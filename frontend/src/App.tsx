import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import BlogLayout from './components/BlogLayout'
import BlogHomePage from './pages/blog/BlogHomePage'
import HotPage from './pages/blog/HotPage'
import StudyPage from './pages/blog/StudyPage'
import FunPage from './pages/blog/FunPage'
import LifePage from './pages/blog/LifePage'
import SearchPage from './pages/blog/SearchPage'
import ArticleDetailPage from './pages/blog/ArticleDetailPage'
import EditorPage from './pages/blog/EditorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import WorldPage from './pages/WorldPage'
import GaussianPage from './pages/GaussianPage'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <Routes>
      {/* ---- 博客路由：侧边栏布局 ---- */}
      <Route element={<BlogLayout />}>
        <Route index element={<BlogHomePage />} />
        <Route path="hot" element={<HotPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="fun" element={<FunPage />} />
        <Route path="life" element={<LifePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="editor" element={<EditorPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="post/*" element={<ArticleDetailPage />} />
      </Route>

      {/* ---- 认证路由：顶部导航栏布局 ---- */}
      <Route element={<Layout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ---- 3D 世界：独立页面，无布局包装 ---- */}
      <Route path="world" element={<WorldPage />} />
      <Route path="world/gaussian/:houseId" element={<GaussianPage />} />

      {/* ---- 404 ---- */}
      <Route
        path="*"
        element={
          <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
            <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-semibold text-slate-800">页面未找到</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                你访问的页面不存在，或已经被移动。
              </p>
              <a
                href="/"
                className="mt-6 inline-flex rounded-full bg-warm-100 px-5 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-200"
              >
                返回首页
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
