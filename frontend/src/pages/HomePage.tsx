import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const featuredPosts = [
  {
    title: '从一个稳定的个人主页开始',
    category: '建站记录',
    excerpt: '先把公开阅读体验做好，再把留言、创作和订阅逐步接进来。',
    date: '2026.06',
    readTime: '6 min',
  },
  {
    title: 'React 与 Go 的轻量全栈边界',
    category: '工程实践',
    excerpt: '前端负责体验，后端负责边界，数据库迁移从第一天开始保留。',
    date: '2026.06',
    readTime: '9 min',
  },
  {
    title: '为长期写作设计的信息架构',
    category: '内容设计',
    excerpt: '主页、归档、标签、搜索和作者介绍，是博客能长期生长的骨架。',
    date: '2026.06',
    readTime: '7 min',
  },
]

const topics = ['全栈开发', '产品思考', '阅读笔记', '项目复盘', '工具链', '生活记录']

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative min-h-[calc(100svh-5.5rem)] border-b border-slate-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=2200&q=85')",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/86 to-blue-950/42" />

        <div className="relative mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="max-w-3xl pt-4 text-white">
            <p className="mb-5 inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-blue-100 backdrop-blur">
              Personal Blog / Notes / Projects
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
              XLab Notes
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              这里会沉淀我的技术实践、阅读笔记、项目复盘和一些长期思考。主要内容公开可读，只有当你留言或创建自己的内容时才需要登录。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#posts"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition-colors hover:bg-blue-50"
              >
                阅读最新文章
              </a>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                了解这个博客
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-lg rounded-md border border-white/18 bg-white/92 p-5 shadow-2xl shadow-slate-950/35 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Featured
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    本周想写
                  </h2>
                </div>
                <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                  Public
                </span>
              </div>

              <div className="space-y-4 py-5">
                {featuredPosts.map((post) => (
                  <article
                    key={post.title}
                    className="rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/45"
                  >
                    <div className="flex items-center justify-between gap-4 text-xs font-medium text-slate-500">
                      <span>{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {post.excerpt}
                    </p>
                  </article>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4">
                {[
                  ['24', '文章占位'],
                  ['6', '专题方向'],
                  ['0', '登录门槛'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-semibold text-slate-950">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="posts" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Latest Writing
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                最新文章
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              文章内容后续接入真实数据。当前先保留完整展示位，让主页结构、节奏和视觉层级先成立。
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <article
                key={post.title}
                className="group rounded-md border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  0{index + 1}
                </div>
                <p className="mt-6 text-sm font-semibold text-blue-800">{post.category}</p>
                <h3 className="mt-3 text-xl font-semibold leading-7 text-slate-950">
                  {post.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="topics" className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Topics
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              写作方向
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              用少量稳定分类承载长期写作，不让主页被功能入口淹没。访客可以自由阅读，互动动作再进入登录验证。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <div
                key={topic}
                className="rounded-md border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold text-slate-800 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-blue-950 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              About
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              一个先阅读、后互动的个人博客
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-blue-100">
              主页会逐步填充个人介绍、精选文章、项目作品和联系入口。阅读路径保持开放；当你想留言、收藏，或创建自己的内容时，系统会再要求登录。
            </p>
          </div>

          <div className="rounded-md border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-blue-100">交互边界</p>
            <div className="mt-5 space-y-4">
              {[
                ['公开可读', '首页、文章、标签、归档、搜索都不需要登录。'],
                ['按需登录', '留言、点赞、收藏、订阅和创作时再验证身份。'],
                ['长期扩展', '后续可以加入工作台、个人内容和外部信息聚合。'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-md bg-white p-4 text-slate-950">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-950 transition-colors hover:bg-blue-50"
                >
                  进入个人资料
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-950 transition-colors hover:bg-blue-50"
                >
                  登录后留言或创作
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
