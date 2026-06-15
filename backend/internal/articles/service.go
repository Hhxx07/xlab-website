// ===========================================================================
// Articles Service 层 — internal/articles/service.go
// 业务逻辑：slug 生成、权限校验、字数计算
// ===========================================================================

package articles

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

var (
	ErrNotFound   = errors.New("文章不存在")
	ErrForbidden  = errors.New("没有权限执行此操作")
	ErrSlugExists = errors.New("该 slug 已存在")
)

// Service 文章业务逻辑层
type Service struct {
	repo *Repository
}

// NewService 创建 Service
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// CreateInput 创建文章输入
type CreateInput struct {
	Title     string   `json:"title"`
	Body      string   `json:"body"`
	Summary   string   `json:"summary"`
	Cover     *string  `json:"cover"`
	TagIDs    []string `json:"tag_ids"`
	Published bool     `json:"published"`
}

// UpdateInput 更新文章输入
type UpdateInput struct {
	Title     *string  `json:"title"`
	Body      *string  `json:"body"`
	Summary   *string  `json:"summary"`
	Cover     *string  `json:"cover"`
	TagIDs    []string `json:"tag_ids"`
	Published *bool    `json:"published"`
}

// Create 创建文章
func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (*Article, error) {
	if err := validateCreateInput(input); err != nil {
		return nil, err
	}

	slug := generateSlug(input.Title)
	slug, err := s.repo.EnsureUniqueSlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	a := &Article{
		UserID:    userID,
		Title:     strings.TrimSpace(input.Title),
		Slug:      slug,
		Body:      input.Body,
		Summary:   strings.TrimSpace(input.Summary),
		Cover:     input.Cover,
		WordCount: utf8.RuneCountInString(strings.TrimSpace(input.Body)),
		Published: input.Published,
	}

	if len(input.TagIDs) == 0 {
		input.TagIDs = []string{}
	}

	if err := s.repo.Create(ctx, a, input.TagIDs); err != nil {
		return nil, err
	}

	return s.repo.GetBySlug(ctx, a.Slug, "")
}

// GetBySlug 按 slug 获取文章（含浏览数+1）
func (s *Service) GetBySlug(ctx context.Context, slug, myUserID string) (*Article, error) {
	a, err := s.repo.GetBySlug(ctx, slug, myUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	// 浏览数+1（异步忽略错误）
	go func() { _ = s.repo.IncrementView(context.Background(), a.ID) }()
	return a, nil
}

// GetByIDForEdit returns the full article body for an authenticated editor.
func (s *Service) GetByIDForEdit(ctx context.Context, userID, role, articleID string) (*Article, error) {
	a, err := s.repo.GetByID(ctx, articleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if role != "admin" && a.UserID != userID {
		return nil, ErrForbidden
	}
	return a, nil
}

// List 文章列表
func (s *Service) List(ctx context.Context, f ListFilter) ([]Article, int, error) {
	if f.Published == nil {
		pub := true
		f.Published = &pub
	}
	return s.repo.List(ctx, f)
}

// Update 更新文章（权限检查）
func (s *Service) Update(ctx context.Context, userID, articleID string, input UpdateInput) (*Article, error) {
	a, err := s.repo.GetByID(ctx, articleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// 权限检查：作者本人或 admin
	if a.UserID != userID {
		// admin check is done at handler level via context
		// Here, just check ownership — handler will override for admin
		return nil, ErrForbidden
	}

	if input.Title != nil {
		a.Title = strings.TrimSpace(*input.Title)
		a.Slug = generateSlug(a.Title)
		a.Slug, _ = s.repo.EnsureUniqueSlug(ctx, a.Slug)
	}
	if input.Body != nil {
		a.Body = *input.Body
		a.WordCount = utf8.RuneCountInString(strings.TrimSpace(*input.Body))
	}
	if input.Summary != nil {
		a.Summary = strings.TrimSpace(*input.Summary)
	}
	if input.Cover != nil {
		a.Cover = input.Cover
	}
	if input.Published != nil {
		a.Published = *input.Published
	}

	tagIDs := input.TagIDs
	if tagIDs == nil {
		// 保持原有标签
		for _, t := range a.Tags {
			tagIDs = append(tagIDs, t.ID)
		}
	}

	if err := s.repo.Update(ctx, articleID, a, tagIDs); err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, articleID)
}

// UpdateAsAdmin admin 更新任意文章
func (s *Service) UpdateAsAdmin(ctx context.Context, articleID string, input UpdateInput) (*Article, error) {
	a, err := s.repo.GetByID(ctx, articleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if input.Title != nil {
		a.Title = strings.TrimSpace(*input.Title)
		a.Slug = generateSlug(a.Title)
		a.Slug, _ = s.repo.EnsureUniqueSlug(ctx, a.Slug)
	}
	if input.Body != nil {
		a.Body = *input.Body
		a.WordCount = utf8.RuneCountInString(strings.TrimSpace(*input.Body))
	}
	if input.Summary != nil {
		a.Summary = strings.TrimSpace(*input.Summary)
	}
	if input.Cover != nil {
		a.Cover = input.Cover
	}
	if input.Published != nil {
		a.Published = *input.Published
	}

	tagIDs := input.TagIDs
	if tagIDs == nil {
		for _, t := range a.Tags {
			tagIDs = append(tagIDs, t.ID)
		}
	}

	if err := s.repo.Update(ctx, articleID, a, tagIDs); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, articleID)
}

// Delete 删除文章（权限检查）
func (s *Service) Delete(ctx context.Context, userID, articleID string) error {
	a, err := s.repo.GetByID(ctx, articleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	if a.UserID != userID {
		return ErrForbidden
	}

	return s.repo.Delete(ctx, articleID)
}

// DeleteAsAdmin admin 删除任意文章
func (s *Service) DeleteAsAdmin(ctx context.Context, articleID string) error {
	_, err := s.repo.GetByID(ctx, articleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, articleID)
}

// ToggleLike 点赞/取消点赞
func (s *Service) ToggleLike(ctx context.Context, userID, articleID string) (liked bool, count int, err error) {
	_, err = s.repo.GetByID(ctx, articleID)
	if err != nil {
		return false, 0, ErrNotFound
	}
	return s.repo.ToggleLike(ctx, userID, articleID)
}

// MyArticles 获取当前用户的文章
func (s *Service) MyArticles(ctx context.Context, userID string) ([]Article, error) {
	articles, _, err := s.repo.List(ctx, ListFilter{
		AuthorID:  userID,
		Published: nil,
		MyUserID:  userID,
		Limit:     50,
	})
	return articles, err
}

// ListTags 获取所有标签
func (s *Service) ListTags(ctx context.Context) ([]Tag, error) {
	return s.repo.ListTags(ctx)
}

// Sections 获取分区 + 标签映射
type SectionInfo struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Tags  []Tag  `json:"tags"`
}

func (s *Service) Sections(ctx context.Context) ([]SectionInfo, error) {
	tags, err := s.repo.ListTags(ctx)
	if err != nil {
		return nil, err
	}

	sectionMap := map[string]*SectionInfo{
		"study": {Name: "study", Label: "学习"},
		"fun":   {Name: "fun", Label: "有趣"},
		"life":  {Name: "life", Label: "生活"},
	}

	for i := range tags {
		t := tags[i]
		if sec, ok := sectionMap[t.Section]; ok {
			sec.Tags = append(sec.Tags, t)
		}
	}

	return []SectionInfo{*sectionMap["study"], *sectionMap["fun"], *sectionMap["life"]}, nil
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

// 中英文标点、特殊字符 → 连字符
var slugRe = regexp.MustCompile(`[^a-zA-Z0-9一-鿿]+`)

func generateSlug(title string) string {
	title = strings.TrimSpace(title)
	// 取前 60 个字符
	runes := []rune(title)
	if len(runes) > 60 {
		title = string(runes[:60])
	}
	slug := slugRe.ReplaceAllString(title, "-")
	slug = strings.Trim(slug, "-")
	slug = strings.ToLower(slug)
	if slug == "" {
		slug = "untitled"
	}
	return slug
}

func validateCreateInput(input CreateInput) error {
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		return errors.New("标题不能为空")
	}
	if len([]rune(input.Title)) > 200 {
		return errors.New("标题不能超过 200 个字符")
	}
	if strings.TrimSpace(input.Body) == "" {
		return errors.New("正文不能为空")
	}
	return nil
}
