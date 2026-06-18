import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import MilkdownMarkdown from '../../components/MilkdownMarkdown'
import { articlesApi } from '../../api/articles'
import { MODULE_BADGE_COLORS, MODULE_LABELS } from '../../lib/blogUtils'
import { useAuthStore } from '../../store/authStore'
import CommentSection from '../../components/CommentSection'
import type { Article } from '../../types'

export default function ArticleDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const slug = params['*'] || ''

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    articlesApi.getBySlug(slug)
      .then((data) => {
        if (!alive) return
        const a = data.article
        setArticle(a)
        setLiked(a.liked_by_me ?? false)
        setLikeCount(a.like_count)
      })
      .catch(() => { if (alive) setNotFound(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [slug])

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      const data = await articlesApi.toggleLike(slug)
      setLiked(data.liked)
      setLikeCount(data.like_count)
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--green-main)]" />
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-800">笔记未找到</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Not Found
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

  const tagName = article.tags?.[0]?.name ?? ''
  // Map tag name back to module key for existing color system
  const tagToModule: Record<string, string> = { '知识': 'knowledge', '游戏': 'game', '小说': 'novel', '电影': 'movie', '生活': 'life', '运动': 'sport' }
  const module = tagToModule[tagName] || 'knowledge'
  const badgeColor = MODULE_BADGE_COLORS[module] ?? 'bg-slate-50 text-slate-600'
  const label = MODULE_LABELS[module] ?? tagName
  const canEdit = isAuthenticated && (user?.role === 'admin' || user?.id === article.user_id)

  return (
    <article>
      {article.cover && (
        <div className="h-48 overflow-hidden sm:h-64 lg:h-80">
          <img src={article.cover} alt={article.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-warm-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>

        <span className={`mt-6 inline-block relative -top-1 -right-3 rounded-full px-3 py-1 text-xs font-medium ${badgeColor}`}>
          {label}
        </span>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {article.title}
        </h1>

        {article.summary && (
          <p className="mt-3 text-lg leading-relaxed text-slate-500">{article.summary}</p>
        )}

        {/* 作者 + 统计 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
          {article.author_name && <span>作者：{article.author_name}</span>}
          <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
          <span>{article.word_count} 字</span>
          <span>👁 {article.view_count}</span>
        </div>

        {/* 点赞按钮 */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
              liked
                ? 'bg-red-50 text-red-500 shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-400'
            }`}
          >
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>
          {canEdit && (
            <Link
              to={`/editor?edit=${article.id}`}
              className="inline-flex items-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-[var(--green-soft)] hover:text-[var(--green-main)]"
            >
              编辑
            </Link>
          )}
        </div>

        <hr className="my-8 border-slate-200" />

        <div className="article-prose text-slate-700">
          <MilkdownMarkdown markdown={article.body} />
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-warm-100 px-5 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-200"
          >
            ← 返回首页
          </Link>
        </div>

        {/* 评论区 */}
        <div className="mt-12">
          <CommentSection articleSlug={slug} />
        </div>
      </div>
    </article>
  )
}
