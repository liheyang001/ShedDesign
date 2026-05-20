import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

interface LoginPageProps {
  onSuccess: () => void
  onGoSignup: () => void
}

export function LoginPage({ onSuccess, onGoSignup }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>登录</h2>
        <p className="auth-subtitle">登录以开始设计您的花园棚屋</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="auth-switch">
          还没有账号？{' '}
          <button onClick={onGoSignup} className="link-btn">
            立即注册
          </button>
        </p>
      </div>
    </div>
  )
}
