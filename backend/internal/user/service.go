// ===========================================================================
// User Service 层 — internal/user/service.go
//
// 用户资料业务逻辑
// ===========================================================================

package user

import (
	"context"
	"fmt"
	"strings"
)

// Service 用户服务
type Service struct {
	repo *Repository
}

// NewService 创建 Service
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// GetByUsername 通过用户名获取用户公开信息
func (s *Service) GetByUsername(ctx context.Context, username string) (*User, error) {
	user, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("用户不存在: %w", err)
	}
	return user, nil
}

// UpdateMeInput 更新资料的请求参数
type UpdateMeInput struct {
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
}

// Validate 校验输入
func (i *UpdateMeInput) Validate() error {
	if i.DisplayName != nil {
		*i.DisplayName = strings.TrimSpace(*i.DisplayName)
		if len(*i.DisplayName) > 64 {
			return fmt.Errorf("显示名称最多 64 个字符")
		}
	}
	if i.Bio != nil {
		*i.Bio = strings.TrimSpace(*i.Bio)
		if len(*i.Bio) > 500 {
			return fmt.Errorf("个人简介最多 500 个字符")
		}
	}
	return nil
}

// UpdateMe 更新当前登录用户的资料
func (s *Service) UpdateMe(ctx context.Context, userID string, input UpdateMeInput) (*User, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := s.repo.Update(ctx, userID, input.DisplayName, input.Bio, input.AvatarURL)
	if err != nil {
		return nil, fmt.Errorf("更新资料失败: %w", err)
	}
	return user, nil
}
