import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { buscarReemplazo } from './engine.js'
import { sendWhatsApp, buildReplacementMessage } from './gowa.js'

// ============================================================
// Gestor de duplas / parejas — pipeline DETERMINISTA.
// El LLM solo dispara la intención (POST /pairs/iniciar); TODO el flujo
// (invitar candidato, esperar SI/NO, timeout, escalado, avisar al solicitante)
// corre aquí con estados, SIN depender del LLM ni filtrar proceso al socio.
// ============================================================

const ESPERA_MS = 10 * 60 * 1000 // candidato tiene 10 min para responder antes de escalar

// Empieza la búsqueda de un compañero para el solicitante.
// 1) Busca el candidato compatible más afín al nivel del solicitante.
// 2) Le envía la invitación por WhatsApp AL CANDIDATO (no al solicitante).
// 3) Crea pair_request con estado esperando.
export function iniciarDupla(requesterId: string, clubId: string, contexto?: { nivel?: string }): {
  ok: boolean
  parejaSolicitada?: string
  message?: string
  error?: string
} {
  const solicitante = db.prepare(`SELECT * FROM players WHERE id = ? AND club_id = ?`).get(requesterId, clubId) as any
  if (!solicitante) return { ok: false, error: 'solicitante no encontrado' }

  // Buscar candidato compatible: mismo club, distinto del solicitante, prioriza nivel similar
  const catRank: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }
  const nivelSol = catRank[contexto?.nivel || solicitante.categoria] ?? 5
  const candidatos = db.prepare(`SELECT * FROM players WHERE club_id = ? AND id != ? AND es_nuevo = 0`).all(clubId, requesterId) as any[]
  const candidato = candidatos
    .map((c) => ({ perfil: c, dist: Math.abs((catRank[c.categoria] ?? 5) - nivelSol) }))
    .sort((a, b) => a.dist - b.dist)[0]?.perfil

  if (!candidato) return { ok: false, error: 'no hay candidatos disponibles para formar pareja' }

  // Guardar la solicitud (estado esperando)
  const id = randomUUID()
  db.prepare(`INSERT INTO pair_requests (id, club_id, requester_id, candidate_id, status, attempts)
              VALUES (?, ?, ?, ?, 'esperando', 1)`).run(id, clubId, requesterId, candidato.id)

  // Invitar al CANDIDATO por WhatsApp (no al solicitante)
  const msg = buildReplacementMessage(candidato.name, solicitante.name, solicitante.categoria, 'partido', 'horario a convenir')
  sendWhatsApp(candidato.phone, `${msg}\n¿Confirmas para armar la dupla? Responde SI o NO.`)

  logPairEvent(id, 'invitado', candidato.id, clubId)

  return { ok: true, parejaSolicitada: candidato.name }
}

// Procesa la respuesta SI/NO de un CANDIDATO invitable.
// Si SI: confirma la dupla y avisa al solicitante "pareja asegurada".
// Si NO: marca esta solicitud como escalado y busca otro candidato.
export async function responderDupla(candidateId: string, clubId: string, respuesta: 'si' | 'no'): Promise<void> {
  const pair = db.prepare(`
    SELECT pr.*, p.name AS solicitante_nombre, p.phone AS solicitante_phone
    FROM pair_requests pr JOIN players p ON p.id = pr.requester_id
    WHERE pr.candidate_id = ? AND pr.club_id = ? AND pr.status IN ('esperando','escalando')
    ORDER BY pr.created_at DESC LIMIT 1
  `).get(candidateId, clubId) as any
  if (!pair) return

  if (respuesta === 'si') {
    db.prepare(`UPDATE pair_requests SET status='confirmado', confirmed_at=datetime('now') WHERE id=?`).run(pair.id)
    logPairEvent(pair.id, 'confirmado', candidateId, clubId)
    // Avisar AL SOLICITANTE (recién aquí, con el resultado)
    const msg = `🎾 ¡Buenas noticias, ${pair.solicitante_nombre}! Conseguimos pareja: ${buscarNombre(candidateId)} confirmó su participación. ¡A jugar!`
    await sendWhatsApp(pair.solicitante_phone, msg)
  } else {
    // Rechazado o timeout -> escalar a otro candidato
    db.prepare(`UPDATE pair_requests SET status='escalando', attempts=attempts+1 WHERE id=?`).run(pair.id)
    logPairEvent(pair.id, 'escalando', candidateId, clubId)
    await escalarDupla(pair)
  }
}

// Escala la búsqueda a otro candidato (excluye los ya intentados). Si no hay más, informa.
async function escalarDupla(pair: any): Promise<void> {
  const usados = db.prepare(`
    SELECT candidate_id FROM pair_requests WHERE id = ?
  `).get(pair.id) as any
  const clubId = pair.club_id
  const solicitante = db.prepare(`SELECT * FROM players WHERE id = ?`).get(pair.requester_id) as any
  const nivelSol = (solicitante && catRank[solicitante.categoria]) || 5

  const candidatos = db.prepare(`SELECT * FROM players WHERE club_id = ? AND es_nuevo = 0`).all(clubId) as any[]
  const elegible = candidatos.find((c) => c.id !== pair.requester_id && c.id !== usados.candidate_id)
  if (!elegible) {
    // No quedan candidatos: avisar al solicitante que no se pudo armar por ahora
    await sendWhatsApp(solicitante.phone, `🙏 ${solicitante?.name}, por ahora no hay más jugadores disponibles. Te aviso si aparece alguien compatible.`)
    db.prepare(`UPDATE pair_requests SET status='rechazado' WHERE id=?`).run(pair.id)
    return
  }
  db.prepare(`UPDATE pair_requests SET candidate_id=?, status='esperando', attempts=attempts+1 WHERE id=?`).run(elegible.id, pair.id)
  const msg = buildReplacementMessage(elegible.name, solicitante.name, solicitante.categoria, 'partido', 'horario a convenir')
  await sendWhatsApp(elegible.phone, `${msg}\n¿Confirmas para armar la dupla? Responde SI o NO.`)
  logPairEvent(pair.id, 'invitado_escalado', elegible.id, clubId)
}

// Timeout: las solicitudes 'esperando' sin respuesta hace >10min se escalan.
export function timeoutDuplas(): number {
  const vencidas = db.prepare(`
    SELECT pr.*, p.phone AS solicitante_phone, p.name AS solicitante_nombre
    FROM pair_requests pr JOIN players p ON p.id = pr.requester_id
    WHERE pr.status IN ('esperando','escalando')
      AND datetime(pr.created_at) < datetime('now', '-10 minutes')
  `).all() as any[]
  let n = 0
  for (const p of vencidas) {
    n++
    escalarDupla(p)
  }
  return n
}

// Estado actual de una solicitud de dupla para que el agente lo consulte sin filtrar proceso.
export function estadoDupla(requesterId: string, clubId: string): { estado: string; pareja?: string } | null {
  const pair = db.prepare(`
    SELECT pr.*, p.name AS candidato_nombre
    FROM pair_requests pr LEFT JOIN players p ON p.id = pr.candidate_id
    WHERE pr.requester_id = ? AND pr.club_id = ? AND pr.status != 'cancelado'
    ORDER BY pr.created_at DESC LIMIT 1
  `).get(requesterId, clubId) as any
  if (!pair) return null
  const estados: Record<string, string> = {
    esperando: 'Buscando compañero, te aviso apenas confirme.',
    escalando: 'Sigo buscando un compañero para ti.',
    confirmado: `¡Tu pareja es ${pair.candidato_nombre}, ya está confirmada!`,
    rechazado: 'Por ahora no hay más jugadores disponibles.',
  }
  return { estado: estados[pair.status] || pair.status, pareja: pair.candidato_nombre || undefined }
}

// helper interno para el nombre de un candidato
function buscarNombre(playerId: string): string {
  const p = db.prepare(`SELECT name FROM players WHERE id = ?`).get(playerId) as any
  return p?.name || 'el compañero'
}

// Log de eventos del gestor de duplas (observabilidad)
function logPairEvent(pairId: string, estado: string, playerId: string, clubId: string): void {
  try {
    db.prepare(`INSERT INTO bot_events (club_id, phone, event, data) VALUES (?, ?, ?, ?)`)
      .run(clubId, playerId, `pair_${estado}`, JSON.stringify({ pair_id: pairId }).slice(0, 300))
  } catch { /* observabilidad no crítica */ }
}

// catRank local (no exportado para no duplicar engine)
const catRank: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }
