import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchMe()
    }
  }, [fetchMe, isAuthenticated, isLoading])

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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Sign in required
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">
            需要登录
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            公开文章可以直接阅读；查看个人资料、留言和创作内容时需要登录。
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.display_name || user.username

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="bg-blue-950 px-6 py-10 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-blue-950">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-200">@{user.username}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                  {displayName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  {user.bio || '这里会展示你的个人简介、公开主页信息和后续创作入口。'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Profile
              </h2>
              <dl className="mt-6 space-y-5">
                <InfoRow label="邮箱" value={user.email || '未设置'} />
                <InfoRow label="角色" value={user.role === 'admin' ? '管理员' : '用户'} />
                <InfoRow
                  label="邮箱验证"
                  value={user.email_verified_at ? '已验证' : '待验证'}
                />
              </dl>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Account
              </h2>
              <dl className="mt-6 space-y-5">
                <InfoRow label="注册时间" value={formatDate(user.created_at)} />
                <InfoRow label="最后更新" value={formatDate(user.updated_at)} />
                <InfoRow label="内容权限" value="按登录用户权限开放" />
              </dl>
            </div>
          </div>
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
