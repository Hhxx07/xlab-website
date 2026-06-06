import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotePage from './pages/NotePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import WorldPage from './pages/WorldPage'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notes/*" element={<NotePage />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
              <div className="max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-950">页面未找到</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  你访问的页面不存在，或已经被移动。
                </p>
                <a
                  href="/"
                  className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  返回首页
                </a>
              </div>
            </div>
          }
        />
      </Route>
      <Route path="/world" element={<WorldPage />} />
    </Routes>
  )
}
