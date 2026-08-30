import { randomUUID } from 'node:crypto'
import { db } from './db.js'

// ============================================================
// Robustez P0 — sesiones persistentes, idempotencia y eventos
// ============================================================

// ── Sesiones persistentes (reemplaza el Map en memoria) ──
const SESSION_TTL_MS = 10 * 60 * 1000 // 10 minutos

export interface BotSession {
  phone: string
  club_id: string | null
  state: string
  payload: string | null   // JSON
  expires_at: string | null
}

export function getSession(phone: string): BotSession | null {
  const s = db.prepare(`SELECT * FROM bot_sessions WHERE phone = ?`).get(phone) as any
  if (!s) return null
  // Chequear expiración
  if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) {
    deleteSession(phone)
    return null
  }
  return s
}

export function setSession(phone: string, clubId: string | null, state: string, payload: any = null): void {
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  const payloadStr = payload ? JSON.stringify(payload) : null
  db.prepare(`
    INSERT INTO bot_sessions (phone, club_id, state, payload, expires_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET
      club_id = excluded.club_id,
      state = excluded.state,
      payload = excluded.payload,
      expires_at = excluded.expires_at,
      updated_at = datetime('now')
  `).run(phone, clubId, state, payloadStr, expires)
}

export function deleteSession(phone: string): void {
  db.prepare(`DELETE FROM bot_sessions WHERE phone = ?`).run(phone)
}

// ── Idempotencia del webhook ──
// Devuelve true si el mensaje ya fue procesado (no debe volver a procesarse)
export function isDuplicateMessage(messageId: string): boolean {
  if (!messageId) return false
  const row = db.prepare(`SELECT 1 FROM processed_messages WHERE message_id = ?`).get(messageId)
  return !!row
}

export function markMessageProcessed(messageId: string, phone: string, intent: string): void {
  if (!messageId) return
  db.prepare(`INSERT OR IGNORE INTO processed_messages (message_id, phone, intent) VALUES (?, ?, ?)`)
    .run(messageId, phone, intent)
}

// ── Eventos del bot (observabilidad) ──
export function logBotEvent(phone: string, event: string, data: any = null): void {
  try {
    const dataStr = data ? JSON.stringify(data).slice(0, 500) : null
    db.prepare(`INSERT INTO bot_events (phone, event, data) VALUES (?, ?, ?)`)
      .run(phone, event, dataStr)
  } catch (e) {
    // No bloquear el flujo si el log falla
    console.error('[bot_events] error:', e)
  }
}

// ── Estado del slot protegido: reserva anti-doble (transacción) ──
// Intenta reservar un slot; devuelve true si se logró (solo un ganador por slot).
export function tryReserveSlot(clubId: string, slotId: string, playerId: string, source: string, price: number | null): boolean {
  // Transacción atómica: actualizar sólo si sigue libre
  const result = db.prepare(`UPDATE slots SET status = 'reservada' WHERE id = ? AND status = 'libre'`).run(slotId)
  if (result.changes === 0) return false // ya reservado por otro → no duplica

  const rid = randomUUID()
  db.prepare(`INSERT INTO reservations (id, club_id, slot_id, player_id, status, source, price) VALUES (?, ?, ?, ?, 'confirmada', ?, ?)`)
    .run(rid, clubId, slotId, playerId, source, price)
  return true
}
