import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { label: '主页', to: '/', subLabel: 'Main', icon: HomeIcon },
  { label: '热门', to: '/hot', subLabel: 'Trending', icon: HotIcon },
  { label: '学习', to: '/study', subLabel: 'Study', icon: StudyIcon },
  { label: '有趣', to: '/fun', subLabel: 'Fun', icon: FunIcon },
]

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-page)]/82 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-[rgba(255,253,248,0.86)] px-4 py-3 shadow-[0_18px_60px_rgba(52,45,32,0.10)] backdrop-blur-xl sm:px-5">
        <Link to="/" className="group flex items-center gap-3" aria-label="x-blog 首页">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brown-soft)] text-sm font-black text-[var(--brown-main)] shadow-sm transition group-hover:bg-[var(--green-soft)] group-hover:text-[var(--green-main)]">
            xb
          </span>
          <span>
            <span className="block text-lg font-black tracking-[-0.04em] text-[var(--text-main)]">x-blog</span>
            <span className="hidden text-xs font-medium text-[var(--text-soft)] sm:block">小地方，也舒服</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-500 transition-all hover:bg-white/80 hover:text-[var(--text-main)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/50 text-slate-400 transition group-hover:text-[var(--green-main)]">
                <item.icon />
              </span>
              <span>
                <span className="block leading-4">{item.label}</span>
                <span className="block text-[11px] font-medium text-slate-400">{item.subLabel}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isAuthenticated && (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white/80 hover:text-[var(--text-main)] sm:inline"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[var(--green-main)] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
              >
                留言 / 创作
              </Link>
            </>
          )}

          {!isLoading && isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-white/75"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brown-soft)] text-sm font-bold text-[var(--brown-main)]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-28 truncate text-sm font-bold text-[var(--text-main)]">
                    {user.display_name || user.username}
                  </span>
                  <span className="block text-xs text-[var(--text-soft)]">Profile</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[var(--bg-page)] px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-[var(--brown-soft)] hover:text-[var(--brown-main)]"
              >
                退出
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function HotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-2.2 3.2-5 6.1-5 10.3A5 5 0 0 0 12 18a5 5 0 0 0 5-4.7C17 9.1 14.2 6.2 12 3Z" />
      <path d="M12 12c-.9 1.3-1.5 2.2-1.5 3.1a1.5 1.5 0 0 0 3 0c0-.9-.6-1.8-1.5-3.1Z" />
    </svg>
  )
}

function StudyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20" />
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v20H7.5A2.5 2.5 0 0 1 5 19.5z" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  )
}

function FunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="11" rx="3" />
      <path d="M8 12h3M9.5 10.5v3M15 11.5h.01M17.5 13.5h.01" />
    </svg>
  )
}
