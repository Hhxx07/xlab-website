import { Link } from 'react-router-dom'
import type { NoteDocument } from '../content/notes/noteRegistry'
import { MODULE_BADGE_COLORS, MODULE_LABELS, PLACEHOLDER_GRADIENTS } from '../lib/blogUtils'

// ===========================================================================
// 文章预览卡片组件
// ===========================================================================

interface BlogCardProps {
  note: NoteDocument
}

export default function BlogCard({ note }: BlogCardProps) {
  const badgeColor = MODULE_BADGE_COLORS[note.module] ?? 'bg-slate-50 text-slate-600'
  const label = MODULE_LABELS[note.module] ?? note.module
  const gradient = PLACEHOLDER_GRADIENTS[note.module] ?? 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'

  return (
    <Link
      to={`/post/${note.slug}`}
      className="group block overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* ---- 封面区域 ---- */}
      <div className="relative h-40 overflow-hidden">
        {note.cover ? (
          <img
            src={note.cover}
            alt={note.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: gradient }}
          />
        )}
        {/* 模块徽章 */}
        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
        >
          {label}
        </span>
      </div>

      {/* ---- 内容区 ---- */}
      <div className="p-4">
        <h3 className="text-base font-semibold leading-snug text-slate-800 line-clamp-2 group-hover:text-warm-600 transition-colors">
          {note.title}
        </h3>
        {note.summary && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
            {note.summary}
          </p>
        )}
      </div>
    </Link>
  )
}
