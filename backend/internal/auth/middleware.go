// ===========================================================================
// Auth 中间件 — internal/auth/middleware.go
//
// 职责：
//   1. 从请求 Cookie 中提取 session_token
//   2. 验证 token 有效性
//   3. 将 user 信息注入 request context
//   4. 未登录返回 401
// ===========================================================================

package auth

import (
	"context"
	"net/http"
)

// context key 类型，避免与其他包冲突
type contextKey string

const (
	// ctxKeyUser 在 context 中存储当前登录用户
	ctxKeyUser contextKey = "user"
	// ctxKeySessionTokenHash 在 context 中存储 session token hash
	ctxKeySessionTokenHash contextKey = "session_token_hash"
)

// Middleware 认证中间件
type Middleware struct {
	svc *Service
}

// NewMiddleware 创建中间件实例
func NewMiddleware(svc *Service) *Middleware {
	return &Middleware{svc: svc}
}

// RequireAuth 是一个 chi 中间件，要求请求必须携带有效的 session cookie
//
// 流程：
//  1. 从 Cookie 读取 session_token
//  2. 对 token 做 SHA-256 哈希
//  3. 在数据库中查找对应会话
//  4. 通过 user_id 查找用户
//  5. 将 user 注入 request context
//
// 未通过验证 → 返回 401
func (m *Middleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. 读取 Cookie
		cookie, err := r.Cookie("session_token")
		if err != nil {
			writeError(w, http.StatusUnauthorized, "请先登录")
			return
		}

		// 2. 哈希原始 token（数据库中存的是哈希值）
		rawToken := cookie.Value
		tokenHash := HashToken(rawToken)

		// 3. 通过 token hash 查找并验证会话
		user, err := m.svc.GetMe(r.Context(), tokenHash)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "会话无效或已过期")
			return
		}

		// 4. 注入 context
		ctx := context.WithValue(r.Context(), ctxKeyUser, user)
		ctx = context.WithValue(ctx, ctxKeySessionTokenHash, tokenHash)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserFromContext 从 context 中获取当前用户
// 供其他 handler 使用
func GetUserFromContext(ctx context.Context) *User {
	user, ok := ctx.Value(ctxKeyUser).(*User)
	if !ok {
		return nil
	}
	return user
}
