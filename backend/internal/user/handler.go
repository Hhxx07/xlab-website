// ===========================================================================
// User HTTP Handler — internal/user/handler.go
//
// 用户资料相关 API 端点
// ===========================================================================

package user

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/xlab-backend/internal/auth"
)

// Handler 用户 HTTP 处理器
type Handler struct {
	svc *Service
}

// NewHandler 创建 Handler
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ---------------------------------------------------------------------------
// GET /api/users/{username}  — 用户主页
// ---------------------------------------------------------------------------

// GetByUsername 通过用户名获取用户公开信息
//
// 返回用户资料（不含敏感信息如邮箱）
func (h *Handler) GetByUsername(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	if username == "" {
		writeError(w, http.StatusBadRequest, "缺少用户名参数")
		return
	}

	user, err := h.svc.GetByUsername(r.Context(), username)
	if err != nil {
		// 使用 errors.Is 判断是否 "not found"
		if err.Error() == "用户不存在: no rows in result set" ||
			pgx.ErrNoRows.Error() == "no rows in result set" {
			writeError(w, http.StatusNotFound, "用户不存在")
			return
		}
		writeError(w, http.StatusInternalServerError, "服务器错误")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": sanitizeUser(user),
	})
}

// ---------------------------------------------------------------------------
// PATCH /api/users/me  — 更新个人资料（需登录）
// ---------------------------------------------------------------------------

// UpdateMe 更新当前登录用户的资料
func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	// 从 context 获取当前用户（由 AuthMiddleware 注入）
	currentUser := auth.GetUserFromContext(r.Context())
	if currentUser == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	var input UpdateMeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	user, err := h.svc.UpdateMe(r.Context(), currentUser.ID, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": sanitizeUser(user),
	})
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    statusCode,
			"message": message,
		},
	})
}

func sanitizeUser(u *User) map[string]interface{} {
	return map[string]interface{}{
		"id":           u.ID,
		"username":     u.Username,
		"display_name": u.DisplayName,
		"avatar_url":   u.AvatarURL,
		"bio":          u.Bio,
		"role":         u.Role,
		"created_at":   u.CreatedAt,
		"updated_at":   u.UpdatedAt,
	}
}
