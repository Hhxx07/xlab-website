// ===========================================================================
// Articles Repository 层 — internal/articles/repository.go
// 封装文章、标签关联、点赞相关的数据库操作
// ===========================================================================

package articles

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Article 文章模型
type Article struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Body       string    `json:"body"`
	Summary    string    `json:"summary"`
	Cover      *string   `json:"cover"`
	WordCount  int       `json:"word_count"`
	ViewCount  int       `json:"view_count"`
	LikeCount  int       `json:"like_count"`
	Published  bool      `json:"published"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	AuthorName *string   `json:"author_name"`
	Tags       []Tag     `json:"tags"`
	LikedByMe  bool      `json:"liked_by_me"`
}

// Tag 标签模型
type Tag struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Section   string    `json:"section"`
	CreatedAt time.Time `json:"created_at"`
}

// ListFilter 列表查询过滤条件
type ListFilter struct {
	Section   string // study|fun|life → 翻译为 tag 筛选
	Tag       string // 精确 tag name
	AuthorID  string // 作者用户 ID
	Hot       *bool  // 热门标记（article_tags 中是否含特定 tag）
	Published *bool  // 发布状态，nil=不过滤
	Search    string // 搜索关键词（标题模糊匹配）
	Limit     int
	Offset    int
	MyUserID  string // 当前登录用户 ID，用于填充 liked_by_me
}

// Repository 数据访问层
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository 创建 Repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create 创建文章（含标签关联）
func (r *Repository) Create(ctx context.Context, a *Article, tagIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx,
		`INSERT INTO articles (id, user_id, title, slug, body, summary, cover, word_count, published)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, user_id, title, slug, body, summary, cover, word_count, view_count, like_count, published, created_at, updated_at`,
		a.UserID, a.Title, a.Slug, a.Body, a.Summary, a.Cover, a.WordCount, a.Published,
	).Scan(
		&a.ID, &a.UserID, &a.Title, &a.Slug, &a.Body, &a.Summary, &a.Cover,
		&a.WordCount, &a.ViewCount, &a.LikeCount, &a.Published,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// 关联标签
	for _, tagID := range tagIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			a.ID, tagID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// GetBySlug 通过 slug 获取文章（含标签、作者名）
func (r *Repository) GetBySlug(ctx context.Context, slug string, myUserID string) (*Article, error) {
	a := &Article{}
	err := r.pool.QueryRow(ctx,
		`SELECT a.id, a.user_id, a.title, a.slug, a.body, a.summary, a.cover,
		        a.word_count, a.view_count, a.like_count, a.published,
		        a.created_at, a.updated_at, u.username
		 FROM articles a
		 JOIN users u ON u.id = a.user_id
		 WHERE a.slug = $1`,
		slug,
	).Scan(
		&a.ID, &a.UserID, &a.Title, &a.Slug, &a.Body, &a.Summary, &a.Cover,
		&a.WordCount, &a.ViewCount, &a.LikeCount, &a.Published,
		&a.CreatedAt, &a.UpdatedAt, &a.AuthorName,
	)
	if err != nil {
		return nil, err
	}

	// 加载标签
	a.Tags, _ = r.getArticleTags(ctx, a.ID)

	// 加载 liked_by_me
	if myUserID != "" {
		err = r.pool.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM article_likes WHERE user_id=$1 AND article_id=$2)`,
			myUserID, a.ID,
		).Scan(&a.LikedByMe)
		if err != nil {
			a.LikedByMe = false
		}
	}

	return a, nil
}

// GetByID 通过 ID 获取文章
func (r *Repository) GetByID(ctx context.Context, id string) (*Article, error) {
	a := &Article{}
	err := r.pool.QueryRow(ctx,
		`SELECT a.id, a.user_id, a.title, a.slug, a.body, a.summary, a.cover,
		        a.word_count, a.view_count, a.like_count, a.published,
		        a.created_at, a.updated_at, u.username
		 FROM articles a
		 JOIN users u ON u.id = a.user_id
		 WHERE a.id = $1`,
		id,
	).Scan(
		&a.ID, &a.UserID, &a.Title, &a.Slug, &a.Body, &a.Summary, &a.Cover,
		&a.WordCount, &a.ViewCount, &a.LikeCount, &a.Published,
		&a.CreatedAt, &a.UpdatedAt, &a.AuthorName,
	)
	if err != nil {
		return nil, err
	}
	a.Tags, _ = r.getArticleTags(ctx, a.ID)
	return a, nil
}

// List 分页查询文章列表
func (r *Repository) List(ctx context.Context, f ListFilter) ([]Article, int, error) {
	// 动态构建 WHERE 条件
	conditions := []string{}
	args := []interface{}{}
	argIdx := 1

	// 发布状态
	if f.Published != nil {
		conditions = append(conditions, fmt.Sprintf("a.published = $%d", argIdx))
		args = append(args, *f.Published)
		argIdx++
	} else {
		conditions = append(conditions, "a.published = true")
	}

	// 作者筛选
	if f.AuthorID != "" {
		conditions = append(conditions, fmt.Sprintf("a.user_id = $%d", argIdx))
		args = append(args, f.AuthorID)
		argIdx++
	}

	// 搜索
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf("a.title ILIKE $%d", argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	// tag 精确筛选
	tagJoin := ""
	if f.Tag != "" {
		tagJoin = "JOIN article_tags at_t ON at_t.article_id = a.id JOIN tags t ON t.id = at_t.tag_id"
		conditions = append(conditions, fmt.Sprintf("t.name = $%d", argIdx))
		args = append(args, f.Tag)
		argIdx++
	}

	// section 筛选 (study/fun/life → 对应 tag name 列表)
	if f.Section != "" && f.Tag == "" {
		sectionTags := sectionTagNames(f.Section)
		if len(sectionTags) > 0 {
			tagJoin = "JOIN article_tags at_s ON at_s.article_id = a.id JOIN tags ts ON ts.id = at_s.tag_id"
			placeholders := []string{}
			for _, t := range sectionTags {
				placeholders = append(placeholders, fmt.Sprintf("$%d", argIdx))
				args = append(args, t)
				argIdx++
			}
			conditions = append(conditions, fmt.Sprintf("ts.name IN (%s)", strings.Join(placeholders, ",")))
		}
	}

	// hot 筛选（需要 tag join）
	if f.Hot != nil && *f.Hot {
		if tagJoin == "" {
			tagJoin = "JOIN article_tags at_h ON at_h.article_id = a.id JOIN tags th ON th.id = at_h.tag_id"
		}
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// distinct: 防止 tag join 导致重复行
	distinct := ""
	if tagJoin != "" {
		distinct = "DISTINCT"
	}

	// 计数
	countQuery := fmt.Sprintf("SELECT COUNT(%s a.id) FROM articles a %s %s", distinct, tagJoin, whereClause)
	var total int
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 列表查询
	if f.Limit <= 0 {
		f.Limit = 10
	}
	if f.Limit > 50 {
		f.Limit = 50
	}

	listQuery := fmt.Sprintf(
		`SELECT %s a.id, a.user_id, a.title, a.slug, a.summary, a.cover,
		        a.word_count, a.view_count, a.like_count, a.published,
		        a.created_at, a.updated_at, u.username
		 FROM articles a %s
		 JOIN users u ON u.id = a.user_id
		 %s
		 ORDER BY a.created_at DESC
		 LIMIT $%d OFFSET $%d`,
		distinct, tagJoin, whereClause, argIdx, argIdx+1,
	)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	articles := []Article{}
	for rows.Next() {
		var a Article
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.Title, &a.Slug, &a.Summary, &a.Cover,
			&a.WordCount, &a.ViewCount, &a.LikeCount, &a.Published,
			&a.CreatedAt, &a.UpdatedAt, &a.AuthorName,
		); err != nil {
			return nil, 0, err
		}
		// 加载标签
		a.Tags, _ = r.getArticleTags(ctx, a.ID)
		// 加载 liked_by_me
		if f.MyUserID != "" {
			r.pool.QueryRow(ctx,
				`SELECT EXISTS(SELECT 1 FROM article_likes WHERE user_id=$1 AND article_id=$2)`,
				f.MyUserID, a.ID,
			).Scan(&a.LikedByMe)
		}
		articles = append(articles, a)
	}

	return articles, total, nil
}

// Update 更新文章（含标签）
func (r *Repository) Update(ctx context.Context, id string, a *Article, tagIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx,
		`UPDATE articles SET title=$1, slug=$2, body=$3, summary=$4, cover=$5, word_count=$6, published=$7, updated_at=NOW()
		 WHERE id=$8
		 RETURNING id, user_id, title, slug, body, summary, cover, word_count, view_count, like_count, published, created_at, updated_at`,
		a.Title, a.Slug, a.Body, a.Summary, a.Cover, a.WordCount, a.Published, id,
	).Scan(
		&a.ID, &a.UserID, &a.Title, &a.Slug, &a.Body, &a.Summary, &a.Cover,
		&a.WordCount, &a.ViewCount, &a.LikeCount, &a.Published,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// 替换标签
	_, _ = tx.Exec(ctx, `DELETE FROM article_tags WHERE article_id = $1`, id)
	for _, tagID := range tagIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			id, tagID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// Delete 删除文章
func (r *Repository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM articles WHERE id = $1`, id)
	return err
}

// IncrementView 浏览数 +1
func (r *Repository) IncrementView(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE articles SET view_count = view_count + 1 WHERE id = $1`, id,
	)
	return err
}

// ToggleLike 点赞/取消点赞，返回操作后的 like_count
func (r *Repository) ToggleLike(ctx context.Context, userID, articleID string) (liked bool, count int, err error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, 0, err
	}
	defer tx.Rollback(ctx)

	// 检查是否已点赞
	var exists bool
	err = tx.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM article_likes WHERE user_id=$1 AND article_id=$2)`,
		userID, articleID,
	).Scan(&exists)
	if err != nil {
		return false, 0, err
	}

	if exists {
		// 取消点赞
		_, err = tx.Exec(ctx, `DELETE FROM article_likes WHERE user_id=$1 AND article_id=$2`, userID, articleID)
		if err != nil {
			return false, 0, err
		}
		_, err = tx.Exec(ctx, `UPDATE articles SET like_count = like_count - 1 WHERE id=$1 AND like_count > 0`, articleID)
		if err != nil {
			return false, 0, err
		}
		liked = false
	} else {
		// 点赞
		_, err = tx.Exec(ctx, `INSERT INTO article_likes (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, articleID)
		if err != nil {
			return false, 0, err
		}
		_, err = tx.Exec(ctx, `UPDATE articles SET like_count = like_count + 1 WHERE id=$1`, articleID)
		if err != nil {
			return false, 0, err
		}
		liked = true
	}

	err = tx.QueryRow(ctx, `SELECT like_count FROM articles WHERE id=$1`, articleID).Scan(&count)
	if err != nil {
		return liked, 0, err
	}

	return liked, count, tx.Commit(ctx)
}

// CountByUser 统计某用户的文章数量
func (r *Repository) CountByUser(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM articles WHERE user_id = $1`, userID,
	).Scan(&count)
	return count, err
}

// TotalLikesByUser 统计某用户收到的总点赞数
func (r *Repository) TotalLikesByUser(ctx context.Context, userID string) (int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(like_count), 0) FROM articles WHERE user_id = $1`, userID,
	).Scan(&total)
	return total, err
}

// TotalCommentsByUser 统计某用户发表的评论数
func (r *Repository) TotalCommentsByUser(ctx context.Context, userID string) (int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM comments WHERE user_id = $1`, userID,
	).Scan(&total)
	return total, err
}

// CountAll 统计全站文章数
func (r *Repository) CountAll(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM articles`).Scan(&count)
	return count, err
}

// ---------------------------------------------------------------------------
// Tag 操作
// ---------------------------------------------------------------------------

// ListTags 获取所有标签
func (r *Repository) ListTags(ctx context.Context) ([]Tag, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, section, created_at FROM tags ORDER BY section, name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := []Tag{}
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Section, &t.CreatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// GetTagsByIDs 根据 ID 列表获取标签
func (r *Repository) GetTagsByIDs(ctx context.Context, ids []string) ([]Tag, error) {
	if len(ids) == 0 {
		return []Tag{}, nil
	}
	placeholders := []string{}
	args := []interface{}{}
	for i, id := range ids {
		placeholders = append(placeholders, fmt.Sprintf("$%d", i+1))
		args = append(args, id)
	}

	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT id, name, section, created_at FROM tags WHERE id IN (%s)`, strings.Join(placeholders, ",")),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := []Tag{}
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Section, &t.CreatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// ---------------------------------------------------------------------------
// 内部辅助
// ---------------------------------------------------------------------------

func (r *Repository) getArticleTags(ctx context.Context, articleID string) ([]Tag, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT t.id, t.name, t.section, t.created_at
		 FROM tags t
		 JOIN article_tags at ON at.tag_id = t.id
		 WHERE at.article_id = $1
		 ORDER BY t.section, t.name`,
		articleID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := []Tag{}
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Section, &t.CreatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// sectionTagNames 返回分区对应的标签名列表
func sectionTagNames(section string) []string {
	switch section {
	case "study":
		return []string{"知识"}
	case "fun":
		return []string{"游戏", "小说", "电影"}
	case "life":
		return []string{"生活", "运动"}
	default:
		return nil
	}
}

// EnsureUniqueSlug 确保 slug 唯一，冲突时追加数字后缀
func (r *Repository) EnsureUniqueSlug(ctx context.Context, baseSlug string) (string, error) {
	slug := baseSlug
	for i := 1; i < 100; i++ {
		var exists bool
		err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM articles WHERE slug=$1)`, slug).Scan(&exists)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, i)
	}
	return "", fmt.Errorf("无法生成唯一 slug，已达最大重试次数")
}

// CountArticles 统计文章总数
func (r *Repository) CountArticles(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM articles`).Scan(&count)
	return count, err
}

// CountComments 统计评论总数
func (r *Repository) CountComments(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM comments`).Scan(&count)
	return count, err
}

// CountUsers 统计用户总数
func (r *Repository) CountUsers(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}

// AdminListArticles 管理后台文章列表（含未发布）
func (r *Repository) AdminListArticles(ctx context.Context, limit, offset int) ([]Article, int, error) {
	return r.List(ctx, ListFilter{Published: nil, Limit: limit, Offset: offset})
}

// ListUsers 管理后台用户列表
func (r *Repository) ListUsers(ctx context.Context, limit, offset int) ([]UserInfo, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, email, username, display_name, avatar_url, bio, role, email_verified_at, created_at, updated_at
		 FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	users := []UserInfo{}
	for rows.Next() {
		var u UserInfo
		err := rows.Scan(&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL,
			&u.Bio, &u.Role, &u.EmailVerifiedAt, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		// 统计文章数
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM articles WHERE user_id=$1`, u.ID).Scan(&u.ArticleCount)
		users = append(users, u)
	}
	return users, total, nil
}

// UpdateUserRole 更新用户角色
func (r *Repository) UpdateUserRole(ctx context.Context, userID, role string) error {
	_, err := r.pool.Exec(ctx, `UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2`, role, userID)
	return err
}

// UserInfo 管理后台用户信息
type UserInfo struct {
	ID              string     `json:"id"`
	Email           *string    `json:"email"`
	Username        string     `json:"username"`
	DisplayName     *string    `json:"display_name"`
	AvatarURL       *string    `json:"avatar_url"`
	Bio             *string    `json:"bio"`
	Role            string     `json:"role"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	ArticleCount    int        `json:"article_count"`
}

// Ensure repositories import is used
var _ = pgx.ErrNoRows
