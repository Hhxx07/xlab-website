// ===========================================================================
// Chi 日志中间件 — internal/platform/logger/middleware.go
//
// 为每个 HTTP 请求记录：
//   - 请求方法、路径、状态码
//   - 响应耗时
//   - 响应体大小
// ===========================================================================

package logger

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
)

// ChiMiddleware 返回 chi 兼容的请求日志中间件
func ChiMiddleware(log zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// 包装 ResponseWriter 以捕获状态码
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			next.ServeHTTP(ww, r)

			// 请求完成后记录日志
			log.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Str("query", r.URL.RawQuery).
				Int("status", ww.Status()).
				Int("bytes", ww.BytesWritten()).
				Dur("duration", time.Since(start)).
				Str("remote_addr", r.RemoteAddr).
				Str("request_id", middleware.GetReqID(r.Context())).
				Msg("HTTP 请求")
		})
	}
}
