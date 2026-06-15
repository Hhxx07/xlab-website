// ===========================================================================
// Go 后端入口 — cmd/api/main.go
// ===========================================================================

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

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
		r.Get("/api/articles/by-id/{id}", articlesHandler.GetByIDForEdit)
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
	r.Get("/api/trending/github/scrape", githubTrendingScrapeHandler(dbPool))
	r.Get("/api/trending/github/history", githubTrendingHistoryHandler(dbPool))
	r.Get("/api/trending/github/readme", githubTrendingReadmeHandler)

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

type persistedTrendingRepo struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Language    string    `json:"language"`
	URL         string    `json:"url"`
	Stars       string    `json:"stars"`
	StarsToday  *int      `json:"stars_today,omitempty"`
	Readme      string    `json:"readme,omitempty"`
	CapturedAt  time.Time `json:"captured_at,omitempty"`
}

func githubTrendingScrapeHandler(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
		defer cancel()

		items := scrapeGitHubTrending(ctx)
		if len(items) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"items": []map[string]string{{
					"name":        "github/trending",
					"description": "Trending 抓取暂时不可用。",
					"language":    "Go",
					"url":         "https://github.com/trending",
					"stars":       "",
				}},
			})
			return
		}

		capturedAt := time.Now()
		for i := range items {
			items[i].Readme = fetchGitHubReadme(ctx, items[i].Name)
		}
		_ = saveTrendingRun(ctx, db, items, capturedAt)
		for i := range items {
			items[i].CapturedAt = capturedAt
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
	}
}

func githubTrendingReadmeHandler(w http.ResponseWriter, r *http.Request) {
	repo := strings.TrimSpace(r.URL.Query().Get("repo"))
	if !strings.Contains(repo, "/") || strings.Contains(repo, "..") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid repo"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"readme": fetchGitHubReadme(ctx, repo)})
}

func githubTrendingHistoryHandler(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		rows, err := db.Query(ctx,
			`SELECT full_name, description, language, url, stars, stars_today, readme, captured_at
			 FROM github_trending_repos
			 ORDER BY archive_date DESC, captured_at DESC
			 LIMIT 50`,
		)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"items": []persistedTrendingRepo{}})
			return
		}
		defer rows.Close()

		items := []persistedTrendingRepo{}
		for rows.Next() {
			var item persistedTrendingRepo
			if err := rows.Scan(&item.Name, &item.Description, &item.Language, &item.URL, &item.Stars, &item.StarsToday, &item.Readme, &item.CapturedAt); err == nil {
				items = append(items, item)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
	}
}

func scrapeGitHubTrending(ctx context.Context) []persistedTrendingRepo {
	items := []persistedTrendingRepo{}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://github.com/trending?since=daily", nil)
	if err != nil {
		return items
	}
	req.Header.Set("User-Agent", "xlab-trending/1.0")
	req.Header.Set("Accept", "text/html")

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.Body == nil {
		return items
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	pageHTML := string(body)
	cardRe := regexp.MustCompile(`(?s)<article[^>]*Box-row[^>]*>(.*?)</article>`)
	nameRe := regexp.MustCompile(`(?s)<h2[^>]*>.*?<a[^>]*href="/([^"]+)"`)
	descRe := regexp.MustCompile(`(?s)<p[^>]*col-9[^>]*>(.*?)</p>`)
	langRe := regexp.MustCompile(`(?s)<span[^>]*itemprop="programmingLanguage"[^>]*>(.*?)</span>`)
	starsRe := regexp.MustCompile(`(?s)<span[^>]*d-inline-block float-sm-right[^>]*>(.*?)</span>`)
	tagRe := regexp.MustCompile(`<[^>]+>`)
	spaceRe := regexp.MustCompile(`\s+`)
	digitRe := regexp.MustCompile(`\d+`)

	clean := func(value string) string {
		value = tagRe.ReplaceAllString(value, " ")
		value = html.UnescapeString(value)
		return strings.TrimSpace(spaceRe.ReplaceAllString(value, " "))
	}

	for _, match := range cardRe.FindAllStringSubmatch(pageHTML, 10) {
		card := match[1]
		nameMatch := nameRe.FindStringSubmatch(card)
		if len(nameMatch) < 2 {
			continue
		}
		name := clean(strings.Trim(nameMatch[1], "/"))
		item := persistedTrendingRepo{
			Name:     name,
			Language: "Unknown",
			URL:      "https://github.com/" + name,
		}
		if desc := descRe.FindStringSubmatch(card); len(desc) > 1 {
			item.Description = clean(desc[1])
		}
		if lang := langRe.FindStringSubmatch(card); len(lang) > 1 {
			item.Language = clean(lang[1])
		}
		if stars := starsRe.FindStringSubmatch(card); len(stars) > 1 {
			item.Stars = clean(stars[1])
			if digits := digitRe.FindString(item.Stars); digits != "" {
				if n, err := strconv.Atoi(digits); err == nil {
					item.StarsToday = &n
				}
			}
		}
		items = append(items, item)
	}

	return items
}

func saveTrendingRun(ctx context.Context, db *pgxpool.Pool, items []persistedTrendingRepo, capturedAt time.Time) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	newItems := make([]persistedTrendingRepo, 0, len(items))
	for _, item := range items {
		var exists bool
		archiveDate := capturedAt.Format("2006-01-02")
		if err := tx.QueryRow(ctx,
			`SELECT EXISTS(
				SELECT 1 FROM github_trending_repos
				WHERE full_name = $1 AND archive_date = $2::date
			)`,
			item.Name, archiveDate,
		).Scan(&exists); err != nil {
			return err
		}
		if !exists {
			newItems = append(newItems, item)
		}
	}
	if len(newItems) == 0 {
		return tx.Commit(ctx)
	}

	var runID string
	if err := tx.QueryRow(ctx,
		`INSERT INTO github_trending_runs (source, captured_at)
		 VALUES ('github_trending', $1)
		 RETURNING id`,
		capturedAt,
	).Scan(&runID); err != nil {
		return err
	}

	for _, item := range newItems {
		readme := item.Readme
		if readme == "" {
			readme = fetchGitHubReadme(ctx, item.Name)
		}
		if len(readme) > 30000 {
			readme = readme[:30000]
		}
		_, err := tx.Exec(ctx,
			`INSERT INTO github_trending_repos
			 (run_id, full_name, description, language, url, stars, stars_today, readme, archive_date, captured_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10)`,
			runID, item.Name, item.Description, item.Language, item.URL, item.Stars, item.StarsToday, readme, capturedAt.Format("2006-01-02"), capturedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func fetchGitHubReadme(ctx context.Context, fullName string) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/repos/"+fullName+"/readme", nil)
	if err != nil {
		return ""
	}
	req.Header.Set("Accept", "application/vnd.github.raw")
	req.Header.Set("User-Agent", "xlab-trending/1.0")
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.Body == nil {
		return ""
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return ""
	}
	body, _ := io.ReadAll(resp.Body)
	return string(body)
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

func legacyGithubTrendingScrapeHandler(w http.ResponseWriter, r *http.Request) {
	type repo struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Language    string `json:"language"`
		URL         string `json:"url"`
		Stars       string `json:"stars"`
	}

	items := []repo{}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://github.com/trending?since=daily", nil)
	if err == nil {
		req.Header.Set("User-Agent", "xlab-trending/1.0")
		req.Header.Set("Accept", "text/html")
		if resp, err := http.DefaultClient.Do(req); err == nil && resp.Body != nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			html := string(body)
			cardRe := regexp.MustCompile(`(?s)<article[^>]*Box-row[^>]*>(.*?)</article>`)
			nameRe := regexp.MustCompile(`(?s)<h2[^>]*>.*?<a[^>]*href="/([^"]+)"`)
			descRe := regexp.MustCompile(`(?s)<p[^>]*col-9[^>]*>(.*?)</p>`)
			langRe := regexp.MustCompile(`(?s)<span[^>]*itemprop="programmingLanguage"[^>]*>(.*?)</span>`)
			starsRe := regexp.MustCompile(`(?s)<span[^>]*d-inline-block float-sm-right[^>]*>(.*?)</span>`)
			tagRe := regexp.MustCompile(`<[^>]+>`)
			spaceRe := regexp.MustCompile(`\s+`)

			clean := func(value string) string {
				value = tagRe.ReplaceAllString(value, " ")
				value = strings.ReplaceAll(value, "&amp;", "&")
				value = strings.ReplaceAll(value, "&#39;", "'")
				value = strings.ReplaceAll(value, "&quot;", `"`)
				return strings.TrimSpace(spaceRe.ReplaceAllString(value, " "))
			}

			for _, match := range cardRe.FindAllStringSubmatch(html, 10) {
				card := match[1]
				nameMatch := nameRe.FindStringSubmatch(card)
				if len(nameMatch) < 2 {
					continue
				}
				name := clean(strings.Trim(nameMatch[1], "/"))
				item := repo{
					Name:     name,
					Language: "Unknown",
					URL:      "https://github.com/" + name,
				}
				if desc := descRe.FindStringSubmatch(card); len(desc) > 1 {
					item.Description = clean(desc[1])
				}
				if lang := langRe.FindStringSubmatch(card); len(lang) > 1 {
					item.Language = clean(lang[1])
				}
				if stars := starsRe.FindStringSubmatch(card); len(stars) > 1 {
					item.Stars = clean(stars[1])
				}
				items = append(items, item)
			}
		}
	}

	if len(items) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
		return
	}

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
