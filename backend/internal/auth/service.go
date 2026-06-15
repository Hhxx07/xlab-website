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

const (
	argon2Time    uint32 = 3
	argon2Memory  uint32 = 64 * 1024
	argon2Threads uint8  = 4
	argon2KeyLen  uint32 = 32
	saltLen       int    = 16
)

var (
	ErrEmailAlreadyExists    = errors.New("该邮箱已被注册")
	ErrUsernameAlreadyExists = errors.New("该用户名已被占用")
	ErrInvalidEmailPassword  = errors.New("邮箱或密码错误")
	ErrEmailNotVerified      = errors.New("请先完成邮箱验证后再登录")
	ErrSessionExpired        = errors.New("会话已过期，请重新登录")
	ErrUnauthorized          = errors.New("请先登录")
)

type Service struct {
	repo       *Repository
	cfg        *config.Config
	magicLinks map[string]magicLinkEntry
	mu         sync.Mutex
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg, magicLinks: make(map[string]magicLinkEntry)}
}

type magicLinkEntry struct {
	Email     string
	ExpiresAt time.Time
}

type RegisterInput struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterResult struct {
	User *User `json:"user"`
}

func (s *Service) Register(ctx context.Context, input RegisterInput) (*RegisterResult, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
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

	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("密码加密失败: %w", err)
	}

	email := input.Email
	username := input.Username
	hash := passwordHash
	user, err := s.repo.CreateUser(ctx, &email, username, &hash)
	if err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	if err := s.sendVerificationEmail(ctx, user.ID, input.Email); err != nil {
		return nil, fmt.Errorf("发送验证邮件失败: %w", err)
	}

	return &RegisterResult{User: user}, nil
}

func (s *Service) sendVerificationEmail(ctx context.Context, userID, email string) error {
	rawToken, tokenHash, err := generateSessionToken()
	if err != nil {
		return err
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	if err := s.repo.CreateEmailVerificationToken(ctx, userID, tokenHash, expiresAt); err != nil {
		return err
	}

	frontend := strings.TrimRight(s.cfg.FrontendURL, "/")
	verifyURL := fmt.Sprintf("%s/api/auth/verify-email?token=%s", frontend, rawToken)
	loginURL := fmt.Sprintf("%s/login?verified=1", frontend)

	if s.cfg.SMTPHost != "" && s.cfg.SMTPUser != "" {
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
			"欢迎注册 XLab。",
			"请点击下面的链接完成邮箱验证，链接 24 小时内有效：",
			verifyURL,
			"",
			"验证成功后可从这里登录：",
			loginURL,
		}, "\r\n")
		return smtp.SendMail(addr, auth, from, []string{email}, []byte(message))
	}

	fmt.Printf("\n[EMAIL VERIFY DEV]\n%s\nLogin after verify: %s\n\n", verifyURL, loginURL)
	return nil
}

func (s *Service) VerifyEmail(ctx context.Context, rawToken string) error {
	tokenHash := HashToken(rawToken)

	t, err := s.repo.GetEmailVerificationToken(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("验证链接无效或已过期")
		}
		return err
	}

	if err := s.repo.UpdateUserEmailVerified(ctx, t.UserID); err != nil {
		return err
	}
	_ = s.repo.DeleteEmailVerificationToken(ctx, t.ID)
	return nil
}

func (s *Service) ResendVerification(ctx context.Context, userID, email string) error {
	return s.sendVerificationEmail(ctx, userID, email)
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResult struct {
	User      *User  `json:"user"`
	SetCookie string `json:"-"`
}

func (s *Service) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	if input.Email == "" || input.Password == "" {
		return nil, fmt.Errorf("邮箱和密码不能为空")
	}

	user, err := s.repo.GetUserByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidEmailPassword
		}
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	if user.PasswordHash == nil || !verifyPassword(input.Password, *user.PasswordHash) {
		return nil, ErrInvalidEmailPassword
	}
	if user.Email != nil && user.EmailVerifiedAt == nil {
		return nil, ErrEmailNotVerified
	}

	return s.createLoginSession(ctx, user)
}

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
		Message:     "登录链接已发送，请检查邮箱。",
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

	if user.EmailVerifiedAt == nil {
		if err := s.repo.UpdateUserEmailVerified(ctx, user.ID); err != nil {
			return nil, err
		}
		user.EmailVerifiedAt = ptrTime(time.Now())
	}

	return s.createLoginSession(ctx, user)
}

func (s *Service) createLoginSession(ctx context.Context, user *User) (*LoginResult, error) {
	rawToken, tokenHash, err := generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("生成会话令牌失败: %w", err)
	}

	expiresAt := time.Now().Add(time.Duration(s.cfg.SessionTTLHours) * time.Hour)
	if _, err := s.repo.CreateSession(ctx, user.ID, tokenHash, nil, nil, expiresAt); err != nil {
		return nil, fmt.Errorf("创建会话失败: %w", err)
	}

	return &LoginResult{
		User:      user,
		SetCookie: buildSessionCookie(rawToken, expiresAt),
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
		"Subject: x路blog 登录链接",
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
		return err
	}
	return s.repo.DeleteSession(ctx, session.ID)
}

func (s *Service) GetMe(ctx context.Context, sessionTokenHash string) (*User, error) {
	session, err := s.repo.GetSessionByTokenHash(ctx, sessionTokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionExpired
		}
		return nil, err
	}

	return s.repo.GetUserByID(ctx, session.UserID)
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argon2Memory, argon2Time, argon2Threads, b64Salt, b64Hash), nil
}

func verifyPassword(password, encodedHash string) bool {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1
}

func generateSessionToken() (rawToken, tokenHash string, err error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", "", err
	}

	rawToken = base64.RawURLEncoding.EncodeToString(tokenBytes)
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash = base64.RawURLEncoding.EncodeToString(hash[:])

	return rawToken, tokenHash, nil
}

func HashToken(rawToken string) string {
	hash := sha256.Sum256([]byte(rawToken))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}

func buildSessionCookie(rawToken string, expiresAt time.Time) string {
	secure := "; Secure"
	return fmt.Sprintf(
		"session_token=%s; Path=/; HttpOnly; SameSite=Lax; Expires=%s%s",
		rawToken,
		expiresAt.Format(http.TimeFormat),
		secure,
	)
}

func ClearSessionCookie() string {
	return "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
}

func ptrTime(value time.Time) *time.Time {
	return &value
}
