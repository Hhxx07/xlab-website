import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BlogCard from '../../components/BlogCard'
import { articlesApi } from '../../api/articles'
import { articleToNoteDoc } from '../../lib/blogUtils'
import type { Article } from '../../types'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const activeQuery = useMemo(() => initialQuery.trim(), [initialQuery])

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    let alive = true
    if (!activeQuery) {
      setArticles([])
      setTotal(0)
      return () => {
        alive = false
      }
    }

    setLoading(true)
    articlesApi.list({ search: activeQuery, limit: '30' })
      .then((data) => {
        if (!alive) return
        setArticles(data.articles ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        if (!alive) return
        setArticles([])
        setTotal(0)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [activeQuery])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = query.trim()
    if (next) setParams({ q: next })
  }

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Search
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            全站文章搜索
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            搜索文章标题、摘要和正文内容。
          </p>
        </div>

        <form onSubmit={submit} className="warm-card mb-8 flex flex-col gap-3 p-4 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词"
            className="min-h-12 flex-1 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 text-sm font-medium text-[var(--text-main)] outline-none transition focus:border-[var(--green-main)]"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-[var(--green-main)] px-6 text-sm font-bold text-white transition hover:bg-[var(--green-deep)]"
          >
            搜索
          </button>
        </form>

        {activeQuery && (
          <p className="mb-5 text-sm font-medium text-[var(--text-muted)]">
            “{activeQuery}” 找到 {total} 篇文章
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="warm-card h-[248px] animate-pulse bg-white/70" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.id} note={articleToNoteDoc(article)} />
            ))}
          </div>
        ) : (
          <div className="warm-card p-8 text-center">
            <p className="text-base font-bold text-[var(--text-main)]">
              {activeQuery ? '没有找到匹配文章' : '输入关键词开始搜索'}
            </p>
            <Link to="/" className="mt-4 inline-flex text-sm font-bold text-[var(--green-main)]">
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
