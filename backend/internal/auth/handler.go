// ===========================================================================
// Auth HTTP Handler — internal/auth/handler.go
//
// 负责：
//   1. 解析 HTTP 请求（JSON body、Cookie）
//   2. 参数校验
//   3. 调用 Service 层
//   4. 构造 HTTP 响应
// ===========================================================================


package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/xlab-backend/internal/platform/config"
)

// Handler 认证 HTTP 处理器
type Handler struct {
	svc *Service
	cfg *config.Config
}

// NewHandler 创建 Handler
func NewHandler(svc *Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, cfg: cfg}
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

// Register 处理注册请求
//
// 请求体 JSON：
//
//	{ "email": "...", "username": "...", "password": "..." }
//
// 成功返回 201 + 用户信息（不含密码）
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var input RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	result, err := h.svc.Register(r.Context(), input)
	if err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) || errors.Is(err, ErrUsernameAlreadyExists) {
			writeError(w, http.StatusConflict, err.Error())
			return
		}
		// 校验类错误返回 400
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

// Login 处理登录请求
//
// 请求体 JSON：
//
//	{ "email": "...", "password": "..." }
//
// 成功：
//  1. 返回 200 + 用户信息
//  2. 设置 HttpOnly Cookie（session_token）
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	result, err := h.svc.Login(r.Context(), input)
	if err != nil {
		if errors.Is(err, ErrInvalidEmailPassword) {
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// 设置 HttpOnly Cookie
	w.Header().Set("Set-Cookie", result.SetCookie)

	// 返回用户信息（不含 Cookie 值）
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": sanitizeUser(result.User),
	})
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

// Logout 处理登出请求
//
// 从 Cookie 中获取 session_token，删除对应会话
// 成功后清除客户端 Cookie
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// 从 context 中获取 token hash（由 AuthMiddleware 注入）
	tokenHash, ok := r.Context().Value(ctxKeySessionTokenHash).(string)
	if !ok || tokenHash == "" {
		writeError(w, http.StatusUnauthorized, "未登录")
		return
	}

	_ = h.svc.Logout(r.Context(), tokenHash) // 忽略登出错误

	// 清除客户端 Cookie
	w.Header().Set("Set-Cookie", ClearSessionCookie())
	writeJSON(w, http.StatusOK, map[string]string{"message": "已登出"})
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

// Me 返回当前登录用户信息
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	// 从 context 中获取用户（由 AuthMiddleware 注入）
	user, ok := r.Context().Value(ctxKeyUser).(*User)
	if !ok || user == nil {
		writeError(w, http.StatusUnauthorized, "未登录")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": sanitizeUser(user),
	})
}

// ---------------------------------------------------------------------------
// GET /api/auth/github/start  （Phase 1 骨架）
// ---------------------------------------------------------------------------

// GitHubStart GitHub OAuth 入口
// Phase 1：返回提示信息，完整流程后续实现
func (h *Handler) GitHubStart(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"message":     "GitHub OAuth 登录将在后续版本中实现",
		"redirect_to": "https://github.com/login/oauth/authorize",
	})
}

// ---------------------------------------------------------------------------
// GET /api/auth/github/callback  （Phase 1 骨架）
// ---------------------------------------------------------------------------

// GitHubCallback GitHub OAuth 回调
// Phase 1：返回提示信息，完整流程后续实现
func (h *Handler) GitHubCallback(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"message": "GitHub OAuth 回调将在后续版本中实现",
	})
}

// ---------------------------------------------------------------------------
// 响应工具函数
// ---------------------------------------------------------------------------

// writeJSON 写入 JSON 响应
func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// writeError 写入错误响应（统一格式）
func writeError(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    statusCode,
			"message": message,
		},
	})
}

// sanitizeUser 返回安全的用户信息（不暴露密码哈希等敏感字段）
func sanitizeUser(u *User) map[string]interface{} {
	return map[string]interface{}{
		"id":                u.ID,
		"email":             u.Email,
		"username":          u.Username,
		"display_name":      u.DisplayName,
		"avatar_url":        u.AvatarURL,
		"bio":               u.Bio,
		"role":              u.Role,
		"email_verified_at": u.EmailVerifiedAt,
		"created_at":        u.CreatedAt,
		"updated_at":        u.UpdatedAt,
	}
}
