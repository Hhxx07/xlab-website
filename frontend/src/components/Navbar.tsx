import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { label: '文章', href: '#posts' },
  { label: '专题', href: '#topics' },
  { label: '关于', href: '#about' },
]

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="XLab Notes 首页">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white shadow-sm">
            XL
          </span>
          <span className="text-base font-semibold tracking-wide text-slate-950">
            XLab Notes
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isAuthenticated && (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 sm:inline"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                留言 / 创作
              </Link>
            </>
          )}

          {!isLoading && isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-950">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">
                  {user.display_name || user.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
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
