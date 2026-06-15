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

---

## 七、3D 小镇与高斯世界的完整实现方式

本项目的 3D 部分分成两个层级：

1. `3D 小镇`：使用 `@react-three/fiber`、`@react-three/drei` 和 Three.js 基础几何体搭建的低多边形/像素风导航场景。
2. `高斯世界`：使用原生 Three.js 解析 `.ply` Gaussian Splatting 数据，并通过自定义 Shader 把每个高斯点渲染成可缩放、可透明混合、可扰动的面片。

小镇负责导航、模块入口和笔记交互；高斯世界负责进入某个房屋后的沉浸式 3D 展示。两者通过 React Router 串起来：小镇靠近房屋热点后按 `E`，跳转到 `/world/gaussian/:houseId`，高斯页再加载 `/gaussian/{houseId}/scene.ply`。

### 7.1 3D 小镇的入口结构

小镇页面入口是：

- `frontend/src/pages/WorldPage.tsx`
- `frontend/src/features/world/WorldCanvas.tsx`
- `frontend/src/features/world/WorldScene.tsx`

`WorldPage.tsx` 负责普通 React UI 层：

- 固定全屏容器：`fixed inset-0 overflow-hidden`
- 挂载 `<WorldCanvas />`
- 显示左上角标题、右上角返回按钮、左下角控制提示
- 显示 `InteractionPrompt`
- 显示 `NoteModal`
- 监听键盘交互：`E` 触发当前热点，`Esc` 关闭弹窗或返回首页

`WorldCanvas.tsx` 是 Three.js Canvas 层：

- 使用 `Canvas` 创建 WebGL 上下文。
- `dpr={1}` 限制像素比，降低 GPU 压力。
- `gl.antialias=true` 开启抗锯齿。
- 默认使用 `OrthographicCamera` 营造等距小镇视角。
- 调试模式 `FREE_CAMERA` 下切换成 `PerspectiveCamera + OrbitControls`，方便开发时自由检查模型位置。

默认相机配置：

```tsx
<OrthographicCamera
  makeDefault
  position={[8, 8, 8]}
  zoom={preview ? 38 : 48}
  near={0.1}
  far={100}
  onUpdate={(self) => self.lookAt(0, 0, 0)}
/>
```

这个相机位置让世界从斜上方看下来，`x/y/z` 三轴都能被看见，因此基础盒子几何体会呈现接近像素小镇的等距风格。

### 7.2 小镇场景图如何组装

`WorldScene.tsx` 是真正的 3D 场景组织者。它把世界拆成多个小组件：

- `Ground`：地面和中心广场。
- `Road`：十字道路和地砖。
- `Sky`：背景色、半球光、方向光、像素云。
- `NewsBoard`：村口新闻板。
- `PixelTree`：树木。
- `Player`：玩家角色。
- `CameraRig`：跟随玩家的相机控制。
- `KnowledgeHouse` / `GameHouse` / `LifeHouse` / `MovieHouse` / `NovelHouse` / `SportHouse`：各主题房屋。

场景里最重要的组织方式是 `worldModules` 数据驱动：

```ts
export const worldModules: WorldModule[] = [
  {
    id: 'knowledge',
    name: '知识',
    position: [-5.8, 0, 3.6],
    route: '/notes/knowledge/math',
    type: 'house',
  },
  ...
]
```

`WorldScene.tsx` 维护一个组件映射：

```ts
const moduleComponents = {
  knowledge: KnowledgeHouse,
  game: GameHouse,
  life: LifeHouse,
  movie: MovieHouse,
  novel: NovelHouse,
  sport: SportHouse,
}
```

渲染时遍历 `worldModules`，按 `module.id` 找到对应房屋组件，再把 `module.position` 传进去。这样房屋的位置和业务模块配置在数据层，房屋的几何造型留在组件层。

### 7.3 像素风小镇是怎么用几何体拼出来的

当前小镇不是导入 glTF/FBX 模型，而是直接用 Three.js 基础几何体手工搭建：

- 地面：`planeGeometry args={[24, 24]}`。
- 中心广场：`ringGeometry args={[1.6, 2.15, 4]}`，四边形环形看起来更像像素风广场。
- 道路：`boxGeometry args={[1, 0.05, 1]}`，通过 `scale` 拉成长条，形成十字路。
- 地砖：多个小 `boxGeometry` 排列在道路两侧。
- 树：树干和树冠都是盒子，两个绿色盒子错位堆叠。
- 新闻板：两根木柱、一个公告板、一个顶部横梁。
- 玩家：身体、头、脚、头发都由盒子组成。
- 房屋：主体、屋顶、门窗、装饰物由 box/cone 等基础几何体组合。

例如 `KnowledgeHouse`：

- 房屋主体：`boxGeometry [2.2, 1.5, 1.55]`
- 屋顶：`boxGeometry [2.45, 0.25, 1.75]`
- 门：`boxGeometry [0.52, 0.9, 0.08]`
- 窗：`boxGeometry [0.45, 0.36, 0.06]`
- 铅笔装饰：倾斜的细长 box + 四棱锥 cone

这种做法的优点是：

- 不依赖外部模型资源。
- 所有对象可用 React 组件表达，改颜色、位置、尺寸很快。
- 像素风和低多边形风格天然适合 box/cone/plane 组合。
- 资产体积小，加载快。

缺点是复杂造型需要写较多 mesh，因此项目把每类物体拆成独立组件，避免 `WorldScene` 变成巨型文件。

### 7.4 小镇输入系统

键盘输入在 `useKeyboardControls.ts` 中统一处理。

支持：

- `W` / `ArrowUp`：上
- `S` / `ArrowDown`：下
- `A` / `ArrowLeft`：左
- `D` / `ArrowRight`：右
- `E`：交互
- `Esc`：关闭弹窗或返回

这个 hook 返回的是一个 ref：

```ts
const keys = useRef({
  up: false,
  down: false,
  left: false,
  right: false,
})
```

使用 ref 的原因是：玩家移动在 `useFrame` 每帧读取输入。如果用 React state，每次按键都会触发组件重新渲染；用 ref 可以让渲染循环直接读最新输入，不引入不必要的 React 更新。

### 7.5 等距方向转换

小镇相机是斜 45 度俯视，屏幕方向和世界坐标方向不是一一对应的。因此移动输入需要经过 `getIsoMovement` 转换。

实现位置：

- `frontend/src/features/world/utils/isoDirection.ts`

核心逻辑：

```ts
const x = screenX + screenY
const z = screenY - screenX
const length = Math.hypot(x, z) || 1
return { x: x / length, z: z / length }
```

这一步把屏幕上的上下左右转换成世界平面上的 `x/z` 方向。最后做归一化，保证斜向移动不会比单方向移动更快。

### 7.6 玩家移动和边界限制

玩家组件在：

- `frontend/src/features/world/Player.tsx`

每帧执行：

1. 从 `controls.current` 读取当前按键。
2. 调用 `getIsoMovement` 得到世界方向。
3. 按 `speed * delta` 推进位置。
4. 调用 `clampTownPosition` 把玩家限制在小镇范围内。
5. 把位置写入 Zustand 全局状态。
6. 用 `group.current.position.lerp(...)` 平滑靠近目标位置。
7. 有移动时根据方向更新 `rotation.y`，让角色朝向移动方向。

边界限制在 `distance.ts`：

```ts
export function clampTownPosition(position) {
  return [
    Math.max(-10, Math.min(10, position[0])),
    position[1],
    Math.max(-10, Math.min(10, position[2])),
  ]
}
```

也就是说小镇活动范围是 `x: -10..10`、`z: -10..10`。

### 7.7 相机跟随系统

相机跟随在：

- `frontend/src/features/world/CameraRig.tsx`

它通过 `useThree()` 拿到当前默认相机，再在 `useFrame` 中读取 Zustand 的 `playerPosition`。

每帧逻辑：

```ts
target.set(playerPosition[0], 0.2, playerPosition[2])
desired.copy(target).add(offset) // offset = [8, 8, 8]
camera.position.lerp(desired, 0.08)
camera.lookAt(target)
camera.updateProjectionMatrix()
```

这让相机始终在玩家斜上方 `[8, 8, 8]` 的位置追随，且用 `lerp` 做缓动，避免玩家一动相机就硬切。

### 7.8 热点系统与交互

热点数据在：

- `frontend/src/features/world/data/hotspots.ts`

热点类型有三种：

- `open_note`：打开笔记弹窗。
- `open_news`：打开新闻板。
- `enter_house`：进入某个主题房屋的高斯世界。

每个热点包含：

```ts
{
  id: 'knowledge-door',
  module: 'knowledge',
  position: [-5.8, 0, 4.95],
  radius: 1.35,
  type: 'enter_house',
  noteSlug: 'knowledge/math',
  interactionText: '按 E 进入知识小屋',
}
```

`WorldScene.tsx` 每帧执行热点检测：

1. 从 Zustand 读取玩家位置。
2. 遍历 `hotspots`。
3. 用 `distance2D` 计算玩家和热点在 `x/z` 平面上的距离。
4. 如果距离小于热点半径，记录最近热点。
5. 最近热点变化时写入 `activeHotspot`。

UI 层的 `InteractionPrompt` 订阅 `activeHotspot`，有热点时在屏幕底部显示 `interactionText`。

按下 `E` 时，`WorldPage.handleAction` 根据热点类型执行：

- `open_news`：打开新闻弹窗。
- `open_note`：打开笔记弹窗。
- `enter_house`：跳转到 `/world/gaussian/{module}`。

进入高斯世界时会把当前玩家位置放进 router state：

```ts
navigate(`/world/gaussian/${activeHotspot.module}`, {
  state: { returnPosition: pos },
})
```

这样从高斯世界返回小镇时，玩家不会回到出生点，而是回到进入房屋前的位置。

### 7.9 小镇状态管理

小镇的全局状态在：

- `frontend/src/features/world/store/worldStore.ts`

使用 Zustand 保存：

- `playerPosition`
- `currentScene`
- `activeHotspot`
- `activeNoteSlug`
- `isNoteModalOpen`
- `isNewsModalOpen`
- `movementEnabled`
- `visitedModules`

这里没有把所有 3D 对象状态都放进 Zustand，只保存跨组件需要共享的业务状态。比如玩家 mesh 的平滑位置、旋转等临时渲染状态留在 `Player.tsx` 的 ref 中；而热点、弹窗、当前玩家位置这种会影响 UI 和路由的状态才进入 store。

### 7.10 高斯世界页面如何进入

高斯世界页面入口是：

- `frontend/src/pages/GaussianPage.tsx`
- `frontend/src/features/world/gaussian/GaussianViewer.tsx`

路由参数 `houseId` 决定加载哪个高斯模型：

```ts
const { houseId } = useParams()
const plyUrl = `/gaussian/${houseId}/scene.ply`
```

例如进入知识小屋：

```text
/world/gaussian/knowledge
```

对应资源：

```text
public/gaussian/knowledge/scene.ply
```

`GaussianPage` 只负责：

- 从路由拿 `houseId`
- 从 `worldModules` 找房屋名
- 拼出 `.ply` 地址
- 把返回函数传给 `GaussianViewer`

真正的高斯渲染全部在 `GaussianViewer.tsx`。

### 7.11 高斯世界为什么没有用 R3F

小镇使用 R3F，因为它是大量 React 组件化 mesh 的组合，适合声明式写法。

高斯世界使用原生 Three.js，原因是它需要：

- 手动解析二进制 `.ply`
- 创建 `InstancedBufferGeometry`
- 自定义 shader attribute 和 uniform
- 控制每帧 physics、shader time、turbulence
- 直接管理 renderer、scene、camera 生命周期
- 更细粒度地控制 WebGL 性能

这类逻辑如果强行写成 R3F 组件，会把 shader、buffer、加载状态和相机控制拆得很碎。当前实现集中在一个 viewer 中，便于理解数据从 PLY 到 GPU 的完整链路。

### 7.12 GaussianViewer 的整体生命周期

`GaussianViewer.tsx` 的生命周期由一个 `useEffect([plyUrl])` 管理：

1. 初始化 Three.js：`scene`、`camera`、`renderer`、grid。
2. 绑定输入事件：键盘、鼠标、resize。
3. 启动 LoadingGameSystem。
4. 下载 `.ply` 文件。
5. 解析 PLY 为 typed arrays。
6. 创建 Gaussian Splat mesh。
7. 自动对焦相机。
8. 启动 requestAnimationFrame 渲染循环。
9. 组件卸载时释放 renderer、geometry、material、事件监听和动画帧。

这是典型的 Three.js imperative lifecycle：初始化、加载、渲染、清理都由代码显式控制。

### 7.13 PLY 数据解析

PLY 解析函数是 `parsePLY(buffer: ArrayBuffer)`。

它做了几件事：

1. 读取文件头部，找到 `end_header`。
2. 解析 `element vertex` 得到点数量。
3. 解析每个 `property`，记录属性在每个 vertex 结构中的 offset。
4. 用 `DataView` 按 little-endian 读取二进制数据。
5. 把有效点写入 typed arrays：
   - `posBuffer: Float32Array(vertexCount * 3)`
   - `rotBuffer: Float32Array(vertexCount * 4)`
   - `scaleBuffer: Float32Array(vertexCount * 3)`
   - `colBuffer: Float32Array(vertexCount * 4)`

当前代码识别的关键字段：

- `x/y/z`：高斯中心位置。
- `opacity`：不透明度，经过 sigmoid 转换。
- `f_dc_0/1/2`：球谐直流颜色项，使用 `SH_C0` 转换为 RGB。
- `rot_0..rot_3`：旋转四元数。
- `scale_0..scale_2`：高斯尺度，使用 `Math.exp` 还原。

透明度过滤：

```ts
const minOpacity = 0.05
if (opacity < minOpacity) continue
```

这样可以跳过几乎不可见的点，减少实例数量。

### 7.14 从 PLY 到 GPU：InstancedBufferGeometry

解析完成后会生成：

```ts
geometryData = {
  count,
  pos,
  rot,
  scale,
  col,
}
```

然后 `createSplatMesh(data)` 创建一个基础平面：

```ts
const baseGeo = new THREE.PlaneGeometry(1, 1)
const geo = new THREE.InstancedBufferGeometry()
geo.index = baseGeo.index
geo.attributes.position = baseGeo.attributes.position
geo.attributes.uv = baseGeo.attributes.uv
```

每个高斯点不是一个独立 mesh，而是一个平面实例。每个实例有自己的属性：

```ts
geo.setAttribute('instPosition', new THREE.InstancedBufferAttribute(data.pos, 3))
geo.setAttribute('instRotation', new THREE.InstancedBufferAttribute(data.rot, 4))
geo.setAttribute('instScale', new THREE.InstancedBufferAttribute(data.scale, 3))
geo.setAttribute('instColor', new THREE.InstancedBufferAttribute(data.col, 4))
```

这就是高斯世界能渲染大量点的关键：CPU 只创建一个 mesh，GPU 通过 instancing 一次绘制大量 splat。

### 7.15 高斯点的 Shader 渲染

材质是 `THREE.ShaderMaterial`，包括自定义 vertex shader 和 fragment shader。

主要 uniforms：

- `uSplatScale`：整体缩放。
- `uOpacityMod`：整体透明度调节。
- `uBrightness`：亮度。
- `uTime`：动画时间。
- `uTurbulence`：扰动强度。
- `uFlowAmp`：流动幅度。
- `uFlowFreq`：流动频率。
- `uFlowSpeed`：流动速度。

vertex shader 做的事：

1. 读取当前实例的 `instPosition`、`instRotation`、`instScale`、`instColor`。
2. 把基础平面顶点按高斯 scale 放大。
3. 用四元数转旋转矩阵，旋转平面。
4. 如果开启湍流，把点中心按 curl noise 风格函数偏移。
5. 计算最终裁剪空间位置。

fragment shader 做的事：

1. 用 `uv` 把方形平面映射到 `[-1, 1]`。
2. 超出单位圆的像素直接 `discard`。
3. 使用 `exp(-r^2 * 2.0)` 生成中心浓、边缘淡的高斯透明度。
4. 颜色乘亮度，alpha 乘实例透明度和整体透明度。

核心片段：

```glsl
vec2 c = vUv * 2.0 - 1.0;
if (dot(c, c) > 1.0) discard;
float a = exp(-dot(c, c) * 2.0) * vColor.a * uOpacityMod;
if (a < 0.05) discard;
gl_FragColor = vec4(vColor.rgb * uBrightness, a);
```

所以每个实例虽然几何上是一个平面，但视觉上会变成一个柔和的椭圆/圆形高斯点。

### 7.16 高斯世界的飞行相机

高斯世界不是 OrbitControls，而是自定义第一人称飞行控制。

状态保存在 `physics` 对象里：

- `velocity`
- `inputVector`
- `move: { f, b, l, r, u, d }`
- `boost`
- `mouseDown`
- `targetRot`
- `currRot`

键盘：

- `W/S/A/D`：前后左右飞行。
- `Space`：上升。
- `ShiftLeft`：下降。
- `Q`：加速。
- `H`：隐藏/显示 UI。
- `Esc`：返回小镇。

鼠标：

- 按住左键拖动，修改 `targetRot.x/y`。
- 每帧让 `currRot` 平滑追向 `targetRot`。

每帧物理更新：

1. 根据当前相机四元数计算 forward/right/up。
2. 根据输入组合出移动方向。
3. 加速度推进 `velocity`。
4. 指数阻尼模拟摩擦。
5. 限制最大速度。
6. `camera.position.addScaledVector(velocity, dt)`。

这样得到的是类似飞行观察器的体验，而不是围绕模型旋转。

### 7.17 高斯世界的自动对焦

模型加载后会执行 `autoFocusCamera()`。

它抽样前若干个点，估算模型半径，然后把相机放到合适距离：

```ts
camera.position.set(0, 0, radius * 3)
camera.lookAt(0, 0, 0)
```

同时同步 `physics.targetRot` 和 `physics.currRot`，避免相机位置变了但鼠标控制的内部旋转状态还停留在旧值。

### 7.18 流体/散开效果

高斯世界有一个 turbulence 按钮。点击后切换：

```ts
turbulence: s.turbulence > 0.5 ? 0.0 : 1.0
```

渲染循环里 `currentTurbulence` 不会瞬间跳变，而是缓慢追向目标值：

```ts
currentTurbulence += (target - currentTurbulence) * lerpSpeed
```

shader 内部根据 `uTime`、`uFlowAmp`、`uFlowFreq`、`uFlowSpeed` 计算 curl 风格偏移，让每个高斯点像被流场吹散一样运动。关掉后，点又回到原位置。

### 7.19 LoadingGameSystem

高斯 PLY 可能较大，所以 viewer 内置了一个加载小游戏系统：

- 使用一个独立 `<canvas>` 绘制加载层。
- 玩家三角形由键盘输入驱动。
- 随机生成目标点。
- 碰到目标点时产生粒子并刷新目标。
- 同时显示下载进度条、加载文案和 quote。

这个系统和主 Three.js 场景是分离的：加载层是 2D Canvas，模型加载完成后调用 `loadingSys.stop()`，再显示真正的高斯世界。

### 7.20 UI 与渲染层分离

`GaussianViewer` 的 UI 是 React DOM：

- 顶部标题和副标题。
- 点数/FPS 状态。
- 底部控制按钮。
- 导航提示。
- 加载遮罩。

Three.js 只负责渲染 `renderer.domElement`。React 负责 HUD。两者通过 `bridgeRef` 连接：

```ts
const bridgeRef = useRef({
  splatMesh: null,
  state: sliders,
  updateUniforms: () => {},
  autoFocusCamera: () => {},
  downloadModel: () => {},
})
```

当 React slider/state 变化时，写入 `bridgeRef.current.state`，然后调用 `updateUniforms()` 把 UI 状态同步到 shader uniforms。

这种做法避免把 Three.js 对象放进 React state，因为 Three.js 对象频繁变化，用 state 会导致不必要的 React re-render。

### 7.21 小镇与高斯世界的整体数据流

完整链路如下：

1. 用户进入 `/world`。
2. `WorldPage` 渲染 `WorldCanvas`。
3. `WorldCanvas` 创建 R3F Canvas 和相机。
4. `WorldScene` 渲染小镇：地面、道路、房屋、树、玩家。
5. `useKeyboardControls` 记录按键。
6. `Player` 每帧根据按键更新位置。
7. `WorldScene` 每帧根据位置检测热点。
8. UI 显示当前热点提示。
9. 用户按 `E`。
10. 如果是笔记/新闻热点，打开 DOM 弹窗。
11. 如果是房屋热点，跳转 `/world/gaussian/:houseId`。
12. `GaussianPage` 根据 `houseId` 拼出 `.ply` 地址。
13. `GaussianViewer` 下载并解析 PLY。
14. PLY 数据进入 `InstancedBufferGeometry`。
15. Shader 把每个实例渲染成高斯 splat。
16. 用户在高斯世界中飞行查看。
17. 按 `Esc` 或返回按钮回到 `/world`，恢复进入前的小镇位置。

### 7.22 为什么这样拆分

这个 3D 架构的核心取舍是：

- 小镇是交互导航空间，强调可维护、组件化、数据驱动，所以用 R3F。
- 高斯世界是高性能点云/splat 渲染空间，强调 buffer、shader、相机和资源生命周期控制，所以用原生 Three.js。
- UI 仍然交给 React DOM，不把所有东西都塞进 WebGL。
- 跨组件业务状态用 Zustand，逐帧渲染状态用 ref 和 Three.js 对象。

这让项目同时保留了 React 的可维护性和 Three.js 的底层控制能力。
