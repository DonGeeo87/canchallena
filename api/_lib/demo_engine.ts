import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { armarPartido } from './engine.js'
import { tryReserveSlot } from './bot_session.js'

// ============================================================
// Demo Engine — Sandbox de ventas para CanchaLlena
// Opera sobre el club ficticio 'club-demo' (Club Deportivo Los Guerreros)
// para que un club interesado vea el sistema trabajando antes de compartir datos reales.
// ============================================================
const DEMO_CLUB = 'club-demo'
const DEMO_PHONE = '+569****1010' // Andrés Fuentes, jugador demo inicial

// Formatea CLP sin depender del locale ICU de Node (alpine no trae es-CL completo)
function formatCLP(n: number): string {
  return n.toLocaleString('de-DE').replace(/,/g, '.')
}

export interface DemoEvent {
  type: string
  message: string
  at: string
  // Datos estructurados para que el frontend anime el flujo
  player?: { name: string; categoria: string }
  court?: { name: string; time: string }
  match?: {
    parejaA: { name: string; categoria: string }[]
    parejaB: { name: string; categoria: string }[]
    courtName: string
    time: string
  }
  reemplazo?: { name: string; categoria: string }
}

// Genera slots libres para "hoy" en las canchas demo (para que el bot tenga disponibilidad)
export function ensureDemoSlots(day: string = new Date().toISOString().slice(0, 10)): void {
  const courts = db.prepare(`SELECT id, price_per_slot FROM courts WHERE club_id = ?`).all(DEMO_CLUB) as any[]
  const times = ['10:00', '13:00', '16:00', '19:30', '21:00']
  for (const c of courts) {
    for (const t of times) {
      const exists = db.prepare(`SELECT id FROM slots WHERE court_id = ? AND starts_at LIKE ?`).get(c.id, `${day}T${t}:00`) as any
      if (!exists) {
        const end = t === '19:30' ? '21:00' : t === '21:00' ? '22:30' : `${parseInt(t) + 2}:00`.padStart(5, '0')
        db.prepare(`INSERT INTO slots (id, court_id, starts_at, ends_at, status, price) VALUES (?, ?, ?, ?, 'libre', ?)`)
          .run(randomUUID(), c.id, `${day}T${t}:00`, `${day}T${end}:00`, c.price_per_slot)
      }
    }
  }
}

// Obtiene el estado actual del club demo para el dashboard
export function getDemoState(): any {
  const today = new Date().toISOString().slice(0, 10)
  const club = db.prepare(`SELECT * FROM clubs WHERE id = ?`).get(DEMO_CLUB) as any
  const courts = db.prepare(`SELECT * FROM courts WHERE club_id = ?`).all(DEMO_CLUB) as any[]
  const players = db.prepare(`SELECT * FROM players WHERE club_id = ?`).all(DEMO_CLUB) as any[]
  const slots = db.prepare(`SELECT s.*, c.name AS court_name FROM slots s JOIN courts c ON c.id = s.court_id WHERE c.club_id = ? AND s.starts_at LIKE ? ORDER BY s.starts_at`).all(DEMO_CLUB, `${today}%`) as any[]
  const reservations = db.prepare(`SELECT r.*, s.starts_at, c.name AS court_name, p.name AS player_name FROM reservations r JOIN slots s ON s.id=r.slot_id JOIN courts c ON c.id=s.court_id JOIN players p ON p.id=r.player_id WHERE c.club_id = ? AND s.starts_at LIKE ?`).all(DEMO_CLUB, `${today}%`) as any[]
  const openMatches = db.prepare(`SELECT om.*, c.name AS court_name, s.starts_at FROM open_matches om JOIN slots s ON s.id=om.slot_id JOIN courts c ON c.id=s.court_id WHERE c.club_id = ? AND om.status='buscando'`).all(DEMO_CLUB) as any[]
  const occupied = slots.filter((s: any) => s.status !== 'libre').length
  const free = slots.filter((s: any) => s.status === 'libre').length

  // Estado reactivo de cada cancha: ocupada si tiene algún slot no-libre HOY
  const courtCards = courts.map((c) => {
    const courtSlots = slots.filter((s: any) => s.court_id === c.id)
    const anyOccupied = courtSlots.some((s: any) => s.status !== 'libre')
    const firstSlot = courtSlots[0]
    return {
      id: c.id,
      name: c.name,
      price: c.price_per_slot,
      status: anyOccupied ? 'reservada' : 'libre',
      // horario del primer slot libre (para mostrar)
      time: firstSlot ? firstSlot.starts_at.slice(11, 16) : '—',
    }
  })

  return {
    club: { name: club.name, slug: club.slug, city: club.city },
    courts: courts.map((c) => ({ id: c.id, name: c.name, price: c.price_per_slot })),
    courtCards,
    players: players.map((p) => ({ id: p.id, name: p.name, categoria: p.categoria, nivel: p.nivel, es_nuevo: p.es_nuevo, dias_sin_jugar: p.dias_sin_jugar })),
    occupancyRate: (occupied + free) ? Math.round((occupied / (occupied + free)) * 100) : 0,
    occupiedCount: occupied,
    freeCount: free,
    reservationsToday: reservations.length,
    openMatches: openMatches.map((m: any) => ({ id: m.id, court: m.court_name, at: m.starts_at, status: m.status })),
  }
}

// Simula una nueva reserva: un jugador demo reserva la primera cancha libre disponible
export function simulateNewReservation(): DemoEvent {
  ensureDemoSlots()
  const today = new Date().toISOString().slice(0, 10)
  // Buscar un slot libre hoy
  const slot = db.prepare(`SELECT s.*, c.name AS court_name FROM slots s JOIN courts c ON c.id=s.court_id WHERE c.club_id=? AND s.starts_at LIKE ? AND s.status='libre' ORDER BY s.starts_at LIMIT 1`).get(DEMO_CLUB, `${today}%`) as any
  if (!slot) return { type: 'error', message: 'No hay canchas libres para simular una reserva', at: new Date().toISOString() }
  // Buscar un jugador demo que no sea el que "viene del menú"
  const player = db.prepare(`SELECT id, name, categoria FROM players WHERE club_id=? ORDER BY dias_sin_jugar DESC LIMIT 1`).get(DEMO_CLUB) as any
  const ok = tryReserveSlot(DEMO_CLUB, slot.id, player.id, 'bot', slot.price || 8000)
  if (!ok) return { type: 'error', message: `La cancha ${slot.court_name} a las ${slot.starts_at.slice(11, 16)} se reservó justo antes`, at: new Date().toISOString() }
  return {
    type: 'reserva',
    message: `✅ ${player.name} (${player.categoria}) reservó ${slot.court_name} a las ${slot.starts_at.slice(11, 16)}. Cliente notificado automáticamente.`,
    at: new Date().toISOString(),
    player: { name: player.name, categoria: player.categoria },
    court: { name: slot.court_name, time: slot.starts_at.slice(11, 16) },
  }
}

// Simula que un cliente pregunta por disponibilidad → el bot responde con la lista
export function simulateAvailabilityQuery(): DemoEvent {
  ensureDemoSlots()
  const today = new Date().toISOString().slice(0, 10)
  const libres = db.prepare(`SELECT s.*, c.name AS court_name FROM slots s JOIN courts c ON c.id=s.court_id WHERE c.club_id=? AND s.starts_at LIKE ? AND s.status='libre' ORDER BY s.starts_at LIMIT 4`).all(DEMO_CLUB, `${today}%`) as any[]
  if (!libres.length) return { type: 'error', message: 'No hay disponibilidad para mostrar hoy', at: new Date().toISOString() }
  const lineas = libres.map((s: any) => `• ${s.court_name} a las ${s.starts_at.slice(11, 16)} · $${formatCLP(s.price || 8000)}`).join('\n')
  return { type: 'disponibilidad', message: `🤖 Un cliente preguntó por disponibilidad.\n\nDisponible HOY:\n${lineas}\n\nEl bot respondió automáticamente sin intervención.`, at: new Date().toISOString() }
}

// Simula crear un partido abierto: el motor arma parejas e invita por WhatsApp
export function simulateCreateMatch(): DemoEvent {
  ensureDemoSlots()
  const today = new Date().toISOString().slice(0, 10)
  const partido = armarPartido(DEMO_CLUB)
  if (!partido) return { type: 'error', message: 'No hay suficientes jugadores para armar un partido (mínimo 4)', at: new Date().toISOString() }
  // Buscar un slot libre para anclar el partido
  const slot = db.prepare(`SELECT * FROM slots WHERE court_id IN (SELECT id FROM courts WHERE club_id=?) AND status='libre' LIMIT 1`).get(DEMO_CLUB) as any
  const matchId = randomUUID()
  const slotId = slot ? slot.id : randomUUID()
  if (slot) db.prepare(`UPDATE slots SET status='partido_abierto' WHERE id=?`).run(slot.id)
  else db.prepare(`INSERT INTO slots (id, court_id, starts_at, ends_at, status, price) VALUES (?, (SELECT id FROM courts WHERE club_id=? LIMIT 1), ?, ?, 'partido_abierto', 8000)`).run(slotId, DEMO_CLUB, `${today}T19:30:00`, `${today}T21:00:00`)
  db.prepare(`INSERT INTO open_matches (id, slot_id, status) VALUES (?, ?, 'buscando')`).run(matchId, slotId)
  const [a1, a2] = partido.parejaA
  const [b1, b2] = partido.parejaB
  for (const p of [a1, a2, b1, b2]) {
    db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id, status) VALUES (?, ?, ?, 'pendiente')`).run(randomUUID(), matchId, p.id)
  }
  const nombres = [a1, a2, b1, b2].map((p) => p.name).join(', ')
  return {
    type: 'match',
    message: `🤖 Motor de matchmaking: armó las parejas e invitó a 4 jugadores.\n\n🎾 ${a1.name} + ${a2.name}  vs  ${b1.name} + ${b2.name}\n\nInvitados: ${nombres}. El bot espera sus respuestas SI/NO.`,
    at: new Date().toISOString(),
    match: {
      parejaA: [{ name: a1.name, categoria: a1.categoria }, { name: a2.name, categoria: a2.categoria }],
      parejaB: [{ name: b1.name, categoria: b1.categoria }, { name: b2.name, categoria: b2.categoria }],
      courtName: courtName(slotId),
      time: slot?.starts_at ? slot.starts_at.slice(11, 16) : '19:30',
    },
  }
}

// Helper para obtener nombre de cancha de un slot
function courtName(slotId: string): string {
  const r = db.prepare(`SELECT c.name FROM slots s JOIN courts c ON c.id=s.court_id WHERE s.id=?`).get(slotId) as any
  return r?.name || 'Cancha'
}

// Simula una cancelación: libera un cupo y busca reemplazo
export function simulateCancellation(): DemoEvent {
  const today = new Date().toISOString().slice(0, 10)
  const slot = db.prepare(`SELECT s.*, c.name AS court_name FROM slots s JOIN courts c ON c.id=s.court_id WHERE c.club_id=? AND s.starts_at LIKE ? AND s.status='reservada' LIMIT 1`).get(DEMO_CLUB, `${today}%`) as any
  if (!slot) {
    // Si no hay reservada, crear una primero
    const ev = simulateNewReservation()
    if (ev.type === 'error') return ev
    return simulateCancellation()
  }
  const player = db.prepare(`SELECT r.player_id, p.name FROM reservations r JOIN players p ON p.id=r.player_id WHERE r.slot_id=? LIMIT 1`).get(slot.id) as any
  db.prepare(`UPDATE slots SET status='libre' WHERE id=?`).run(slot.id)
  // Buscar reemplazo
  const reemplazo = db.prepare(`SELECT name, categoria FROM players WHERE club_id=? AND id NOT IN (SELECT player_id FROM reservations WHERE slot_id=?) ORDER BY dias_sin_jugar DESC LIMIT 1`).get(DEMO_CLUB, slot.id) as any
  const msg = reemplazo
    ? `${player?.name || 'Un cliente'} canceló ${slot.court_name} a las ${slot.starts_at.slice(11, 16)}. El bot avisó a ${reemplazo.name} (${reemplazo.categoria}) que queda un cupo.`
    : `${player?.name || 'Un cliente'} canceló ${slot.court_name} a las ${slot.starts_at.slice(11, 16)}. Cupo liberado y disponibilidad actualizada automáticamente.`
  return { type: 'cancellation', message: `⚠️ ${msg}`, at: new Date().toISOString() }
}
