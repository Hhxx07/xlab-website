# XLab — 内容社区平台

> 一个可长期演进的内容社区平台：博客、讨论、信息流聚合、用户仪表盘

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 19 + TypeScript + Vite | SPA 应用，组件化开发 |
| **样式** | Tailwind CSS 3 | 原子化 CSS，快速构建 UI |
| **状态管理** | Zustand | 轻量客户端状态 |
| **路由** | React Router v7 | 客户端路由 |
| **后端** | Go 1.25 + chi | REST API 服务 |
| **数据库** | PostgreSQL 18 | 主数据库 |
| **缓存** | Redis 8 | 缓存与队列（后续启用） |
| **日志** | zerolog | 结构化日志 |
| **认证** | Argon2id + HttpOnly Cookie | 密码哈希 + 会话管理 |
| **容器化** | Docker + Docker Compose | 一键启动开发环境 |

## 项目结构

```
26.6-xlab网站/
├── design.md                     # 完整设计文档
├── docker-compose.yml            # 一键启动所有服务
├── .gitignore
│
├── frontend/                     # React 前端
│   ├── Dockerfile                # 前端开发容器
│   ├── index.html
│   ├── vite.config.ts            # Vite + API 代理配置
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx              # 应用入口
│       ├── App.tsx               # 路由配置
│       ├── index.css             # Tailwind 指令
│       ├── api/client.ts         # fetch 封装 + 错误处理
│       ├── store/authStore.ts    # Zustand 认证状态
│       ├── types/index.ts        # TypeScript 类型定义
│       ├── components/
│       │   ├── Layout.tsx        # 页面布局（导航栏 + 页脚）
│       │   └── Navbar.tsx        # 顶部导航栏
│       └── pages/
│           ├── HomePage.tsx      # 首页
│           ├── LoginPage.tsx     # 登录页
│           ├── RegisterPage.tsx  # 注册页
│           └── ProfilePage.tsx   # 个人资料页
│
└── backend/                      # Go 后端
    ├── Dockerfile                # 多阶段构建
    ├── .air.toml                 # API 热重载配置
    ├── .air.worker.toml          # Worker 热重载配置
    ├── go.mod / go.sum
    ├── cmd/
    │   ├── api/main.go           # HTTP API 入口
    │   └── worker/main.go        # 后台任务入口（骨架）
    ├── internal/
    │   ├── auth/                 # 认证模块
    │   │   ├── handler.go        # HTTP 处理器
    │   │   ├── service.go        # 业务逻辑（Argon2id 哈希）
    │   │   ├── repository.go     # 数据访问层
    │   │   └── middleware.go     # 认证中间件
    │   ├── user/                 # 用户模块
    │   │   ├── handler.go
    │   │   ├── service.go
    │   │   └── repository.go
    │   └── platform/             # 基础设施
    │       ├── config/config.go  # 环境变量配置
    │       ├── database/postgres.go  # PostgreSQL 连接池
    │       └── logger/           # zerolog 日志
    └── migrations/               # SQL 迁移文件
        ├── 000001_init_users.up.sql     # users + user_identities
        ├── 000001_init_users.down.sql
        ├── 000002_add_sessions.up.sql   # sessions
        └── 000002_add_sessions.down.sql
```

## 快速开始

### 前置条件

- [Docker](https://www.docker.com/) + Docker Compose
- [Node.js](https://nodejs.org/) 22+（仅本地开发需要）
- [Go](https://go.dev/) 1.25+（仅本地开发需要）

### 方式一：Docker 一键启动（推荐）

```bash
# 启动所有服务（PostgreSQL、Redis、API、Worker、前端）
docker compose up -d

# 查看日志
docker compose logs -f api

# 停止
docker compose down
```

启动后访问：

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| API 服务 | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 方式二：本地开发

```bash
# 1. 启动 PostgreSQL 和 Redis（Docker）
docker compose up -d postgres redis

# 2. 后端
cd backend
cp .env.example .env  # 编辑环境变量（可选）
go run ./cmd/api/

# 3. 前端（另一个终端）
cd frontend
npm install
npm run dev
```

### 方式三：仅前端开发（连远程 API）

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
# API 请求自动代理到 localhost:8080
```

## API 端点

### 认证

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| `POST` | `/api/auth/register` | 邮箱注册 | ❌ |
| `POST` | `/api/auth/login` | 邮箱登录 | ❌ |
| `POST` | `/api/auth/logout` | 登出 | ✅ Cookie |
| `GET` | `/api/auth/me` | 当前用户信息 | ✅ Cookie |
| `GET` | `/api/auth/github/start` | GitHub OAuth 入口 | ❌（骨架） |
| `GET` | `/api/auth/github/callback` | GitHub OAuth 回调 | ❌（骨架） |

### 用户

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| `GET` | `/api/users/{username}` | 用户公开资料 | ❌ |
| `PATCH` | `/api/users/me` | 更新个人资料 | ✅ Cookie |

### 健康检查

```bash
curl http://localhost:8080/api/health
# → {"status":"ok"}
```

## 安全设计

- **密码哈希**：Argon2id（64MB 内存、3 次迭代、4 并行度）
- **会话管理**：256-bit 随机 token → SHA-256 哈希存库 → 原始 token 通过 HttpOnly Cookie 返回
- **Cookie 属性**：`HttpOnly`（JS 不可读）、`SameSite=Lax`（防 CSRF）
- **密码验证**：常量时间比较（防时序攻击）
- **数据库**：参数化查询（防 SQL 注入）

## 数据库迁移

迁移文件位于 `backend/migrations/`。

**本地手动执行：**

```bash
# 安装 golang-migrate CLI
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 执行迁移
migrate -database "postgres://app:app@localhost:5432/app?sslmode=disable" \
        -path backend/migrations up
```

**Docker 中自动执行：** API 服务启动时自动运行迁移。

## 开发阶段

| Phase | 内容 | 状态 |
|-------|------|------|
| **Phase 0** | 项目骨架：Docker、Go 后端、数据库迁移、Tailwind CSS | ✅ 完成 |
| **Phase 1** | 用户系统：注册/登录/Session/用户资料页 | ✅ 完成 |
| Phase 2 | 博客核心：发帖、Markdown 编辑、信息流 | 🔜 待开发 |
| Phase 3 | 评论与行级标注 | 🔜 待开发 |
| Phase 4 | 统计与互动：阅读统计、点赞、仪表盘 | 🔜 待开发 |
| Phase 5 | 搜索与订阅 | 🔜 待开发 |
| Phase 6 | 爬虫与热点 | 🔜 待开发 |
| Phase 7 | 工程化增强：测试、CI、生产部署 | 🔜 待开发 |

## 常见命令

```bash
# 后端编译检查
cd backend && go build ./...

# 后端运行测试（后续）
cd backend && go test ./...

# 前端类型检查
cd frontend && npx tsc --noEmit

# 前端构建
cd frontend && npm run build

# Docker 重建某个服务
docker compose up -d --build api

# 查看数据库
docker compose exec postgres psql -U app -d app
```

## 许可证

MIT
