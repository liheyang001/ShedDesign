import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserPublic } from '../types/auth'
import { signupApi, loginApi, getAuthStorage, setAuthStorage, clearAuthStorage } from '../services/api'

interface AuthContextValue {
  user: UserPublic | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { user: storedUser, accessToken } = getAuthStorage()
    if (storedUser && accessToken) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const data = await loginApi(email, password)
    setAuthStorage(data.accessToken, data.refreshToken, data.user)
    setUser(data.user)
  }

  async function signup(email: string, password: string) {
    const data = await signupApi(email, password)
    setAuthStorage(data.accessToken, data.refreshToken, data.user)
    setUser(data.user)
  }

  function logout() {
    clearAuthStorage()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
