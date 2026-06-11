import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

// ===========================================================================
// 博客整体布局：左侧固定侧边栏 + 右侧滚动主内容区
// ===========================================================================

export default function BlogLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ---- 桌面端固定侧边栏 ---- */}
      <div className="hidden lg:flex lg:w-[260px] lg:flex-shrink-0 lg:flex-col">
        <div className="fixed inset-y-0 left-0 flex w-[260px] flex-col border-r border-slate-200/60 bg-warm-100">
          <Sidebar />
        </div>
      </div>

      {/* ---- 移动端滑出抽屉 ---- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          {/* 侧边栏 */}
          <div className="absolute inset-y-0 left-0 w-[260px] animate-[slideIn_200ms_ease-out] bg-warm-100 shadow-2xl">
            <Sidebar onNavClick={closeSidebar} />
          </div>
        </div>
      )}

      {/* ---- 移动端汉堡按钮 ---- */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg lg:hidden"
        aria-label="打开菜单"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      {/* ---- 主内容区 ---- */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
