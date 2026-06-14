import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { articlesApi } from '../api/articles'
import BlogCard from '../components/BlogCard'
import { articleToNoteDoc } from '../lib/blogUtils'
import type { Article } from '../types'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore()
  const [myArticles, setMyArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [searchParams] = useState(() => new URLSearchParams(window.location.search))

  useEffect(() => {
    if (!isAuthenticated && !isLoading) fetchMe()
  }, [fetchMe, isAuthenticated, isLoading])

  // 加载我的文章
  useEffect(() => {
    if (!isAuthenticated || !user) return
    setArticlesLoading(true)
    articlesApi.myArticles()
      .then((data) => setMyArticles(data.articles ?? []))
      .catch(() => setMyArticles([]))
      .finally(() => setArticlesLoading(false))
  }, [isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-blue-100 border-t-blue-900" />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Sign in required</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">需要登录</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            公开文章可以直接阅读；查看个人资料、留言和创作内容时需要登录。
          </p>
          <Link to="/login" className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.display_name || user.username
  const verified = searchParams.get('verified') === '1'
  const totalLikes = myArticles.reduce((sum, a) => sum + a.like_count, 0)

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这篇文章吗？')) return
    try {
      await articlesApi.delete(id)
      setMyArticles((prev) => prev.filter((a) => a.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
        {verified && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✅ 邮箱验证成功！
          </div>
        )}

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="bg-blue-950 px-6 py-10 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-blue-950">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-200">@{user.username}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal">{displayName}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  {user.bio || '这里会展示你的个人简介。'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Profile</h2>
              <dl className="mt-6 space-y-5">
                <InfoRow label="邮箱" value={user.email || '未设置'} />
                <InfoRow label="角色" value={user.role === 'admin' ? '管理员' : '用户'} />
                <InfoRow label="邮箱验证" value={user.email_verified_at ? '已验证' : '待验证'} />
              </dl>
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Account</h2>
              <dl className="mt-6 space-y-5">
                <InfoRow label="注册时间" value={formatDate(user.created_at)} />
                <InfoRow label="最后更新" value={formatDate(user.updated_at)} />
                <InfoRow label="文章数" value={String(myArticles.length)} />
              </dl>
            </div>
          </div>
        </section>

        {/* 统计 + 我的文章 */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xl font-bold text-[var(--text-main)]">📝 我的文章</h2>
            {user.role === 'admin' && (
              <Link to="/editor" className="rounded-full bg-[var(--green-main)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--green-deep)]">
                + 写文章
              </Link>
            )}
          </div>

          <div className="mb-4 flex gap-6 text-sm text-slate-500">
            <span>📄 {myArticles.length} 篇</span>
            <span>❤️ {totalLikes} 获赞</span>
          </div>

          {articlesLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="warm-card h-[200px] animate-pulse bg-white/70" />
              ))}
            </div>
          ) : myArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {myArticles.map((a) => (
                <div key={a.id} className="relative">
                  <BlogCard note={articleToNoteDoc(a)} />
                  <div className="absolute right-3 top-3 flex gap-1">
                    <Link
                      to={`/editor?edit=${a.id}`}
                      className="rounded-full bg-white/90 px-2 py-1 text-xs text-slate-500 shadow-sm hover:text-[var(--green-main)]"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded-full bg-white/90 px-2 py-1 text-xs text-red-400 shadow-sm hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="warm-card py-12 text-center">
              <p className="text-sm text-slate-400">还没有文章，去写第一篇吧 ✍️</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-950">{value}</dd>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
