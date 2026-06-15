import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ApiRequestError } from '../api/client'

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentEmail, setSentEmail] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSentEmail(null)

    const usernameTrimmed = username.trim()
    const emailTrimmed = email.trim()
    if (!usernameTrimmed || !emailTrimmed || !password) {
      setError('请填写所有字段')
      return
    }
    if (usernameTrimmed.length < 2 || usernameTrimmed.length > 32) {
      setError('用户名长度需要 2-32 个字符')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要 6 个字符')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      await register(emailTrimmed, usernameTrimmed, password)
      setSentEmail(emailTrimmed)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
      } else {
        setError('注册失败，请稍后重试')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[var(--bg-page)] px-5 py-14 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Join XLab
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)] sm:text-5xl">
            创建账号
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[var(--text-muted)]">
            注册后会发送验证邮件。点击邮件里的链接完成邮箱验证，再回到登录页进入网站。
          </p>
        </section>

        <section className="warm-card p-6 sm:p-8">
          {sentEmail ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-soft)] text-xl font-black text-[var(--green-main)]">
                ✓
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] text-[var(--text-main)]">
                验证邮件已发送
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                请检查 {sentEmail}，点击邮件中的验证链接后再登录。
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex rounded-full bg-[var(--green-main)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--green-deep)]"
              >
                去登录
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <Field label="用户名" htmlFor="username">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  autoComplete="username"
                  required
                  minLength={2}
                  maxLength={32}
                  className="form-input"
                />
              </Field>

              <Field label="邮箱地址" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  className="form-input"
                />
              </Field>

              <Field label="密码" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 个字符"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="form-input"
                />
              </Field>

              <Field label="确认密码" htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                  required
                  className="form-input"
                />
              </Field>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[var(--green-main)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(79,111,82,0.24)] transition hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? '正在创建...' : '创建账号并发送验证邮件'}
              </button>

              <p className="text-center text-sm text-[var(--text-muted)]">
                已有账号？{' '}
                <Link to="/login" className="font-bold text-[var(--green-main)] hover:text-[var(--green-deep)]">
                  立即登录
                </Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-bold text-[var(--text-main)]">{label}</span>
      {children}
    </label>
  )
}
