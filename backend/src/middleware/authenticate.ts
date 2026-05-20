import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.js'
import type { TokenPayload } from '../types/user.js'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' })
  }
}
