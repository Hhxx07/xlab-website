// ===========================================================================
// 结构化日志 — internal/platform/logger/logger.go
//
// 基于 rs/zerolog 实现：
//   - 开发环境：彩色、人性化输出（ConsoleWriter）
//   - 生产环境：JSON 格式输出，便于 ELK / Loki 采集
//   - 提供 chi 中间件，自动记录每个 HTTP 请求
// ===========================================================================

package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

// New 创建 zerolog Logger
//
// appEnv:
//
//	"development" → 彩色控制台输出
//	"production"  → JSON 格式输出
func New(appEnv string) zerolog.Logger {
	var logger zerolog.Logger

	if appEnv == "production" {
		logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	} else {
		// 开发环境：彩色输出，时间格式友好
		output := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
			NoColor:    false,
		}
		logger = zerolog.New(output).With().Timestamp().Logger()
	}

	// 全局日志级别：开发 Debug，生产 Info
	zerolog.SetGlobalLevel(zerolog.DebugLevel)
	if appEnv == "production" {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	return logger
}
