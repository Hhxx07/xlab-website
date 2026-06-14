// ===========================================================================
// Comments HTTP Handler — internal/comments/handler.go
// ===========================================================================

package comments

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/xlab-backend/internal/articles"
	"github.com/xlab-backend/internal/auth"
)

// Handler 评论 HTTP 处理器
type Handler struct {
	svc      *Service
	articlesRepo *articles.Repository
}

// NewHandler 创建 Handler
func NewHandler(svc *Service, articlesRepo *articles.Repository) *Handler {
	return &Handler{svc: svc, articlesRepo: articlesRepo}
}

// ---------------------------------------------------------------------------
// GET /api/articles/{slug}/comments
// ---------------------------------------------------------------------------
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	// 查找文章
	a, err := h.articlesRepo.GetBySlug(r.Context(), slug, "")
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error": map[string]interface{}{"code": 404, "message": "文章不存在"},
		})
		return
	}

	myUserID := ""
	if u := auth.GetUserFromContext(r.Context()); u != nil {
		myUserID = u.ID
	}

	comments, err := h.svc.List(r.Context(), a.ID, myUserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error": map[string]interface{}{"code": 500, "message": "获取评论失败"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"comments": comments})
}

// ---------------------------------------------------------------------------
// POST /api/articles/{slug}/comments（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error": map[string]interface{}{"code": 401, "message": "请先登录"},
		})
		return
	}

	slug := chi.URLParam(r, "slug")
	a, err := h.articlesRepo.GetBySlug(r.Context(), slug, "")
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error": map[string]interface{}{"code": 404, "message": "文章不存在"},
		})
		return
	}

	var input CreateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": "请求格式错误"},
		})
		return
	}

	c, err := h.svc.Create(r.Context(), a.ID, user.ID, input)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": err.Error()},
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"comment": c})
}

// ---------------------------------------------------------------------------
// POST /api/articles/{slug}/comments/{id}/reply（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) Reply(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error": map[string]interface{}{"code": 401, "message": "请先登录"},
		})
		return
	}

	slug := chi.URLParam(r, "slug")
	a, err := h.articlesRepo.GetBySlug(r.Context(), slug, "")
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error": map[string]interface{}{"code": 404, "message": "文章不存在"},
		})
		return
	}

	parentID := chi.URLParam(r, "id")

	var input CreateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": "请求格式错误"},
		})
		return
	}
	input.ParentID = &parentID

	c, err := h.svc.Create(r.Context(), a.ID, user.ID, input)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error": map[string]interface{}{"code": 400, "message": err.Error()},
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"comment": c})
}

// ---------------------------------------------------------------------------
// DELETE /api/comments/{id}（需认证，作者或 admin）
// ---------------------------------------------------------------------------
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error": map[string]interface{}{"code": 401, "message": "请先登录"},
		})
		return
	}

	id := chi.URLParam(r, "id")

	var err error
	if user.Role == "admin" {
		err = h.svc.DeleteAsAdmin(r.Context(), id)
	} else {
		err = h.svc.Delete(r.Context(), user.ID, id)
	}

	if err != nil {
		if err == ErrCommentNotFound {
			writeJSON(w, http.StatusNotFound, map[string]interface{}{
				"error": map[string]interface{}{"code": 404, "message": "评论不存在"},
			})
			return
		}
		if err == ErrCommentForbidden {
			writeJSON(w, http.StatusForbidden, map[string]interface{}{
				"error": map[string]interface{}{"code": 403, "message": "没有权限删除此评论"},
			})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error": map[string]interface{}{"code": 500, "message": "删除评论失败"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "已删除"})
}

// ---------------------------------------------------------------------------
// POST /api/comments/{id}/like（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error": map[string]interface{}{"code": 401, "message": "请先登录"},
		})
		return
	}

	id := chi.URLParam(r, "id")
	liked, count, err := h.svc.ToggleLike(r.Context(), user.ID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error": map[string]interface{}{"code": 404, "message": "评论不存在"},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"liked":      liked,
		"like_count": count,
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
