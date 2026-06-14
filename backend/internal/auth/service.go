// ===========================================================================
// Auth Service 层 — internal/auth/service.go
//
// 核心业务逻辑：
//   - Register：校验输入 → Argon2id 哈希密码 → 创建用户
//   - Login：查用户 → 验证密码 → 生成 Session Token → 返回 Cookie
//   - Logout：删除 Session
//   - GetMe：通过 Session 获取当前用户
//   - 密码哈希与验证（Argon2id）
//   - Session Token 生成与验证
// ===========================================================================

package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"net/smtp"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/xlab-backend/internal/platform/config"
	"golang.org/x/crypto/argon2"
)

// 密码哈希参数（Argon2id 推荐配置）
// 这些参数影响哈希计算时间和内存消耗
const (
	argon2Time    uint32 = 3         // 迭代次数
	argon2Memory  uint32 = 64 * 1024 // 内存用量 64MB
	argon2Threads uint8  = 4         // 并行度
	argon2KeyLen  uint32 = 32        // 输出哈希长度（32 字节 = 256 bits）
	saltLen       int    = 16        // 盐值长度
)

// 业务层错误定义
var (
	ErrEmailAlreadyExists    = errors.New("该邮箱已被注册")
	ErrUsernameAlreadyExists = errors.New("该用户名已被占用")
	ErrInvalidEmailPassword  = errors.New("邮箱或密码错误")
	ErrSessionExpired        = errors.New("会话已过期，请重新登录")
	ErrUnauthorized          = errors.New("请先登录")
)

// Service 认证服务
type Service struct {
	repo       *Repository
	cfg        *config.Config
	magicLinks map[string]magicLinkEntry
	mu         sync.Mutex
}

// NewService 创建认证服务实例
func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg, magicLinks: make(map[string]magicLinkEntry)}
}

type magicLinkEntry struct {
	Email     string
	ExpiresAt time.Time
}

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------

// RegisterInput 注册请求参数
type RegisterInput struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegisterResult 注册返回结果（不含密码）
type RegisterResult struct {
	User *User `json:"user"`
}

// Register 处理用户注册
//
// 流程：
//  1. 校验输入（用户名/密码长度、邮箱格式）
//  2. 检查邮箱、用户名是否已被占用
//  3. Argon2id 哈希密码
//  4. 写入数据库
//  5. 返回用户信息（不含密码哈希）
func (s *Service) Register(ctx context.Context, input RegisterInput) (*RegisterResult, error) {
	// 1. 基础校验
	input.Email = strings.TrimSpace(input.Email)
	input.Username = strings.TrimSpace(input.Username)

	if input.Email == "" || input.Username == "" || input.Password == "" {
		return nil, fmt.Errorf("邮箱、用户名和密码不能为空")
	}
	if len(input.Username) < 2 || len(input.Username) > 32 {
		return nil, fmt.Errorf("用户名长度需要 2-32 个字符")
	}
	if len(input.Password) < 6 {
		return nil, fmt.Errorf("密码至少需要 6 个字符")
	}

	// 2. 检查唯一性
	existingUser, err := s.repo.GetUserByEmail(ctx, input.Email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("查询邮箱失败: %w", err)
	}
	if existingUser != nil {
		return nil, ErrEmailAlreadyExists
	}

	existingUser, err = s.repo.GetUserByUsername(ctx, input.Username)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("查询用户名失败: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUsernameAlreadyExists
	}

	// 3. 哈希密码
	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("密码加密失败: %w", err)
	}

	// 4. 创建用户
	email := input.Email // 指针化
	username := input.Username
	hash := passwordHash
	user, err := s.repo.CreateUser(ctx, &email, username, &hash)
	if err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	// 5. 生成邮箱验证令牌
	_ = s.sendVerificationEmail(ctx, user.ID, input.Email)

	return &RegisterResult{User: user}, nil
}

// sendVerificationEmail 生成验证令牌并发送邮件（dev 模式打印链接）
func (s *Service) sendVerificationEmail(ctx context.Context, userID, email string) error {
	rawToken, tokenHash, err := generateSessionToken()
	if err != nil {
		return err
	}

	expiresAt := time.Now().Add(24 * time.Hour) // 24小时有效
	if err := s.repo.CreateEmailVerificationToken(ctx, userID, tokenHash, expiresAt); err != nil {
		return err
	}

	verifyURL := fmt.Sprintf("%s/api/auth/verify-email?token=%s", s.cfg.FrontendURL, rawToken)

	if s.cfg.SMTPHost != "" && s.cfg.SMTPUser != "" {
		// 生产环境发送邮件
		from := s.cfg.SMTPFrom
		if from == "" {
			from = s.cfg.SMTPUser
		}
		addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)
		auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPassword, s.cfg.SMTPHost)
		message := strings.Join([]string{
			fmt.Sprintf("From: %s", from),
			fmt.Sprintf("To: %s", email),
			"Subject: 验证你的 XLab 邮箱",
			"MIME-Version: 1.0",
			"Content-Type: text/plain; charset=UTF-8",
			"",
			fmt.Sprintf("点击链接验证邮箱：%s", verifyURL),
			"链接 24 小时内有效。",
		}, "\r\n")
		_ = smtp.SendMail(addr, auth, from, []string{email}, []byte(message))
	} else {
		// 开发环境打印到控制台
		fmt.Printf("\n========================================\n")
		fmt.Printf("📧 邮箱验证链接（dev）:\n%s\n", verifyURL)
		fmt.Printf("========================================\n\n")
	}

	return nil
}

// VerifyEmail 验证邮箱
func (s *Service) VerifyEmail(ctx context.Context, rawToken string) error {
	tokenHash := HashToken(rawToken)

	t, err := s.repo.GetEmailVerificationToken(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("验证链接无效或已过期")
		}
		return err
	}

	// 标记邮箱已验证
	if err := s.repo.UpdateUserEmailVerified(ctx, t.UserID); err != nil {
		return err
	}

	// 删除已使用的令牌
	_ = s.repo.DeleteEmailVerificationToken(ctx, t.ID)

	return nil
}

// ResendVerification 重新发送验证邮件
func (s *Service) ResendVerification(ctx context.Context, userID, email string) error {
	return s.sendVerificationEmail(ctx, userID, email)
}

// ---------------------------------------------------------------------------
// 登录
// ---------------------------------------------------------------------------

// LoginInput 登录请求参数
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResult 登录返回
type LoginResult struct {
	User      *User  `json:"user"`
	SetCookie string `json:"-"` // 需要设置的 Cookie 值，JSON 不输出
}

// Login 处理用户登录
//
// 流程：
//  1. 查找用户
//  2. 验证密码
//  3. 生成 Session Token
//  4. token hash 存入 sessions 表
//  5. 返回用户信息 + Cookie 字符串
func (s *Service) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
	input.Email = strings.TrimSpace(input.Email)

	if input.Email == "" || input.Password == "" {
		return nil, fmt.Errorf("邮箱和密码不能为空")
	}

	// 1. 查找用户
	user, err := s.repo.GetUserByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidEmailPassword
		}
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	// 2. 验证密码（OAuth 用户无密码）
	if user.PasswordHash == nil {
		return nil, ErrInvalidEmailPassword
	}
	if !verifyPassword(input.Password, *user.PasswordHash) {
		return nil, ErrInvalidEmailPassword
	}

	// 3. 生成 Session Token
	rawToken, tokenHash, err := generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("生成会话令牌失败: %w", err)
	}

	// 4. 存储会话
	expiresAt := time.Now().Add(time.Duration(s.cfg.SessionTTLHours) * time.Hour)
	session, err := s.repo.CreateSession(ctx, user.ID, tokenHash, nil, nil, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("创建会话失败: %w", err)
	}

	// 5. 构建 HttpOnly Cookie 字符串
	cookie := buildSessionCookie(rawToken, expiresAt)

	_ = session // session 信息已记录到数据库

	return &LoginResult{
		User:      user,
		SetCookie: cookie,
	}, nil
}

// ---------------------------------------------------------------------------
// 登出
// ---------------------------------------------------------------------------

// Logout 处理登出
// 通过 token hash 查找并删除对应 session
type MagicLinkRequestInput struct {
	Email string `json:"email"`
}

type MagicLinkRequestResult struct {
	Message     string `json:"message"`
	DevLoginURL string `json:"dev_login_url,omitempty"`
}

func (s *Service) RequestMagicLink(_ context.Context, input MagicLinkRequestInput) (*MagicLinkRequestResult, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || !strings.Contains(email, "@") {
		return nil, fmt.Errorf("请输入有效邮箱")
	}

	rawToken, _, err := generateSessionToken()
	if err != nil {
		return nil, err
	}

	s.mu.Lock()
	s.magicLinks[rawToken] = magicLinkEntry{Email: email, ExpiresAt: time.Now().Add(15 * time.Minute)}
	s.mu.Unlock()

	loginURL := fmt.Sprintf("%s/api/auth/magic-link/verify?token=%s", strings.TrimRight(s.cfg.FrontendURL, "/"), rawToken)
	if s.cfg.AppEnv == "development" {
		fmt.Printf("\n[MAGIC LINK DEV] %s\n\n", loginURL)
	} else if err := s.sendMagicLinkEmail(email, loginURL); err != nil {
		return nil, err
	}

	return &MagicLinkRequestResult{
		Message:     "登录链接已生成。开发环境请查看后端控制台输出。",
		DevLoginURL: loginURL,
	}, nil
}

func (s *Service) VerifyMagicLink(ctx context.Context, rawToken string) (*LoginResult, error) {
	s.mu.Lock()
	entry, ok := s.magicLinks[rawToken]
	if ok {
		delete(s.magicLinks, rawToken)
	}
	s.mu.Unlock()

	if !ok || time.Now().After(entry.ExpiresAt) {
		return nil, fmt.Errorf("登录链接无效或已过期")
	}

	user, err := s.repo.GetUserByEmail(ctx, entry.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			email := entry.Email
			username := sanitizeMagicUsername(strings.Split(entry.Email, "@")[0])
			username = fmt.Sprintf("%s_%d", username, time.Now().Unix()%100000)
			user, err = s.repo.CreateUser(ctx, &email, username, nil)
		}
		if err != nil {
			return nil, err
		}
	}

	rawSessionToken, tokenHash, err := generateSessionToken()
	if err != nil {
		return nil, err
	}
	expiresAt := time.Now().Add(time.Duration(s.cfg.SessionTTLHours) * time.Hour)
	if _, err := s.repo.CreateSession(ctx, user.ID, tokenHash, nil, nil, expiresAt); err != nil {
		return nil, err
	}

	return &LoginResult{
		User:      user,
		SetCookie: buildSessionCookie(rawSessionToken, expiresAt),
	}, nil
}

func sanitizeMagicUsername(value string) string {
	var b strings.Builder
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
			b.WriteRune(r)
		}
	}
	if b.Len() < 2 {
		return "user"
	}
	return b.String()
}

func (s *Service) sendMagicLinkEmail(email string, loginURL string) error {
	if s.cfg.SMTPHost == "" || s.cfg.SMTPUser == "" || s.cfg.SMTPPassword == "" {
		return fmt.Errorf("SMTP 配置不完整，无法发送登录邮件")
	}

	from := s.cfg.SMTPFrom
	if from == "" {
		from = s.cfg.SMTPUser
	}

	addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)
	auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPassword, s.cfg.SMTPHost)
	message := strings.Join([]string{
		fmt.Sprintf("From: %s", from),
		fmt.Sprintf("To: %s", email),
		"Subject: x·blog 登录链接",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		"点击下面的链接完成登录，链接 15 分钟内有效：",
		loginURL,
	}, "\r\n")

	return smtp.SendMail(addr, auth, from, []string{email}, []byte(message))
}

func (s *Service) Logout(ctx context.Context, sessionTokenHash string) error {
	session, err := s.repo.GetSessionByTokenHash(ctx, sessionTokenHash)
	if err != nil {
		return err // 会话不存在也算登出成功
	}
	return s.repo.DeleteSession(ctx, session.ID)
}

// ---------------------------------------------------------------------------
// 获取当前用户
// ---------------------------------------------------------------------------

// GetMe 通过 session token hash 获取当前登录用户
func (s *Service) GetMe(ctx context.Context, sessionTokenHash string) (*User, error) {
	session, err := s.repo.GetSessionByTokenHash(ctx, sessionTokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionExpired
		}
		return nil, err
	}

	user, err := s.repo.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// ---------------------------------------------------------------------------
// 密码工具函数（Argon2id）
// ---------------------------------------------------------------------------

// hashPassword 使用 Argon2id 算法哈希密码
//
// 返回格式（与 PHP password_hash 兼容的字符串表示）：
//
//	$argon2id$v=19$m=65536,t=3,p=4$<base64_salt>$<base64_hash>
func hashPassword(password string) (string, error) {
	// 生成随机盐值
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Argon2id 哈希
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	// 格式化为可存储的字符串
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argon2Memory, argon2Time, argon2Threads, b64Salt, b64Hash), nil
}

// verifyPassword 验证密码是否匹配哈希
//
// 使用常量时间比较防止时序攻击
func verifyPassword(password, encodedHash string) bool {
	// 解析编码后的哈希字符串
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false
	}

	// 提取参数（简化解析，假定格式固定）
	b64Salt := parts[4]
	b64Hash := parts[5]

	salt, err := base64.RawStdEncoding.DecodeString(b64Salt)
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(b64Hash)
	if err != nil {
		return false
	}

	// 重新计算哈希
	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	// 常量时间比较
	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1
}

// ---------------------------------------------------------------------------
// Session Token 工具
// ---------------------------------------------------------------------------

// generateSessionToken 生成随机 session token
//
// 返回：
//
//	rawToken  — 原始 256-bit token（base64 编码，发给浏览器）
//	tokenHash — rawToken 的 SHA-256 哈希（存入数据库）
func generateSessionToken() (rawToken, tokenHash string, err error) {
	tokenBytes := make([]byte, 32) // 256 bits
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", "", err
	}

	rawToken = base64.RawURLEncoding.EncodeToString(tokenBytes)

	// 对原始 token 做 SHA-256 哈希后入库
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash = base64.RawURLEncoding.EncodeToString(hash[:])

	return rawToken, tokenHash, nil
}

// HashToken 对原始 token 做 SHA-256（从 Cookie 中提取 token 后验证用）
func HashToken(rawToken string) string {
	hash := sha256.Sum256([]byte(rawToken))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}

// buildSessionCookie 构建 HttpOnly Session Cookie 字符串
//
// Cookie 属性：
//
//	HttpOnly — JS 无法读取，防止 XSS 窃取
//	Secure  — 仅 HTTPS 发送（生产环境开启）
//	SameSite  — Lax，防止 CSRF
//	Path     — /，全站有效
func buildSessionCookie(rawToken string, expiresAt time.Time) string {
	secure := "; Secure" // 开发环境可选择性关闭
	// TODO: 根据 APP_ENV 判断是否设置 Secure
	return fmt.Sprintf(
		"session_token=%s; Path=/; HttpOnly; SameSite=Lax; Expires=%s%s",
		rawToken,
		expiresAt.Format(http.TimeFormat),
		secure,
	)
}

// ClearSessionCookie 返回一个清除 session cookie 的 Set-Cookie 头
func ClearSessionCookie() string {
	return "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
}
