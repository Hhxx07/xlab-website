import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <main key={location.pathname + location.search} className="page-transition">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold tracking-wide">XLab Notes</p>
            <p className="mt-1 text-sm text-slate-400">
              公开阅读优先，留言和创作时再登录。
            </p>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Built with React + Go + PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  )
}
