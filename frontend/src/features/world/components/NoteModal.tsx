import { mockNews } from '../data/mockNews'
import { getNote } from '../../../content/notes/noteRegistry'
import { renderMarkdown } from '../../../content/notes/markdown'

export default function NoteModal({
  noteSlug,
  showNews,
  onClose,
}: {
  noteSlug: string | null
  showNews: boolean
  onClose: () => void
}) {
  const note = getNote(noteSlug ?? undefined)
  const isOpen = showNews || Boolean(note)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-200/70 bg-slate-950/92 text-amber-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-amber-200/20 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              XLab Archive
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              {showNews ? '村口新闻板' : note?.title}
            </h2>
            {note?.summary && (
              <p className="mt-2 text-sm leading-6 text-amber-100/80">{note.summary}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amber-200/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-white/10"
          >
            关闭
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto px-6 py-6">
          {showNews ? (
            <div className="space-y-4">
              {mockNews.map((item) => (
                <article key={item.id} className="rounded-2xl border border-amber-200/15 bg-white/7 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-amber-50">{item.title}</h3>
                    <span className="text-xs text-amber-200/75">{item.source}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-amber-100/80">{item.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-5 text-sm leading-7 text-amber-50/90">
              {note ? renderMarkdown(note.body) : <p>内容暂未找到。</p>}
            </div>
          )}
        </div>

        <div className="border-t border-amber-200/20 px-6 py-4 text-xs text-amber-100/70">
          Esc 或点击空白处关闭
        </div>
      </div>
    </div>
  )
}
