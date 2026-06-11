import { Link } from 'react-router-dom'
import { getAllNotes } from '../../content/notes/noteRegistry'
import BlogCard from '../../components/BlogCard'

// ===========================================================================
// Blog 首页 — 全景 Hero + 最新文章
// ===========================================================================

export default function BlogHomePage() {
  const latestNotes = getAllNotes().slice(0, 6)

  return (
    <div>
      {/* ---- Hero 首屏 ---- */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        {/* 背景图：养神小狗 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/养神小狗.png')" }}
        />
        {/* 暗色渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />

        {/* 前景文字 */}
        <div className="relative z-10 px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            一隅
          </h1>
          <p className="mt-4 text-lg text-white/80 sm:text-xl">
            生活的片段在这里相聚
          </p>
        </div>
      </section>

      {/* ---- 最新文章 ---- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">最新文章</h2>
            <p className="mt-1 text-sm text-slate-500">最近更新的内容</p>
          </div>
          <Link
            to="/hot"
            className="text-sm font-medium text-warm-600 transition-colors hover:text-warm-700"
          >
            查看全部 →
          </Link>
        </div>

        {latestNotes.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestNotes.map((note) => (
              <BlogCard key={note.slug} note={note} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-400">还没有文章，敬请期待</p>
          </div>
        )}
      </section>
    </div>
  )
}
