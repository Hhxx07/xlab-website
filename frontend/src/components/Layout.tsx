// ===========================================================================
// 页面布局组件 — src/components/Layout.tsx
// 
// 所有页面的外层容器：导航栏 + 主内容区 + 页脚
// 使用 React Router 的 <Outlet /> 渲染子路由页面
// ===========================================================================

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区 — 自动伸缩填充剩余空间 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 页脚 — 简洁版 */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} XLab — 内容社区平台</p>
          <p className="mt-1 text-xs text-gray-400">
            Built with React + Go + PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  )
}
