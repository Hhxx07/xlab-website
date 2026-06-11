import { Link, useParams, useNavigate } from 'react-router-dom'
import { getNote } from '../../content/notes/noteRegistry'
import { renderMarkdown } from '../../content/notes/markdown'
import { MODULE_BADGE_COLORS, MODULE_LABELS } from '../../lib/blogUtils'

// ===========================================================================
// 文章详情页 — 完整 Markdown 阅读视图
// ===========================================================================

export default function ArticleDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const note = getNote(params['*'])

  if (!note) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-800">笔记未找到</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            这篇文章还没有创建，或链接已失效。
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex rounded-full bg-warm-100 px-5 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-200"
          >
            ← 返回
          </button>
        </div>
      </div>
    )
  }

  const badgeColor = MODULE_BADGE_COLORS[note.module] ?? 'bg-slate-50 text-slate-600'
  const label = MODULE_LABELS[note.module] ?? note.module

  return (
    <article>
      {/* ---- 封面图 Banner ---- */}
      {note.cover && (
        <div className="h-48 overflow-hidden sm:h-64 lg:h-80">
          <img
            src={note.cover}
            alt={note.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* ---- 正文 ---- */}
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        {/* 返回链接 */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-warm-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>

        {/* 模块徽章 */}
        <span className={`mt-6 inline-block rounded-full px-3 py-1 text-xs font-medium ${badgeColor}`}>
          {label}
        </span>

        {/* 标题 */}
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {note.title}
        </h1>

        {/* 摘要 */}
        {note.summary && (
          <p className="mt-3 text-lg leading-relaxed text-slate-500">
            {note.summary}
          </p>
        )}

        {/* 分割线 */}
        <hr className="my-8 border-slate-200" />

        {/* Markdown 渲染内容 */}
        <div className="space-y-6 text-slate-700">
          {renderMarkdown(note.body)}
        </div>

        {/* 底部返回 */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-warm-100 px-5 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-200"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </article>
  )
}
