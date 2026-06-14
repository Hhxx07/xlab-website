// ===========================================================================
// Admin HTTP Handler — internal/admin/handler.go
// ===========================================================================

package admin

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/xlab-backend/internal/articles"
	"github.com/xlab-backend/internal/auth"
)

// Handler 管理员 HTTP 处理器
type Handler struct {
	articlesRepo *articles.Repository
}

// NewHandler 创建 Handler
func NewHandler(articlesRepo *articles.Repository) *Handler {
	return &Handler{articlesRepo: articlesRepo}
}

// ---------------------------------------------------------------------------
// GET /api/admin/stats
// ---------------------------------------------------------------------------
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	userCount, _ := h.articlesRepo.CountUsers(r.Context())
	articleCount, _ := h.articlesRepo.CountArticles(r.Context())
	commentCount, _ := h.articlesRepo.CountComments(r.Context())

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"stats": map[string]interface{}{
			"users":    userCount,
			"articles": articleCount,
			"comments": commentCount,
		},
	})
}

// ---------------------------------------------------------------------------
// GET /api/admin/articles
// ---------------------------------------------------------------------------
func (h *Handler) Articles(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(q.Get("offset"))

	arts, total, err := h.articlesRepo.AdminListArticles(r.Context(), limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error": map[string]interface{}{"code": 500, "message": "获取文章列表失败"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"articles": arts,
		"total":    total,
	})
}

// ---------------------------------------------------------------------------
// GET /api/admin/users
// ---------------------------------------------------------------------------
func (h *Handler) Users(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(q.Get("offset"))

	users, total, err := h.articlesRepo.ListUsers(r.Context(), limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error": map[string]interface{}{"code": 500, "message": "获取用户列表失败"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"total": total,
	})
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/{id}/role
// ---------------------------------------------------------------------------
func (h *Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var input struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": "请求格式错误"},
		})
		return
	}

	if input.Role != "admin" && input.Role != "user" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": "角色只能是 admin 或 user"},
		})
		return
	}

	err := h.articlesRepo.UpdateUserRole(r.Context(), id, input.Role)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error": map[string]interface{}{"code": 500, "message": "更新角色失败"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "角色已更新"})
}

// ---------------------------------------------------------------------------
// RequireAdmin middleware
// ---------------------------------------------------------------------------
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := auth.GetUserFromContext(r.Context())
		if user == nil || user.Role != "admin" {
			writeJSON(w, http.StatusForbidden, map[string]interface{}{
				"error": map[string]interface{}{"code": 403, "message": "需要管理员权限"},
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---------------------------------------------------------------------------
// 辅助
// ---------------------------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
