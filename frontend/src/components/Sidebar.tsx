import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// ===========================================================================
// 侧边栏导航配置
// ===========================================================================

const NAV_ITEMS = [
  { label: '主页', path: '/', icon: HomeIcon },
  { label: '热门', path: '/hot', icon: HotIcon },
  { label: '学习', path: '/study', icon: StudyIcon },
  { label: '有趣', path: '/fun', icon: FunIcon },
  { label: '生活', path: '/life', icon: LifeIcon },
] as const

// ===========================================================================
// 简易 SVG 图标（线框风格，与参考网站一致）
// ===========================================================================

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function HotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-2 4-5 7-5 12a5 5 0 0 0 10 0c0-5-3-8-5-12z" />
      <path d="M12 11c-1 2-2 4-2 6a2 2 0 0 0 4 0c0-2-1-4-2-6z" opacity="0.5" />
    </svg>
  )
}

function StudyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  )
}

function FunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M8 12h2M14 12h2M12 10v4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LifeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.5C4.5 6 3 9 3 12c0 5 4 9 9 9s9-4 9-9c0-3-1.5-6-4-7.5" />
      <path d="M12 3v10" />
      <path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  )
}

// ===========================================================================
// 组件
// ===========================================================================

interface SidebarProps {
  onNavClick?: () => void
}

export default function Sidebar({ onNavClick }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <aside className="flex h-full flex-col bg-warm-100">
      {/* ---- Logo ---- */}
      <div className="px-6 pt-8 pb-6">
        <Link to="/" className="inline-block text-2xl font-bold tracking-tight text-slate-800" onClick={onNavClick}>
          x<span className="text-warm-500">·</span>blog
        </Link>
      </div>

      {/* ---- 导航菜单 ---- */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-warm-200/70 text-warm-700'
                  : 'text-slate-500 hover:bg-warm-200/40 hover:text-slate-700'
              }`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ---- 底部登录区 ---- */}
      <div className="border-t border-warm-200 px-4 py-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-300 text-sm font-semibold text-warm-800">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm font-medium text-slate-700">{user.username}</span>
            <button
              onClick={handleLogout}
              className="rounded-full px-3 py-1 text-xs text-slate-400 transition-colors hover:bg-warm-200/50 hover:text-slate-600"
            >
              退出
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onNavClick}
            className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-warm-200/40 hover:text-slate-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>登录</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
