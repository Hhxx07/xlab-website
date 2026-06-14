// ===========================================================================
// Comments Repository — internal/comments/repository.go
// ===========================================================================

package comments

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Comment 评论模型
type Comment struct {
	ID         string     `json:"id"`
	ArticleID  string     `json:"article_id"`
	UserID     string     `json:"user_id"`
	ParentID   *string    `json:"parent_id"`
	Body       string     `json:"body"`
	LikeCount  int        `json:"like_count"`
	CreatedAt  time.Time  `json:"created_at"`
	LikedByMe  bool       `json:"liked_by_me"`
	User       *CommentUser `json:"user"`
	Replies    []Comment  `json:"replies,omitempty"`
}

// CommentUser 评论用户简况
type CommentUser struct {
	Username    string  `json:"username"`
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

// Repository 数据访问层
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository 创建 Repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create 创建评论
func (r *Repository) Create(ctx context.Context, c *Comment) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO comments (id, article_id, user_id, parent_id, body)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4)
		 RETURNING id, article_id, user_id, parent_id, body, like_count, created_at`,
		c.ArticleID, c.UserID, c.ParentID, c.Body,
	).Scan(&c.ID, &c.ArticleID, &c.UserID, &c.ParentID, &c.Body, &c.LikeCount, &c.CreatedAt)
}

// GetByArticleID 获取文章的所有评论（含用户信息）
func (r *Repository) GetByArticleID(ctx context.Context, articleID, myUserID string) ([]Comment, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT c.id, c.article_id, c.user_id, c.parent_id, c.body, c.like_count, c.created_at,
		        u.username, u.display_name, u.avatar_url
		 FROM comments c
		 JOIN users u ON u.id = c.user_id
		 WHERE c.article_id = $1
		 ORDER BY c.created_at ASC`,
		articleID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	all := []Comment{}
	for rows.Next() {
		var c Comment
		c.User = &CommentUser{}
		err := rows.Scan(&c.ID, &c.ArticleID, &c.UserID, &c.ParentID, &c.Body, &c.LikeCount, &c.CreatedAt,
			&c.User.Username, &c.User.DisplayName, &c.User.AvatarURL)
		if err != nil {
			return nil, err
		}
		// liked_by_me
		if myUserID != "" {
			r.pool.QueryRow(ctx,
				`SELECT EXISTS(SELECT 1 FROM comment_likes WHERE user_id=$1 AND comment_id=$2)`,
				myUserID, c.ID,
			).Scan(&c.LikedByMe)
		}
		all = append(all, c)
	}

	// 构建树形结构
	return buildTree(all), nil
}

// GetByID 根据 ID 获取单条评论
func (r *Repository) GetByID(ctx context.Context, id string) (*Comment, error) {
	c := &Comment{}
	c.User = &CommentUser{}
	err := r.pool.QueryRow(ctx,
		`SELECT c.id, c.article_id, c.user_id, c.parent_id, c.body, c.like_count, c.created_at,
		        u.username, u.display_name, u.avatar_url
		 FROM comments c
		 JOIN users u ON u.id = c.user_id
		 WHERE c.id = $1`,
		id,
	).Scan(&c.ID, &c.ArticleID, &c.UserID, &c.ParentID, &c.Body, &c.LikeCount, &c.CreatedAt,
		&c.User.Username, &c.User.DisplayName, &c.User.AvatarURL)
	if err != nil {
		return nil, err
	}
	return c, nil
}

// Delete 删除评论（级联删除子评论）
func (r *Repository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM comments WHERE id = $1`, id)
	return err
}

// ToggleLike 评论点赞/取消点赞
func (r *Repository) ToggleLike(ctx context.Context, userID, commentID string) (liked bool, count int, err error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, 0, err
	}
	defer tx.Rollback(ctx)

	var exists bool
	err = tx.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM comment_likes WHERE user_id=$1 AND comment_id=$2)`,
		userID, commentID,
	).Scan(&exists)
	if err != nil {
		return false, 0, err
	}

	if exists {
		_, err = tx.Exec(ctx, `DELETE FROM comment_likes WHERE user_id=$1 AND comment_id=$2`, userID, commentID)
		if err != nil {
			return false, 0, err
		}
		_, err = tx.Exec(ctx, `UPDATE comments SET like_count = like_count - 1 WHERE id=$1 AND like_count > 0`, commentID)
		if err != nil {
			return false, 0, err
		}
		liked = false
	} else {
		_, err = tx.Exec(ctx, `INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, commentID)
		if err != nil {
			return false, 0, err
		}
		_, err = tx.Exec(ctx, `UPDATE comments SET like_count = like_count + 1 WHERE id=$1`, commentID)
		if err != nil {
			return false, 0, err
		}
		liked = true
	}

	err = tx.QueryRow(ctx, `SELECT like_count FROM comments WHERE id=$1`, commentID).Scan(&count)
	if err != nil {
		return liked, 0, err
	}

	return liked, count, tx.Commit(ctx)
}

// ---------------------------------------------------------------------------
// 辅助：扁平列表 → 树形结构
// ---------------------------------------------------------------------------
func buildTree(flat []Comment) []Comment {
	byID := map[string]*Comment{}
	roots := []Comment{}

	for i := range flat {
		c := flat[i]
		c.Replies = []Comment{}
		byID[c.ID] = &c
	}

	for i := range flat {
		c := byID[flat[i].ID]
		if c.ParentID != nil {
			parent, ok := byID[*c.ParentID]
			if ok {
				parent.Replies = append(parent.Replies, *c)
			} else {
				roots = append(roots, *c)
			}
		} else {
			roots = append(roots, *c)
		}
	}

	return roots
}
