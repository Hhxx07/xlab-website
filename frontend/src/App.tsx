// ===========================================================================
// 应用根组件 — src/App.tsx
// 
// 职责：
//   1. 路由配置（React Router v7）
//   2. 应用初始化（恢复 session）
// ===========================================================================

import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// 布局
import Layout from './components/Layout'

// 页面
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  // 应用启动时尝试恢复登录状态
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    // 页面加载/刷新时，通过 session cookie 自动恢复登录状态
    fetchMe()
  }, [fetchMe])

  return (
    <Routes>
      {/* Layout 作为父路由，所有子页面共享导航栏 + 页脚 */}
      <Route element={<Layout />}>
        {/* 首页 */}
        <Route path="/" element={<HomePage />} />

        {/* 认证 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 用户 — 个人资料（需登录） */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* 404 — 兜底路由 */}
        <Route path="*" element={
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                页面未找到
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                你访问的页面不存在，或者已被移动
              </p>
              <a
                href="/"
                className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
              >
                返回首页
              </a>
            </div>
          </div>
        } />
      </Route>
    </Routes>
  )
}