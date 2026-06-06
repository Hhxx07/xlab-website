import { Link } from 'react-router-dom'
import WorldCanvas from '../features/world/WorldCanvas'
import { worldModules } from '../features/world/data/worldModules'
import { getAllNotes } from '../content/notes/noteRegistry'

const latestNotes = getAllNotes().slice(0, 3)
const featuredNotes = getAllNotes().slice(3, 6)

export default function HomePage() {
  return (
    <div className="bg-[#fbfaf8] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm">
            Personal homepage with a tiny voxel world
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-normal text-slate-950 sm:text-7xl">
            XLab
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            一个把知识、生活、游戏、电影、小说和体育装进 3D 像素小镇的个人网站。
          </p>
        </div>

        <Link
          to="/world"
          className="group mt-12 block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/15"
          aria-label="进入 3D 像素小镇"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">3D 小镇入口</p>
              <p className="mt-1 text-sm text-slate-500">
                点击进入全屏世界，使用 WASD 移动，按 E 交互。
              </p>
            </div>
            <span className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-blue-950">
              Enter World
            </span>
          </div>
          <div className="h-[420px] bg-sky-100 sm:h-[520px]">
            <WorldCanvas preview />
          </div>
          <div className="border-t border-slate-200 bg-amber-50 px-5 py-3 text-sm text-slate-600">
            如果 3D 小镇暂时无法加载，你仍然可以通过下面的模块卡片浏览内容。
          </div>
        </Link>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Modules
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                六个主题小屋
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              每个小屋都对应一类公开内容。3D 是空间化入口，普通卡片仍然可以直接访问 Markdown 页面。
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {worldModules.map((module) => (
              <Link
                key={module.id}
                to={module.route}
                className="rounded-lg border border-slate-200 bg-[#fbfaf8] p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"
              >
                <div
                  className="mb-5 h-12 w-12 rounded-md border border-slate-200"
                  style={{ background: module.color }}
                />
                <h3 className="text-xl font-semibold text-slate-950">{module.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <ContentPanel title="最新文章" items={latestNotes} />
        <ContentPanel title="精选笔记" items={featuredNotes} />
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            About
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">关于我</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            这里会逐步填充个人介绍、项目经历和长期写作计划。主页、文章、归档和搜索公开可读；留言、点赞、收藏、写作和后台管理再进入登录验证。
          </p>
        </div>
      </section>
    </div>
  )
}

function ContentPanel({
  title,
  items,
}: {
  title: string
  items: ReturnType<typeof getAllNotes>
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.map((note) => (
          <Link
            key={note.slug}
            to={`/notes/${note.slug}`}
            className="block rounded-md border border-slate-200 bg-[#fbfaf8] p-4 transition-colors hover:border-blue-200 hover:bg-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {note.module}
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-950">{note.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{note.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
