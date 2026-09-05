import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { db } from './_lib/db.js'
import { requireAuth, signToken, type AuthUser } from './_lib/auth.js'
import { armarPartido, buscarReemplazo, matchScore, rankCandidates } from './_lib/engine.js'
import { sendWhatsApp, buildInviteMessage, buildReplacementMessage, getGowaConfig } from './_lib/gowa.js'
import { getSession, setSession, deleteSession, isDuplicateMessage, markMessageProcessed, logBotEvent, tryReserveSlot, isBotEnabled, setBotEnabled } from './_lib/bot_session.js'
import * as demo from './_lib/demo_engine.js'
import { getPlayerStreak, getPartnerStruggle, recommendPartnerChange, getPlayerProgress, findPlayersByLevel, registerMatchResult, crearPlanProgreso } from './_lib/coach.js'
import { ensureClubSlots, getClubAvailability, getClubAvailabilityMultiDay } from './_lib/slots_gen.js'

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

// ---------- Auth (multi-tenant: login por email + clave por admin) ----------
app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }

  // Sin credenciales -> compat con demo (dev): primer admin
  if (!email || !password) {
    const admin = db.prepare(`SELECT id, club_id, name FROM admins LIMIT 1`).get() as any
    if (!admin) return res.status(400).json({ error: 'No hay admin; ejecuta db:seed' })
    const user: AuthUser = { adminId: admin.id, clubId: admin.club_id, phone: '' }
    return res.json({ token: signToken(user), admin })
  }

  // Login real por email/clave
  const admin = db.prepare(`SELECT * FROM admins WHERE email = ?`).get(email.toLowerCase()) as any
  if (!admin || !admin.password_hash) return res.status(401).json({ error: 'Credenciales inválidas' })
  const ok = bcrypt.compareSync(password, admin.password_hash)
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })
  const user: AuthUser = { adminId: admin.id, clubId: admin.club_id, phone: admin.phone || '' }
  res.json({ token: signToken(user), admin: { id: admin.id, name: admin.name, email: admin.email, club_id: admin.club_id } })
})

// ---------- Onboarding: registrar un club nuevo + su admin ----------
app.post(`${API_PREFIX}/auth/register`, (req, res) => {
  const { club_name, slug, city, plan, admin_name, admin_email, admin_password, whatsapp } = req.body as Record<string, string>
  if (!club_name || !slug || !admin_email || !admin_password) {
    return res.status(400).json({ error: 'club_name, slug, admin_email y admin_password requeridos' })
  }
  // Slug único
  const exists = db.prepare(`SELECT id FROM clubs WHERE slug = ?`).get(slug)
  if (exists) return res.status(409).json({ error: 'Ya existe un club con ese slug' })
  const clubId = randomUUID()
  db.prepare(`INSERT INTO clubs (id, name, slug, city, currency, plan, whatsapp) VALUES (?, ?, ?, ?, 'CLP', ?, ?)`)
    .run(clubId, club_name, slug, city || '', plan || 'Starter', whatsapp || '')
  const adminId = randomUUID()
  const hash = bcrypt.hashSync(admin_password, 10)
  db.prepare(`INSERT INTO admins (id, club_id, name, email, password_hash) VALUES (?, ?, ?, ?, ?)`)
    .run(adminId, clubId, admin_name || 'Admin', admin_email.toLowerCase(), hash)
  const user: AuthUser = { adminId, clubId, phone: whatsapp || '' }
  res.status(201).json({ club_id: clubId, admin_id: adminId, token: signToken(user), message: 'Club y admin creados' })
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
  // Asegurar que existan slots para hoy (disponibilidad real)
  ensureClubSlots(clubId, date)
  const rows = getClubAvailability(clubId, date)
  res.json(rows)
})

// ---------- Disponibilidad multi-día (agente: si hoy no hay, ofrece próximos días) ----------
app.get(`${API_PREFIX}/disponibilidad`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const daysAhead = Number(req.query.days) || 3
  const result = getClubAvailabilityMultiDay(clubId, daysAhead)
  res.json(result)
})

// ---------- Reservas (booking) ----------
app.post(`${API_PREFIX}/booking`, (req, res) => {
  // Punto de entrada para el BOT (y web/admin): crea una reserva de un jugador en un slot.
  const { slot_id, phone, player_name } = req.body
  if (!slot_id || !phone || !player_name) return res.status(400).json({ error: 'slot_id, phone y player_name requeridos' })

  const slot = db.prepare(`SELECT * FROM slots WHERE id = ?`).get(slot_id) as any
  if (!slot) return res.status(404).json({ error: 'Slot no encontrado' })
  if (slot.status === 'reservada') return res.status(409).json({ error: 'Slot ya reservado' })

  // Upsert jugador por teléfono + club (aislamiento multi-tenant)
  const club = db.prepare(`SELECT club_id FROM courts WHERE id = ?`).get(slot.court_id) as any
  let player = db.prepare(`SELECT * FROM players WHERE club_id = ? AND phone = ?`).get(club.club_id, phone) as any
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

// ---------- Matchmaking: crear partido con el motor de emparejamiento ----------
app.post(`${API_PREFIX}/matchmaking/open`, requireAuth, async (req, res) => {
  const { slot_id } = req.body
  if (!slot_id) return res.status(400).json({ error: 'slot_id requerido' })
  const slot = db.prepare(`SELECT * FROM slots WHERE id = ?`).get(slot_id) as any
  if (!slot) return res.status(404).json({ error: 'Slot no encontrado' })
  if (slot.status !== 'libre') return res.status(409).json({ error: 'Slot no está libre' })

  const club = db.prepare(`SELECT club_id FROM courts WHERE id = ?`).get(slot.court_id) as any
  const partido = armarPartido(club.club_id)
  if (!partido) return res.status(400).json({ error: 'No hay suficientes jugadores (mínimo 4)' })

  const matchId = randomUUID()
  const slotId = slot_id
  db.prepare(`INSERT INTO open_matches (id, slot_id) VALUES (?, ?)`).run(matchId, slotId)
  db.prepare(`UPDATE slots SET status = 'partido_abierto' WHERE id = ?`).run(slotId)

  // Registrar las 4 invitaciones y enviar por WhatsApp
  const [a1, a2] = partido.parejaA
  const [b1, b2] = partido.parejaB
  const cuatro = [a1, a2, b1, b2]
  const date = new Date(slot.starts_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const hora = new Date(slot.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const court = db.prepare(`SELECT name FROM courts WHERE id = ?`).get(slot.court_id) as any
  const courtName = court?.name || 'cancha'
  const resultados: any[] = []

  // Determinar pareja de cada jugador para el mensaje
  const parejaDe = (id: string) => {
    const otros = cuatro.filter((p) => p.id !== id)
    return otros[0]
  }

  for (const p of cuatro) {
    const iv = randomUUID()
    db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id) VALUES (?, ?, ?)`).run(iv, matchId, p.id)
    const pareja = parejaDe(p.id)
    const msg = buildInviteMessage(p.name, pareja.name, pareja.categoria, date, hora, courtName)
    // Enviar por GoWA (device del club). No bloquea la creación si falla el envío.
    const sent = await sendWhatsApp(p.phone, msg)
    resultados.push({ id: iv, player: p.name, categoria: p.categoria, es_nuevo: p.es_nuevo, whatsapp: sent.ok ? 'enviado' : `fallo: ${sent.error}` })
  }

  res.status(201).json({
    open_match_id: matchId,
    slot: slotId,
    gowa_device: getGowaConfig().deviceId,
    parejaA: partido.parejaA.map((p) => ({ name: p.name, categoria: p.categoria, es_nuevo: p.es_nuevo })),
    parejaB: partido.parejaB.map((p) => ({ name: p.name, categoria: p.categoria, es_nuevo: p.es_nuevo })),
    invitaciones: resultados,
  })
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
  const rows = db.prepare(`SELECT id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados, ausencias FROM players WHERE club_id = ? ORDER BY dias_sin_jugar DESC`).all(clubId)
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
      SELECT mi.id, mi.status, p.name, p.categoria, p.es_nuevo
      FROM match_invitations mi JOIN players p ON p.id = mi.player_id
      WHERE mi.open_match_id = ?
    `).all(m.id)
    const accepted = invites.filter((i: any) => i.status === 'aceptada').length
    return { ...m, capacity: 4, invites, accepted }
  })
  res.json({ matches: enriched })
})

// ---------- Cambiar estado de un slot (el dashboard hace clic en la grilla) ----------
app.patch(`${API_PREFIX}/courts/:courtId/slot`, requireAuth, (req, res) => {
  const courtId = String(req.params.courtId)
  const { time, status } = req.body
  if (!time || !status) return res.status(400).json({ error: 'time y status requeridos' })

  // Buscar slot de esa cancha en esa hora (hoy o futuro)
  const slot = db.prepare(`
    SELECT s.id FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.id = ? AND substr(s.starts_at,12,5) = ?
    ORDER BY s.starts_at DESC LIMIT 1
  `).get(courtId, String(time)) as any
  if (!slot) return res.status(404).json({ error: 'Slot no encontrado para esa cancha/hora' })

  const statusMap: Record<string, string> = {
    free: 'libre', reserved: 'reservada', open_match: 'partido_abierto',
  }
  const dbStatus = statusMap[status] || status
  db.prepare(`UPDATE slots SET status = ? WHERE id = ?`).run(dbStatus, slot.id)
  res.json({ ok: true, slot_id: slot.id, status: dbStatus })
})

// ---------- Autocompletar partido: invitar al mejor candidato pendiente ----------
app.post(`${API_PREFIX}/matchmaking/:id/complete`, requireAuth, async (req, res) => {
  const match = db.prepare(`SELECT * FROM open_matches WHERE id = ?`).get(String(req.params.id)) as any
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' })

  // Jugador con mejor match score no invitado aún
  const candidato = db.prepare(`
    SELECT p.* FROM players p
    WHERE p.club_id = (SELECT c.club_id FROM slots s JOIN courts c ON c.id=s.court_id WHERE s.id=?)
      AND p.id NOT IN (SELECT player_id FROM match_invitations WHERE open_match_id=?)
      AND p.es_nuevo = 0
    ORDER BY p.dias_sin_jugar DESC LIMIT 1
  `).get(match.slot_id, match.id) as any
  if (!candidato) return res.status(400).json({ error: 'No hay candidatos disponibles' })

  const invId = randomUUID()
  db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id, status) VALUES (?, ?, ?, 'pendiente')`)
    .run(invId, match.id, candidato.id)
  if (candidato.phone) await sendWhatsApp(candidato.phone, `🎾 ¡Hola ${candidato.name}! Quedó un cupo para un partido.\n¿Juegas?\nResponde SI o NO.`)
  res.status(201).json({ ok: true, invitacion_id: invId, jugador: { name: candidato.name, categoria: candidato.categoria } })
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

// ---------- Responder invitación (paso 5 y 6 del prototipo) ----------
app.post(`${API_PREFIX}/matchmaking/invite/:id/respond`, requireAuth, (req, res) => {
  const status = String(req.body?.status ?? '')
  const invId = String(req.params.id)
  const inv = db.prepare(`SELECT mi.*, p.es_nuevo, p.name, p.categoria, om.slot_id, om.id AS open_match_id, c.club_id
    FROM match_invitations mi
    JOIN players p ON p.id = mi.player_id
    JOIN open_matches om ON om.id = mi.open_match_id
    JOIN slots sl ON sl.id = om.slot_id
    JOIN courts c ON c.id = sl.court_id
    WHERE mi.id = ?`).get(invId) as any
  if (!inv) return res.status(404).json({ error: 'Invitación no encontrada' })
  if (!['aceptada', 'rechazada'].includes(status)) {
    return res.status(400).json({ error: 'status debe ser aceptada o rechazada' })
  }
  db.prepare(`UPDATE match_invitations SET status = ? WHERE id = ?`).run(status, invId)
  if (status === 'rechazada') {
    db.prepare(`UPDATE players SET ausencias = ausencias + 1 WHERE id = ?`).run(inv.player_id)
  }

  // Contar aceptadas
  const aceptadas = db.prepare(`SELECT COUNT(*) AS n FROM match_invitations WHERE open_match_id = ? AND status='aceptada'`).get(inv.open_match_id) as any

  if (status === 'rechazada') {
    // Buscar reemplazo de nivel similar sin sacar al 6ª
    const todosEnPartido = db.prepare(`SELECT player_id FROM match_invitations WHERE open_match_id = ?`).all(inv.open_match_id).map((r: any) => r.player_id)
    const reemplazo = buscarReemplazo(inv.club_id, inv as any, todosEnPartido)
    if (reemplazo) {
      const invId = randomUUID()
      db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id) VALUES (?, ?, ?)`).run(invId, inv.open_match_id, reemplazo.id)
      return res.json({
        rechazado: inv.name, status,
        reemplazo: { id: reemplazo.id, name: reemplazo.name, categoria: reemplazo.categoria },
        aceptadas: aceptadas.n,
      })
    }
    return res.json({ rechazado: inv.name, status, reemplazo: null, aceptadas: aceptadas.n })
  }

  res.json({ status, aceptadas: aceptadas.n })
})

// ---------- Confirmar partido (paso 7) ----------
app.post(`${API_PREFIX}/matchmaking/:id/confirm`, requireAuth, (req, res) => {
  const match = db.prepare(`SELECT * FROM open_matches WHERE id = ?`).get(String(req.params.id)) as any
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' })
  const aceptadas = db.prepare(`SELECT COUNT(*) AS n FROM match_invitations WHERE open_match_id = ? AND status='aceptada'`).get(match.id) as any
  if (aceptadas.n < 4) return res.status(400).json({ error: `Faltan ${4 - aceptadas.n} confirmaciones` })

  // Marcar partido confirmado + slot reservada + crear matches
  db.prepare(`UPDATE open_matches SET status = 'confirmado' WHERE id = ?`).run(match.id)
  db.prepare(`UPDATE slots SET status = 'reservada' WHERE id = ?`).run(match.slot_id)
  res.json({ ok: true, status: 'confirmado', jugadores: 4 })
})

// ---------- Registrar resultado (paso 8) ----------
app.post(`${API_PREFIX}/matches`, requireAuth, (req, res) => {
  const { open_match_id, score, winner } = req.body
  if (!open_match_id || !score || !winner) return res.status(400).json({ error: 'open_match_id, score y winner requeridos' })

  const om = db.prepare(`SELECT * FROM open_matches WHERE id = ?`).get(open_match_id) as any
  if (!om) return res.status(404).json({ error: 'Partido abierto no encontrado' })
  const invs = db.prepare(`SELECT mi.player_id, p.name, p.es_nuevo FROM match_invitations mi JOIN players p ON p.id=mi.player_id WHERE mi.open_match_id=? AND mi.status='aceptada'`).all(open_match_id) as any[]
  if (invs.length < 4) return res.status(400).json({ error: 'Faltan jugadores confirmados' })

  const [a1, a2, b1, b2] = invs
  const slot = db.prepare(`SELECT c.club_id FROM slots s JOIN courts c ON c.id = s.court_id WHERE s.id = ?`).get(om.slot_id) as any
  const matchId = randomUUID()
  db.prepare(`INSERT INTO matches (id, club_id, slot_id, team_a1, team_a2, team_b1, team_b2, score, winner, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'jugado')`)
    .run(matchId, slot.club_id, om.slot_id, a1.player_id, a2.player_id, b1.player_id, b2.player_id, score, winner)

  // Sumar ganados a los de la pareja ganadora, ausencias +1 a los que no jugaron? No: ausencias se cuenta en rechazo.
  const ganadores = winner === 'A' ? [a1, a2] : [b1, b2]
  const perdedores = winner === 'A' ? [b1, b2] : [a1, a2]
  for (const g of ganadores) db.prepare(`UPDATE players SET ganados = ganados + 1 WHERE id = ?`).run(g.player_id)

  // Registrar resultado en match_player_results (racha / coaching)
  try {
    registerMatchResult({
      clubId: slot.club_id,
      matchId: matchId,
      winnerPlayerIds: ganadores.map((g) => g.player_id),
      loserPlayerIds: perdedores.map((g) => g.player_id),
      score,
      playedAt: new Date().toISOString(),
    })
  } catch (e) { console.error('registerMatchResult error:', e) }

  // Liberar cancha y cerrar partido
  db.prepare(`UPDATE slots SET status = 'libre' WHERE id = ?`).run(om.slot_id)
  db.prepare(`UPDATE open_matches SET status = 'cancelado' WHERE id = ?`).run(open_match_id)

  res.status(201).json({ match_id: matchId, score, winner, ganadores: ganadores.map((g) => g.name) })
})

// ---------- Estadísticas (paso 9) ----------
app.get(`${API_PREFIX}/stats`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const players = db.prepare(`SELECT id, name, categoria, nivel, ganados, ausencias, dias_sin_jugar FROM players WHERE club_id = ? ORDER BY ganados DESC`).all(clubId)
  const partidosMes = db.prepare(`SELECT COUNT(*) AS n FROM matches WHERE club_id = ? AND status='jugado' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get(clubId) as any
  res.json({ players, partidosMes: partidosMes.n })
})

// ============================================================
// FASE 3 — COACH / RACHAS / PROGRESO / RETENCIÓN (diferenciador)
// ============================================================

// Rachas y estado de un jugador
app.get(`${API_PREFIX}/coach/player/:id/streak`, requireAuth, (req, res) => {
  const playerId = String(req.params.id)
  const streak = getPlayerStreak(playerId)
  res.json({ player_id: playerId, ...streak })
})

// Racha/desempeño con una pareja específica
app.get(`${API_PREFIX}/coach/player/:id/partner/:partnerId`, requireAuth, (req, res) => {
  const result = getPartnerStruggle(String(req.params.id), String(req.params.partnerId))
  res.json(result)
})

// Progreso + retención del jugador (frecuencia, días sin jugar, riesgo abandono)
app.get(`${API_PREFIX}/coach/player/:id/progress`, requireAuth, (req, res) => {
  const progress = getPlayerProgress(String(req.params.id))
  if (!progress) return res.status(404).json({ error: 'Jugador no encontrado' })
  res.json(progress)
})

// Recomendar cambio de pareja por racha perdedora
app.get(`${API_PREFIX}/coach/player/:id/recommend-partner`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const playerId = String(req.params.id)
  const { partner_id } = req.query as { partner_id?: string }
  if (!partner_id) return res.status(400).json({ error: 'parametro partner_id requerido (pareja actual)' })
  const rec = recommendPartnerChange(playerId, clubId, partner_id)
  res.json(rec)
})

// Plan de progreso personalizado del jugador (ficha + historial)
app.get(`${API_PREFIX}/coach/player/:id/plan`, requireAuth, (req, res) => {
  const plan = crearPlanProgreso(String(req.params.id))
  if (!plan) return res.status(404).json({ error: 'Jugador no encontrado o sin historial' })
  res.json(plan)
})

// Buscar jugadores por nivel (matchmaking por categoría)
app.get(`${API_PREFIX}/coach/find-by-level`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const { nivel } = req.query as { nivel?: string }
  if (!nivel) return res.status(400).json({ error: 'parametro nivel requerido (3ª, 4ª, 5ª o 6ª)' })
  const matching = findPlayersByLevel(clubId, nivel)
  res.json({ nivel, jugadores: matching })
})

// ---------- Actividad del agente (resumen de lo que hizo el bot por club) ----------
// Multi-tenant: filtra por clubId del token. Agrupa los eventos de hoy + últimos 7 días.
app.get(`${API_PREFIX}/agent/activity`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser

  // Conteo de eventos HOY (por tipo)
  const hoy = db.prepare(`
    SELECT event, COUNT(*) AS n FROM bot_events
    WHERE club_id = ? AND date(created_at) = date('now', 'localtime')
    GROUP BY event
  `).all(clubId) as any[]
  const hoyMap: Record<string, number> = {}
  for (const r of hoy) hoyMap[r.event] = r.n

  // Conteo de eventos últimos 7 días
  const semana = db.prepare(`
    SELECT event, COUNT(*) AS n FROM bot_events
    WHERE club_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY event
  `).all(clubId) as any[]
  const semanaMap: Record<string, number> = {}
  for (const r of semana) semanaMap[r.event] = r.n

  // Timeline: últimos 15 eventos del agente (con jugador si lo hay)
  const timeline = db.prepare(`
    SELECT be.event, be.data, be.created_at, p.name AS player_name
    FROM bot_events be
    LEFT JOIN players p ON p.id = be.player_id
    WHERE be.club_id = ? AND be.event IN ('mensaje','reserva_ok','invitacion_si','invitacion_no','invitacion_expirada','bot_paused','bot_activated','unirse_partido')
    ORDER BY be.id DESC LIMIT 15
  `).all(clubId) as any[]

  res.json({
    club_id: clubId,
    hoy: hoyMap,
    ultimos7dias: semanaMap,
    // KPIs legibles del agente
    resumen_hoy: {
      conversaciones: hoyMap['mensaje'] || 0,
      reservas_gestionadas: hoyMap['reserva_ok'] || 0,
      invitaciones_aceptadas: hoyMap['invitacion_si'] || 0,
      invitaciones_rechazadas: hoyMap['invitacion_no'] || 0,
      total_eventos: (hoy as any[]).reduce((s, r) => s + r.n, 0),
    },
    timeline,
  })
})

// ---------- AutoFill FASE A: detectar oportunidades (canchas libres con jugadores suficientes) ----------
// El admin ve las oportunidades y aprueba. NO crea partidos solo aún (FASE B lo hará).
app.get(`${API_PREFIX}/autofill/oportunidades`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const today = new Date().toISOString().slice(0, 10)

  // Canchas libres hoy (horario valle tipicamente 12:00-19:00 en L-V)
  const libres = db.prepare(`
    SELECT s.id, s.starts_at, s.price, c.name AS court_name
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ? AND s.status = 'libre'
    ORDER BY s.starts_at
  `).all(clubId, `${today}%`)

  // Jugadores disponibles (sin invitación pendiente) ordenados por match score
  const players = db.prepare(`
    SELECT p.* FROM players p
    WHERE p.club_id = ?
  `).all(clubId) as any[]

  const oportunidades = libres.map((slot: any) => {
    // Estimar nivel objetivo: media de categorías de los jugadores candidatos (4ª ~ nivel 3)
    const candidatos = rankCandidates(players, {
      nivelObjetivo: 4, // ~nivel medio 3.0
      rangoNivel: 1,
      disponible: true,
      diasDesdeUltimo: slot ? 0 : 0,
      historialAcepta: 0.7,
      preferenciasOk: true,
    })
    const suficientes = candidatos.length >= 4
    return {
      slot_id: slot.id,
      court_name: slot.court_name,
      starts_at: slot.starts_at,
      price: slot.price,
      jugadores_compatibles: candidatos.slice(0, 8).map((c) => ({ name: c.player.name, categoria: c.player.categoria, score: c.score })),
      puede_armar_partido: suficientes,
      partidos_posibles: Math.floor(candidatos.length / 4),
    }
  }).filter((o) => o.puede_armar_partido)

  res.json({ oportunidades })
})

// ---------- Expirar invitaciones vencidas (tiempo de respuesta) ----------
// Invitaciones que llevan más de X minutos pendientes → se marcan expiradas y se busca reemplazo.
app.post(`${API_PREFIX}/matchmaking/expirar`, requireAuth, async (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const limiteMin = Number(req.body?.minutos) || 15

  // Invitaciones pendientes con más de 'limiteMin' minutos (usa created_at en UTC)
  const vencidas = db.prepare(`
    SELECT mi.id, mi.player_id, mi.open_match_id
    FROM match_invitations mi
    JOIN open_matches om ON om.id = mi.open_match_id
    JOIN slots sl ON sl.id = om.slot_id
    JOIN courts c ON c.id = sl.court_id
    WHERE mi.status = 'pendiente' AND c.club_id = ?
      AND (strftime('%s','now') - strftime('%s', mi.created_at)) > ?
  `).all(clubId, limiteMin * 60) as any[]

  let expiradas = 0
  for (const inv of vencidas) {
    db.prepare(`UPDATE match_invitations SET status='expirada' WHERE id=?`).run(inv.id)
    logBotEvent('', 'invitacion_expirada', { invId: inv.id })
    expiradas++
  }
  res.json({ expiradas, limite_minutos: limiteMin })
})

// ---------- Ranking por Match Score para un slot ----------
// Dado un slot, devuelve los jugadores compatibles ordenados por score.
app.get(`${API_PREFIX}/matchmaking/:id/candidatos`, requireAuth, (req, res) => {
  const { clubId } = (req as any).authUser as AuthUser
  const slotId = String(req.params.id)
  const slot = db.prepare(`SELECT c.club_id FROM slots s JOIN courts c ON c.id=s.court_id WHERE s.id=?`).get(slotId) as any
  if (!slot || slot.club_id !== clubId) return res.status(404).json({ error: 'Slot no encontrado' })

  const players = db.prepare(`SELECT * FROM players WHERE club_id=?`).all(clubId) as any[]
  // Excluir jugadores que ya tienen invitación aceptada en un partido abierto (para no sobre-invitar)
  const ranking = rankCandidates(players, {
    nivelObjetivo: 4,
    rangoNivel: 1,
    disponible: true,
    diasDesdeUltimo: 0,
    historialAcepta: 0.7,
    preferenciasOk: true,
  })
  res.json({ candidatos: ranking.slice(0, 10).map((r) => ({ name: r.player.name, categoria: r.player.categoria, score: r.score, breakdown: r.breakdown })) })
})

// ---------- Webhook GoWA (entrada WhatsApp del bot) ----------
// Helper: el texto ya pide directamente disponibilidad (canchas/partidos/horarios/reservar).
// Si es así, NO mostrar el menú (evita interceptar una consulta natural con el saludo).
function consultaPrevia(text: string): boolean {
  return /(CANCHA|PARTIDO|HORARIO|DISPONIB|JUEGO|RESERVAR|QUE HAY)/.test(text)
}

app.post(`${API_PREFIX}/webhook/gowa`, async (req, res) => {
  res.status(200).json({ ok: true })
  const msg = req.body as any
  const p = msg?.payload || msg || {}

  // ── FILTRO DE RUIDO ──
  // Ignorar: eventos no-message (ack/reaction/presence), mensajes propios, y grupos (@g.us).
  if (msg?.event && msg.event !== 'message') return
  if (msg?.is_from_me === true) return
  const chatId = String(p?.chat_id || msg?.chat_id || '')
  // chat_id de grupo termina en @g.us; un DM es @s.whatsapp.net
  if (chatId.includes('@g.us')) return

  // Solo loggear mensajes relevantes (DM del bot), no todo el tráfico
  const from = p?.from || msg?.from || msg?.sender?.id || p?.chat_id || ''
  const rawText = String(p?.body || p?.text || msg?.body || msg?.text || msg?.message || '')
  if (from && rawText.trim()) {
    console.log(`[webhook] DM ${from} (${msg?.id || p?.id || 'no-id'}): ${rawText.trim().slice(0, 50)}`)
  }

  const text = rawText.trim().toUpperCase()
  if (!from || !text) return

  const fromDigits = from.replace(/[^0-9]/g, '')
  const jid = `${fromDigits}@s.whatsapp.net`
  const textoAdmin = text

  // Comandos del admin (solo para números de confianza) para pausar/reactivar
  const ADMIN_PHONES = ['56994912874', '56939688275', '56953316685'] // papá, DonGeeo, mamá
  const esAdmin = ADMIN_PHONES.includes(fromDigits)
  if (esAdmin && (textoAdmin === 'BOT OFF' || textoAdmin === 'PAUSAR BOT')) { setBotEnabled(false); await sendWhatsApp(jid, '🔕 Bot pausado. Para reactivar escribe BOT ON.'); logBotEvent(fromDigits, 'bot_paused', {}); return }
  if (esAdmin && (textoAdmin === 'BOT ON' || textoAdmin === 'ACTIVAR BOT')) { setBotEnabled(true); await sendWhatsApp(jid, '🔔 Bot activado.'); logBotEvent(fromDigits, 'bot_activated', {}); return }

  // ── INTERRUPTOR GLOBAL ──
  // Si el bot está pausado, no responder a nadie (solo responde 200 para ack).
  if (!isBotEnabled()) {
    if (esAdmin && (textoAdmin === 'BOT ON' || textoAdmin === 'ACTIVAR BOT')) { setBotEnabled(true); logBotEvent(fromDigits, 'bot_activated', {}); return }
    console.log(`[bot-pausado] ignorado mensaje de ${fromDigits}`)
    return
  }

  // ── P0: Idempotencia — si este mensaje ya fue procesado, no repetir acción.
  const messageId = msg?.id || p?.id || ''
  if (messageId && isDuplicateMessage(messageId)) {
    logBotEvent(from, 'duplicado', { messageId })
    return
  }

  // Resolver jugador por número (reconocimiento del socio por su número de WhatsApp)
  const player = db.prepare(`SELECT * FROM players WHERE REPLACE(REPLACE(REPLACE(phone,'+',''),' ',''),'-','') = ? OR phone LIKE ?`).get(fromDigits, `%${fromDigits.slice(-9)}%`) as any
  if (!player) return
  logBotEvent(fromDigits, 'mensaje', { text: rawText.slice(0, 50), club_id: player.club_id, player_id: player.id })

  // ── ONBOARDING DEL SOCIO (FICHA) ──
  // Reconoce al socio por número; si es nuevo o sin ficha, inicia la captura de datos en español.
  const sesionActual = getSession(fromDigits)

  // Máquina de pasos de ficha: [nombre_campo, pregunta]
  const FICHA_PASOS: Array<[string, (nombre: string) => string]> = [
    ['categoria_deseada', (n) => `🎾 ¡Perfecto, ${n}! Primero, para armarte un plan de progreso personalizado:\n\n¿A qué categoría aspiras?\n• 3ª (avanzado)\n• 4ª (medio-alto)\n• 5ª (medio)\n• 6ª (nuevo)\n\nResponde la categoría (ej. "4ª") o escribe "saltar"`],
    ['modalidad', () => `¿Sueles jugar solo (con pareja) o en pareja fija?\n\n• solo\n• pareja fija\n• cualquiera`],
    ['horario_preferido', () => `¿Hora del día prefieres jugar?\n\n• mañana\n• tarde\n• noche\n• cualquiera`],
    ['dias_preferidos', () => `¿Qué días de la semana prefieres?\n\n• entre semana\n• fin de semana\n• cualquiera`],
    ['experiencia', () => `¿Cuánta experiencia tienes jugando pádel?\n\n• nunca\n• poco\n• intermedio\n• avanzado`],
    ['objetivo', () => `¿Cuál es tu objetivo?\n\n• divertirme\n• competir\n• subir de nivel\n• conocer gente`],
  ]

  // Estado: capturando un campo de la ficha. El payload.paso indica qué campo captura la RESPUESTA
  // que llegó ahora. La pregunta para ese campo ya fue enviada en el turno anterior.
  if (sesionActual && sesionActual.state === 'onboarding_ficha') {
    const idx = Number((sesionActual.payload ? JSON.parse(sesionActual.payload as string) : {}).paso || 0)
    const nombre = player.name || 'socio'
    // idx es el campo que capturamos con la respuesta actual
    const campo = FICHA_PASOS[idx]?.[0]
    if (campo) {
      // Guardar la respuesta recibida
      const valor = (text === 'SALTAR' || text === 'SKIP') ? null : text
      db.prepare(`UPDATE players SET ${campo} = ?, updated_at = datetime('now') WHERE id = ?`).run(valor, player.id)
      // Avanzar al siguiente campo
      const sig = idx + 1
      if (sig >= FICHA_PASOS.length) {
        // Ficha completa → marcar
        db.prepare(`UPDATE players SET ficha_completa = 1, coach_activo = 1, updated_at = datetime('now') WHERE id = ?`).run(player.id)
        deleteSession(fromDigits)
        logBotEvent(fromDigits, 'ficha_completada', { club_id: player.club_id, player_id: player.id })
        await sendWhatsApp(jid, `✅ ¡Listo, ${nombre}! Tu ficha de socio quedó armada 🎾📝\n\nYa sé tu categoría, modalidad, horarios y objetivo.\n\n¿Quieres que armemos tu plan de progreso?\n\n• "menu" para ver el menú principal\n• "plan" para armar tu plan de progreso`)
        markMessageProcessed(messageId, fromDigits, 'ficha_completada')
        return
      }
      // Enviar la pregunta del siguiente campo y guardar el nuevo paso
      setSession(fromDigits, player.club_id, 'onboarding_ficha', { paso: sig })
      await sendWhatsApp(jid, FICHA_PASOS[sig][1](nombre))
      markMessageProcessed(messageId, fromDigits, `ficha_paso_${sig}`)
      return
    }
  }

  // Estado: onboarding iniciado pero preguntando el nombre
  if (sesionActual && sesionActual.state === 'onboarding_nombre') {
    if (text !== 'SKIP' && text !== 'SALTAR') {
      db.prepare(`UPDATE players SET name = ?, updated_at = datetime('now') WHERE id = ?`).run(text, player.id)
    }
    // Iniciar captura de ficha (paso 0 = categoria)
    setSession(fromDigits, player.club_id, 'onboarding_ficha', { paso: 0 })
    const nombre = (text !== 'SKIP' && text !== 'SALTAR') ? text : (player.name || 'nuevo socio')
    await sendWhatsApp(jid, FICHA_PASOS[0][1](nombre))
    markMessageProcessed(messageId, fromDigits, 'ficha_inicio')
    return
  }

  // Si el socio NO tiene la ficha completa, iniciar onboarding
  const fichaCompleta = player.ficha_completa === 1
  const yaEsConocido = player.name && player.name !== 'nuevo'
  if (!fichaCompleta && !sesionActual) {
    if (!yaEsConocido || player.name === 'nuevo') {
      setSession(fromDigits, player.club_id, 'onboarding_nombre', {})
      await sendWhatsApp(jid, `¡Hola! 👋 Bienvenido al club 🎾\n\nSoy CanchaLlena, tu agente del club. Me encargaré de tus reservas, partidos y de ayudarte a progresar en la cancha.\n\nPara conocerte mejor, ¿cómo te llamas? (Escribe tu nombre)`)
      markMessageProcessed(messageId, fromDigits, 'onboarding_bienvenida')
      return
    }
    // Socio conocido pero sin ficha → iniciar captura directo
    setSession(fromDigits, player.club_id, 'onboarding_ficha', { paso: 0 })
    await sendWhatsApp(jid, `🎾 ¡Hola, ${player.name}! Quiero conocerte mejor para armarte un plan de progreso.\n\n` + FICHA_PASOS[0][1](player.name))
    markMessageProcessed(messageId, fromDigits, 'ficha_inicio')
    return
  }

  // ── FLUJO 1: ¿Hay una invitación pendiente para este jugador? Entonces SI/NO.
  const inv = db.prepare(`SELECT mi.id, mi.open_match_id, mi.status FROM match_invitations mi WHERE mi.player_id = ? AND mi.status='pendiente' ORDER BY mi.created_at DESC LIMIT 1`).get(player.id) as any

  if (inv) {
    const isSi = text === 'S' || text.includes('SI') || text === 'SÍ' || text === 'YES'
    const isNo = text === 'N' || text.includes('NO')
    if (isSi) {
      db.prepare(`UPDATE match_invitations SET status='aceptada' WHERE id=?`).run(inv.id)
      logBotEvent(fromDigits, 'invitacion_si', { invId: inv.id, club_id: player.club_id, player_id: player.id })
      const aceptadas = db.prepare(`SELECT COUNT(*) AS n FROM match_invitations WHERE open_match_id=? AND status='aceptada'`).get(inv.open_match_id) as any
      const faltan = 4 - aceptadas.n
      const cupoMsg = faltan > 0
        ? `Listo, confirmamos tu lugar 🎾 (${aceptadas.n}/4 confirmados).\nFaltan ${faltan} jugador${faltan === 1 ? '' : 'es'} para completar.`
        : `¡Partido COMPLETO! 🎾\nLos 4 jugadores confirmados.\nNos vemos en la cancha. 🏟️`
      await sendWhatsApp(jid, `¡Listo, ${player.name}! ${cupoMsg}`)
      markMessageProcessed(messageId, fromDigits, 'invitacion_si')
    } else if (isNo) {
      db.prepare(`UPDATE match_invitations SET status='rechazada' WHERE id=?`).run(inv.id)
      db.prepare(`UPDATE players SET ausencias = ausencias + 1 WHERE id = ?`).run(player.id)
      logBotEvent(fromDigits, 'invitacion_no', { invId: inv.id, club_id: player.club_id, player_id: player.id })
      const todosEnPartido = db.prepare(`SELECT player_id FROM match_invitations WHERE open_match_id = ?`).all(inv.open_match_id).map((r: any) => r.player_id)
      const salio = db.prepare(`SELECT * FROM players WHERE id = ?`).get(player.id) as any
      const reemplazo = buscarReemplazo(salio.club_id, salio, todosEnPartido)
      let reemplazoMsg = ''
      if (reemplazo) {
        const invId = randomUUID()
        db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id) VALUES (?, ?, ?)`).run(invId, inv.open_match_id, reemplazo.id)
        await sendWhatsApp(reemplazo.phone,
          `¡Hola ${reemplazo.name}! 🎾\nQuedó un cupo para un partido.\n¿Juegas?\nResponde SI o NO.`)
        reemplazoMsg = `\nYa estamos contactando a otro jugador para tu lugar.`
      }
      await sendWhatsApp(jid, `Sin problema, ${player.name} 🙌${reemplazoMsg}\n¡Te avisamos si sale otro partido con tu nivel! 👋`)
      markMessageProcessed(messageId, fromDigits, 'invitacion_no')
    }
    // Si respondió otra cosa distinta a SI/NO con invitación pendiente, no hacer nada.
    return
  }

  // ── MENÚ PRINCIPAL (V0.5) ──
  // Si el socio tiene una sesión de menú activa, interpretar 1/2/3/4.
  const sesionMenu = getSession(fromDigits)
  if (sesionMenu && sesionMenu.state === 'menu') {
    if (text === '1') { // Reservar cancha → disponibilidad
      deleteSession(fromDigits)
      // cae al flujo de disponibilidad de abajo
    } else if (text === '2') { // Buscar partido → mostrar partidos abiertos
      deleteSession(fromDigits)
      const abiertos = db.prepare(`
        SELECT om.id, c.name AS court_name, s.starts_at, om.status,
          (SELECT COUNT(*) FROM match_invitations mi WHERE mi.open_match_id=om.id AND mi.status='aceptada') AS aceptados
        FROM open_matches om
        JOIN slots s ON s.id = om.slot_id
        JOIN courts c ON c.id = s.court_id
        WHERE om.status='buscando' AND c.club_id = ?
        ORDER BY s.starts_at LIMIT 5
      `).all(player.club_id)
      if (!abiertos.length) {
        await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nAhora no hay partidos abiertos buscando jugadores.\nTe avisamos cuando se arme uno con tu nivel.`)
        markMessageProcessed(messageId, fromDigits, 'buscar_partido_vacio')
        return
      }
      const lineas = abiertos.map((m: any, i: number) =>
        `${i + 1}. ${m.court_name} · ${new Date(m.starts_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })} ${new Date(m.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h · ${m.aceptados}/4`)
      await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nPartidos abiertos con cupos:\n\n${lineas.join('\n')}\n\nResponde el número del partido para unirte, o escribe "menu" para volver.`)
      markMessageProcessed(messageId, fromDigits, 'buscar_partido')
      // Guardar sesión de "elegir partido" para que la siguiente respuesta (número) se una
      setSession(fromDigits, player.club_id, 'choosing_match', { abiertos })
      return
    } else if (text === '3') { // Mis reservas
      deleteSession(fromDigits)
      const misRes = db.prepare(`
        SELECT r.id, c.name AS court_name, s.starts_at, r.status
        FROM reservations r
        JOIN slots s ON s.id = r.slot_id
        JOIN courts c ON c.id = s.court_id
        WHERE r.player_id = ? ORDER BY s.starts_at DESC LIMIT 5
      `).all(player.id)
      if (!misRes.length) {
        await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nAún no tienes reservas. Escribe "menu" para volver, o "canchas" para ver disponibilidad.`)
        markMessageProcessed(messageId, fromDigits, 'mis_reservas_vacio')
        return
      }
      const lineasRes = misRes.map((r: any) =>
        `• ${r.court_name} · ${new Date(r.starts_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })} ${new Date(r.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h · ${r.status === 'confirmada' ? '✅ confirmada' : r.status}`)
      await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nTus reservas:\n\n${lineasRes.join('\n')}\n\nResponde 0 o "menu" para volver al menú.`)
      markMessageProcessed(messageId, fromDigits, 'mis_reservas')
      return
    } else if (text === '4') { // Mi disponibilidad → cae a disponibilidad
      deleteSession(fromDigits)
    } else if (text === '0' || text.includes('MENU') || text.includes('AYUDA')) {
      // Volver a mostrar el menú
      setSession(fromDigits, player.club_id, 'menu', null)
      await sendWhatsApp(jid, `🎾 ${player.name}, ¿qué deseas hacer?\n\n1 · Reservar cancha\n2 · Buscar partido\n3 · Mis reservas\n4 · Mi disponibilidad`)
      markMessageProcessed(messageId, fromDigits, 'menu')
      return
    } else {
      await sendWhatsApp(jid, `No entendí esa opción 🤔\nResponde 1, 2, 3, 4 o escribe "menu".`)
      return
    }
  }

  // ¿El socio pidió ver el menú? (saludo, ayuda, menú, opciones)
  const pideMenu = /(MENU|AYUDA|OPCIO|INICIO)/.test(text) || (text === 'HOLA')
  if (pideMenu && !consultaPrevia(text)) {
    setSession(fromDigits, player.club_id, 'menu', null)
    await sendWhatsApp(jid,
      `🎾 Hola, ${player.name}!\n\n¿Qué deseas hacer?\n\n` +
      `1 · Reservar cancha\n` +
      `2 · Buscar partido\n` +
      `3 · Mis reservas\n` +
      `4 · Mi disponibilidad\n\n` +
      `También puedes escribirme directo, por ejemplo: "canchas hoy" o "quiero jugar".`)
    markMessageProcessed(messageId, fromDigits, 'menu')
    return
  }

  // ── FLUJO 2: Sin invitación pendiente → consulta disponibilidad o selección de cancha.

  // "0" o "menu" en cualquier sub-flujo → volver al menú principal
  if (text === '0' || text === 'MENU' || text === 'VOLVER') {
    setSession(fromDigits, player.club_id, 'menu', null)
    await sendWhatsApp(jid, `🎾 ${player.name}, ¿qué deseas hacer?\n\n1 · Reservar cancha\n2 · Buscar partido\n3 · Mis reservas\n4 · Mi disponibilidad`)
    markMessageProcessed(messageId, fromDigits, 'menu')
    return
  }

  // ¿El jugador tiene una sesión de "elegir partido" activa? (después de ver partidos abiertos)
  const sesionMatch = getSession(fromDigits)
  if (sesionMatch && sesionMatch.state === 'choosing_match' && sesionMatch.payload) {
    const abiertos = JSON.parse(sesionMatch.payload).abiertos as any[]
    const numSel = parseInt(text.replace(/[^0-9]/g, ''), 10)
    const seleccionado = numSel >= 1 && numSel <= abiertos.length ? abiertos[numSel - 1] : null
    if (!seleccionado) {
      await sendWhatsApp(jid, `No entendí el número del partido 🤔\nEscribe el número que ves en la lista, o "menu" para volver.`)
      return
    }
    // Crear invitación pendiente para este jugador en ese partido abierto
    db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id, status) VALUES (?, ?, ?, 'pendiente')`)
      .run(randomUUID(), seleccionado.id, player.id)
    deleteSession(fromDigits)
    await sendWhatsApp(jid, `¡Listo, ${player.name}! 🎾 Te agregamos al partido de ${seleccionado.court_name}.\nConfirma con SI o NO.\nRecuerda: responde "menu" cuando quieras volver.`)
    markMessageProcessed(messageId, fromDigits, 'unirse_partido')
    return
  }

  // ¿El jugador tiene una sesión activa de selección (le ofrecimos canchas)?
  const sesion = getSession(fromDigits)
  if (sesion && sesion.state === 'choosing_court' && sesion.payload) {
    const ofertadas = JSON.parse(sesion.payload) as any[]
    const numSel = parseInt(text.replace(/[^0-9]/g, ''), 10)
    const seleccionada = numSel >= 1 && numSel <= ofertadas.length
      ? ofertadas[numSel - 1]
      : ofertadas.find((s: any) => text.includes(s.court_name.toUpperCase()) || text.includes(String(new Date(s.starts_at).getHours())))

    // Número inválido / opción no ofrecida → pedir elección válida
    if (!seleccionada) {
      const opciones = ofertadas.map((s: any, i: number) => `${i + 1}. ${s.court_name}`).join('\n')
      await sendWhatsApp(jid, `Hmm, no entendí esa opción 🤔\nEstas son las disponibles:\n\n${opciones}\n\nResponde solo el número, o "menu" para volver.`)
      return
    }

    // ── P0: Reserva anti-doble (transacción atómica) — solo un ganador por slot.
    const ok = tryReserveSlot(player.club_id, seleccionada.id, player.id, 'bot', seleccionada.price)
    if (!ok) {
      deleteSession(fromDigits)
      await sendWhatsApp(jid, `😔 Ese horario fue reservado justo antes que tú.\nElige otra opción, o "menu" para volver.`)
      return
    }
    deleteSession(fromDigits)
    logBotEvent(fromDigits, 'reserva_ok', { slot: seleccionada.id, club_id: player.club_id, player_id: player.id })
    const esHoy = new Date(seleccionada.starts_at).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
    const fechaReserva = esHoy
      ? `Hoy ${new Date(seleccionada.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h`
      : `${new Date(seleccionada.starts_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}, ${new Date(seleccionada.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h`
    await sendWhatsApp(jid,
      `✅ Reserva CONFIRMADA\n\n📅 ${fechaReserva}\n🏟 ${seleccionada.court_name}\n💰 $${Math.round(seleccionada.price).toLocaleString('es-CL')}\n\nTe avisamos cuando falté un cupo para completar el partido.`)
    markMessageProcessed(messageId, fromDigits, 'reserva_cancha')
    return
  }

  // Palabras clave de consulta de disponibilidad
  const consulta = /(CANCHA|PARTIDO|HORARIO|DISPONIB|JUEGO|RESERVAR|QUE HAY|HOLA|OPCIO)/.test(text)
  if (!consulta && text !== '1') return

  // Canchas y horarios libres HOY para el club del jugador
  const today = new Date().toISOString().slice(0, 10)
  const libres = db.prepare(`
    SELECT s.id, s.starts_at, s.price, c.name AS court_name
    FROM slots s JOIN courts c ON c.id = s.court_id
    WHERE c.club_id = ? AND s.starts_at LIKE ? AND s.status = 'libre'
    ORDER BY s.starts_at LIMIT 6
  `).all(player.club_id, `${today}%`)

  if (!libres.length) {
    // No hay nada HOY → buscar la próxima disponibilidad dentro de los próximos 7 días.
    // (No cortar el flujo: se ofrece la siguiente cancha disponible.)
    const hoy = new Date()
    const proximos7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy)
      d.setDate(hoy.getDate() + i + 1)
      return d.toISOString().slice(0, 10)
    })
    const siguientes = db.prepare(`
      SELECT s.id, s.starts_at, s.price, c.name AS court_name
      FROM slots s JOIN courts c ON c.id = s.court_id
      WHERE c.club_id = ?
        AND s.status = 'libre'
        AND (${proximos7.map(() => "s.starts_at LIKE ?").join(' OR ')})
      ORDER BY s.starts_at LIMIT 6
    `).all(player.club_id, ...proximos7.map((d) => `${d}%`))

    if (!siguientes.length) {
      await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nNo hay canchas libres en los próximos días.\nTe avisamos cuando se abra un cupo.`)
      return
    }

    setSession(fromDigits, player.club_id, 'choosing_court', siguientes)
    markMessageProcessed(messageId, fromDigits, 'disponibilidad_proxima')
    const lineasSig = siguientes.map((s: any, i: number) =>
      `${i + 1}. ${s.court_name} · ${new Date(s.starts_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })}, ${new Date(s.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h · $${Math.round(s.price).toLocaleString('es-CL')}`
    )
    await sendWhatsApp(jid,
      `Hola ${player.name}! 🎾\nHoy no hay canchas libres, pero estas son las próximas disponibles:\n\n${lineasSig.join('\n')}\n\nEscribe el número que te interese, o "menu" para volver.`)
    return
  }

  // Guardar lo ofrecido para la siguiente respuesta (sesión persistente con expiración)
  setSession(fromDigits, player.club_id, 'choosing_court', libres)
  markMessageProcessed(messageId, fromDigits, 'disponibilidad_hoy')

  // Construir mensaje legible con canchas disponibles
  const lineas = libres.map((s: any, i: number) =>
    `${i + 1}. ${s.court_name} · ${new Date(s.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} h · $${Math.round(s.price).toLocaleString('es-CL')}`
  )
  await sendWhatsApp(jid, `Hola ${player.name}! 🎾\nEsto es lo que hay disponible HOY:\n\n${lineas.join('\n')}\n\nEscribe el número que te interese (ej. "1"), o "menu" para volver.`)
})

// ============================================================
// DEMO ENGINE — Sandbox de ventas
// Endpoints que el frontend /demo usa para simular situaciones
// sobre el club ficticio 'club-demo'. Sin auth de club (es público de ventas).
// ============================================================

app.get(`${API_PREFIX}/demo/state`, (_req, res) => {
  demo.ensureDemoSlots()
  res.json(demo.getDemoState())
})

// Cada acción de simulación devuelve el evento generado (mensaje del agente + timeline)
app.post(`${API_PREFIX}/demo/act`, async (req, res) => {
  const { action } = req.body as { action?: string }
  if (!action) return res.status(400).json({ error: 'action requerido' })
  let ev: any
  switch (action) {
    case 'reserva':      ev = demo.simulateNewReservation(); break
    case 'disponibilidad': ev = demo.simulateAvailabilityQuery(); break
    case 'crear_partido': ev = demo.simulateCreateMatch(); break
    case 'cancelacion':   ev = demo.simulateCancellation(); break
    default: return res.status(400).json({ error: `acción desconocida: ${action}` })
  }
  // Timeline: registrar en bot_events para trazabilidad del demo
  res.json({ ok: true, event: ev, state: demo.getDemoState() })
})

app.listen(PORT, () => {
  console.log(`✅ CanchaLlena API en http://localhost:${PORT}${API_PREFIX}`)
})
