// ===========================================================================
// 配置加载 — internal/platform/config/config.go
//
// 从环境变量读取所有配置，提供默认值用于开发环境
// 生产环境通过 Docker / K8s 注入敏感配置（DATABASE_URL、JWT_SECRET 等）
// ===========================================================================

package config

import (
	"os"
	"strconv"
)

// Config 聚合所有运行时配置
type Config struct {
	// 应用环境：development | production
	AppEnv string

	// HTTP 服务端口
	Port int

	// PostgreSQL 连接字符串
	// 格式：postgres://user:password@host:port/db?sslmode=disable
	DatabaseURL string

	// Redis 连接字符串（Phase 1 暂未使用）
	RedisURL string

	// JWT 签名密钥（仅用于生成，Phase 1 使用 Session Token）
	JWTSecret string

	// Session Token 有效期（小时），默认 7 天 = 168 小时
	SessionTTLHours int

	// GitHub OAuth 配置
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURI  string

	// 前端地址（用于 OAuth 回调后的跳转）
	FrontendURL string
}

// Load 从环境变量加载配置，缺失时使用合理的开发默认值
func Load() *Config {
	return &Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		Port:               getEnvInt("PORT", 8080),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://app:app@localhost:5432/app?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		SessionTTLHours:    getEnvInt("SESSION_TTL_HOURS", 168),
		GitHubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GitHubRedirectURI:  getEnv("GITHUB_REDIRECT_URI", "http://localhost:8080/api/auth/github/callback"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

// getEnv 获取环境变量，不存在时返回默认值
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// getEnvInt 获取整数类型环境变量
func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if n, err := strconv.Atoi(val); err == nil {
			return n
		}
	}
	return defaultVal
}
