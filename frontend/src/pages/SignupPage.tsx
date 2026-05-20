import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

interface SignupPageProps {
  onSuccess: () => void
  onGoLogin: () => void
}

export function SignupPage({ onSuccess, onGoLogin }: SignupPageProps) {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('两次密码输入不一致')
      return
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位字符')
      return
    }

    setLoading(true)
    try {
      await signup(email, password)
      onSuccess()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>注册账号</h2>
        <p className="auth-subtitle">创建账号以保存您的设计项目</p>

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
              placeholder="至少 8 位字符"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">确认密码</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '注册中...' : '创建账号'}
          </button>
        </form>

        <p className="auth-switch">
          已有账号？{' '}
          <button onClick={onGoLogin} className="link-btn">
            立即登录
          </button>
        </p>
      </div>
    </div>
  )
}
