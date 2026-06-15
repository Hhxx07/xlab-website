import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { articlesApi } from '../api/articles'
import { userApi } from '../api/client'
import BlogCard from '../components/BlogCard'
import { articleToNoteDoc } from '../lib/blogUtils'
import type { Article } from '../types'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore()
  const [myArticles, setMyArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [searchParams] = useState(() => new URLSearchParams(window.location.search))
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const [bioError, setBioError] = useState('')

  useEffect(() => {
    if (!isAuthenticated && !isLoading) fetchMe()
  }, [fetchMe, isAuthenticated, isLoading])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    setBioDraft(user.bio ?? '')
    setArticlesLoading(true)
    articlesApi.myArticles()
      .then((data) => setMyArticles(data.articles ?? []))
      .catch(() => setMyArticles([]))
      .finally(() => setArticlesLoading(false))
  }, [isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg-page)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--green-soft)] border-t-[var(--green-main)]" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg-page)] px-5">
        <div className="warm-card max-w-md p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">Sign in required</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">需要登录</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            查看个人资料、文章数据和创作内容时需要先登录。
          </p>
          <Link to="/login" className="mt-6 inline-flex rounded-full bg-[var(--green-main)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--green-deep)]">
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.display_name || user.username
  const verified = searchParams.get('verified') === '1'
  const totalLikes = myArticles.reduce((sum, a) => sum + a.like_count, 0)
  const totalViews = myArticles.reduce((sum, a) => sum + a.view_count, 0)
  const publishedCount = myArticles.filter((a) => a.published).length

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这篇文章吗？')) return
    try {
      await articlesApi.delete(id)
      setMyArticles((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // Keep the current list if deletion fails.
    }
  }

  const handleSaveBio = async () => {
    setBioSaving(true)
    setBioError('')
    try {
      const res = await userApi.updateMe({ bio: bioDraft.trim() })
      useAuthStore.setState({ user: res.user })
      setIsEditingBio(false)
    } catch {
      setBioError('保存失败，请稍后再试。')
    } finally {
      setBioSaving(false)
    }
  }

  return (
    <div className="bg-[var(--bg-page)] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {verified && (
          <div className="mb-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--green-soft)] px-5 py-3 text-sm font-bold text-[var(--green-deep)]">
            邮箱验证成功。
          </div>
        )}

        <section className="relative overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fffdf8_0%,#eef6ea_48%,#f4e2c8_100%)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <button
            type="button"
            onClick={() => {
              setBioDraft(user.bio ?? '')
              setBioError('')
              setIsEditingBio((value) => !value)
            }}
            className="absolute right-5 top-5 rounded-full bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--brown-main)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:right-8 sm:top-8"
          >
            Profile
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[28px] bg-white/78 text-4xl font-black text-[var(--green-main)] shadow-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--brown-main)]">@{user.username}</p>
                <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
                  {displayName}
                </h1>
                {isEditingBio ? (
                  <div className="mt-4 max-w-2xl">
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-white/82 px-4 py-3 text-sm leading-7 text-[var(--text-main)] outline-none transition focus:border-[var(--green-main)] focus:shadow-[0_0_0_4px_rgba(79,111,82,0.12)]"
                      placeholder="写一句个性签名，介绍此刻的你。"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                        className="rounded-full bg-[var(--green-main)] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.20)] transition hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {bioSaving ? '保存中...' : '保存签名'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBioDraft(user.bio ?? '')
                          setBioError('')
                          setIsEditingBio(false)
                        }}
                        className="rounded-full bg-white/78 px-5 py-2 text-sm font-bold text-[var(--text-muted)] transition hover:bg-white hover:text-[var(--text-main)]"
                      >
                        取消
                      </button>
                      <span className="text-xs font-medium text-[var(--text-soft)]">{bioDraft.length}/500</span>
                    </div>
                    {bioError && <p className="mt-2 text-sm font-semibold text-red-500">{bioError}</p>}
                  </div>
                ) : (
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                    {user.bio || '这里会展示你的个人简介。'}
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/editor"
              className="inline-flex w-fit rounded-full bg-[var(--green-main)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(79,111,82,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
            >
              写文章
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="文章" value={String(myArticles.length)} />
          <StatCard label="已发布" value={String(publishedCount)} />
          <StatCard label="获赞" value={String(totalLikes)} />
          <StatCard label="浏览" value={String(totalViews)} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <InfoPanel title="Profile">
            <InfoRow label="邮箱" value={user.email || '未设置'} />
            <InfoRow label="角色" value={user.role === 'admin' ? '管理员' : '用户'} />
            <InfoRow label="邮箱验证" value={user.email_verified_at ? '已验证' : '待验证'} />
          </InfoPanel>
          <InfoPanel title="Account">
            <InfoRow label="注册时间" value={formatDate(user.created_at)} />
            <InfoRow label="最后更新" value={formatDate(user.updated_at)} />
            <InfoRow label="用户名" value={user.username} />
          </InfoPanel>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">My Notes</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">我的文章</h2>
            </div>
            <Link to="/editor" className="w-fit text-sm font-bold text-[var(--green-main)] hover:text-[var(--green-deep)]">
              新建文章 →
            </Link>
          </div>

          {articlesLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="warm-card h-[240px] animate-pulse bg-white/70" />
              ))}
            </div>
          ) : myArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {myArticles.map((a) => (
                <div key={a.id} className="relative">
                  <BlogCard note={articleToNoteDoc(a)} />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <Link
                      to={`/editor?edit=${a.id}`}
                      className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] shadow-sm transition hover:text-[var(--green-main)]"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold text-red-400 shadow-sm transition hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="warm-card py-14 text-center">
              <p className="text-sm font-semibold text-[var(--text-muted)]">还没有文章，去写第一篇吧。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="warm-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--text-main)]">{value}</p>
    </div>
  )
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="warm-card p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">{title}</h2>
      <dl className="mt-5 space-y-4">{children}</dl>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-sm font-medium text-[var(--text-muted)]">{label}</dt>
      <dd className="text-right text-sm font-bold text-[var(--text-main)]">{value}</dd>
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
