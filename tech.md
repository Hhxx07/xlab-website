# XLab 网站技术栈说明

## 整体架构概览

XLab 是一个前后端分离的网页应用，前端使用 React + Vite 构建 SPA，后端使用 Go 语言提供 REST API，通过 Docker Compose 编排 5 个容器服务（PostgreSQL、Redis、API、Worker、前端）协同运行。

```
用户浏览器
    │
    ├─→ Vite Dev Server (Node) ──→ React SPA (前端页面)
    │       │
    │       └─→ /api/* 代理 ──→ Go API Server (chi 路由)
    │                                │
    │                                ├─→ PostgreSQL (用户数据、会话)
    │                                └─→ Redis (预留，尚未使用)
    │
    └─→ 3D 渲染 (Three.js / React Three Fiber) 在浏览器内完成
```

---

## 一、前端核心技术

### 1. React 19 + TypeScript 6 — 组件化 UI 框架

**作用：** 构建可复用的 UI 组件，管理页面状态和交互逻辑。

**实现方式：**
- 使用函数组件 + Hooks 编写所有页面和组件
- 通过 TypeScript 提供类型安全，定义共享类型（`frontend/src/types/index.ts`）
- React 19 的 StrictMode 包裹根组件，在开发阶段检测潜在问题

### 2. React Router 7 — 客户端路由

**作用：** 实现 SPA 内的页面切换，无需刷新浏览器。

**实现方式：**
- `BrowserRouter` 包裹整个应用，监听浏览器 URL 变化
- 使用嵌套路由布局：`Layout.tsx` 作为公共外壳（导航栏 + 页脚），子页面渲染在 `<Outlet />` 中
- 路由表定义在 `App.tsx`：

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | HomePage | 首页，含 3D 预览和模块卡片 |
| `/world` | WorldPage | 全屏 3D 世界，可操控角色 |
| `/notes/*` | NotePage | Markdown 笔记阅读器 |
| `/login` | LoginPage | 登录表单 |
| `/register` | RegisterPage | 注册表单 |
| `/profile` | ProfilePage | 用户资料页 |

### 3. Zustand 5 — 全局状态管理

**作用：** 在组件间共享状态，避免 props 逐层传递。

**实现方式：**
- **authStore** — 管理用户认证状态：登录/注册/登出操作、当前用户信息、加载状态。应用启动时自动调用 `fetchMe()` 通过 HttpOnly Cookie 恢复登录会话
- **worldStore** — 管理 3D 世界状态：玩家位置、当前场景（小镇/室内）、活跃交互点、模态框开关、已访问模块记录
- Zustand 的 `create()` 函数创建 store hook，组件直接调用 `useAuthStore()` 读写状态

### 4. Three.js + React Three Fiber + Drei — 3D 渲染

本项目的核心特色是**体素风格等距视角 3D 小镇**，所有 3D 内容在浏览器 GPU 上实时渲染。

**技术分层：**

| 层级 | 库 | 作用 |
|---|---|---|
| 底层 | Three.js 0.184 | WebGL 封装，提供场景、相机、几何体、材质等底层 API |
| 中间层 | React Three Fiber 9 | 将 Three.js 对象映射为 React 组件（`<mesh>`、`<group>` 等），融入 React 的生命周期 |
| 工具层 | Drei 10 | 提供开箱即用的辅助组件（`OrthographicCamera` 等） |

**实现方式：**
- `<Canvas>` 组件创建一个 WebGL 渲染上下文，设置 `dpr={1}` 保证像素风格的清晰度
- 使用**正交相机**（OrthographicCamera）而非透视相机，消除透视变形，营造体素游戏的等距视角
- 所有建筑、树木、角色均由 Three.js 基础几何体（BoxGeometry、ConeGeometry）程序化生成，无需加载 3D 模型文件
- 场景采用分层组合：天空 → 地面 → 道路 → 6 栋建筑 → 8 棵树 → 新闻板 → 玩家 → 相机跟随

**6 栋建筑模块：**
`KnowledgeHouse`、`GameHouse`、`LifeHouse`、`MovieHouse`、`NovelHouse`、`SportHouse`，每栋建筑是独立的 `<group>`，包含不同颜色的方块和屋顶，通过 `moduleComponents` 注册表按名称渲染

**角色移动系统：**
- WASD 键盘输入 → `useKeyboardControls.ts` 监听 keydown/keyup
- `isoDirection.ts` 将屏幕方向转换为等距坐标：`x = screenX + screenY, z = screenY - screenX`
- 每帧（`useFrame`）更新位置，乘以速度（4.4）和帧间隔时间（delta），保证不同帧率下速度一致
- `distance.ts` 提供位置限制（clamp 在 [-10, 10] 范围内）

**相机跟随：**
- `CameraRig.tsx` 每帧读取玩家位置
- 目标位置 = 玩家位置 + 固定偏移 (8, 8, 8)（保持等距角度）
- 使用 `camera.position.lerp()`（线性插值因子 0.08）实现平滑跟随，而非僵硬锁定
- `camera.lookAt(target)` 始终保持玩家在画面中心

**交互系统：**
- `hotspots.ts` 定义 11 个交互热点（6 个门、4 个物品、1 个新闻板）
- 每帧检测玩家与热点的距离，进入范围后显示提示文字
- 按 E 键触发交互：打开笔记模态框、打开新闻公告、或"进入"建筑切换场景

### 5. Tailwind CSS 3 — 样式系统

**作用：** 以原子化 CSS 类名快速构建界面，无需手写 CSS。

**实现方式：**
- `index.css` 引入 `@tailwind base/components/utilities` 指令
- PostCSS 处理 Tailwind 指令，生成最终的 CSS 文件
- 所有组件使用 className 内联样式（如 `className="bg-gray-900 text-white p-6 rounded-lg"`），无需单独的 CSS 文件
- 不依赖任何 UI 组件库（如 MUI、shadcn/ui），所有界面完全自定义

---

## 二、后端核心技术

### 1. Go 1.25 + chi v5 — HTTP API 服务

**作用：** 提供 RESTful JSON API，处理用户认证、数据存取。

**实现方式：**
- chi 是一个轻量级 HTTP 路由器，比标准库 `net/http` 更灵活，比 Gin/Echo 更轻量
- 分层架构（Handler → Service → Repository）：
  - **Handler 层** — 解析 HTTP 请求、参数验证、调用 Service、写 JSON 响应
  - **Service 层** — 业务逻辑（密码哈希、会话生成、用户资料更新）
  - **Repository 层** — 数据库查询，封装 SQL，返回 Go 结构体
- CORS 中间件允许前端（`localhost:5173`）跨域请求
- 日志中间件记录每个请求的路径、方法、耗时
- 优雅关闭机制：收到 SIGINT/SIGTERM 信号后停止接收新请求，等待现有请求完成

### 2. PostgreSQL 18 + pgx v5 — 数据持久化

**作用：** 存储用户账号、会话等结构化数据。

**实现方式：**
- pgx 是 PostgreSQL 的原生 Go 驱动，性能优于 `database/sql` + `lib/pq`
- 使用连接池（`pgxpool`）管理数据库连接，避免频繁建立/断开连接
- 数据库迁移通过自定义迁移器实现：读取 `migrations/` 目录中的 SQL 文件，按版本号排序执行，在 `schema_migrations` 表中记录已执行的版本
- 当前数据表：
  - `users` — 用户基本信息（用户名、邮箱、密码哈希、头像等）
  - `user_identities` — 第三方登录关联（预留 GitHub OAuth）
  - `email_verification_tokens` — 邮箱验证令牌
  - `sessions` — 会话管理（令牌哈希、过期时间、IP/UA）

### 3. Argon2id — 密码哈希

**作用：** 安全存储用户密码，抵御暴力破解。

**实现方式：**
- 使用 Go 标准库 `golang.org/x/crypto` 的 Argon2id 实现
- 参数配置：内存 64MB、迭代 3 次、线程 4、输出 32 字节
- Argon2id 是当前最先进的密码哈希算法，同时抵御侧信道攻击（Argon2i）和 GPU 暴力破解（Argon2d）
- 注册时将密码哈希存入数据库，登录时比对哈希，明文密码不落盘

### 4. Session Cookie 认证

**作用：** 识别用户身份，保持登录状态。

**实现流程：**

```
登录时：
  1. 生成 256 位随机令牌
  2. SHA-256 哈希令牌，存入 sessions.token_hash
  3. 原始令牌通过 Set-Cookie 返回浏览器（HttpOnly, Secure, SameSite=Lax）

后续请求：
  1. 浏览器自动携带 Cookie
  2. 中间件取出 session_token，SHA-256 哈希
  3. 在 sessions 表中查找匹配的 token_hash
  4. 找到 → 注入用户信息到请求上下文
  5. 未找到 → 返回 401
```

**安全特性：**
- HttpOnly — JavaScript 无法读取 Cookie，防止 XSS 窃取令牌
- Secure — 仅 HTTPS 连接传输
- SameSite=Lax — 防止 CSRF 攻击
- 数据库存储哈希而非原始令牌 — 即使数据库泄露，攻击者也无法伪造会话
- 会话包含 IP 和 User-Agent 记录，可检测异常使用

### 5. zerolog — 结构化日志

**作用：** 输出可解析的 JSON 日志，便于生产环境日志聚合和搜索。

**实现方式：**
- 开发环境输出彩色控制台格式
- 生产环境输出 JSON 格式（每行一条记录）
- 日志字段：时间戳、日志级别、请求路径、方法、耗时、状态码

---

## 三、内容系统

### Markdown 文件笔记

**作用：** 存储网站内容（知识笔记、游戏攻略、生活记录等），文件即内容，无需 CMS。

**实现方式：**
- Markdown 文件存放在 `frontend/src/content/notes/` 目录，按模块分子目录（knowledge、game、life、movie、novel、sport）
- Vite 的 `?raw` 导入后缀将 `.md` 文件作为原始字符串导入到 JS 中
- `noteRegistry.ts` 解析每个文件的 YAML 前置元数据（标题、日期、摘要、标签）
- `markdown.tsx` 中的手写解析器将 Markdown 转换为 React JSX 渲染，支持标题、段落、无序列表
- 首页展示最新笔记列表，点击进入 `NotePage` 全页阅读
- 在 3D 世界中，走到特定位置按 E 键可打开笔记模态框，模态框中也有链接跳转到完整页面

---

## 四、开发与部署

### Docker Compose — 容器编排

**作用：** 一键启动全部服务，统一开发环境。

**实现方式：**
- 5 个服务定义在一个 `docker-compose.yml` 中
- 服务间通过容器名称互相访问（如前端 `VITE_API_BASE_URL=http://api:8080`）
- PostgreSQL 和 Redis 有健康检查，API 服务等待它们就绪后再启动
- 前端使用 Vite 开发服务器，后端使用 Air 热重载，改代码即生效

### Air — Go 代码热重载

**作用：** 修改 Go 代码后自动重新编译重启，无需手动操作。

**实现方式：**
- 监听 `.go` 文件变化
- API 和 Worker 各有独立的 Air 配置（`.air.toml`、`.air.worker.toml`）

### 多阶段 Docker 构建

**作用：** 生产环境镜像体积最小化。

**实现方式：**
- **dev 阶段** — 带 Air 热重载的开发镜像
- **builder 阶段** — 使用 Go 1.25-alpine 编译静态二进制（`CGO_ENABLED=0`）
- **prod 阶段** — 基于 `alpine:3.21`，仅包含编译好的二进制 + 数据库迁移文件，最终镜像极小

---

## 五、技术选型总结

| 需求 | 技术方案 | 为什么选它 |
|---|---|---|
| 前端框架 | React 19 | 生态成熟，组件模型适合复杂交互 |
| 类型安全 | TypeScript 6 | 编译期捕获错误，提升代码可维护性 |
| 页面路由 | React Router 7 | React 生态标准，嵌套路由支持好 |
| 状态管理 | Zustand 5 | 比 Redux 轻量，API 简洁，TypeScript 友好 |
| 3D 渲染 | Three.js + R3F + Drei | 将 3D 融入 React 组件树，声明式编程 |
| CSS 方案 | Tailwind CSS 3 | 快速原型，无需管理 CSS 文件 |
| 后端语言 | Go 1.25 | 高性能，并发原生支持，部署简单（单二进制） |
| HTTP 路由 | chi v5 | 轻量，兼容标准库，无黑魔法 |
| 数据库 | PostgreSQL 18 | 功能完整，JSON 支持好，生态丰富 |
| 密码安全 | Argon2id | 当前最安全的密码哈希算法 |
| 会话管理 | SHA-256 哈希 + HttpOnly Cookie | 简单安全，无需客户端存储令牌 |
| 日志 | zerolog | 零分配，高性能，结构化 JSON |
| 内容存储 | Markdown 文件 + Vite raw import | 内容即代码，版本管理，无需数据库 |
| 容器化 | Docker Compose | 统一开发环境，一次配置处处运行 |
| 热重载 | Air (Go) + Vite HMR (前端) | 改代码立刻看到效果 |

---

## 六、数据库迁移文件的 up / down 设计

`backend/migrations/` 下面目前有 4 个文件，按“版本号 + up/down”成对维护：

- `000001_init_users.up.sql`：创建用户相关基础表
- `000001_init_users.down.sql`：回滚第 1 版迁移，删除第 1 版创建的表
- `000002_add_sessions.up.sql`：在用户表基础上创建会话表
- `000002_add_sessions.down.sql`：回滚第 2 版迁移，删除会话表

### 命名规则

- `000001`、`000002` 这种前缀表示迁移版本号，迁移器会按数字顺序执行
- `.up.sql` 表示“升级迁移”，也就是把数据库结构推进到新版本
- `.down.sql` 表示“降级迁移”，也就是把这个版本新增的结构撤销掉

### 这 4 个文件分别做了什么

#### `000001_init_users.up.sql`

这个文件负责初始化最基础的用户数据结构，主要创建 3 张表：

- `users`：用户主表，保存邮箱、用户名、头像、角色、密码哈希等信息
- `user_identities`：第三方登录身份关联表，预留 GitHub / Google 等 OAuth 登录
- `email_verification_tokens`：邮箱验证令牌表，预留后续邮件验证流程

同时还会创建一些常用索引，方便按用户名、邮箱、用户 ID 查询。

#### `000001_init_users.down.sql`

这个文件是第 1 版迁移的回滚脚本，作用是把第 1 步建出来的表删掉：

- 先删 `email_verification_tokens`
- 再删 `user_identities`
- 最后删 `users`

这里按这个顺序删除，是因为后面的表依赖前面的表，必须先删依赖表，再删被依赖表。

#### `000002_add_sessions.up.sql`

这个文件在 `users` 表已经存在的前提下，再创建 `sessions` 表，用来保存登录会话：

- `user_id` 外键指向 `users.id`
- `token_hash` 保存 token 的 SHA-256 哈希，不直接存原始 token
- `user_agent`、`ip_hash` 用于审计和风控
- `expires_at` 控制会话过期时间

因为它依赖 `users`，所以必须排在 `000001` 之后执行。

#### `000002_add_sessions.down.sql`

这个文件是第 2 版迁移的回滚脚本，直接删除 `sessions` 表即可：

- `DROP TABLE IF EXISTS sessions;`

由于 `sessions` 依赖 `users`，所以回滚时也要先删 `sessions`，不能反过来。

### 实际执行顺序

迁移器通常会按下面的顺序工作：

1. 执行 `000001_init_users.up.sql`
2. 再执行 `000002_add_sessions.up.sql`
3. 如果需要回滚，先执行 `000002_add_sessions.down.sql`
4. 再执行 `000001_init_users.down.sql`

这样可以保证数据库结构始终满足外键依赖关系，也能安全地撤销最近一次迁移。
