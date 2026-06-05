# design.md

# 长期可扩展内容社区网站设计文档

## 1. 项目目标

本项目目标是搭建一个可长期演进的网站，初始形态为“博客 + 讨论 + 信息流聚合 + 用户仪表盘”的内容社区平台。系统需要支持用户登录、发帖、Markdown 在线编辑、滚动浏览、评论讨论、行级标注、搜索、阅读统计、点赞、订阅、爬虫抓取与热点信息展示，并通过 Docker 完成开发与部署环境编排。

核心原则：

1. **先做模块化单体，不急于微服务化**：早期开发效率更高，同时通过清晰的包结构、数据库边界、任务队列和事件表预留扩展空间。
2. **业务模块可插拔**：博客、评论、搜索、订阅、爬虫、通知、埋点等都应作为相对独立模块。
3. **所有重要行为事件化**：用户行为、内容变化、爬虫结果、通知投递都可以记录为事件，便于统计、推荐、审计和后续分析。
4. **前后端解耦**：React 负责交互体验，Go 后端提供 REST API，PostgreSQL 负责核心数据持久化。
5. **可观测、可迁移、可测试**：从第一版开始保留日志、迁移脚本、测试结构和 Docker 环境。

---

## 2. 技术栈

### 2.1 前端

- React：构建单页应用界面。
- TypeScript：增强类型安全和可维护性。
- Vite：前端开发构建工具。
- React Router：前端路由。
- TanStack Query：服务端状态管理、缓存、分页加载。
- Zustand：轻量客户端状态管理，例如用户信息、编辑器状态。
- Tailwind CSS：快速搭建 UI 样式。
- Markdown 编辑器：可选 `@uiw/react-md-editor`、`Milkdown` 或 `TipTap + Markdown 扩展`。
- 代码高亮：`shiki` 或 `highlight.js`。

### 2.2 后端

- Go：后端主语言。
- chi / Gin / Echo：HTTP 路由框架，推荐先用 `chi`，轻量且适合清晰组织 REST API。
- pgx：Go 连接 PostgreSQL。
- sqlc：根据 SQL 生成类型安全的 Go 查询代码。
- golang-migrate：数据库迁移。
- JWT + HttpOnly Cookie：登录态管理。
- OAuth2：GitHub 登录。
- zerolog / zap：结构化日志。
- go-playground/validator：请求参数校验。

### 2.3 数据库与基础设施

- PostgreSQL：主数据库。
- Redis：可选，用于缓存、限流、任务队列、热点数据。
- Docker / Docker Compose：本地开发和部署编排。
- Nginx / Caddy：反向代理与 HTTPS。
- MinIO / S3：后续用于图片、附件、头像等对象存储。

### 2.4 后续可加入

- Meilisearch / Typesense / Elasticsearch：当 PostgreSQL 全文搜索不够用时引入独立搜索引擎。
- RabbitMQ / NATS / Kafka：当任务队列和事件流规模变大时引入消息系统。
- Prometheus + Grafana：监控系统指标。
- OpenTelemetry：链路追踪。

---

## 3. 总体架构

推荐第一阶段采用“模块化单体 + 后台 Worker”的架构：

```text
[Browser / React]
        |
        | HTTPS / REST API
        v
[Go API Server]
        |
        | SQL
        v
[PostgreSQL]

[Go Worker]
        |
        | 定时任务 / 爬虫 / 订阅推送 / 统计聚合
        v
[PostgreSQL / Redis]
```

模块划分：

```text
backend/
  cmd/
    api/              # HTTP API 入口
    worker/           # 后台任务入口：爬虫、订阅、统计聚合
  internal/
    auth/             # 邮箱登录、GitHub OAuth、会话
    user/             # 用户资料、仪表盘
    post/             # 帖子、Markdown 内容、发布流程
    comment/          # 底部评论与行级标注
    reaction/         # 点赞、收藏、阅读统计
    search/           # 检索
    feed/             # 滚动信息流
    subscription/     # 订阅源、推送规则
    crawler/          # GitHub Trending、RSS、网页抓取
    analytics/        # 数据埋点
    notification/     # 通知与推送
    platform/         # 数据库、日志、配置、中间件
  migrations/         # SQL 迁移
  sql/                # sqlc 查询
```

---

## 4. 核心功能需求

## 4.1 用户系统

### 功能

1. 邮箱注册与登录。
2. 邮箱验证。
3. GitHub OAuth 登录。
4. 用户资料页。
5. 用户仪表盘。
6. 登录状态保持。
7. 后续支持角色权限：普通用户、管理员、内容审核员。

### 实现方案

- 邮箱登录第一版建议采用“邮箱 + 密码 + 邮箱验证”。
- 密码使用 Argon2id 或 bcrypt 哈希存储，绝不保存明文密码。
- 登录态使用 HttpOnly Cookie 保存 Session Token 或 JWT，避免前端 JS 直接读取敏感 token。
- GitHub 登录流程：前端跳转到后端 `/auth/github/start`，后端生成 state 并重定向到 GitHub；GitHub 回调到 `/auth/github/callback`；后端用 code 换 access token，再获取 GitHub 用户信息，与本地用户绑定。
- 一个用户可以同时绑定邮箱登录和 GitHub 登录。

### 关键数据表

- `users`
- `user_identities`
- `sessions`
- `email_verification_tokens`

---

## 4.2 用户仪表盘

### 功能

仪表盘用于展示用户自己的长期数据：

1. 发表的帖子。
2. 草稿。
3. 评论与被回复。
4. 点赞、阅读量、收藏量。
5. 订阅源。
6. 最近阅读历史。
7. 个人行为统计，例如最近 7 天写作次数、浏览次数、互动次数。

### 实现方案

- 后端提供 `/api/dashboard/summary` 聚合接口。
- 对实时性要求低的数据，例如阅读量、趋势、热门内容，可以由 Worker 定时聚合到统计表。
- 仪表盘不要直接对大表做复杂实时查询，应使用 `post_stats`、`user_stats_daily` 等聚合表。

---

## 4.3 博客与帖子系统

### 功能

1. 所有登录用户都可以发帖。
2. 支持草稿、发布、归档、删除。
3. 支持 Markdown 在线编辑。
4. 支持滚动浏览帖子流。
5. 支持标签、分类、作者页。
6. 支持阅读人数统计与点赞。
7. 支持检索。

### 实现方案

帖子内容建议拆分为：

- `posts`：帖子元信息，如标题、作者、状态、发布时间。
- `post_versions`：帖子内容版本，保存 Markdown 原文和渲染后的 HTML。
- `post_stats`：阅读数、点赞数、评论数等统计字段。

这样做的好处：

1. 支持文章版本历史。
2. 支持草稿和正式发布分离。
3. 后续可以做协作编辑、审核流、回滚。

### Markdown 编辑

前端提供左右分栏：

```text
左侧：Markdown 输入区
右侧：实时预览区
顶部：标题、标签、保存草稿、发布按钮
```

后端保存 Markdown 原文。HTML 可以：

1. 前端实时渲染用于预览。
2. 后端发布时统一渲染并消毒，防止 XSS。

---

## 4.4 评论与行级标注

### 需求

评论系统有两种形态：

1. **底部讨论区**：像普通博客评论，集中在文章下方。
2. **行级标注**：像飞书文档一样，可以对文章的某一行或某一段发起讨论。

### 实现方案

统一使用 `comments` 表，但通过字段区分评论锚点：

- 底部评论：`anchor_type = 'post'`
- 行级评论：`anchor_type = 'block'` 或 `anchor_type = 'line'`

为了支持稳定的行级标注，不建议只用“第几行”作为唯一定位方式，因为文章编辑后行号会变化。推荐在 Markdown 渲染阶段给每个段落、标题、代码块生成稳定 block id：

```markdown
## 标题 A

段落内容……
```

渲染后：

```html
<h2 data-block-id="blk_abc123">标题 A</h2>
<p data-block-id="blk_def456">段落内容……</p>
```

行级标注可以绑定到：

```text
post_id + version_id + block_id + optional selected_text_range
```

这样后续即使文章修改，也可以根据版本和 block id 尽量恢复标注位置。

### 评论结构

支持楼中楼：

```text
comment_id
post_id
parent_comment_id
anchor_type
anchor_block_id
content_md
author_id
created_at
```

---

## 4.5 滚动浏览与信息流

### 功能

首页展示所有公开帖子，支持无限滚动：

1. 最新发布。
2. 热门内容。
3. 关注作者内容。
4. 订阅源内容。
5. GitHub Trending 热点。

### 实现方案

第一版采用游标分页，不使用 offset 深分页：

```text
GET /api/feed?cursor=xxx&limit=20&type=latest
```

返回：

```json
{
  "items": [],
  "next_cursor": "..."
}
```

游标可以由 `created_at + id` 组成，避免数据变多后 offset 查询变慢。

后续可以把信息流拆成多个来源：

- `post`：站内帖子。
- `external_article`：爬虫抓取文章。
- `github_trending`：GitHub 热榜。
- `recommendation`：推荐内容。

---

## 4.6 检索功能

### 第一版方案

使用 PostgreSQL Full Text Search：

- 对帖子标题、正文、标签建立全文检索索引。
- 使用 `tsvector` 保存搜索向量。
- 使用 GIN 索引加速搜索。

搜索范围：

1. 帖子标题。
2. 帖子正文。
3. 作者名。
4. 标签。
5. 评论内容。
6. 外部订阅内容。

### 后续升级

当数据量变大、搜索体验要求更高时，可以接入 Meilisearch / Typesense / Elasticsearch，支持：

1. 拼写容错。
2. 搜索建议。
3. 高亮。
4. 多字段权重。
5. 中文分词优化。

---

## 4.7 阅读人数统计与点赞

### 阅读统计

需要区分：

1. PV：页面访问次数。
2. UV：独立访问人数。
3. 登录用户阅读。
4. 匿名用户阅读。

第一版实现：

- 用户打开文章时发送 `POST /api/posts/{id}/view`。
- 后端记录 `post_views`。
- 对匿名用户使用匿名 visitor id，存储在 Cookie 中。
- Worker 定时聚合到 `post_stats.view_count` 和 `post_stats.unique_view_count`。

避免简单刷新刷量：

- 同一用户或同一 visitor 在一定时间窗口内多次打开，只计算一次 UV。
- PV 可以记录多次，但需要限流。

### 点赞

- 一个用户对同一篇帖子只能点赞一次。
- 使用唯一约束：`unique(user_id, target_type, target_id, reaction_type)`。
- 支持取消点赞。
- 后续可以扩展为收藏、表情反应、踩、感谢等。

---

## 4.8 数据埋点：记录用户干了什么、怎么干的

### 目标

埋点不是只记录“点了什么”，还要记录用户完成行为的路径：

- 用户看了什么。
- 从哪里进入。
- 停留多久。
- 滚动到哪里。
- 是否点赞、评论、订阅。
- 编辑器中是否保存草稿、发布、放弃。
- 搜索了什么关键词。
- 爬虫内容是否被点击。

### 前端事件

前端封装统一方法：

```ts
track(eventName, properties)
```

示例：

```ts
track("post_view", {
  post_id: "...",
  source: "home_feed",
  scroll_depth: 0.8
})
```

### 后端事件表

使用 `analytics_events` 表保存原始事件：

```text
id
user_id
anonymous_id
session_id
event_name
entity_type
entity_id
properties jsonb
user_agent
ip_hash
created_at
```

### 注意事项

1. 埋点数据增长很快，必须单独建表。
2. 原始事件不要直接用于复杂实时查询。
3. 通过 Worker 聚合为日统计表。
4. 注意隐私，IP 不保存明文，可保存 hash。
5. 后续可以按月分区或迁移到 ClickHouse。

---

## 4.9 订阅功能与信息流推送

### 功能

用户可以订阅：

1. 站内作者。
2. 站内标签。
3. 外部 RSS 源。
4. GitHub Trending。
5. 指定 GitHub 仓库。
6. 指定关键词。

### 实现方案

核心表：

- `subscriptions`：用户订阅了什么。
- `external_sources`：外部信息源，例如 RSS、GitHub Trending。
- `external_items`：抓取到的外部内容。
- `notifications`：需要推送给用户的通知。

Worker 定时执行：

1. 拉取外部源。
2. 去重保存到 `external_items`。
3. 根据用户订阅规则生成通知。
4. 用户登录后在通知中心查看。
5. 后续支持邮件推送。

---

## 4.10 GitHub Trending 与爬虫

### 功能

1. 定时抓取 GitHub Trending。
2. 保存仓库名、描述、语言、star、链接、抓取时间。
3. 展示每日/每周热门项目。
4. 支持用户订阅语言或关键词。

### 实现方案

第一版可以使用爬虫 Worker：

```text
worker 每隔 N 小时运行
  -> 请求 GitHub Trending 页面或相关数据源
  -> 解析仓库列表
  -> 写入 github_trending_items
  -> 去重
  -> 生成 feed item
```

注意：

1. 爬虫要设置合理频率，不要高频请求。
2. 保存原始抓取时间和来源 URL。
3. 对外部数据做去重。
4. 网络失败时记录错误，不影响主站。
5. 爬虫模块必须和主 API 解耦。

---

## 5. 数据库初步设计

### 5.1 用户相关

```sql
create table users (
  id uuid primary key,
  email text unique,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'user',
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_identities (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  provider_username text,
  provider_email text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  created_at timestamptz not null default now(),
  unique(provider, provider_user_id)
);

create table sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_hash text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### 5.2 帖子相关

```sql
create table posts (
  id uuid primary key,
  author_id uuid not null references users(id),
  title text not null,
  slug text unique,
  status text not null default 'draft',
  visibility text not null default 'public',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table post_versions (
  id uuid primary key,
  post_id uuid not null references posts(id) on delete cascade,
  version_no int not null,
  content_md text not null,
  content_html text,
  block_index jsonb,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique(post_id, version_no)
);

create table post_tags (
  post_id uuid not null references posts(id) on delete cascade,
  tag text not null,
  primary key(post_id, tag)
);

create table post_stats (
  post_id uuid primary key references posts(id) on delete cascade,
  view_count bigint not null default 0,
  unique_view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  updated_at timestamptz not null default now()
);
```

### 5.3 评论与标注

```sql
create table comments (
  id uuid primary key,
  post_id uuid not null references posts(id) on delete cascade,
  post_version_id uuid references post_versions(id),
  author_id uuid not null references users(id),
  parent_comment_id uuid references comments(id) on delete cascade,
  anchor_type text not null default 'post',
  anchor_block_id text,
  anchor_text_start int,
  anchor_text_end int,
  content_md text not null,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5.4 阅读、点赞、埋点

```sql
create table post_views (
  id uuid primary key,
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid references users(id),
  anonymous_id text,
  session_id uuid,
  source text,
  created_at timestamptz not null default now()
);

create table reactions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique(user_id, target_type, target_id, reaction_type)
);

create table analytics_events (
  id uuid primary key,
  user_id uuid references users(id),
  anonymous_id text,
  session_id uuid,
  event_name text not null,
  entity_type text,
  entity_id uuid,
  properties jsonb not null default '{}',
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);
```

### 5.5 订阅与外部信息

```sql
create table subscriptions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null,
  target_value text not null,
  created_at timestamptz not null default now(),
  unique(user_id, target_type, target_value)
);

create table external_sources (
  id uuid primary key,
  source_type text not null,
  name text not null,
  url text,
  config jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table external_items (
  id uuid primary key,
  source_id uuid references external_sources(id),
  title text not null,
  url text not null,
  summary text,
  author text,
  published_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(url)
);

create table github_trending_items (
  id uuid primary key,
  repo_full_name text not null,
  repo_url text not null,
  description text,
  language text,
  stars int,
  stars_today int,
  trending_date date not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(repo_full_name, trending_date)
);
```

---

## 6. API 初步设计

### 6.1 Auth

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/github/start
GET    /api/auth/github/callback
POST   /api/auth/email/verify
```

### 6.2 User & Dashboard

```text
GET    /api/users/:username
PATCH  /api/users/me
GET    /api/dashboard/summary
GET    /api/dashboard/posts
GET    /api/dashboard/comments
GET    /api/dashboard/subscriptions
```

### 6.3 Posts

```text
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/view
GET    /api/posts/:id/versions
```

### 6.4 Comments

```text
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
```

### 6.5 Feed & Search

```text
GET    /api/feed
GET    /api/search?q=keyword&type=post
```

### 6.6 Reactions

```text
POST   /api/reactions
DELETE /api/reactions
```

### 6.7 Subscriptions

```text
GET    /api/subscriptions
POST   /api/subscriptions
DELETE /api/subscriptions/:id
GET    /api/notifications
```

### 6.8 Analytics

```text
POST   /api/analytics/events
```

---

## 7. 前端页面设计

```text
/
  首页信息流

/login
  登录页

/register
  注册页

/dashboard
  用户仪表盘

/posts/:id
  文章详情页
  - 正文
  - 行级标注入口
  - 底部评论区
  - 点赞 / 阅读数

/editor/new
  新建文章

/editor/:id
  编辑文章

/search
  搜索结果页

/trending
  GitHub Trending 热点页

/subscriptions
  订阅管理页

/users/:username
  用户主页
```

---

## 8. Docker 设计

本地开发使用 Docker Compose：

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_BASE_URL=http://localhost:8080

  api:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://app:app@postgres:5432/app?sslmode=disable
      - REDIS_URL=redis://redis:6379
      - APP_ENV=development

  worker:
    build: ./backend
    command: ["./worker"]
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://app:app@postgres:5432/app?sslmode=disable
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgres:18
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=app
      - POSTGRES_DB=app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 9. 可扩展性设计

### 9.1 模块化单体

不要一开始就拆成大量微服务。推荐先使用模块化单体：

```text
auth 模块只处理认证
post 模块只处理文章
comment 模块只处理评论
crawler 模块只处理抓取
analytics 模块只处理埋点
subscription 模块只处理订阅
```

模块之间通过接口调用，而不是到处互相直接访问数据库细节。

### 9.2 数据库迁移

所有表结构变化都必须写迁移文件：

```text
migrations/
  000001_init.up.sql
  000001_init.down.sql
  000002_add_comments.up.sql
  000002_add_comments.down.sql
```

### 9.3 后台任务

爬虫、统计聚合、订阅推送不要放在 API 请求里同步执行。应该交给 Worker：

```text
API Server：处理用户请求
Worker：处理慢任务、定时任务、聚合任务
```

### 9.4 事件表

保留 `analytics_events` 和后续的 `domain_events`。这样以后可以做：

1. 推荐系统。
2. 用户增长分析。
3. 内容质量分析。
4. 风控与审计。
5. 消息通知。

### 9.5 搜索可替换

第一版使用 PostgreSQL 搜索。后续搜索模块不要让业务代码直接依赖 PostgreSQL 细节，而是封装成：

```go
type SearchService interface {
    SearchPosts(ctx context.Context, query string, opts SearchOptions) ([]PostSearchResult, error)
}
```

这样以后可以平滑替换为 Meilisearch 或 Elasticsearch。

### 9.6 文件存储可替换

第一版可以不做复杂文件上传。后续需要上传图片时，通过统一 Storage 接口：

```go
type Storage interface {
    Put(ctx context.Context, key string, r io.Reader) error
    GetURL(ctx context.Context, key string) (string, error)
}
```

本地开发用 MinIO，生产环境可以换 S3 或其他对象存储。

---

## 10. 开发阶段规划

### Phase 0：项目骨架

- 初始化 monorepo。
- 建立 frontend、backend、docker-compose。
- 建立 PostgreSQL 连接。
- 建立迁移系统。
- 建立基础日志与配置。

### Phase 1：用户系统

- 邮箱注册登录。
- GitHub 登录。
- Session / Cookie。
- `/api/auth/me`。
- 用户资料页。

### Phase 2：博客核心

- 发帖。
- Markdown 编辑。
- 草稿保存。
- 发布。
- 首页信息流。
- 帖子详情页。

### Phase 3：评论与行级标注

- 底部评论。
- 评论回复。
- Markdown block id。
- 行级标注。

### Phase 4：统计与互动

- 阅读统计。
- 点赞。
- 用户仪表盘。
- 埋点事件。

### Phase 5：搜索与订阅

- PostgreSQL 全文搜索。
- 用户订阅作者、标签、关键词。
- 通知中心。

### Phase 6：爬虫与热点

- GitHub Trending Worker。
- 外部信息源表。
- Trending 页面。
- 把外部信息纳入信息流。

### Phase 7：工程化增强

- 单元测试。
- API 集成测试。
- CI。
- 生产 Dockerfile。
- Nginx / Caddy 部署。
- 监控与错误报警。

---

## 11. 推荐项目目录

```text
project-root/
  design.md
  docker-compose.yml
  .env.example
  README.md

  frontend/
    package.json
    vite.config.ts
    src/
      app/
      pages/
      components/
      features/
        auth/
        posts/
        comments/
        dashboard/
        search/
        subscriptions/
        trending/
      lib/
      api/

  backend/
    go.mod
    cmd/
      api/
        main.go
      worker/
        main.go
    internal/
      auth/
      user/
      post/
      comment/
      reaction/
      search/
      feed/
      subscription/
      crawler/
      analytics/
      notification/
      platform/
        config/
        db/
        http/
        logger/
    migrations/
    sql/
```

---

## 12. 安全要求

1. 密码必须哈希存储。
2. 登录 Cookie 使用 HttpOnly、Secure、SameSite。
3. 所有写操作检查登录态。
4. 用户只能修改自己的帖子和评论。
5. Markdown 渲染后的 HTML 必须消毒，防止 XSS。
6. GitHub OAuth 使用 state 防 CSRF。
7. API 请求需要限流，尤其是登录、注册、评论、埋点、爬虫触发。
8. 后端不要信任前端传入的 user_id。
9. 敏感配置放入环境变量，不提交到 Git。
10. 埋点中的 IP 建议 hash，不保存明文。

---

## 13. 第一版最小可行产品 MVP

MVP 不要一次做完所有设想。建议第一版只完成：

1. 邮箱登录。
2. GitHub 登录。
3. 发帖与 Markdown 编辑。
4. 首页滚动信息流。
5. 帖子详情页。
6. 底部评论。
7. 点赞。
8. 阅读统计。
9. 简单搜索。
10. Docker Compose 本地启动。

第二版再加入：

1. 行级标注。
2. 用户仪表盘增强。
3. 订阅功能。
4. GitHub Trending 爬虫。
5. 通知中心。
6. 埋点聚合分析。

---

## 14. 总结

本项目的核心不是单个博客功能，而是一个长期可扩展的内容平台。第一阶段应该避免过度架构化，但必须从一开始做好模块边界、数据库迁移、后台任务、事件记录、搜索接口和 Docker 环境。

推荐路线：

```text
先完成用户系统 + 发帖 + 信息流 + 评论
再加入统计 + 搜索 + 仪表盘
最后加入订阅 + 爬虫 + GitHub Trending + 行级标注增强
```

这样既能快速做出可用版本，又不会把后续扩展空间堵死。
