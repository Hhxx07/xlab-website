package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/xlab-backend/internal/auth"
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

	dbPool, err := database.ConnectPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect database")
	}
	defer dbPool.Close()

	if err := database.RunMigrations(dbPool, "migrations"); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}

	authRepo := auth.NewRepository(dbPool)
	authSvc := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authSvc, cfg)
	authMiddleware := auth.NewMiddleware(authSvc)

	userRepo := user.NewRepository(dbPool)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)

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

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/magic-link/request", authHandler.RequestMagicLink)
		r.Post("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/magic-link/verify", authHandler.VerifyMagicLink)
		r.Get("/github/start", authHandler.GitHubStart)
		r.Get("/github/callback", authHandler.GitHubCallback)
	})

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Post("/api/auth/logout", authHandler.Logout)
		r.Get("/api/auth/me", authHandler.Me)
	})

	r.Get("/api/users/{username}", userHandler.GetByUsername)
	r.Get("/api/trending/github", githubTrendingHandler)
	r.Get("/api/trending/github/scrape", githubTrendingScrapeHandler)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Patch("/api/users/me", userHandler.UpdateMe)
	})

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
