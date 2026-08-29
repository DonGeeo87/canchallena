import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { randomUUID } from 'node:crypto'
import { db } from './_lib/db.js'
import { requireAuth, signToken, type AuthUser } from './_lib/auth.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())

const PORT = Number(process.env.PORT) || 3015
const API_PREFIX = '/api'

// ---------- Health ----------
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ ok: true, service: 'canchallena-api', time: new Date().toISOString() })
})

// ---------- Auth (MVP simple: login por teléfono admin + clave) ----------
app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  // En el MVP, la auth de un solo admin por club es directa desde la tabla admins.
  // Simplificación de desarrollo: token firmado con clubId del primer admin si existe.
  const admin = db.prepare(`SELECT id, club_id, name FROM admins LIMIT 1`).get() as any
  if (!admin) return res.status(400).json({ error: 'No hay admin; ejecuta db:seed' })
  const user: AuthUser = { adminId: admin.id, clubId: admin.club_id, phone: '' }
  res.json({ token: signToken(user), admin })
})

// ---------- Club (tenant) ----------
app.get(`${API_PREFIX}/club`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const club = db.prepare(`SELECT * FROM clubs WHERE id = ?`).get(clubId)
  if (!club) return res.status(404).json({ error: 'Club no encontrado' })
  const courts = db.prepare(`SELECT * FROM courts WHERE club_id = ? AND active = 1`).all(clubId)
  const hours = db.prepare(`SELECT * FROM club_hours WHERE club_id = ? ORDER BY day_of_week`).all(clubId)
  res.json({ club, courts, hours })
})

// ---------- Courts ----------
app.get(`${API_PREFIX}/courts`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const courts = db.prepare(`SELECT * FROM courts WHERE club_id = ?`).all(clubId)
  res.json(courts)
})

app.post(`${API_PREFIX}/courts`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const { name, price_per_slot } = req.body
  if (!name || !price_per_slot) return res.status(400).json({ error: 'name y price_per_slot requeridos' })
  const id = randomUUID()
  db.prepare(`INSERT INTO courts (id, club_id, name, price_per_slot) VALUES (?, ?, ?, ?)`)
    .run(id, clubId, name, price_per_slot)
  res.status(201).json({ id, name, price_per_slot })
})

// ---------- Slots (por fecha) ----------
app.get(`${API_PREFIX}/slots`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
  const rows = db.prepare(`
    SELECT s.*, c.name AS court_name, c.price_per_slot
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ?
    ORDER BY s.starts_at
  `).all(clubId, `${date}%`)
  res.json(rows)
})

// ---------- Reservas (booking) ----------
app.post(`${API_PREFIX}/booking`, (req, res) => {
  // Punto de entrada para el BOT (y web/admin): crea una reserva de un jugador en un slot.
  const { slot_id, phone, player_name } = req.body
  if (!slot_id || !phone || !player_name) return res.status(400).json({ error: 'slot_id, phone y player_name requeridos' })

  const slot = db.prepare(`SELECT * FROM slots WHERE id = ?`).get(slot_id) as any
  if (!slot) return res.status(404).json({ error: 'Slot no encontrado' })
  if (slot.status === 'reservada') return res.status(409).json({ error: 'Slot ya reservado' })

  // Upsert jugador por teléfono (identificador del bot)
  let player = db.prepare(`SELECT * FROM players WHERE phone = ?`).get(phone) as any
  const club = db.prepare(`SELECT club_id FROM courts WHERE id = ?`).get(slot.court_id) as any
  if (!player) {
    const id = randomUUID()
    db.prepare(`INSERT INTO players (id, club_id, name, phone) VALUES (?, ?, ?, ?)`)
      .run(id, club.club_id, player_name, phone)
    player = { id, club_id: club.club_id, name: player_name, phone }
  }

  const reservationId = randomUUID()
  db.prepare(`INSERT INTO reservations (id, club_id, slot_id, player_id, status, source, price) VALUES (?, ?, ?, ?, 'pendiente', 'bot', ?)`)
    .run(reservationId, player.club_id, slot_id, player.id, slot.price ?? slot.price_from_court)

  db.prepare(`UPDATE slots SET status = 'reservada' WHERE id = ?`).run(slot_id)

  res.status(201).json({
    reservation_id: reservationId,
    slot: { id: slot.id, starts_at: slot.starts_at, ends_at: slot.ends_at },
    player: { id: player.id, name: player.name, phone: player.phone },
    status: 'pendiente'
  })
})

// ---------- Matchmaking: crear partido abierto desde un slot libre ----------
app.post(`${API_PREFIX}/matchmaking/open`, requireAuth, (req, res) => {
  const { slot_id, min_level, max_level } = req.body
  if (!slot_id) return res.status(400).json({ error: 'slot_id requerido' })
  const slot = db.prepare(`SELECT * FROM slots WHERE id = ?`).get(slot_id) as any
  if (!slot) return res.status(404).json({ error: 'Slot no encontrado' })
  if (slot.status !== 'libre') return res.status(409).json({ error: 'Slot no está libre' })

  const id = randomUUID()
  db.prepare(`INSERT INTO open_matches (id, slot_id, min_level, max_level) VALUES (?, ?, ?, ?)`)
    .run(id, slot_id, min_level ?? 2.0, max_level ?? 4.0)
  db.prepare(`UPDATE slots SET status = 'partido_abierto' WHERE id = ?`).run(slot_id)

  // Candidatos: jugadores del club en el rango de nivel (solo por nivel, el jugador decide)
  const club = db.prepare(`SELECT club_id FROM courts WHERE id = ?`).get(slot.court_id) as any
  const candidates = db.prepare(`
    SELECT id, name, phone, level FROM players
    WHERE club_id = ? AND level BETWEEN ? AND ?
  `).all(club.club_id, min_level ?? 2.0, max_level ?? 4.0)

  // Crear invitaciones
  const invited = []
  for (const p of candidates) {
    const invId = randomUUID()
    db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id) VALUES (?, ?, ?)`)
      .run(invId, id, p.id)
    invited.push(p)
  }

  res.status(201).json({ open_match_id: id, slot: slot_id, candidates: invited.length, invited })
})

// ---------- Tablero admin (HOY) ----------
app.get(`${API_PREFIX}/admin/today`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const today = new Date().toISOString().slice(0, 10)
  const courts = db.prepare(`SELECT * FROM courts WHERE club_id = ? AND active = 1`).all(clubId)
  const slots = db.prepare(`
    SELECT s.*, c.name AS court_name
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ? AND s.status != 'libre'
  `).all(clubId, `${today}%`)
  res.json({ courts, slots })
})

// ---------- Players (lista de socios del club) ----------
app.get(`${API_PREFIX}/players`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const rows = db.prepare(`SELECT id, name, phone, level, created_at FROM players WHERE club_id = ? ORDER BY name`).all(clubId)
  res.json({ players: rows })
})

// ---------- Matchmaking: listar partidos abiertos ----------
app.get(`${API_PREFIX}/matchmaking`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const matches = db.prepare(`
    SELECT om.*, c.name AS court_name
    FROM open_matches om
    JOIN slots s ON s.id = om.slot_id
    JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND om.status = 'buscando'
  `).all(clubId)
  const enriched = matches.map((m: any) => {
    const invites = db.prepare(`
      SELECT mi.id, mi.status, p.name, p.level
      FROM match_invitations mi JOIN players p ON p.id = mi.player_id
      WHERE mi.open_match_id = ?
    `).all(m.id)
    const accepted = invites.filter((i: any) => i.status === 'aceptada').length
    return { ...m, capacity: 4, invites, accepted }
  })
  res.json({ matches: enriched })
})

// ---------- Bookings: reservas del club ----------
app.get(`${API_PREFIX}/bookings`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const rows = db.prepare(`
    SELECT r.*, s.starts_at, s.ends_at, c.name AS court_name, p.name AS player_name, p.phone AS player_phone
    FROM reservations r
    JOIN slots s ON s.id = r.slot_id
    JOIN courts c ON c.id = s.court_id
    JOIN players p ON p.id = r.player_id
    WHERE r.club_id = ? ORDER BY s.starts_at DESC
  `).all(clubId)
  res.json({ bookings: rows })
})

// ---------- Club público (micrositio) ----------
app.get(`${API_PREFIX}/public/club/:slug`, (req, res) => {
  const club = db.prepare(`SELECT id, name, slug, city, currency FROM clubs WHERE slug = ?`).get(req.params.slug) as any
  if (!club) return res.status(404).json({ error: 'Club no encontrado' })
  const courts = db.prepare(`SELECT id, name, price_per_slot FROM courts WHERE club_id = ? AND active = 1`).all(club.id)
  const today = new Date().toISOString().slice(0, 10)
  const freeSlots = db.prepare(`
    SELECT s.id, s.starts_at, s.ends_at, s.price, c.name AS court_name
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ? AND s.status = 'libre'
    ORDER BY s.starts_at
  `).all(club.id, `${today}%`)
  res.json({ club, courts, freeSlots })
})

// ---------- Webhook GoWA (entrada WhatsApp del bot) ----------
app.post(`${API_PREFIX}/webhook/gowa`, (req, res) => {
  // Registra el payload entrante y responde 200 a GoWA. La lógica de intención se implementa en el bot (Sprint 3).
  res.status(200).json({ ok: true, note: 'webhook recibido' })
})

app.listen(PORT, () => {
  console.log(`✅ CanchaLlena API en http://localhost:${PORT}${API_PREFIX}`)
})
