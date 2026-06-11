import BlogCard from '../../components/BlogCard'
import { getNotesBySection } from '../../lib/blogUtils'

export default function StudyPage() {
  const notes = getNotesBySection('study')

  return (
    <ArticleGridPage
      eyebrow="Study"
      title="学习"
      description="课程笔记、数学、物理、计算机与工程实践。"
      emptyText="暂无学习笔记"
      notes={notes}
    />
  )
}

export function ArticleGridPage({
  eyebrow,
  title,
  description,
  emptyText,
  notes,
}: {
  eyebrow: string
  title: string
  description: string
  emptyText: string
  notes: Parameters<typeof BlogCard>[0]['note'][]
}) {
  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        {notes.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <BlogCard key={note.slug} note={note} />
            ))}
          </div>
        ) : (
          <div className="warm-card py-16 text-center">
            <p className="text-sm font-medium text-[var(--text-soft)]">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
