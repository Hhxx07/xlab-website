// ===========================================================================
// Go 后端入口 — cmd/api/main.go
//
// 职责：
//   1. 加载配置（环境变量）
//   2. 连接 PostgreSQL 并运行数据库迁移
//   3. 注册所有 HTTP 路由
//   4. 启动 HTTP 服务器
//
// 路由概览：
//   GET    /api/health                健康检查
//   POST   /api/auth/register         邮箱注册
//   POST   /api/auth/login            邮箱登录
//   POST   /api/auth/logout           登出
//   GET    /api/auth/me               当前用户信息
//   GET    /api/auth/github/start     GitHub OAuth 入口（骨架）
//   GET    /api/auth/github/callback  GitHub OAuth 回调（骨架）
//   GET    /api/users/:username       用户主页
//   PATCH  /api/users/me              更新个人资料
// ===========================================================================

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	// 业务模块
	"github.com/xlab-backend/internal/auth"
	"github.com/xlab-backend/internal/user"

	// 平台基础设施
	"github.com/xlab-backend/internal/platform/config"
	"github.com/xlab-backend/internal/platform/database"
	"github.com/xlab-backend/internal/platform/logger"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// -----------------------------------------------------------------------
	// 1. 加载配置
	// -----------------------------------------------------------------------
	cfg := config.Load()
	log := logger.New(cfg.AppEnv)

	log.Info().
		Str("app_env", cfg.AppEnv).
		Int("port", cfg.Port).
		Msg("应用启动中...")

	// -----------------------------------------------------------------------
	// 2. 连接数据库
	// -----------------------------------------------------------------------
	dbPool, err := database.ConnectPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("无法连接数据库")
	}
	defer dbPool.Close()

	// 运行数据库迁移 — 启动时自动同步表结构
	if err := database.RunMigrations(dbPool, "migrations"); err != nil {
		log.Fatal().Err(err).Msg("数据库迁移失败")
	}

	log.Info().Msg("数据库连接成功，迁移已执行")

	// -----------------------------------------------------------------------
	// 3. 初始化业务模块
	// -----------------------------------------------------------------------

	// Auth 模块 — 认证与会话管理
	authRepo := auth.NewRepository(dbPool)
	authSvc := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authSvc, cfg)
	authMiddleware := auth.NewMiddleware(authSvc)

	// User 模块 — 用户资料
	userRepo := user.NewRepository(dbPool)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)

	// -----------------------------------------------------------------------
	// 4. 注册路由
	// -----------------------------------------------------------------------
	r := chi.NewRouter()

	// --- 全局中间件 ---
	r.Use(middleware.RequestID)      // 每个请求分配唯一 ID
	r.Use(middleware.RealIP)         // 从反向代理头获取真实 IP
	r.Use(logger.ChiMiddleware(log)) // 请求日志
	r.Use(middleware.Recoverer)      // panic 恢复
	r.Use(cors.Handler(cors.Options{ // CORS 配置（开发环境允许所有来源）
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true, // 允许携带 Cookie
		MaxAge:           300,
	}))

	// --- 健康检查 ---
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// --- Auth 路由（无需登录）---
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/magic-link/request", authHandler.RequestMagicLink)
		r.Post("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/github/start", authHandler.GitHubStart)
		r.Get("/github/callback", authHandler.GitHubCallback)
	})

	// --- Auth 路由（需要登录）---
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Post("/api/auth/logout", authHandler.Logout)
		r.Get("/api/auth/me", authHandler.Me)
	})

	// --- User 路由 ---
	r.Get("/api/users/{username}", userHandler.GetByUsername)
	r.Get("/api/trending/github", githubTrendingHandler)
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Patch("/api/users/me", userHandler.UpdateMe)
	})

	// -----------------------------------------------------------------------
	// 5. 启动 HTTP 服务器（支持优雅关闭）
	// -----------------------------------------------------------------------
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 在 goroutine 中启动，主线程等待信号
	go func() {
		log.Info().Str("addr", addr).Msg("HTTP 服务已启动")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("HTTP 服务异常退出")
		}
	}()

	// 等待 SIGINT / SIGTERM 信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("正在优雅关闭...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("HTTP 服务关闭异常")
	}
	log.Info().Msg("服务已停止")
}

func githubTrendingHandler(w http.ResponseWriter, r *http.Request) {
	type repo struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Language    string `json:"language"`
		URL         string `json:"url"`
	}

	items := []repo{}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, "https://api.github.com/search/repositories?q=stars:%3E50000&sort=stars&order=desc&per_page=10", nil)
	if err == nil {
		req.Header.Set("Accept", "application/vnd.github+json")
		resp, err := http.DefaultClient.Do(req)
		if err == nil && resp.Body != nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			var payload struct {
				Items []struct {
					FullName    string  `json:"full_name"`
					Description *string `json:"description"`
					Language    *string `json:"language"`
					HTMLURL     string  `json:"html_url"`
				} `json:"items"`
			}
			if json.Unmarshal(body, &payload) == nil {
				for _, item := range payload.Items {
					description := ""
					if item.Description != nil {
						description = *item.Description
					}
					language := "Unknown"
					if item.Language != nil {
						language = *item.Language
					}
					items = append(items, repo{
						Name:        item.FullName,
						Description: description,
						Language:    language,
						URL:         item.HTMLURL,
					})
				}
			}
		}
	}

	if len(items) == 0 {
		items = []repo{{
			Name:        "github/trending",
			Description: "GitHub Trending 数据暂不可用，本地使用占位数据。",
			Language:    "Go",
			URL:         "https://github.com",
		}}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}
