// ===========================================================================
// Go 后端入口 — cmd/api/main.go
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

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/xlab-backend/internal/admin"
	"github.com/xlab-backend/internal/articles"
	"github.com/xlab-backend/internal/auth"
	"github.com/xlab-backend/internal/comments"
	"github.com/xlab-backend/internal/platform/config"
	"github.com/xlab-backend/internal/platform/database"
	"github.com/xlab-backend/internal/platform/logger"
	"github.com/xlab-backend/internal/user"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.AppEnv)

	log.Info().
		Str("app_env", cfg.AppEnv).
		Int("port", cfg.Port).
		Msg("application starting")

	// ---------------------------------------------------------------------------
	// Database
	// ---------------------------------------------------------------------------
	dbPool, err := database.ConnectPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect database")
	}
	defer dbPool.Close()

	if err := database.RunMigrations(dbPool, "migrations"); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}

	// ---------------------------------------------------------------------------
	// Init modules
	// ---------------------------------------------------------------------------
	authRepo := auth.NewRepository(dbPool)
	authSvc := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authSvc, cfg)
	authMiddleware := auth.NewMiddleware(authSvc)

	userRepo := user.NewRepository(dbPool)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)

	articlesRepo := articles.NewRepository(dbPool)
	articlesSvc := articles.NewService(articlesRepo)
	articlesHandler := articles.NewHandler(articlesSvc)

	commentsRepo := comments.NewRepository(dbPool)
	commentsSvc := comments.NewService(commentsRepo)
	commentsHandler := comments.NewHandler(commentsSvc, articlesRepo)

	adminHandler := admin.NewHandler(articlesRepo)

	// ---------------------------------------------------------------------------
	// Router
	// ---------------------------------------------------------------------------
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logger.ChiMiddleware(log))
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// --- Health ---
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// --- Auth (no auth required) ---
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/magic-link/request", authHandler.RequestMagicLink)
		r.Post("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/verify-email", authHandler.VerifyEmail)
		r.Get("/github/start", authHandler.GitHubStart)
		r.Get("/github/callback", authHandler.GitHubCallback)
	})

	// --- Auth (auth required) ---
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Post("/api/auth/logout", authHandler.Logout)
		r.Get("/api/auth/me", authHandler.Me)
		r.Post("/api/auth/resend-verification", authHandler.ResendVerification)
	})

	// --- Public user profile ---
	r.Get("/api/users/{username}", userHandler.GetByUsername)

	// --- Authenticated user routes ---
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Patch("/api/users/me", userHandler.UpdateMe)
		r.Get("/api/users/me/articles", articlesHandler.MyArticles)
	})

	// --- Articles (public + auth mixed) ---
	r.Get("/api/articles", articlesHandler.List)
	r.Get("/api/articles/{slug}", articlesHandler.GetBySlug)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Post("/api/articles", articlesHandler.Create)
		r.Patch("/api/articles/{id}", articlesHandler.Update)
		r.Delete("/api/articles/{id}", articlesHandler.Delete)
		r.Post("/api/articles/{slug}/like", articlesHandler.ToggleLike)
	})

	// --- Comments ---
	r.Get("/api/articles/{slug}/comments", commentsHandler.List)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Post("/api/articles/{slug}/comments", commentsHandler.Create)
		r.Post("/api/articles/{slug}/comments/{id}/reply", commentsHandler.Reply)
		r.Delete("/api/comments/{id}", commentsHandler.Delete)
		r.Post("/api/comments/{id}/like", commentsHandler.ToggleLike)
	})

	// --- Tags & Sections ---
	r.Get("/api/tags", articlesHandler.ListTags)
	r.Get("/api/sections", articlesHandler.Sections)

	// --- Trending ---
	r.Get("/api/trending/github", githubTrendingHandler)
	r.Get("/api/trending/github/scrape", githubTrendingScrapeHandler)

	// --- Admin (auth + admin role required) ---
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Use(admin.RequireAdmin)
		r.Get("/api/admin/stats", adminHandler.Stats)
		r.Get("/api/admin/articles", adminHandler.Articles)
		r.Get("/api/admin/users", adminHandler.Users)
		r.Patch("/api/admin/users/{id}/role", adminHandler.UpdateRole)
	})

	// ---------------------------------------------------------------------------
	// Start server
	// ---------------------------------------------------------------------------
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info().Str("addr", addr).Msg("HTTP server started")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("HTTP server exited unexpectedly")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("HTTP server shutdown failed")
	}
	log.Info().Msg("server stopped")
}

// ===========================================================================
// GitHub Trending handlers (kept in main.go for simplicity)
// ===========================================================================

func githubTrendingHandler(w http.ResponseWriter, r *http.Request) {
	type repo struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Language    string `json:"language"`
		URL         string `json:"url"`
	}

	items := []repo{}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/search/repositories?q=stars:%3E50000&sort=stars&order=desc&per_page=10", nil)
	if err == nil {
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("User-Agent", "xlab-trending/1.0")
		if token := os.Getenv("GITHUB_TOKEN"); token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
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
					desc := ""
					if item.Description != nil {
						desc = *item.Description
					}
					lang := "Unknown"
					if item.Language != nil {
						lang = *item.Language
					}
					items = append(items, repo{
						Name:        item.FullName,
						Description: desc,
						Language:    lang,
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

func githubTrendingScrapeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": []map[string]string{{
			"name":        "github/trending",
			"description": "Trending 爬取功能将在后续版本实现。",
			"language":    "Go",
			"url":         "https://github.com/trending",
			"stars":       "",
		}},
	})
}
