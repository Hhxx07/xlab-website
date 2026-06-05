// ===========================================================================
// 个人资料页面 — src/pages/ProfilePage.tsx
// 
// 显示当前登录用户的个人资料信息
// 未登录时提示跳转登录
// ===========================================================================

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore()
  const navigate = useNavigate()

  // 页面挂载时确保用户信息是最新的
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // 尝试恢复 session（用户可能刷新页面）
      fetchMe()
    }
  }, [fetchMe, isAuthenticated, isLoading])

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          {/* 简易 loading spinner */}
          <div className="inline-block w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            需要登录
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            请先登录后查看个人资料
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  // 已登录 — 展示用户资料
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* 头像区 */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-md">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user.display_name || user.username}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          @{user.username}
        </p>
      </div>

      {/* 资料卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {/* 基本信息 */}
        <div className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            基本信息
          </h2>

          {/* 用户名 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">用户名</span>
            <span className="text-sm text-gray-900 font-medium">
              {user.username}
            </span>
          </div>

          {/* 邮箱 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">邮箱</span>
            <span className="text-sm text-gray-900">
              {user.email || '未设置'}
            </span>
          </div>

          {/* 角色 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">角色</span>
            <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
              {user.role === 'admin' ? '管理员' : '用户'}
            </span>
          </div>

          {/* 邮箱验证状态 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">邮箱验证</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user.email_verified_at
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}>
              {user.email_verified_at ? '已验证' : '待验证'}
            </span>
          </div>

          {/* 个人简介 */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500">简介</span>
            <span className="text-sm text-gray-700 text-right max-w-xs">
              {user.bio || '这个人很懒，什么都没写...'}
            </span>
          </div>
        </div>

        {/* 账号信息 */}
        <div className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            账号信息
          </h2>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">注册时间</span>
            <span className="text-sm text-gray-900">
              {new Date(user.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">最后更新</span>
            <span className="text-sm text-gray-900">
              {new Date(user.updated_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 功能预告 */}
      <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-lg">
        <p className="text-sm text-brand-700 text-center">
          📊 个人仪表盘、发帖记录、互动统计等功能即将上线
        </p>
      </div>
    </div>
  )
}
