import { randomUUID } from 'node:crypto'
import { db } from './db.js'

// ============================================================
// Generador de slots dinámicos por fecha para CUALQUIER club.
// El agente necesita que un club tenga "canchas hoy" para operar.
// Asegura que existan slots libres para una fecha dada en las
// canchas activas del club (crea los que faltan).
// ============================================================

const DEFAULT_TIMES = ['10:00', '13:00', '16:00', '19:30', '21:00']

function endFor(t: string): string {
  if (t === '19:30') return '21:00'
  if (t === '21:00') return '22:30'
  return `${parseInt(t) + 2}:00`.padStart(5, '0')
}

// Asegura slots libres para un club en una fecha (idempotente: no duplica).
export function ensureClubSlots(clubId: string, day: string = new Date().toISOString().slice(0, 10)): void {
  const courts = db.prepare(`SELECT id, price_per_slot FROM courts WHERE club_id = ? AND active = 1`).all(clubId) as any[]
  for (const c of courts) {
    for (const t of DEFAULT_TIMES) {
      const exists = db.prepare(`SELECT id FROM slots WHERE court_id = ? AND starts_at LIKE ?`).get(c.id, `${day}T${t}:00`) as any
      if (!exists) {
        db.prepare(`INSERT INTO slots (id, court_id, starts_at, ends_at, status, price) VALUES (?, ?, ?, ?, 'libre', ?)`)
          .run(randomUUID(), c.id, `${day}T${t}:00`, `${day}T${endFor(t)}:00`, c.price_per_slot)
      }
    }
  }
}

// Devuelve la disponibilidad de un club para una fecha (con nombre de cancha).
export function getClubAvailability(clubId: string, day: string = new Date().toISOString().slice(0, 10)): any[] {
  ensureClubSlots(clubId, day)
  return db.prepare(`
    SELECT s.*, c.name AS court_name
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ? AND s.status = 'libre'
    ORDER BY s.starts_at
  `).all(clubId, `${day}%`) as any[]
}

// Disponibilidad multi-día: busca hoy; si no hay, explora los próximos N días
// y devuelve las opciones encontradas (para que el agente ofrezca alternativas).
export function getClubAvailabilityMultiDay(clubId: string, daysAhead = 3, maxOptions = 6): {
  today: any[]
  alternatives: Array<{ date: string; slots: any[] }>
} {
  const today = new Date().toISOString().slice(0, 10)
  const todayOptions = getClubAvailability(clubId, today)

  if (todayOptions.length > 0) {
    return { today: todayOptions.slice(0, maxOptions), alternatives: [] }
  }

  // Hoy no hay (o todo ocupado) → explorar próximos días
  const alternatives: any[] = []
  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10)
    const slots = getClubAvailability(clubId, d)
    if (slots.length > 0) alternatives.push({ date: d, slots: slots.slice(0, 3) })
    if (alternatives.reduce((s, a) => s + a.slots.length, 0) >= maxOptions) break
  }
  return { today: todayOptions, alternatives }
}
