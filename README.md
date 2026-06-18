# x·blog

个人博客创作尝试：留下自己的角落。

## 当前功能

- 文章内容
- 邮箱登录
- 评论互动
- 热点捕捉
- 神秘彩蛋

## 技术栈

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, CSS variables |
| Editor | Milkdown / Crepe |
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

项目通过 `docker-compose.yml` + `.env` 文件管理配置。`docker-compose.yml` 中所有变量都有开发默认值，开箱即用。

### 配置邮箱发送（必须）

复制模板并填入真实的 SMTP 信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少修改以下变量：

```env
# 生产环境切换
APP_ENV=production

# 你的域名（邮件中的验证链接会用这个地址）
FRONTEND_URL=https://你的域名.com

# SMTP 邮件配置（以 QQ 邮箱为例）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=你的QQ号@qq.com
SMTP_PASSWORD=你的授权码          # 不是 QQ 密码！需要在 QQ 邮箱设置中开启 SMTP 并获取授权码
SMTP_FROM=你的QQ号@qq.com
```

`.env` 文件已在 `.gitignore` 中忽略，不会被提交到 git。

### 开发模式

不需要创建 `.env`，直接 `docker compose up -d` 即可。此时：
- `APP_ENV` 默认为 `development`
- SMTP 邮件不会真实发送，验证链接会打印在后端控制台（以 `[EMAIL VERIFY DEV]` 开头）

## 常用路由

| Route | Description |
| --- | --- |
| `/` | 个人博客首页 |
| `/hot` | GitHub Trending 信息流 |
| `/study` | 学习文章 |
| `/fun` | 娱乐内容，含 Novels / Games / Movies tabs |
| `/life` | 生活文章 |
| `/editor` | 管理员 Markdown 编辑器 |
| `/login` | 登录 |

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
