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

// Genera horas de inicio a partir de los rangos del club_hours.
// Si el club configuró horarios (open_time..close_time), genera slots con bloques
// redondeados (ej. 09:00, 10:00, ...). Si no, usa DEFAULT_TIMES.
function slotsForDay(clubId: string, day: string): string[] {
  const dow = new Date(day + 'T12:00:00').getDay() // 0=domingo..6=sábado
  const range = db.prepare(`SELECT open_time, close_time FROM club_hours WHERE club_id = ? AND day_of_week = ? LIMIT 1`).get(clubId, dow) as any
  if (!range) return DEFAULT_TIMES
  const [oh, om] = (range.open_time || '09:00').split(':').map(Number)
  const [ch, cm] = (range.close_time || '23:00').split(':').map(Number)
  const times: string[] = []
  for (let h = oh; h < ch; h++) {
    times.push(`${String(h).padStart(2, '0')}:${String(om || 0).padStart(2, '0')}`)
  }
  return times.length ? times : DEFAULT_TIMES
}

// Asegura slots libres para un club en una fecha (idempotente: no duplica).
export function ensureClubSlots(clubId: string, day: string = new Date().toISOString().slice(0, 10)): void {
  const courts = db.prepare(`SELECT id, price_per_slot FROM courts WHERE club_id = ? AND active = 1`).all(clubId) as any[]
  const times = slotsForDay(clubId, day)
  for (const c of courts) {
    for (const t of times) {
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
