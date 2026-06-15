// ===========================================================================
// Articles HTTP Handler — internal/articles/handler.go
// ===========================================================================

package articles

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/xlab-backend/internal/auth"
)

// Handler 文章 HTTP 处理器
type Handler struct {
	svc *Service
}

// NewHandler 创建 Handler
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ---------------------------------------------------------------------------
// GET /api/articles
// ---------------------------------------------------------------------------
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 10
	}
	offset, _ := strconv.Atoi(q.Get("offset"))

	myUserID := ""
	if u := auth.GetUserFromContext(r.Context()); u != nil {
		myUserID = u.ID
	}

	f := ListFilter{
		Section:  q.Get("section"),
		Tag:      q.Get("tag"),
		AuthorID: q.Get("author"),
		Search:   q.Get("search"),
		Limit:    limit,
		Offset:   offset,
		MyUserID: myUserID,
	}

	if q.Get("published") == "all" {
		f.Published = nil
	} else {
		pub := true
		f.Published = &pub
	}

	articles, total, err := h.svc.List(r.Context(), f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "获取文章列表失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"articles": articles,
		"total":    total,
	})
}

// ---------------------------------------------------------------------------
// GET /api/articles/{slug}
// ---------------------------------------------------------------------------
func (h *Handler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	myUserID := ""
	if u := auth.GetUserFromContext(r.Context()); u != nil {
		myUserID = u.ID
	}

	a, err := h.svc.GetBySlug(r.Context(), slug, myUserID)
	if err != nil {
		if err == ErrNotFound {
			writeError(w, http.StatusNotFound, "文章不存在")
			return
		}
		writeError(w, http.StatusInternalServerError, "获取文章失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"article": a})
}

// ---------------------------------------------------------------------------
// GET /api/articles/by-id/{id}（需认证，作者或 admin，用于编辑）
// ---------------------------------------------------------------------------
func (h *Handler) GetByIDForEdit(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	id := chi.URLParam(r, "id")
	a, err := h.svc.GetByIDForEdit(r.Context(), user.ID, user.Role, id)
	if err != nil {
		if err == ErrNotFound {
			writeError(w, http.StatusNotFound, "文章不存在")
			return
		}
		if err == ErrForbidden {
			writeError(w, http.StatusForbidden, "没有权限编辑此文章")
			return
		}
		writeError(w, http.StatusInternalServerError, "获取文章失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"article": a})
}

// ---------------------------------------------------------------------------
// POST /api/articles（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	var input CreateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	a, err := h.svc.Create(r.Context(), user.ID, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"article": a})
}

// ---------------------------------------------------------------------------
// PATCH /api/articles/{id}（需认证，作者或 admin）
// ---------------------------------------------------------------------------
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	id := chi.URLParam(r, "id")

	var input UpdateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	var a *Article
	var err error

	if user.Role == "admin" {
		a, err = h.svc.UpdateAsAdmin(r.Context(), id, input)
	} else {
		a, err = h.svc.Update(r.Context(), user.ID, id, input)
	}

	if err != nil {
		if err == ErrNotFound {
			writeError(w, http.StatusNotFound, "文章不存在")
			return
		}
		if err == ErrForbidden {
			writeError(w, http.StatusForbidden, "没有权限修改此文章")
			return
		}
		writeError(w, http.StatusInternalServerError, "更新文章失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"article": a})
}

// ---------------------------------------------------------------------------
// DELETE /api/articles/{id}（需认证，作者或 admin）
// ---------------------------------------------------------------------------
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
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
		if err == ErrNotFound {
			writeError(w, http.StatusNotFound, "文章不存在")
			return
		}
		if err == ErrForbidden {
			writeError(w, http.StatusForbidden, "没有权限删除此文章")
			return
		}
		writeError(w, http.StatusInternalServerError, "删除文章失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "已删除"})
}

// ---------------------------------------------------------------------------
// POST /api/articles/{slug}/like（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	slug := chi.URLParam(r, "slug")
	a, err := h.svc.GetBySlug(r.Context(), slug, "")
	if err != nil {
		writeError(w, http.StatusNotFound, "文章不存在")
		return
	}

	liked, count, err := h.svc.ToggleLike(r.Context(), user.ID, a.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "操作失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"liked":      liked,
		"like_count": count,
	})
}

// ---------------------------------------------------------------------------
// GET /api/users/me/articles（需认证）
// ---------------------------------------------------------------------------
func (h *Handler) MyArticles(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "请先登录")
		return
	}

	articles, err := h.svc.MyArticles(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "获取文章列表失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"articles": articles})
}

// ---------------------------------------------------------------------------
// GET /api/tags
// ---------------------------------------------------------------------------
func (h *Handler) ListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.svc.ListTags(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "获取标签失败")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

// ---------------------------------------------------------------------------
// GET /api/sections
// ---------------------------------------------------------------------------
func (h *Handler) Sections(w http.ResponseWriter, r *http.Request) {
	sections, err := h.svc.Sections(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "获取分区失败")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"sections": sections})
}

// ---------------------------------------------------------------------------
// 辅助
// ---------------------------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    status,
			"message": message,
		},
	})
}
