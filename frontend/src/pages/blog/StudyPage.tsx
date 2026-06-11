import { getNotesBySection } from '../../lib/blogUtils'
import BlogCard from '../../components/BlogCard'

// ===========================================================================
// 学习文章页 — knowledge 模块
// ===========================================================================

export default function StudyPage() {
  const notes = getNotesBySection('study')

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      {/* ---- 页头 ---- */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">学习</h1>
        <p className="mt-1 text-sm text-slate-500">知识整理与笔记</p>
      </div>

      {/* ---- 卡片网格 ---- */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <BlogCard key={note.slug} note={note} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400">暂无学习笔记</p>
        </div>
      )}
    </div>
  )
}
