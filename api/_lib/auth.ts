import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-prod'

export type Role = 'global' | 'club_admin' | 'member'

export interface AuthUser {
  adminId: string
  clubId: string
  phone: string
  role: Role
  name?: string
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

// Middleware: exige Authorization: Bearer ***
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  const user = verifyToken(header.slice(7))
  if (!user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
  ;(req as any).authUser = user
  next()
}

// Middleware: exige un rol específico (admin global o admin de club).
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).authUser as AuthUser
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'No autorizado para esta acción' })
    }
    next()
  }
}
