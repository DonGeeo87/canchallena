import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'

// En el MVP la auth es simple: un admin por club, credencial admin/club.
// Sin anticipos ni pagos en este sprint (decisión 29-Ago-2026).
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-prod'

export interface AuthUser {
  adminId: string
  clubId: string
  phone: string
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

// Middleware: exige Authorization: Bearer <token>
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
