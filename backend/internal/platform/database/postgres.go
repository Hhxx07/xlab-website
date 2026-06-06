// ===========================================================================
// 数据库连接 — internal/platform/database/postgres.go
//
// 使用 pgx v5 连接池管理 PostgreSQL 连接
// 启动时自动运行 golang-migrate 迁移
// ===========================================================================

package database

import (
	"context"
    "fmt"
    "os"
    "path/filepath"
    "sort"
    "strconv"
    "strings"
    "time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectPool 创建 pgx 连接池
//
// poolConfig 从连接字符串解析，并设置连接池参数：
//   - MaxConns: 最大连接数（开发环境 10）
//   - MinConns: 最小连接数（2）
//   - MaxConnLifetime: 连接最大存活时间
func ConnectPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("解析数据库连接字符串失败: %w", err)
	}

	// 开发环境默认连接池配置
	poolConfig.MaxConns = 10
	poolConfig.MinConns = 2
	poolConfig.MaxConnLifetime = 1 * time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("创建数据库连接池失败: %w", err)
	}

	// 验证连接可用
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("数据库 ping 失败: %w", err)
	}

	return pool, nil
}

// RunMigrations 执行数据库迁移（Up 方向）
//
// 读取 migrations 目录下的 .up.sql 文件，按版本号排序执行
// 已执行过的迁移会被跳过（通过 schema_migrations 表追踪）
func RunMigrations(pool *pgxpool.Pool, migrationsDir string) error {
    ctx := context.Background()

    // 1. 创建迁移版本追踪表（如果不存在）
    _, err := pool.Exec(ctx, `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version BIGINT PRIMARY KEY,
            dirty BOOLEAN NOT NULL DEFAULT FALSE
        )
    `)
    if err != nil {
        return fmt.Errorf("创建迁移追踪表失败: %w", err)
    }

    // 2. 扫描 migrations 目录下所有 .up.sql 文件
    entries, err := os.ReadDir(migrationsDir)
    if err != nil {
        return fmt.Errorf("读取迁移目录失败: %w", err)
    }

    type migration struct {
        version int64
        path    string
    }
    var migrations []migration

    for _, entry := range entries {
        if entry.IsDir() {
            continue
        }
        name := entry.Name()
        // 匹配格式：NNNNNN_description.up.sql
        if !strings.HasSuffix(name, ".up.sql") {
            continue
        }
        // 提取版本号（前 6 位数字）
        parts := strings.SplitN(name, "_", 2)
        version, err := strconv.ParseInt(parts[0], 10, 64)
        if err != nil {
            continue
        }
        migrations = append(migrations, migration{
            version: version,
            path:    filepath.Join(migrationsDir, name),
        })
    }

    // 按版本号排序
    sort.Slice(migrations, func(i, j int) bool {
        return migrations[i].version < migrations[j].version
    })

    // 3. 逐个执行迁移
    for _, m := range migrations {
        // 检查是否已执行
        var exists bool
        err := pool.QueryRow(ctx,
            "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", m.version,
        ).Scan(&exists)
        if err != nil {
            return fmt.Errorf("检查迁移版本 %d 失败: %w", m.version, err)
        }
        if exists {
            continue // 已执行，跳过
        }

        // 读取 SQL 文件
        sqlBytes, err := os.ReadFile(m.path)
        if err != nil {
            return fmt.Errorf("读取迁移文件 %s 失败: %w", m.path, err)
        }

        // 在事务中执行迁移
        tx, err := pool.Begin(ctx)
        if err != nil {
            return fmt.Errorf("开始迁移事务失败: %w", err)
        }

        // 标记为 dirty（正在执行中）
        _, err = tx.Exec(ctx,
            "INSERT INTO schema_migrations (version, dirty) VALUES ($1, TRUE)", m.version,
        )
        if err != nil {
            tx.Rollback(ctx)
            return fmt.Errorf("标记迁移 %d 开始失败: %w", m.version, err)
        }

        // 执行迁移 SQL
        if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
            tx.Rollback(ctx)
            return fmt.Errorf("执行迁移 %d (%s) 失败: %w", m.version, filepath.Base(m.path), err)
        }

        // 标记为完成
        _, err = tx.Exec(ctx,
            "UPDATE schema_migrations SET dirty = FALSE WHERE version = $1", m.version,
        )
        if err != nil {
            tx.Rollback(ctx)
            return fmt.Errorf("标记迁移 %d 完成失败: %w", m.version, err)
        }

        if err := tx.Commit(ctx); err != nil {
            return fmt.Errorf("提交迁移 %d 失败: %w", m.version, err)
        }
    }

    return nil
}
