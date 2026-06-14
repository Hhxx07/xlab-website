import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/articles'
import type { Article, AdminUser } from '../types'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'articles' | 'users'>('articles')
  const [stats, setStats] = useState({ users: 0, articles: 0, comments: 0 })
  const [articles, setArticles] = useState<Article[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/')
    }
  }, [isLoading, isAuthenticated, user, navigate])

  useEffect(() => {
    adminApi.stats().then((d) => setStats(d.stats)).catch(() => {})
    fetchArticles()
  }, [])

  const fetchArticles = () => {
    setLoading(true)
    adminApi.articles({ limit: '50' })
      .then((d) => setArticles(d.articles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchUsers = () => {
    setLoading(true)
    adminApi.users({ limit: '50' })
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--green-main)]" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') return null

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
            🛡 后台
          </h1>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: '用户', value: stats.users },
            { label: '文章', value: stats.articles },
            { label: '评论', value: stats.comments },
          ].map((s) => (
            <div key={s.label} className="warm-card p-5 text-center">
              <p className="text-3xl font-black text-[var(--green-main)]">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex gap-2">
          {([
            ['articles', '📋 文章'],
            ['users', '👥 用户'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); key === 'articles' ? fetchArticles() : fetchUsers() }}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-[var(--green-main)] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="warm-card py-16 text-center text-sm text-slate-400">加载中...</div>
        ) : tab === 'articles' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-left text-xs uppercase text-slate-400">
                  <th className="pb-3 font-medium">标题</th>
                  <th className="pb-3 font-medium">作者</th>
                  <th className="pb-3 font-medium">标签</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium">浏览/点赞</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border-soft)]">
                    <td className="py-3 pr-4">
                      <a href={`/post/${a.slug}`} target="_blank" rel="noreferrer" className="font-medium text-[var(--text-main)] hover:text-[var(--green-main)]">
                        {a.title}
                      </a>
                    </td>
                    <td className="py-3 text-slate-500">{a.author_name || '-'}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {a.tags?.map((t) => (
                          <span key={t.id} className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-xs text-[var(--green-main)]">{t.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      👁 {a.view_count} · ❤️ {a.like_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-left text-xs uppercase text-slate-400">
                  <th className="pb-3 font-medium">用户名</th>
                  <th className="pb-3 font-medium">邮箱</th>
                  <th className="pb-3 font-medium">角色</th>
                  <th className="pb-3 font-medium">文章数</th>
                  <th className="pb-3 font-medium">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border-soft)]">
                    <td className="py-3 font-medium text-[var(--text-main)]">{u.username}</td>
                    <td className="py-3 text-slate-500">{u.email || '-'}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{u.article_count}</td>
                    <td className="py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
