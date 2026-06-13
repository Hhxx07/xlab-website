package main

import (
	"context"
	"encoding/json"
	"html"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	githubUserAgent   = "xlab-trending/1.0"
	trendingCacheTTL  = 15 * time.Minute
	trendingFetchSize = 10
)

type githubRepo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Language    string `json:"language"`
	URL         string `json:"url"`
	Stars       string `json:"stars,omitempty"`
	StarsToday  int    `json:"stars_today,omitempty"`
}

type repoCache struct {
	mu        sync.Mutex
	items     []githubRepo
	expiresAt time.Time
}

var dailyTrendingCache repoCache

func githubTrendingHandler(w http.ResponseWriter, r *http.Request) {
	items := fetchHottestRepos()
	if len(items) == 0 {
		items = hottestFallback()
	}
	writeTrendingJSON(w, items)
}

func githubTrendingScrapeHandler(w http.ResponseWriter, r *http.Request) {
	if items, ok := dailyTrendingCache.get(); ok {
		writeTrendingJSON(w, items)
		return
	}

	items := fetchDailyTrendingRepos()
	if len(items) == 0 {
		items = dailyTrendingFallback()
	}
	dailyTrendingCache.set(items)
	writeTrendingJSON(w, items)
}

func fetchHottestRepos() []githubRepo {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/search/repositories?q=stars:%3E50000&sort=stars&order=desc&per_page=10", nil)
	if err != nil {
		return nil
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", githubUserAgent)
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp == nil || resp.Body == nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var payload struct {
		Items []struct {
			FullName    string  `json:"full_name"`
			Description *string `json:"description"`
			Language    *string `json:"language"`
			HTMLURL     string  `json:"html_url"`
		} `json:"items"`
	}
	if json.Unmarshal(body, &payload) != nil {
		return nil
	}

	items := make([]githubRepo, 0, len(payload.Items))
	for _, item := range payload.Items {
		description := ""
		if item.Description != nil {
			description = *item.Description
		}
		language := "Unknown"
		if item.Language != nil && strings.TrimSpace(*item.Language) != "" {
			language = *item.Language
		}
		if item.FullName == "" || item.HTMLURL == "" {
			continue
		}
		items = append(items, githubRepo{
			Name:        item.FullName,
			Description: description,
			Language:    language,
			URL:         item.HTMLURL,
		})
	}
	return items
}

func fetchDailyTrendingRepos() []githubRepo {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://github.com/trending?since=daily", nil)
	if err != nil {
		return nil
	}
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("User-Agent", githubUserAgent)

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp == nil || resp.Body == nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}
	return parseDailyTrendingHTML(string(body))
}

func parseDailyTrendingHTML(source string) []githubRepo {
	articleRe := regexp.MustCompile(`(?is)<article\b[^>]*class="[^"]*\bBox-row\b[^"]*"[^>]*>(.*?)</article>`)
	articles := articleRe.FindAllStringSubmatch(source, trendingFetchSize)
	items := make([]githubRepo, 0, len(articles))

	for _, match := range articles {
		if len(match) < 2 {
			continue
		}
		item := parseTrendingArticle(match[1])
		if item.Name == "" || item.URL == "" {
			continue
		}
		items = append(items, item)
	}

	return items
}

func parseTrendingArticle(article string) githubRepo {
	linkRe := regexp.MustCompile(`(?is)<h2\b.*?<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>`)
	descRe := regexp.MustCompile(`(?is)<p\b[^>]*>(.*?)</p>`)
	langRe := regexp.MustCompile(`(?is)itemprop="programmingLanguage"[^>]*>(.*?)</span>`)
	starsTodayRe := regexp.MustCompile(`(?is)<span\b[^>]*>\s*([^<]*stars today)\s*</span>`)

	var item githubRepo
	if link := linkRe.FindStringSubmatch(article); len(link) >= 3 {
		item.URL = githubURL(link[1])
		item.Name = normalizeRepoName(stripTags(link[2]))
	}
	if desc := descRe.FindStringSubmatch(article); len(desc) >= 2 {
		item.Description = normalizeText(stripTags(desc[1]))
	}
	if lang := langRe.FindStringSubmatch(article); len(lang) >= 2 {
		item.Language = normalizeText(stripTags(lang[1]))
	}
	if item.Language == "" {
		item.Language = "Unknown"
	}
	if stars := starsTodayRe.FindStringSubmatch(article); len(stars) >= 2 {
		item.Stars = normalizeText(stripTags(stars[1]))
		item.StarsToday = parseStarsToday(item.Stars)
	}
	return item
}

func githubURL(value string) string {
	value = strings.TrimSpace(html.UnescapeString(value))
	if strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://") {
		return value
	}
	if strings.HasPrefix(value, "/") {
		return "https://github.com" + value
	}
	return "https://github.com/" + value
}

func normalizeRepoName(value string) string {
	value = normalizeText(value)
	value = strings.ReplaceAll(value, " / ", "/")
	value = strings.ReplaceAll(value, " /", "/")
	value = strings.ReplaceAll(value, "/ ", "/")
	return value
}

func normalizeText(value string) string {
	value = html.UnescapeString(value)
	return strings.Join(strings.Fields(value), " ")
}

func stripTags(value string) string {
	tagRe := regexp.MustCompile(`(?is)<[^>]+>`)
	return tagRe.ReplaceAllString(value, " ")
}

func parseStarsToday(value string) int {
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, ",", "")
	fields := strings.Fields(value)
	if len(fields) == 0 {
		return 0
	}
	n, _ := strconv.Atoi(fields[0])
	return n
}

func (c *repoCache) get() ([]githubRepo, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if time.Now().After(c.expiresAt) || len(c.items) == 0 {
		return nil, false
	}
	items := make([]githubRepo, len(c.items))
	copy(items, c.items)
	return items, true
}

func (c *repoCache) set(items []githubRepo) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make([]githubRepo, len(items))
	copy(c.items, items)
	c.expiresAt = time.Now().Add(trendingCacheTTL)
}

func writeTrendingJSON(w http.ResponseWriter, items []githubRepo) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

func dailyTrendingFallback() []githubRepo {
	return []githubRepo{{
		Name:        "github/trending",
		Description: "GitHub Trending 暂时不可用，当前显示本地占位数据。",
		Language:    "TypeScript",
		URL:         "https://github.com/trending",
		Stars:       "0 stars today",
	}}
}

func hottestFallback() []githubRepo {
	return []githubRepo{{
		Name:        "github/search",
		Description: "GitHub Search API 暂时不可用，当前显示本地占位数据。",
		Language:    "Go",
		URL:         "https://github.com/search?q=stars%3A%3E50000&type=repositories",
	}}
}
