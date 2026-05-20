import axios from 'axios'
import type { GardenAnalysis, UserPreferences, DesignRecommendation } from '../types/garden'
import type { AuthResponse, RefreshResponse, UserPublic } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const KEYS = {
  access: 'shed_access_token',
  refresh: 'shed_refresh_token',
  user: 'shed_user',
} as const

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000,
})

// Attach Bearer token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(KEYS.access)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401 with request queue to avoid concurrent refresh races
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function drainQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)

    const storedRefresh = localStorage.getItem(KEYS.refresh)
    if (!storedRefresh) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<RefreshResponse>(`${API_URL}/api/auth/refresh`, {
        refreshToken: storedRefresh,
      })
      localStorage.setItem(KEYS.access, data.accessToken)
      localStorage.setItem(KEYS.refresh, data.refreshToken)
      drainQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      drainQueue(refreshError, null)
      clearAuthStorage()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// Auth storage helpers
export function getAuthStorage(): { accessToken: string | null; refreshToken: string | null; user: UserPublic | null } {
  const raw = localStorage.getItem(KEYS.user)
  return {
    accessToken: localStorage.getItem(KEYS.access),
    refreshToken: localStorage.getItem(KEYS.refresh),
    user: raw ? (JSON.parse(raw) as UserPublic) : null,
  }
}

export function setAuthStorage(accessToken: string, refreshToken: string, user: UserPublic) {
  localStorage.setItem(KEYS.access, accessToken)
  localStorage.setItem(KEYS.refresh, refreshToken)
  localStorage.setItem(KEYS.user, JSON.stringify(user))
}

export function clearAuthStorage() {
  localStorage.removeItem(KEYS.access)
  localStorage.removeItem(KEYS.refresh)
  localStorage.removeItem(KEYS.user)
}

// Auth API
export async function signupApi(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/signup', { email, password })
  return res.data
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password })
  return res.data
}

// Garden API
export async function uploadGardenImage(file: File): Promise<{
  imageId: string
  filename: string
  analysis: GardenAnalysis
}> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await api.post('/upload', formData)
  return response.data
}

export function getImageUrl(imageId: string): string {
  return `${API_URL}/api/image/${imageId}`
}

export async function submitQuestionnaire(
  imageId: string,
  preferences: UserPreferences,
): Promise<{ questionnaireId: string; imageId: string; preferences: UserPreferences }> {
  const res = await api.post('/questionnaire', { imageId, preferences })
  return res.data
}

export async function generateRecommendation(
  analysis: GardenAnalysis,
  preferences: UserPreferences,
): Promise<DesignRecommendation> {
  const res = await api.post<{ recommendation: DesignRecommendation }>('/generate-recommendation', {
    analysis,
    preferences,
  })
  return res.data.recommendation
}
