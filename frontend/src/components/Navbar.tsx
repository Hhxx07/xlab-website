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
