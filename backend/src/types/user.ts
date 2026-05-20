export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface UserPublic {
  id: string
  email: string
  createdAt: string
}

export interface TokenPayload {
  userId: string
  email: string
}
