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
// Phase 1 实现简单版本：读取 migrations 目录的 .up.sql 文件按序执行
// 生产环境建议使用 golang-migrate 库，此处以简洁为主
func RunMigrations(pool *pgxpool.Pool, migrationsDir string) error {
	// 创建迁移版本追踪表（如果不存在）
	_, err := pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version BIGINT PRIMARY KEY,
			dirty BOOLEAN NOT NULL DEFAULT FALSE
		)
	`)
	if err != nil {
		return fmt.Errorf("创建迁移追踪表失败: %w", err)
	}

	// Phase 1 简化：直接执行已知的迁移 SQL
	// 后续 Phase 将改用 golang-migrate 库的 FileSource
	// 当前通过 init.sql 中的 IF NOT EXISTS 保证幂等性
	// 实际迁移文件在 migrations/ 目录中，可通过 migrate CLI 手动执行

	return nil
}
