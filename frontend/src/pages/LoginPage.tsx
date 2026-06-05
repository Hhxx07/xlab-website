// ===========================================================================
// 登录页面 — src/pages/LoginPage.tsx
// 
// 邮箱 + 密码登录表单
// 登录成功后跳转到首页
// ===========================================================================

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ApiRequestError } from '../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()

  // 表单状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // 基础前端校验
    if (!email.trim() || !password) {
      setError('请填写邮箱和密码')
      return
    }

    try {
      await login(email, password)
      // 登录成功 → 跳转首页
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
      } else {
        setError('登录失败，请稍后重试')
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">登录 XLab</h1>
          <p className="text-sm text-gray-500 mt-1">
            欢迎回来，继续探索内容社区
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-5 text-center text-sm">
            <span className="text-gray-500">还没有账号？</span>{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              立即注册
            </Link>
          </div>
        </div>

        {/* GitHub OAuth 占位 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            GitHub 登录将在后续版本中实现
          </p>
        </div>
      </div>
    </div>
  )
}
