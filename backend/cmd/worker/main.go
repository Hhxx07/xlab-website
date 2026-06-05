// ===========================================================================
// Worker 入口 — cmd/worker/main.go
//
// Phase 1：仅输出启动日志，不做任何实际任务
// 后续 Phase 将在此注册爬虫、统计聚合、订阅推送等定时任务
// ===========================================================================

package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/xlab-backend/internal/platform/config"
	"github.com/xlab-backend/internal/platform/database"
	"github.com/xlab-backend/internal/platform/logger"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.AppEnv)

	log.Info().Msg("Worker 启动中...")

	// 连接数据库（Worker 需要访问数据）
	dbPool, err := database.ConnectPool(nil, cfg.DatabaseURL) // context.Background() 简化
	if err != nil {
		log.Fatal().Err(err).Msg("Worker 无法连接数据库")
	}
	defer dbPool.Close()

	fmt.Println(dbPool) // 暂时使用 dbPool 避免编译错误

	log.Info().Msg("Worker 已就绪，等待任务注册（Phase 1 无实际任务）")

	// 等待关闭信号，保持进程存活
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Worker 已停止")
}
