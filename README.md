# x·blog

一个响应式个人博客与极客资讯系统。首页以暖米色、藏青蓝和自然草木色为主，公开展示个人文章、分类入口和 3D 知识小镇入口；登录只在留言、创作和管理员发布等动作发生时需要。

## 当前功能

- 个人博客首页：养神小狗 Hero、最新文章、探索角落、3D 小镇入口
- 左侧悬浮岛 Sidebar：Main Page、Trending、Study、Fun、Life、Login
- Study / Fun / Life：文章卡片网格，Fun 支持 Novels / Games / Movies tabs
- Trending：后端接口获取 GitHub 热门仓库信息，前端以信息流卡片展示
- Editor：管理员可访问的 Milkdown Markdown 所见即所得编辑器
- Auth：邮箱 Magic Link 无密码登录；开发环境不发邮件，直接在后端控制台打印登录链接
- 3D World：保留 `/world` 入口，并继续作为知识小镇模块
- 文章封面目录：`frontend/public/assets/covers/`

## 技术栈

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, CSS variables |
| Editor | Milkdown / Crepe |
| 3D | three, @react-three/fiber, @react-three/drei |
| State | Zustand |
| Routing | React Router |
| Backend | Go 1.25, chi |
| Database | PostgreSQL 18 |
| Cache / Queue | Redis 8 |
| Dev Env | Docker Compose |

## 目录

```text
.
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   └── assets/covers/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── features/world/
└── backend/
    ├── Dockerfile
    ├── cmd/api/
    ├── internal/
    └── migrations/
```

## 启动方式

### 方式 1：Docker 全量启动

适合一次性启动 frontend、backend、PostgreSQL、Redis。

```bash
docker compose up --build
```

打开：

- Frontend: http://localhost:5173
- API health: http://localhost:8080/api/health
- 3D world: http://localhost:5173/world

查看 Magic Link 开发登录链接：

```bash
docker compose logs -f api
```

### 方式 2：Docker 数据库 + 本地前后端

适合日常开发调试。

Terminal 1:

```bash
docker compose up -d postgres redis
```

Terminal 2:

```bash
cd backend
go run ./cmd/api
```

Terminal 3:

```bash
cd frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

本地登录调试：在登录页输入邮箱后，后端终端会输出 `[MAGIC LINK DEV] ...` 链接，浏览器打开该链接即可完成登录。

### 方式 3：仅前端

公开页面可以启动，登录、Trending 和需要 API 的功能会依赖后端。

```bash
cd frontend
npm install
npm run dev
```

## 环境变量

Docker Compose 已提供开发默认值。生产环境发送 Magic Link 邮件时需要配置：

```text
APP_ENV=production
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASSWORD=your-password
SMTP_FROM=hello@example.com
```

开发环境保持 `APP_ENV=development` 时不会发送邮件，只会在后端控制台输出登录链接。

## 常用路由

| Route | Description |
| --- | --- |
| `/` | 个人博客首页 |
| `/hot` | GitHub Trending 信息流 |
| `/study` | 学习文章 |
| `/fun` | 娱乐内容，含 Novels / Games / Movies tabs |
| `/life` | 生活文章 |
| `/editor` | 管理员 Markdown 编辑器 |
| `/world` | 3D 知识小镇 |
| `/login` | Magic Link 登录 |

## 验证

Frontend build:

```bash
cd frontend
npm run build
```

Backend build:

```bash
cd backend
go build ./...
```

Docker smoke test:

```bash
docker compose up --build
```

## 备注

- 文章封面统一放在 `frontend/public/assets/covers/`。
- Trending 接口会请求 GitHub Search API；网络不可用时后端会返回本地占位数据，保证页面能正常渲染。
- 发布接口仍可继续扩展；当前编辑器页面已完成 UI 与 Milkdown 接入，并保留管理员权限门槛。
