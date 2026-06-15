import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function BlogLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <div className="hidden lg:flex lg:w-[264px] lg:flex-shrink-0 lg:flex-col">
        <div className="fixed inset-y-0 left-0 flex w-[264px] flex-col p-4">
          <Sidebar />
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-[slideIn_200ms_ease-out] p-4">
            <Sidebar onNavClick={closeSidebar} />
          </div>
        </div>
      )}

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg lg:hidden"
        aria-label="打开菜单"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      <main className="flex-1 overflow-y-auto">
        <div key={location.pathname + location.search} className="page-transition min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
