import { getNotesBySection } from '../../lib/blogUtils'
import BlogCard from '../../components/BlogCard'

// ===========================================================================
// 热门文章页
// ===========================================================================

export default function HotPage() {
  const notes = getNotesBySection('hot')

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      {/* ---- 页头 ---- */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">
          <span className="mr-2">🔥</span>热门文章
        </h1>
        <p className="mt-1 text-sm text-slate-500">大家都在看</p>
      </div>

      {/* ---- 热门榜单 Top 3 ---- */}
      {notes.length > 0 && (
        <div className="mb-10 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            当前热点
          </h2>
          <ol className="space-y-3">
            {notes.slice(0, 5).map((note, i) => (
              <li key={note.slug} className="flex items-center gap-4">
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? 'bg-red-100 text-red-600'
                      : i === 1
                        ? 'bg-orange-100 text-orange-600'
                        : i === 2
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={`/post/${note.slug}`}
                    className="text-sm font-medium text-slate-800 transition-colors hover:text-warm-600 line-clamp-1"
                  >
                    {note.title}
                  </a>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">{note.module}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ---- 卡片网格 ---- */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <BlogCard key={note.slug} note={note} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400">暂无热门文章</p>
        </div>
      )}
    </div>
  )
}
