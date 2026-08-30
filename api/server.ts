import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { randomUUID } from 'node:crypto'
import { db } from './_lib/db.js'
import { requireAuth, signToken, type AuthUser } from './_lib/auth.js'
import { armarPartido, buscarReemplazo } from './_lib/engine.js'
import { sendWhatsApp, buildInviteMessage, buildReplacementMessage, getGowaConfig } from './_lib/gowa.js'

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
  for (const g of ganadores) db.prepare(`UPDATE players SET ganados = ganados + 1 WHERE id = ?`).run(g.player_id)

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

// ---------- Webhook GoWA (entrada WhatsApp del bot) ----------
// Recibe los mensajes entrantes de los jugadores (vía dongeeo-bot deviceRoutes)
// y procesa las respuestas SI/NO a las invitaciones de partido.
// El device del club tiene que estar enroutado aquí (ver deviceRoutes en dongeeo-bot).
app.post(`${API_PREFIX}/webhook/gowa`, async (req, res) => {
  res.status(200).json({ ok: true })
  const msg = req.body as any
  // Extraer número del jugador y texto — soporta varios formatos de payload GoWA
  const from = msg?.from || msg?.sender?.id || msg?.chat_id || msg?.nested?.key?.remoteJid || msg?.phone || ''
  const rawText = String(msg?.text || msg?.message || msg?.nested?.message?.conversation || msg?.body || '')
  const text = rawText.trim().toUpperCase()
  if (!from || !text) return

  // Buscar invitaciones pendientes de ese jugador (número normalizado, ej 569...
  const fromDigits = from.replace(/[^0-9]/g, '')
  const player = db.prepare(`SELECT id, name FROM players WHERE REPLACE(REPLACE(REPLACE(phone,'+',''),' ',''),'-','') = ? OR phone LIKE ?`).get(fromDigits, `%${fromDigits.slice(-9)}%`) as any
  if (!player) return

  const inv = db.prepare(`SELECT mi.id, mi.open_match_id FROM match_invitations mi WHERE mi.player_id = ? AND mi.status='pendiente' ORDER BY mi.created_at DESC LIMIT 1`).get(player.id) as any
  if (!inv) return

  const isSi = text.includes('SI') || text === 'S'
  const isNo = text.includes('NO')
  const jid = `${fromDigits}@s.whatsapp.net`

  if (isNo) {
    // Marcar rechazada + buscar reemplazo + avisar al jugador con mensaje de cierre
    db.prepare(`UPDATE match_invitations SET status='rechazada' WHERE id=?`).run(inv.id)
    db.prepare(`UPDATE players SET ausencias = ausencias + 1 WHERE id = ?`).run(player.id)
    const todosEnPartido = db.prepare(`SELECT player_id FROM match_invitations WHERE open_match_id = ?`).all(inv.open_match_id).map((r: any) => r.player_id)
    const salio = db.prepare(`SELECT * FROM players WHERE id = ?`).get(player.id) as any
    const reemplazo = buscarReemplazo(salio.club_id, salio, todosEnPartido)
    let reemplazoMsg = ''
    if (reemplazo) {
      const invId = randomUUID()
      db.prepare(`INSERT INTO match_invitations (id, open_match_id, player_id) VALUES (?, ?, ?)`).run(invId, inv.open_match_id, reemplazo.id)
      await sendWhatsApp(reemplazo.phone,
        `¡Hola ${reemplazo.name}! 🎾 Quedó un cupo para un partido. ¿Juegas? Responde SI o NO.`)
      reemplazoMsg = ` Ya estamos contactando a otro jugador para tu lugar.`
    }
    await sendWhatsApp(jid, `Sin problema, ${player.name} 🙌 ${reemplazoMsg}¡Te avisamos si sale otro partido con tu nivel! 👋`)
  } else if (isSi) {
    // Marcar aceptada + avisar + contar cupos
    db.prepare(`UPDATE match_invitations SET status='aceptada' WHERE id=?`).run(inv.id)
    const aceptadas = db.prepare(`SELECT COUNT(*) AS n FROM match_invitations WHERE open_match_id=? AND status='aceptada'`).get(inv.open_match_id) as any
    const faltan = 4 - aceptadas.n
    const cupoMsg = faltan > 0
      ? `Te confirmamos tu lugar en el partido. Faltan ${faltan} jugador${faltan === 1 ? '' : 'es'} para completar.`
      : `¡Partido COMPLETO! Los 4 jugadores confirmados. Nos vemos en la cancha. 🏟️`
    await sendWhatsApp(jid, `¡Listo, ${player.name}! 🎾 ${cupoMsg}`)
  }
})

app.listen(PORT, () => {
  console.log(`✅ CanchaLlena API en http://localhost:${PORT}${API_PREFIX}`)
})
