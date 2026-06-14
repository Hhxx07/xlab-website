// ===========================================================================
// Comments Service — internal/comments/service.go
// ===========================================================================

package comments

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

var (
	ErrCommentNotFound = errors.New("评论不存在")
	ErrCommentForbidden = errors.New("没有权限删除此评论")
)

// Service 评论业务逻辑
type Service struct {
	repo *Repository
}

// NewService 创建 Service
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// CreateInput 发表评论输入
type CreateInput struct {
	Body     string  `json:"body"`
	ParentID *string `json:"parent_id"`
}

// Create 发表评论
func (s *Service) Create(ctx context.Context, articleID, userID string, input CreateInput) (*Comment, error) {
	body := strings.TrimSpace(input.Body)
	if body == "" {
		return nil, errors.New("评论内容不能为空")
	}
	if len([]rune(body)) > 2000 {
		return nil, errors.New("评论不能超过 2000 字")
	}

	c := &Comment{
		ArticleID: articleID,
		UserID:    userID,
		ParentID:  input.ParentID,
		Body:      body,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, c.ID)
}

// List 获取文章评论列表（树形）
func (s *Service) List(ctx context.Context, articleID, myUserID string) ([]Comment, error) {
	return s.repo.GetByArticleID(ctx, articleID, myUserID)
}

// Delete 删除评论
func (s *Service) Delete(ctx context.Context, userID, commentID string) error {
	c, err := s.repo.GetByID(ctx, commentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCommentNotFound
		}
		return err
	}

	if c.UserID != userID {
		return ErrCommentForbidden
	}

	return s.repo.Delete(ctx, commentID)
}

// DeleteAsAdmin admin 删除任意评论
func (s *Service) DeleteAsAdmin(ctx context.Context, commentID string) error {
	_, err := s.repo.GetByID(ctx, commentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCommentNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, commentID)
}

// ToggleLike 评论点赞/取消
func (s *Service) ToggleLike(ctx context.Context, userID, commentID string) (bool, int, error) {
	_, err := s.repo.GetByID(ctx, commentID)
	if err != nil {
		return false, 0, ErrCommentNotFound
	}
	return s.repo.ToggleLike(ctx, userID, commentID)
}
