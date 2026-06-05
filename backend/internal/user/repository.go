// ===========================================================================
// User Repository 层 — internal/user/repository.go
//
// 用户资料相关的数据访问操作
// ===========================================================================

package user

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// User 用户模型（与 auth 包中的 User 结构相同，各模块独立定义）
type User struct {
	ID              string
	Email           *string
	Username        string
	DisplayName     *string
	AvatarURL       *string
	Bio             *string
	Role            string
	EmailVerifiedAt *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Repository 用户数据访问层
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository 创建 Repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// GetByUsername 通过用户名查找用户
func (r *Repository) GetByUsername(ctx context.Context, username string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role,
		        email_verified_at, created_at, updated_at
		 FROM users WHERE username = $1`,
		username,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByID 通过 ID 查找用户
func (r *Repository) GetByID(ctx context.Context, id string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role,
		        email_verified_at, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Update 更新用户资料（仅允许更新 display_name、bio、avatar_url）
func (r *Repository) Update(ctx context.Context, id string, displayName, bio, avatarURL *string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`UPDATE users
		 SET display_name = COALESCE($2, display_name),
		     bio = COALESCE($3, bio),
		     avatar_url = COALESCE($4, avatar_url),
		     updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, email, username, display_name, avatar_url, bio, role,
		           email_verified_at, created_at, updated_at`,
		id, displayName, bio, avatarURL,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
