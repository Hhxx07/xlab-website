# XLab 数据库文档

> 生成日期：2026-06-13  
> 项目：`d:\UserDate\DeskTop\26.6-xlab网站`  
> 数据库：PostgreSQL 18 + pgx v5.7.6

---

## 目录

1. [技术栈概览](#1-技术栈概览)
2. [数据库表结构](#2-数据库表结构)
3. [连接与连接池](#3-连接与连接池)
4. [数据库迁移](#4-数据库迁移)
5. [配置与环境变量](#5-配置与环境变量)
6. [后端分层架构](#6-后端分层架构)
7. [前后端链接方式](#7-前后端链接方式)
8. [Docker 部署](#8-docker-部署)

---

## 1. 技术栈概览

| 层级 | 技术 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL 18 | 通过 Docker 容器运行 |
| 驱动 | `github.com/jackc/pgx/v5` v5.7.6 | 纯 Go 实现的 PostgreSQL 驱动，含连接池 |
| 迁移 | 自研 migration runner | 非 `golang-migrate`；兼容其文件命名规范 |
| 缓存 | Redis 8 | 当前阶段仅声明，暂未在代码中使用 |
| ORM | **无** | 全部使用原生 SQL + `pgx` 参数化查询 |

---

## 2. 数据库表结构

### 2.1 总览

```
┌──────────────────────────────────────────────────────────┐
│                     users (用户表)                         │
│  id | email | username | password_hash | role | ...       │
└──────────┬───────────────────────────────────────────────┘
           │ 1:N
     ┌─────┼──────────────┬──────────────────┐
     ▼     ▼              ▼                  ▼
┌────────┐ ┌────────────────────┐ ┌───────────────────────┐
│sessions│ │  user_identities   │ │email_verification     │
│(会话)   │ │  (OAuth身份关联)    │ │_tokens (邮箱验证)      │
└────────┘ └────────────────────┘ └───────────────────────┘

┌──────────────────────────────┐
│  schema_migrations (迁移记录) │
└──────────────────────────────┘
```

共 **5 张表**，全部由 2 个迁移文件创建。

---

### 2.2 `users` — 用户表

迁移文件：`000001_init_users.up.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY,
    email             TEXT UNIQUE,
    username          TEXT UNIQUE NOT NULL,
    display_name      TEXT,
    avatar_url        TEXT,
    bio               TEXT,
    role              TEXT NOT NULL DEFAULT 'user',
    password_hash     TEXT,
    email_verified_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 由 PostgreSQL `gen_random_uuid()` 生成 |
| `email` | TEXT | UNIQUE, 可空 | 邮箱（OAuth 登录时可为空） |
| `username` | TEXT | UNIQUE, NOT NULL | 用户名 |
| `display_name` | TEXT | 可空 | 展示名称 |
| `avatar_url` | TEXT | 可空 | 头像 URL |
| `bio` | TEXT | 可空 | 个人简介 |
| `role` | TEXT | NOT NULL, 默认 `'user'` | 角色：`'user'` / `'admin'` |
| `password_hash` | TEXT | 可空 | Argon2id 密码哈希（OAuth 登录时为空） |
| `email_verified_at` | TIMESTAMPTZ | 可空 | 邮箱验证时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_users_username` ON `username`
- `idx_users_email` ON `email` WHERE email IS NOT NULL

**密码存储格式（Argon2id）：**
```
$argon2id$v=19$m=65536,t=3,p=4$<base64_salt>$<base64_hash>
```
参数：`time=3`, `memory=64MB`, `threads=4`, `keyLen=32 bytes`，随机盐 16 bytes。

---

### 2.3 `sessions` — 会话表

迁移文件：`000002_add_sessions.up.sql`

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    user_agent  TEXT,
    ip_hash     TEXT,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 会话 ID |
| `user_id` | UUID | FK → users(id) CASCADE | 所属用户 |
| `token_hash` | TEXT | UNIQUE, NOT NULL | 会话令牌的 SHA-256 哈希 |
| `user_agent` | TEXT | 可空 | 客户端 User-Agent |
| `ip_hash` | TEXT | 可空 | 客户端 IP 哈希 |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 过期时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |

**索引：**
- `idx_sessions_user` ON `user_id`
- `idx_sessions_expires` ON `expires_at`

**安全设计：** 数据库中**永远不存储原始 token**，只存储 SHA-256 哈希。原始 token（256-bit 随机数，base64url 编码）通过 HttpOnly + SameSite=Lax + Secure Cookie 传递给浏览器。

---

### 2.4 `user_identities` — OAuth 身份关联表

迁移文件：`000001_init_users.up.sql`

```sql
CREATE TABLE IF NOT EXISTS user_identities (
    id                     UUID PRIMARY KEY,
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider               TEXT NOT NULL,
    provider_user_id       TEXT NOT NULL,
    provider_username      TEXT,
    provider_email         TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);
```

- 允许一个用户绑定多个 OAuth 提供商
- `(provider, provider_user_id)` 联合唯一，防止重复绑定
- `access_token_encrypted` / `refresh_token_encrypted` 用于后续 API 调用（如 GitHub API）

---

### 2.5 `email_verification_tokens` — 邮箱验证令牌表

迁移文件：`000001_init_users.up.sql`

```sql
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- 对应 Magic Link 邮箱验证流程。当前阶段表已建，但 Magic Link 服务端暂使用内存 map 存储，未写入此表。

---

### 2.6 `schema_migrations` — 迁移记录表

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty   BOOLEAN NOT NULL DEFAULT FALSE
);
```

由 `RunMigrations()` 自动创建，用于跟踪已应用的迁移版本。`dirty` 标记用于检测是否有迁移在中途失败。

---

## 3. 连接与连接池

### 3.1 连接池配置

文件：`backend/internal/platform/database/postgres.go`

```go
connConfig.MaxConns          = 10   // 最大连接数
connConfig.MinConns          = 2    // 最小连接数
connConfig.MaxConnLifetime   = 1h   // 单连接最大存活时间
connConfig.MaxConnIdleTime   = 30m  // 空闲连接超时
```

### 3.2 连接字符串格式

```
postgres://app:app@localhost:5432/app?sslmode=disable
                │   │         │  │
                │   │         │  └── 数据库名
                │   │         └──── 端口
                │   └────────────── 密码
                └────────────────── 用户名
```

- **本地开发**：`localhost:5432`（直连宿主机 PostgreSQL）
- **Docker 内**：`postgres:5432`（Docker 服务名，由 Compose DNS 解析）
- **生产环境**：通过 `DATABASE_URL` 环境变量覆盖

### 3.3 连接池初始化流程

```
config.Load()
    │
    ▼
database.ConnectPool(ctx, cfg.DatabaseURL)
    │
    ├── pgxpool.ParseConfig()
    ├── 设置 MaxConns/MinConns/Lifetime/IdleTime
    ├── pool.Ping(ctx)  ← 验证连接
    └── 返回 *pgxpool.Pool
```

---

## 4. 数据库迁移

### 4.1 迁移文件

| 文件 | 版本 | 内容 |
|------|------|------|
| `000001_init_users.up.sql` | 1 | 创建 users, user_identities, email_verification_tokens |
| `000001_init_users.down.sql` | 1 | 回滚上述三张表 |
| `000002_add_sessions.up.sql` | 2 | 创建 sessions |
| `000002_add_sessions.down.sql` | 2 | 删除 sessions |

### 4.2 迁移运行机制

```
RunMigrations(pool, "migrations")
    │
    ├── 创建 schema_migrations 表（如不存在）
    ├── 扫描 migrations/ 目录，匹配模式 NNNNNN_*.up.sql
    ├── 按版本号排序
    ├── 跳过已应用的版本（查 schema_migrations 表）
    └── 逐个执行未应用版本：
        ├── BEGIN 事务
        ├── INSERT INTO schema_migrations(version, dirty=true)
        ├── 执行 SQL 文件内容
        ├── UPDATE schema_migrations SET dirty=false
        └── COMMIT
```

迁移在 `main.go` 启动时自动执行，无需手动命令。

---

## 5. 配置与环境变量

文件：`backend/internal/platform/config/config.go`

| 环境变量 | 默认值 | 用途 |
|----------|--------|------|
| `APP_ENV` | `development` | 运行环境 |
| `PORT` | `8080` | HTTP 服务端口 |
| `DATABASE_URL` | `postgres://app:app@localhost:5432/app?sslmode=disable` | 数据库连接字符串 |
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接（暂未使用） |
| `JWT_SECRET` | `dev-secret-...` | JWT 签名密钥 |
| `SESSION_TTL_HOURS` | `168`（7天） | 会话过期时间 |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth Client Secret |
| `GITHUB_REDIRECT_URI` | `http://localhost:8080/api/auth/github/callback` | GitHub OAuth 回调 |
| `FRONTEND_URL` | `http://localhost:5173` | 前端地址（CORS / Cookie） |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | — | 邮件服务配置 |

额外（未在 Config struct 中，由 handler 直接读取）：
| `GITHUB_TOKEN` | — | GitHub API Token，提升 API 速率限制 |

---

## 6. 后端分层架构

```
请求流：HTTP → Handler → Service → Repository → pgxpool → PostgreSQL
                                              ↓
                                          数据库查询
```

### 6.1 层次职责

| 层 | 目录 | 职责 | 示例 |
|----|------|------|------|
| **Handler** | `internal/*/handler.go` | HTTP 请求解析、响应序列化、状态码 | `authHandler.Register()` |
| **Middleware** | `internal/auth/middleware.go` | 认证拦截、context 注入 | `RequireAuth` → 校验 Cookie → 注入 User |
| **Service** | `internal/*/service.go` | 业务逻辑、校验、密码哈希 | `authSvc.Login()` → 验证密码 → 创建会话 |
| **Repository** | `internal/*/repository.go` | 数据访问、SQL 执行 | `authRepo.CreateUser()` → INSERT |
| **Database** | `internal/platform/database/` | 连接池管理、迁移 | `ConnectPool()`, `RunMigrations()` |
| **Config** | `internal/platform/config/` | 环境变量加载 | `config.Load()` |

### 6.2 模块划分

#### Auth 模块 (`internal/auth/`)

| 文件 | 说明 |
|------|------|
| `repository.go` | User 和 Session 的 CRUD（含 PasswordHash） |
| `service.go` | 注册、登录、登出、Magic Link、密码哈希（Argon2id） |
| `handler.go` | 7 个 HTTP 端点 |
| `middleware.go` | `RequireAuth` 认证中间件 |

#### User 模块 (`internal/user/`)

| 文件 | 说明 |
|------|------|
| `repository.go` | 公开资料 CRUD（不含 PasswordHash） |
| `service.go` | 用户名查询、更新个人资料 |
| `handler.go` | `GET /users/:username`, `PATCH /users/me` |

### 6.3 Repository 方法速查

#### Auth Repository

| 方法 | SQL | 说明 |
|------|-----|------|
| `CreateUser(email, username, passwordHash)` | INSERT INTO users | 创建用户，返回完整 User |
| `GetUserByEmail(email)` | SELECT ... WHERE email=$1 | 邮箱查找 |
| `GetUserByUsername(username)` | SELECT ... WHERE username=$1 | 用户名查找 |
| `GetUserByID(id)` | SELECT ... WHERE id=$1 | ID 查找 |
| `UpdateUserEmailVerified(userID)` | UPDATE ... SET email_verified_at | 标记邮箱已验证 |
| `CreateSession(userID, tokenHash, ...)` | INSERT INTO sessions | 创建会话 |
| `GetSessionByTokenHash(tokenHash)` | SELECT ... WHERE token_hash=$1 AND expires_at>NOW() | 验证会话 |
| `DeleteSession(id)` | DELETE FROM sessions WHERE id=$1 | 删除会话（登出） |
| `DeleteExpiredSessions()` | DELETE WHERE expires_at<NOW() | 清理过期会话 |

#### User Repository

| 方法 | SQL | 说明 |
|------|-----|------|
| `GetByUsername(username)` | SELECT ... FROM users WHERE username=$1 | 不含 password_hash |
| `GetByID(id)` | SELECT ... FROM users WHERE id=$1 | 不含 password_hash |
| `Update(id, displayName, bio, avatarURL)` | UPDATE ... SET ... COALESCE | 部分更新，NULL 表示不修改 |

### 6.4 User 结构体的两个版本

| 字段 | `auth.User` | `user.User` |
|------|-------------|-------------|
| ID / Email / Username / DisplayName | ✅ | ✅ |
| AvatarURL / Bio / Role | ✅ | ✅ |
| EmailVerifiedAt / CreatedAt / UpdatedAt | ✅ | ✅ |
| **PasswordHash** | ✅ | ❌（安全隔离） |

`auth.User` 是内部认证使用，含密码哈希。  
`user.User` 是公开资料使用，刻意排除密码字段，防止泄漏。

---

## 7. 前后端链接方式

### 7.1 架构图

```
┌─────────────┐     HTTP/REST      ┌──────────────┐     pgx      ┌────────────┐
│   前端 (React) │ ◄──────────────► │  后端 (Go/Chi) │ ◄──────────► │ PostgreSQL │
│   :5173       │    Cookie + JSON  │   :8080        │    SQL       │   :5432    │
└─────────────┘                    └──────────────┘              └────────────┘
```

### 7.2 前端 → 后端通信

#### 开发模式（原生运行）

前端 Vite dev server (`:5173`) 通过代理转发 `/api/*` 到后端：

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8080',  // 本地开发
    changeOrigin: true,
  },
}
```

#### Docker 模式

```yaml
# docker-compose.yml
frontend:
  environment:
    VITE_API_BASE_URL: http://api:8080  # Docker 内服务名
```

Vite 配置优先读取环境变量：
```typescript
target: process.env.VITE_API_BASE_URL || 'http://localhost:8080'
```

#### 认证流程

```
1. 前端 POST /api/auth/login {email, password}
2. 后端验证 → 创建 Session → 返回 Set-Cookie: session_token=xxx
3. 浏览器自动在后续请求中携带 Cookie
4. 后端 RequireAuth 中间件读取 Cookie → 哈希 → 查 sessions 表 → 注入 User
```

Cookie 属性：`HttpOnly` `SameSite=Lax` `Secure`（生产环境）

### 7.3 前端状态管理

认证状态由 Zustand store 管理：

文件：`frontend/src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}
```

- `fetchMe()` 在应用初始化时调用，请求 `GET /api/auth/me`，通过 Cookie 自动认证
- 前端路由守卫可基于 `user.role` 做权限控制

### 7.4 当前 API 端点总览

| 方法 | 路径 | 认证 | 模块 | 说明 |
|------|------|------|------|------|
| GET | `/api/health` | 无 | - | 健康检查 |
| POST | `/api/auth/register` | 无 | Auth | 邮箱注册 |
| POST | `/api/auth/login` | 无 | Auth | 邮箱登录 |
| POST | `/api/auth/logout` | ✅ | Auth | 登出 |
| GET | `/api/auth/me` | ✅ | Auth | 当前用户信息 |
| POST | `/api/auth/magic-link/request` | 无 | Auth | 请求 Magic Link |
| GET/POST | `/api/auth/magic-link/verify` | 无 | Auth | 验证 Magic Link |
| GET | `/api/auth/github/start` | 无 | Auth | GitHub OAuth（骨架） |
| GET | `/api/auth/github/callback` | 无 | Auth | GitHub OAuth 回调（骨架） |
| GET | `/api/users/{username}` | 无 | User | 用户公开资料 |
| PATCH | `/api/users/me` | ✅ | User | 更新个人资料 |
| GET | `/api/trending/github` | 无 | - | GitHub 高星仓库 |

---

## 8. Docker 部署

### 8.1 服务编排

```yaml
# docker-compose.yml
services:
  postgres:    # PostgreSQL 18, 端口 5432, 数据卷持久化
  redis:       # Redis 8, 端口 6379
  api:         # Go 后端, 端口 8080, Air 热重载
  worker:      # Go Worker（骨架）
  frontend:    # Vite + React, 端口 5173
```

### 8.2 数据库连接链（Docker 内）

```
api 容器                     postgres 容器
DATABASE_URL=                postgres://app:app@postgres:5432/app
postgres://app:app
  @postgres:5432/app  ──────► postgres:5432 (Docker DNS)
```

### 8.3 数据持久化

```yaml
volumes:
  postgres18_data:  # 命名卷，Docker 管理
```

数据库文件存储在 Docker 管理的卷中，容器重启不丢失。  
手动删除：`docker compose down -v`（会清除所有数据）。

### 8.4 后端 Dockerfile

```
dev 阶段:  golang:1.25-alpine → 安装 air → 热重载运行
builder:   golang:1.25-alpine → 编译二进制 → /api
prod 阶段: alpine:3.21 → 复制二进制 + migrations/ → 运行
```

---

## 附录：缺失部分

| 缺失项 | 说明 |
|--------|------|
| **笔记/文章表** | 数据库中没有存储 markdown 笔记的表，内容全部是前端静态 `.md` 文件 |
| **数据访问日志** | 没有慢查询日志或数据库监控 |
| **数据库测试** | 没有 Repository 层的单元测试 |
| **连接重试机制** | 连接失败直接 Fatal，无自动重试 |
| **读写分离** | 单一连接池，无主从架构 |
| **数据库备份** | 未配置自动备份策略 |
| **Magic Link 持久化** | `email_verification_tokens` 表已建但未使用，代码用内存 map |
| **Worker 实际任务** | Worker 服务只是连接数据库后阻塞，无实际异步任务 |
