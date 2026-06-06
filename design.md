# XLab 个人博客网站设计文档

## 1. 项目目标

本项目的核心目标是搭建一个以个人博客展示为主的网站。第一优先级不是做开放内容社区，而是先提供一个漂亮、清晰、可长期维护的个人主页和文章阅读体验。

网站默认面向公开访客开放：访客可以直接浏览主页、文章列表、文章详情、分类标签、归档和公开资料，不需要登录。只有当用户想要留言、点赞、收藏、订阅、创建自己的内容或进入个人工作台时，系统才要求登录验证。

核心原则：

1. **公开阅读优先**：首页、文章、归档、标签、搜索等主要内容默认无需登录。
2. **个人品牌优先**：主页保留漂亮的首屏和内容区域，后续填充个人介绍、精选文章、项目经历、照片或作品集。
3. **低门槛互动**：访客阅读不设阻碍；留言、点赞、收藏等写操作进入登录流程。
4. **创作能力可扩展**：站长和登录用户可以逐步拥有文章编辑、草稿、发布和个人内容管理能力。
5. **模块化单体起步**：前期保持 React + Go + PostgreSQL 的清晰单体结构，按 auth、user、post、comment、reaction、search 等模块拆分。
6. **安全边界明确**：所有写操作都由后端验证登录态和权限，前端只负责展示和交互引导。

---

## 2. 产品定位

### 2.1 第一阶段定位

第一阶段是个人博客站：

- 一个视觉完成度较高的公开主页。
- 一个公开文章列表和文章详情页。
- 文章支持 Markdown 内容展示。
- 公开访客可以搜索、按标签浏览、阅读文章。
- 登录用户可以留言、点赞、收藏。
- 站长可以进入后台创建、编辑、发布文章。

### 2.2 后续扩展方向

后续可以逐步扩展为轻量内容平台：

- 登录用户创建自己的文章或笔记。
- 用户个人主页。
- 评论回复和行级标注。
- 订阅作者、标签或外部信息源。
- 阅读统计、点赞统计、内容分析。
- GitHub Trending、RSS 聚合和热点信息展示。

---

## 3. 技术栈

### 3.1 前端

- React：构建单页应用界面。
- TypeScript：增强类型安全和可维护性。
- Vite：前端开发和构建工具。
- React Router：页面路由。
- Zustand：管理登录态、用户信息和局部交互状态。
- Tailwind CSS：构建页面视觉样式。
- Markdown 渲染：用于文章详情页和编辑预览。
- 后续可引入 TanStack Query：管理文章列表、评论、搜索等服务端数据缓存。

### 3.2 后端

- Go：后端主语言。
- chi：轻量 HTTP 路由框架。
- pgx：连接 PostgreSQL。
- golang-migrate：数据库迁移。
- Argon2id + HttpOnly Cookie：密码哈希和 Session 管理。
- OAuth2：后续支持 GitHub 登录。
- zerolog：结构化日志。

### 3.3 数据库与基础设施

- PostgreSQL：主数据库。
- Redis：可选，用于缓存、限流、任务队列或热点数据。
- Docker / Docker Compose：本地开发和部署编排。
- Caddy / Nginx：生产环境反向代理与 HTTPS。
- MinIO / S3：后续用于图片、附件、头像等对象存储。

---

## 4. 总体架构

第一阶段采用“模块化单体 + 可选 Worker”的架构：

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
        | 统计聚合 / 外部抓取 / 定时任务
        v
[PostgreSQL / Redis]
```

后端模块建议：

```text
backend/
  cmd/
    api/              # HTTP API 入口
    worker/           # 后台任务入口
  internal/
    auth/             # 注册、登录、Session、OAuth
    user/             # 用户资料、公开主页、个人设置
    post/             # 博客文章、草稿、发布、标签
    comment/          # 留言和回复
    reaction/         # 点赞、收藏
    search/           # 文章搜索
    analytics/        # 阅读统计和行为事件
    platform/         # 数据库、日志、配置、中间件
  migrations/
```

---

## 5. 访问与登录策略

### 5.1 无需登录的内容

以下页面和接口默认公开：

- 首页 `/`
- 文章列表 `/posts`
- 文章详情 `/posts/:slug`
- 标签页 `/tags/:tag`
- 归档页 `/archive`
- 搜索页 `/search`
- 关于页 `/about`
- 公开用户主页 `/users/:username`
- 公开文章阅读统计展示

### 5.2 需要登录的操作

用户执行以下动作时才需要登录：

- 发表留言或回复。
- 点赞、收藏或订阅。
- 创建自己的文章、笔记或内容。
- 编辑、删除、发布自己的文章。
- 修改个人资料。
- 进入个人工作台。
- 查看私有草稿和个人互动记录。

### 5.3 登录引导

前端不应在用户首次进入网站时强制弹出登录。合适的交互是：

1. 用户正常浏览公开内容。
2. 用户点击“留言”“点赞”“收藏”“写文章”等按钮。
3. 如果未登录，跳转到登录页或打开登录弹窗。
4. 登录成功后回到原操作位置并继续提交。

---

## 6. 首页设计

首页是个人博客的主展示面，需要保留漂亮、可填充的结构。第一版可以先放占位内容，但布局要完整。

### 6.1 首屏

首屏承担个人品牌展示：

- 显示站点名称或个人名称。
- 简短一句个人定位，例如技术、设计、研究、生活记录等方向。
- 提供主要入口：最新文章、精选文章、关于我。
- 背景可以使用高质量图片、个人照片、项目截图或简洁的视觉场景。

首屏不放登录墙，也不把“注册/登录”作为主要目标。

### 6.2 主内容区

首页主体建议包含：

- 精选文章：手动挑选 3 到 6 篇。
- 最新文章：按发布时间展示。
- 主题标签：展示主要写作方向。
- 项目或作品：为后续个人作品集预留区域。
- 关于我摘要：放一段简短介绍和详情入口。

### 6.3 右侧或底部辅助信息

可选内容：

- 近期更新。
- 热门文章。
- 推荐阅读。
- GitHub、邮箱、社交链接。
- RSS 订阅入口。

---

## 7. 核心功能需求

## 7.1 用户系统

### 功能

1. 邮箱注册与登录。
2. 登录状态保持。
3. 当前用户信息查询。
4. 公开用户资料页。
5. 用户修改自己的资料。
6. 后续支持 GitHub OAuth 登录。

### 实现方案

- 使用邮箱 + 密码作为第一版登录方式。
- 密码使用 Argon2id 哈希存储。
- 登录态使用 HttpOnly Cookie 保存 Session Token。
- 前端通过 `/api/auth/me` 判断当前登录状态。
- 后端所有写操作必须从 Session 中识别用户，不信任前端传入的 `user_id`。

关键数据表：

- `users`
- `user_identities`
- `sessions`
- `email_verification_tokens`

---

## 7.2 博客文章系统

### 功能

1. 公开访客可以浏览所有已发布文章。
2. 站长和有权限的登录用户可以创建文章。
3. 支持草稿、发布、归档、删除。
4. 支持 Markdown 编辑和渲染。
5. 支持标签、分类、摘要和封面图。
6. 支持精选文章和置顶文章。
7. 支持阅读数统计。

### 实现方案

文章内容拆分为：

- `posts`：文章元信息，例如标题、作者、状态、slug、摘要、封面图、发布时间。
- `post_versions`：文章内容版本，保存 Markdown 原文和渲染后的 HTML。
- `post_tags`：文章标签。
- `post_stats`：阅读数、点赞数、评论数等聚合数据。

这样可以支持：

1. 草稿和正式发布分离。
2. 文章版本历史。
3. 后续协作编辑、审核、回滚。

---

## 7.3 留言与评论

### 功能

1. 公开访客可以阅读评论。
2. 用户留言或回复时必须登录。
3. 支持楼中楼回复。
4. 支持站长删除、隐藏或置顶评论。
5. 后续支持行级标注。

### 实现方案

评论统一使用 `comments` 表：

```text
comment_id
post_id
parent_comment_id
author_id
content_md
status
created_at
updated_at
```

权限规则：

- `GET /api/posts/:id/comments` 公开。
- `POST /api/posts/:id/comments` 需要登录。
- `PATCH /api/comments/:id` 仅作者或管理员可操作。
- `DELETE /api/comments/:id` 仅作者或管理员可操作。

---

## 7.4 点赞、收藏与订阅

### 功能

1. 公开访客可以看到点赞数和收藏数。
2. 用户点击点赞、收藏或订阅时需要登录。
3. 同一用户对同一目标只能有一次同类型反应。
4. 支持取消点赞、取消收藏、取消订阅。

### 实现方案

使用统一的 `reactions` 表：

```text
user_id
target_type
target_id
reaction_type
created_at
unique(user_id, target_type, target_id, reaction_type)
```

`reaction_type` 可包括：

- `like`
- `bookmark`
- `follow`

---

## 7.5 搜索与归档

### 第一版方案

使用 PostgreSQL Full Text Search：

- 对文章标题、摘要、正文、标签建立全文索引。
- 搜索结果只返回已发布、公开可见文章。
- 搜索页无需登录。

公开页面：

- `/search?q=keyword`
- `/archive`
- `/tags/:tag`

后续可接入 Meilisearch、Typesense 或 Elasticsearch。

---

## 7.6 阅读统计

### 功能

1. 记录文章 PV。
2. 记录匿名访客 UV。
3. 记录登录用户阅读。
4. 聚合展示文章阅读量。

### 实现方案

- 用户打开文章时前端发送 `POST /api/posts/:id/view`。
- 匿名访客使用匿名 visitor id，保存在 Cookie 中。
- 后端写入 `post_views`。
- Worker 定时聚合到 `post_stats`。

阅读接口可以公开，但需要限流和去重策略。

---

## 8. 数据库初步设计

### 8.1 用户相关

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

### 8.2 文章相关

```sql
create table posts (
  id uuid primary key,
  author_id uuid not null references users(id),
  title text not null,
  slug text unique not null,
  summary text,
  cover_image_url text,
  status text not null default 'draft',
  visibility text not null default 'public',
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
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
  bookmark_count bigint not null default 0,
  comment_count bigint not null default 0,
  updated_at timestamptz not null default now()
);
```

### 8.3 评论、互动与阅读

```sql
create table comments (
  id uuid primary key,
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references users(id),
  parent_comment_id uuid references comments(id) on delete cascade,
  content_md text not null,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table post_views (
  id uuid primary key,
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid references users(id),
  anonymous_id text,
  session_id uuid,
  source text,
  created_at timestamptz not null default now()
);
```

---

## 9. API 初步设计

### 9.1 Auth

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/github/start
GET    /api/auth/github/callback
```

### 9.2 Public Blog

```text
GET    /api/site/home
GET    /api/posts
GET    /api/posts/:slug
GET    /api/tags
GET    /api/tags/:tag/posts
GET    /api/archive
GET    /api/search?q=keyword
GET    /api/users/:username
GET    /api/posts/:id/comments
POST   /api/posts/:id/view
```

### 9.3 Authenticated Actions

```text
POST   /api/posts
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish
GET    /api/dashboard/posts
POST   /api/posts/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/reactions
DELETE /api/reactions
PATCH  /api/users/me
```

---

## 10. 前端页面设计

```text
/
  个人博客首页
  - 首屏个人展示
  - 精选文章
  - 最新文章
  - 标签入口
  - 项目或作品预留区

/posts
  文章列表页

/posts/:slug
  文章详情页
  - 正文
  - 标签
  - 阅读统计
  - 公开评论列表
  - 登录后留言

/tags/:tag
  标签文章页

/archive
  归档页

/search
  搜索结果页

/about
  关于我

/login
  登录页

/register
  注册页

/dashboard
  登录后工作台

/editor/new
  新建文章，需要登录

/editor/:id
  编辑文章，需要登录且校验权限

/users/:username
  公开用户主页
```

---

## 11. 权限矩阵

| 功能 | 匿名访客 | 登录用户 | 作者 | 管理员 |
|------|----------|----------|------|--------|
| 浏览首页 | 允许 | 允许 | 允许 | 允许 |
| 阅读公开文章 | 允许 | 允许 | 允许 | 允许 |
| 搜索文章 | 允许 | 允许 | 允许 | 允许 |
| 查看评论 | 允许 | 允许 | 允许 | 允许 |
| 发表留言 | 禁止 | 允许 | 允许 | 允许 |
| 点赞收藏 | 禁止 | 允许 | 允许 | 允许 |
| 创建文章 | 禁止 | 按权限 | 允许 | 允许 |
| 编辑自己的文章 | 禁止 | 禁止 | 允许 | 允许 |
| 删除任意评论 | 禁止 | 禁止 | 禁止 | 允许 |
| 管理站点内容 | 禁止 | 禁止 | 禁止 | 允许 |

---

## 12. 开发阶段规划

### Phase 0：项目骨架

- monorepo 初始化。
- frontend、backend、docker-compose 建立。
- PostgreSQL 连接。
- 数据库迁移。
- 基础日志、配置和健康检查。

### Phase 1：公开博客首页

- 首页布局。
- 精选文章区域。
- 最新文章区域。
- 关于我区域。
- 标签和归档入口。
- 不登录即可访问主要内容。

### Phase 2：用户系统

- 邮箱注册登录。
- Session / Cookie。
- `/api/auth/me`。
- 登录后导航状态。
- 用户资料页。

### Phase 3：博客核心

- 文章列表。
- 文章详情。
- Markdown 渲染。
- 草稿和发布。
- 编辑器页面。
- 标签、摘要、封面图。

### Phase 4：留言与互动

- 公开评论列表。
- 登录后留言。
- 评论回复。
- 点赞和收藏。
- 未登录操作时跳转登录。

### Phase 5：搜索与统计

- PostgreSQL 全文搜索。
- 归档页。
- 阅读统计。
- 热门文章。

### Phase 6：个人内容扩展

- 登录用户创建自己的内容。
- 用户公开主页增强。
- 用户工作台。
- 订阅、通知、外部信息源。

### Phase 7：工程化增强

- 单元测试。
- API 集成测试。
- CI。
- 生产 Dockerfile。
- Caddy / Nginx 部署。
- 监控和错误报警。

---

## 13. 安全要求

1. 密码必须哈希存储。
2. 登录 Cookie 使用 HttpOnly、Secure、SameSite。
3. 所有写操作必须检查登录态。
4. 用户只能修改自己的文章、评论和资料，管理员除外。
5. Markdown 渲染后的 HTML 必须消毒，防止 XSS。
6. GitHub OAuth 使用 state 防 CSRF。
7. 登录、注册、评论、阅读统计接口需要限流。
8. 后端不要信任前端传入的 `user_id`。
9. 敏感配置放入环境变量，不提交到 Git。
10. 统计中的 IP 建议 hash，不保存明文。

---

## 14. 第一版 MVP

第一版目标是做出一个可公开访问、观感完整的个人博客：

1. 漂亮的个人博客首页，占位内容可后续填充。
2. 公开文章列表。
3. 公开文章详情页。
4. Markdown 内容展示。
5. 邮箱登录和注册。
6. 登录后才能留言。
7. 登录后才能创建或编辑内容。
8. 基础阅读统计。
9. Docker Compose 本地启动。

第二版再加入：

1. 点赞和收藏。
2. 搜索和归档。
3. 用户公开主页。
4. 用户工作台。
5. 订阅和通知。
6. 外部信息源和热点内容。

---

## 15. 总结

这个项目应先从“好看的个人博客”开始，而不是从“完整社区平台”开始。公开内容必须足够顺畅：用户打开网站就能阅读、浏览和了解作者。登录系统作为互动和创作的安全边界存在，只在用户需要留言、点赞、收藏、订阅或创建自己的内容时出现。

推荐路线：

```text
先完成个人主页 + 公开文章阅读
再加入登录 + 留言 + 创作
最后扩展搜索 + 统计 + 用户内容 + 订阅和外部信息源
```
