// ===========================================================================
// 首页 — src/pages/HomePage.tsx
// 
// Phase 1：展示欢迎信息 + 登录/未登录不同状态
// 后续 Phase 2 将替换为信息流（最新帖子、热门内容等）
// ===========================================================================

import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
      {/* ---- Hero 区域 ---- */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          欢迎来到{' '}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            XLab
          </span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          一个可长期演进的内容社区平台 — 博客、讨论、信息流聚合与用户仪表盘
        </p>
      </div>

      {/* ---- 登录状态卡片 ---- */}
      {!isLoading && (
        <div className="max-w-md mx-auto">
          {isAuthenticated && user ? (
            /* 已登录：欢迎卡片 */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                你好，{user.display_name || user.username}！
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                欢迎回到 XLab
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  className="block w-full py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                >
                  查看个人资料
                </Link>
                <Link
                  to="/"
                  className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  浏览内容（即将推出）
                </Link>
              </div>
            </div>
          ) : (
            /* 未登录：行动号召卡片 */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-500 text-2xl mx-auto mb-4">
                👋
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                加入 XLab
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                注册账号，开始探索内容社区
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/register"
                  className="block w-full py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                >
                  立即注册
                </Link>
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  已有账号？登录
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- 功能预告 ---- */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {[
          { icon: '📝', title: '博客与帖子', desc: 'Markdown 在线编辑，草稿与发布管理' },
          { icon: '💬', title: '评论与标注', desc: '底部讨论 + 行级标注，深度交流' },
          { icon: '📊', title: '数据仪表盘', desc: '阅读量、互动统计，一目了然' },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
