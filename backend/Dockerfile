# ===========================================================================
# 后端 Dockerfile — 多阶段构建
# 
# 阶段说明：
#   dev  — 开发环境，包含 air 热重载，源码通过 volume 挂载
#   prod — 生产环境，编译静态二进制（后续 Phase 使用）
# ===========================================================================

# ---------------------------------------------------------------------------
# 开发阶段
# ---------------------------------------------------------------------------
FROM golang:1.25-alpine AS dev

# 安装 air 热重载工具
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# 预复制 go.mod / go.sum 以利用 Docker 缓存层
COPY go.mod go.sum ./
RUN go mod download

# 源码通过 docker-compose volumes 挂载，无需 COPY

# 默认命令：启动 air 监听 api 入口
CMD ["air", "-c", ".air.toml"]

# ---------------------------------------------------------------------------
# 生产阶段（骨架，后续 Phase 完善）
# ---------------------------------------------------------------------------
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /api ./cmd/api

FROM alpine:3.21 AS prod
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /api /usr/local/bin/api
COPY --from=builder /app/migrations /migrations
EXPOSE 8080
CMD ["/usr/local/bin/api"]
