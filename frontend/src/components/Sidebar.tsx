import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  { label: '主页', path: '/', subLabel: 'Main Page', icon: HomeIcon },
  { label: '热门', path: '/hot', subLabel: 'Trending', icon: HotIcon },
  { label: '学习', path: '/study', subLabel: 'Study', icon: StudyIcon },
  { label: '有趣', path: '/fun', subLabel: 'Fun', icon: FunIcon },
  { label: '生活', path: '/life', subLabel: 'Life', icon: LifeIcon },
] as const

interface SidebarProps {
  onNavClick?: () => void
}

export default function Sidebar({ onNavClick }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    onNavClick?.()
  }

  return (
    <aside className="flex h-full flex-col rounded-[28px] border border-white/70 bg-[rgba(255,253,248,0.86)] px-4 py-5 shadow-[0_18px_60px_rgba(52,45,32,0.10)] backdrop-blur-xl">
      <Link to="/" className="group block px-3 pb-5 pt-2" onClick={onNavClick}>
        <p className="text-3xl font-black tracking-[-0.04em] text-[var(--text-main)]">
          x-blog
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--text-soft)]">
          小地方，也舒服
        </p>
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[var(--border-soft)] to-transparent" />
      </Link>

      <form onSubmit={handleSearch} className="mb-4 px-1">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white/72 px-3 py-2 shadow-sm">
          <SearchIcon />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)]"
          />
        </div>
      </form>

      <nav className="flex-1 space-y-2 px-1">
        {NAV_ITEMS.map(({ label, subLabel, path, icon: Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              className={`group relative flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm transition-all ${
                active
                  ? 'bg-[var(--green-soft)] text-[var(--green-deep)] shadow-sm'
                  : 'text-slate-500 hover:bg-white/80 hover:text-[var(--text-main)]'
              }`}
            >
              {active && (
                <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--green-main)]" />
              )}
              <span
                className={`ml-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  active
                    ? 'bg-white/80 text-[var(--green-main)]'
                    : 'bg-white/50 text-slate-400 group-hover:text-[var(--green-main)]'
                }`}
              >
                <Icon />
              </span>
              <span className="min-w-0">
                <span className={`block ${active ? 'font-bold' : 'font-semibold'}`}>
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">{subLabel}</span>
              </span>
            </Link>
          )
        })}

        {isAuthenticated && user?.role === 'admin' && (
          <Link
            to="/admin"
            onClick={onNavClick}
            className={`group relative flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm transition-all ${
              isActive('/admin')
                ? 'bg-[var(--green-soft)] text-[var(--green-deep)] shadow-sm'
                : 'text-slate-500 hover:bg-white/80 hover:text-[var(--text-main)]'
            }`}
          >
            {isActive('/admin') && (
              <span className="absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--green-main)]" />
            )}
            <span className={`ml-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isActive('/admin') ? 'bg-white/80 text-[var(--green-main)]' : 'bg-white/50 text-slate-400'
            }`}>
              <AdminIcon />
            </span>
            <span className="min-w-0">
              <span className={`block ${isActive('/admin') ? 'font-bold' : 'font-semibold'}`}>
                管理
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">Admin</span>
            </span>
          </Link>
        )}
      </nav>

      <div className="mt-5 rounded-[20px] border border-[var(--border-soft)] bg-white/70 p-4">
        {isAuthenticated && user ? (
          <div>
            <Link
              to="/profile"
              onClick={onNavClick}
              className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-[var(--bg-page)]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brown-soft)] text-sm font-bold text-[var(--brown-main)]">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-main)]">{user.username}</p>
                <p className="text-xs text-[var(--text-soft)]">进入个人资料</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-full bg-[var(--bg-page)] px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-[var(--brown-soft)] hover:text-[var(--brown-main)]"
            >
              退出登录
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-[var(--text-main)]">Welcome</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
              登录后可以写文章和回复评论。
            </p>
            <Link
              to="/login"
              onClick={onNavClick}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--green-main)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

function HomeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function HotIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-2.2 3.2-5 6.1-5 10.3A5 5 0 0 0 12 18a5 5 0 0 0 5-4.7C17 9.1 14.2 6.2 12 3Z" />
      <path d="M12 12c-.9 1.3-1.5 2.2-1.5 3.1a1.5 1.5 0 0 0 3 0c0-.9-.6-1.8-1.5-3.1Z" />
    </svg>
  )
}

function StudyIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20" />
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v20H7.5A2.5 2.5 0 0 1 5 19.5z" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  )
}

function FunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="11" rx="3" />
      <path d="M8 12h3M9.5 10.5v3M15 11.5h.01M17.5 13.5h.01" />
    </svg>
  )
}

function LifeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-4.5 7-11a4 4 0 0 0-7-2.65A4 4 0 0 0 5 10c0 6.5 7 11 7 11Z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 22.62 6.8l-.06.06A1.65 1.65 0 0 0 22.23 8.68a1.65 1.65 0 0 0 1.51 1H24a2 2 0 0 1 0 4h-.26a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-[var(--text-soft)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
