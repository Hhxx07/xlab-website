import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.requestMagicLink({ email })
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送登录链接失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[76vh] items-center justify-center px-5 py-12" style={{ background: 'var(--bg-page)' }}>
      <div className="warm-card w-full max-w-md p-7 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
          Magic Link
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
          登录一隅
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          输入邮箱后，系统会发送一个临时登录链接。本地开发环境会直接在后端控制台输出链接。
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--green-soft)] px-4 py-3 text-sm text-[var(--green-deep)]">
              {message}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold text-[var(--text-main)]">邮箱地址</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm outline-none transition-shadow focus:ring-4 focus:ring-[var(--green-soft)]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--green-main)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '发送中...' : '发送登录链接'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[var(--text-soft)]">
          仍需要密码注册？{' '}
          <Link to="/register" className="font-bold text-[var(--green-main)]">
            前往注册
          </Link>
        </div>
      </div>
    </div>
  )
}
