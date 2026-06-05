// ===========================================================================
// 导航栏组件 — src/components/Navbar.tsx
// 
// 顶部响应式导航栏：
//   - 左侧：Logo + 品牌名
//   - 右侧：首页链接 + 登录/注册 或 用户下拉菜单
// ===========================================================================

import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ---- 左侧：Logo ---- */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Logo 图标 */}
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                X
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                XLab
              </span>
            </Link>
          </div>

          {/* ---- 右侧：导航链接 ---- */}
          <div className="flex items-center gap-4">
            {/* 首页 */}
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
            >
              首页
            </Link>

            {/* 未登录：显示登录/注册按钮 */}
            {!isLoading && !isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                  注册
                </Link>
              </>
            )}

            {/* 已登录：用户菜单 */}
            {!isLoading && isAuthenticated && user && (
              <div className="flex items-center gap-3">
                {/* 用户资料链接 */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors"
                >
                  {/* 头像占位 */}
                  <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.display_name || user.username}</span>
                </Link>
                {/* 登出按钮 */}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
