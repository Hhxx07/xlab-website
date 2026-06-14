import { useEffect, useState } from 'react'
import BlogCard from '../../components/BlogCard'
import { articlesApi } from '../../api/articles'
import { articleToNoteDoc } from '../../lib/blogUtils'
import type { Article } from '../../types'

export default function StudyPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    articlesApi.list({ section: 'study', limit: '20' })
      .then((data) => { if (alive) setArticles(data.articles ?? []) })
      .catch(() => { if (alive) setArticles([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <ArticleGridPage
      eyebrow="Study"
      title="学习"
      description="课程笔记、数学、物理、计算机与工程实践。"
      emptyText="暂无学习笔记"
      articles={articles}
      loading={loading}
    />
  )
}

export function ArticleGridPage({
  eyebrow,
  title,
  description,
  emptyText,
  articles,
  loading,
}: {
  eyebrow: string
  title: string
  description: string
  emptyText: string
  articles: Article[]
  loading: boolean
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

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="warm-card h-[248px] animate-pulse bg-white/70" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((a) => (
              <BlogCard key={a.slug} note={articleToNoteDoc(a)} />
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
