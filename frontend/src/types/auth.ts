export interface UserPublic {
  id: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  user: UserPublic
  accessToken: string
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
