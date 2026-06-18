import { Link } from 'react-router-dom'
import type { NoteDocument } from '../content/notes/noteRegistry'
import { MODULE_ACCENT_COLORS, MODULE_BADGE_COLORS, MODULE_LABELS } from '../lib/blogUtils'

interface BlogCardProps {
  note: NoteDocument
  meta?: string
}
export default function BlogCard({ note, meta = 'Notes' }: BlogCardProps) {
  const badgeColor = MODULE_BADGE_COLORS[note.module] ?? 'bg-slate-100 text-slate-600'
  const label = MODULE_LABELS[note.module] ?? note.module
  const accent = MODULE_ACCENT_COLORS[note.module] ?? '#9ca3af'

  return (
    <Link
      to={`/post/${note.slug}`}
      className="warm-card warm-card-hover group relative block min-h-[248px] overflow-hidden p-6"
    >
      <span
        className="absolute right-6 top-0 h-14 w-7 rounded-b-full opacity-80"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badgeColor}`}>
          {label}
        </span>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>

      <h3 className="mt-6 text-xl font-extrabold leading-snug tracking-[-0.02em] text-[var(--text-main)] transition-colors group-hover:text-[var(--green-deep)]">
        {note.title}
      </h3>
      <p className="mt-4 line-clamp-2 text-sm leading-7 text-[var(--text-muted)]">
        {note.summary || '这里会记录一段学习、工程、阅读或生活里的片段。'}
      </p>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--border-soft)] pt-4 text-xs font-medium text-[var(--text-soft)]">
        <span>{meta}</span>
        <span>阅读 →</span>
      </div>
    </Link>
  )
}

