import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as userStore from '../services/userStore.js'
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/auth.js'
import type { UserPublic, TokenPayload } from '../types/user.js'

function toPublic(user: { id: string; email: string; createdAt: string }): UserPublic {
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  if (userStore.emailExists(email)) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = userStore.createUser({
    id: randomUUID(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  })

  const payload: TokenPayload = { userId: user.id, email: user.email }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.status(201).json({ user: toPublic(user), accessToken, refreshToken })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = userStore.findByEmail(email)
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const payload: TokenPayload = { userId: user.id, email: user.email }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.json({ user: toPublic(user), accessToken, refreshToken })
}

export function refresh(req: Request, res: Response): void {
  const { refreshToken } = req.body

  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'Refresh token is required' })
    return
  }

  let payload: TokenPayload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
    return
  }

  const user = userStore.findById(payload.userId)
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  const newPayload: TokenPayload = { userId: user.id, email: user.email }
  const accessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  res.json({ accessToken, refreshToken: newRefreshToken })
}
