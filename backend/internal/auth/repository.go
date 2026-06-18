// ===========================================================================
// Auth Repository 层 — internal/auth/repository.go
//
// 封装所有认证相关的数据库操作，使用 pgx 直接执行 SQL
// 职责：
//   - 用户 CRUD（创建、查询、更新）
//   - 会话管理（创建、查询、删除）
//   - 不包含业务逻辑
// ===========================================================================

package auth

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// User 用户模型（数据库行映射）
type User struct {
	ID              string  // UUID
	Email           *string // 可为空（OAuth 用户）
	Username        string
	DisplayName     *string
	AvatarURL       *string
	Bio             *string
	Role            string
	PasswordHash    *string // Argon2id 哈希，OAuth 用户可为空
	EmailVerifiedAt *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type PendingRegistration struct {
	ID           string
	Email        string
	Username     string
	PasswordHash string
	TokenHash    string
	ExpiresAt    time.Time
	CreatedAt    time.Time
}

// Session 会话模型
type Session struct {
	ID        string
	UserID    string
	TokenHash string
	UserAgent *string
	IPHash    *string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// Repository 数据访问层
// 持有 pgxpool.Pool 用于执行 SQL
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository 创建 Repository 实例
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ---------------------------------------------------------------------------
// 用户操作
// ---------------------------------------------------------------------------

// CreateUser 创建新用户
// 使用 UUID v7 生成主键，确保时间有序
func (r *Repository) CreateUser(ctx context.Context, email *string, username string, passwordHash *string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (id, email, username, password_hash)
		 VALUES (gen_random_uuid(), $1, $2, $3)
		 RETURNING id, email, username, display_name, avatar_url, bio, role,
		           password_hash, email_verified_at, created_at, updated_at`,
		email, username, passwordHash,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.PasswordHash, &user.EmailVerifiedAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *Repository) CreateVerifiedUser(ctx context.Context, email string, username string, passwordHash string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (id, email, username, password_hash, email_verified_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, NOW())
		 RETURNING id, email, username, display_name, avatar_url, bio, role,
		           password_hash, email_verified_at, created_at, updated_at`,
		email, username, passwordHash,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.PasswordHash, &user.EmailVerifiedAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByEmail 通过邮箱查找用户
// 如果未找到返回 pgx.ErrNoRows
func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role,
		        password_hash, email_verified_at, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.PasswordHash, &user.EmailVerifiedAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByUsername 通过用户名查找用户
func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role,
		        password_hash, email_verified_at, created_at, updated_at
		 FROM users WHERE username = $1`,
		username,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.PasswordHash, &user.EmailVerifiedAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByID 通过 ID 查找用户
func (r *Repository) GetUserByID(ctx context.Context, id string) (*User, error) {
	user := &User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role,
		        password_hash, email_verified_at, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.AvatarURL, &user.Bio, &user.Role,
		&user.PasswordHash, &user.EmailVerifiedAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// UpdateUserEmailVerified 标记邮箱已验证
func (r *Repository) UpdateUserEmailVerified(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET email_verified_at = NOW(), updated_at = NOW()
		 WHERE id = $1`,
		userID,
	)
	return err
}

func (r *Repository) CreatePendingRegistration(ctx context.Context, email, username, passwordHash, tokenHash string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO pending_registrations (id, email, username, password_hash, token_hash, expires_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
		email, username, passwordHash, tokenHash, expiresAt,
	)
	return err
}

func (r *Repository) GetPendingRegistrationByEmail(ctx context.Context, email string) (*PendingRegistration, error) {
	p := &PendingRegistration{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, password_hash, token_hash, expires_at, created_at
		 FROM pending_registrations
		 WHERE email = $1 AND expires_at > NOW()`,
		email,
	).Scan(&p.ID, &p.Email, &p.Username, &p.PasswordHash, &p.TokenHash, &p.ExpiresAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) GetPendingRegistrationByUsername(ctx context.Context, username string) (*PendingRegistration, error) {
	p := &PendingRegistration{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, password_hash, token_hash, expires_at, created_at
		 FROM pending_registrations
		 WHERE username = $1 AND expires_at > NOW()`,
		username,
	).Scan(&p.ID, &p.Email, &p.Username, &p.PasswordHash, &p.TokenHash, &p.ExpiresAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) GetPendingRegistrationByTokenHash(ctx context.Context, tokenHash string) (*PendingRegistration, error) {
	p := &PendingRegistration{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, username, password_hash, token_hash, expires_at, created_at
		 FROM pending_registrations
		 WHERE token_hash = $1 AND expires_at > NOW()`,
		tokenHash,
	).Scan(&p.ID, &p.Email, &p.Username, &p.PasswordHash, &p.TokenHash, &p.ExpiresAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) DeletePendingRegistration(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM pending_registrations WHERE id = $1`, id)
	return err
}

// ---------------------------------------------------------------------------
// 会话操作
// ---------------------------------------------------------------------------

// CreateSession 创建新会话记录
// tokenHash: 随机 token 的 SHA-256 哈希
func (r *Repository) CreateSession(ctx context.Context, userID, tokenHash string, userAgent, ipHash *string, expiresAt time.Time) (*Session, error) {
	session := &Session{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_hash, expires_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
		 RETURNING id, user_id, token_hash, user_agent, ip_hash, expires_at, created_at`,
		userID, tokenHash, userAgent, ipHash, expiresAt,
	).Scan(
		&session.ID, &session.UserID, &session.TokenHash,
		&session.UserAgent, &session.IPHash,
		&session.ExpiresAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// GetSessionByTokenHash 通过 token hash 查找有效会话
// 自动过滤已过期的会话
func (r *Repository) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	session := &Session{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, token_hash, user_agent, ip_hash, expires_at, created_at
		 FROM sessions
		 WHERE token_hash = $1 AND expires_at > NOW()`,
		tokenHash,
	).Scan(
		&session.ID, &session.UserID, &session.TokenHash,
		&session.UserAgent, &session.IPHash,
		&session.ExpiresAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// DeleteSession 删除指定会话（用户登出时调用）
func (r *Repository) DeleteSession(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, id)
	return err
}

// DeleteExpiredSessions 清理过期会话（由 Worker 定时调用）
func (r *Repository) DeleteExpiredSessions(ctx context.Context) (int64, error) {
	tag, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at < NOW()`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

// ---------------------------------------------------------------------------
// 邮箱验证令牌操作
// ---------------------------------------------------------------------------

// EmailVerificationToken 邮箱验证令牌模型
type EmailVerificationToken struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// CreateEmailVerificationToken 创建邮箱验证令牌
func (r *Repository) CreateEmailVerificationToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
		 VALUES (gen_random_uuid(), $1, $2, $3)`,
		userID, tokenHash, expiresAt,
	)
	return err
}

// GetEmailVerificationToken 通过 token hash 查找有效验证令牌
func (r *Repository) GetEmailVerificationToken(ctx context.Context, tokenHash string) (*EmailVerificationToken, error) {
	t := &EmailVerificationToken{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, token_hash, expires_at, created_at
		 FROM email_verification_tokens
		 WHERE token_hash = $1 AND expires_at > NOW()`,
		tokenHash,
	).Scan(&t.ID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

// DeleteEmailVerificationToken 删除已使用的验证令牌
func (r *Repository) DeleteEmailVerificationToken(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM email_verification_tokens WHERE id = $1`, id)
	return err
}

// DeleteExpiredEmailVerificationTokens 清理过期验证令牌
func (r *Repository) DeleteExpiredEmailVerificationTokens(ctx context.Context) (int64, error) {
	tag, err := r.pool.Exec(ctx, `DELETE FROM email_verification_tokens WHERE expires_at < NOW()`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
