import { randomUUID } from 'node:crypto'
import { db } from './db.js'

// ============================================================
// Coach — Rachas, recomendación de pareja, progreso y retención
// Es el DIFFERENCIADOR de CanchaLlena: no solo gestiona, RETIENE al socio.
// ============================================================

// Registra el resultado de una tanda de 4 jugadores.
// Inserta una fila por jugador (2 por equipo: ganador + perdedor).
export function registerMatchResult(input: {
  clubId: string
  matchId?: string
  winnerPlayerIds: string[]   // 2 jugadores (pareja ganadora)
  loserPlayerIds: string[]    // 2 jugadores (pareja perdedora)
  score?: string
  playedAt?: string
}) {
  const { clubId, matchId, winnerPlayerIds, loserPlayerIds, score } = input
  const playedAt = input.playedAt || new Date().toISOString()

  if (winnerPlayerIds.length !== 2 || loserPlayerIds.length !== 2) {
    throw new Error('registerMatchResult espera exactamente 2 ganadores y 2 perdedores')
  }

  // Pareja perdedora = rival de la ganadora y viceversa
  const w1 = winnerPlayerIds[0], w2 = winnerPlayerIds[1]
  const l1 = loserPlayerIds[0], l2 = loserPlayerIds[1]

  const insert = db.prepare(`
    INSERT INTO match_player_results
      (id, club_id, match_id, player_id, partner_id, opponent1_id, opponent2_id, won, score, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const mid = matchId ?? null
  const sc = score ?? null

  // 2 filas: pareja ganadora (won=1)
  insert.run(randomUUID(), clubId, mid, w1, w2, l1, l2, 1, sc, playedAt)
  insert.run(randomUUID(), clubId, mid, w2, w1, l1, l2, 1, sc, playedAt)
  // 2 filas: pareja perdedora (won=0)
  insert.run(randomUUID(), clubId, mid, l1, l2, w1, w2, 0, sc, playedAt)
  insert.run(randomUUID(), clubId, mid, l2, l1, w1, w2, 0, sc, playedAt)

  // Actualizar contador `ganados` del jugador
  for (const w of winnerPlayerIds) {
    db.prepare(`UPDATE players SET ganados = ganados + 1 WHERE id = ?`).run(w)
  }
  return { ok: true }
}

// ------------------------------------------------------------------
// RACHA: partidos consecutivos ganados o perdidos MÁS RECIENTES
// ------------------------------------------------------------------
export function getPlayerStreak(playerId: string) {
  const results = db.prepare(`
    SELECT won FROM match_player_results WHERE player_id = ? ORDER BY played_at DESC
  `).all(playerId) as { won: number }[]

  if (!results.length) return { streakCount: 0, streakType: 'none', wins: 0, losses: 0, totalMatches: 0 }

  const first = results[0].won
  let count = 0
  for (const r of results) {
    if (r.won === first) count++
    else break
  }
  const wins = results.filter((r) => r.won === 1).length
  const losses = results.filter((r) => r.won === 0).length
  return {
    streakCount: count,
    streakType: first === 1 ? 'win' : 'loss',
    wins,
    losses,
    totalMatches: results.length,
  }
}

// ------------------------------------------------------------------
// ¿Racha PERDEDORA con una pareja específica?
// Cuenta los partidos consecutivos perdidos JUGANDO con partner_id
// ------------------------------------------------------------------
export function getPartnerStruggle(playerId: string, partnerId: string) {
  const results = db.prepare(`
    SELECT won FROM match_player_results
    WHERE player_id = ? AND partner_id = ?
    ORDER BY played_at DESC
  `).all(playerId, partnerId) as { won: number }[]

  if (!results.length) return { played: 0, consecutiveLosses: 0, isStruggling: false }

  let consecutiveLosses = 0
  for (const r of results) {
    if (r.won === 0) consecutiveLosses++
    else break
  }
  const played = results.length
  const losses = results.filter((r) => r.won === 0).length
  return {
    played,
    consecutiveLosses,
    totalPartnerLosses: losses,
    // "en problemas" si pierde 2+ seguidos con esa pareja
    isStruggling: consecutiveLosses >= 2,
  }
}

// ------------------------------------------------------------------
// RECOMENDACIÓN DE CAMBIO DE PAREJA
// Si el jugador va en racha perdedora con su pareja actual, encontrar
// una pareja compatible de nivel similar con mejor historial reciente.
// ------------------------------------------------------------------
export function recommendPartnerChange(playerId: string, clubId: string, currentPartnerId: string) {
  const struggle = getPartnerStruggle(playerId, currentPartnerId)
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(playerId) as any

  if (!struggle.isStruggling) {
    return { recommendChange: false, message: `La pareja con ${partnerName(currentPartnerId)} está bien, no es necesario rotar.` }
  }

  // Buscar candidatos: mismo club, no el actual, similar nivel, que NO estén en racha perdedora con el jugador
  const catRank: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }
  const playerCat = catRank[player?.categoria] ?? 4
  const candidates = db.prepare(`
    SELECT * FROM players WHERE club_id = ? AND id != ? AND id != ?
  `).all(clubId, playerId, currentPartnerId) as any[]

  const scored = candidates.map((c) => {
    const cCat = catRank[c.categoria] ?? 4
    const levelDiff = Math.abs(cCat - playerCat)
    const cStreak = getPlayerStreak(c.id)
    const withC = getPartnerStruggle(playerId, c.id)
    // score: mejor si nivel parecido + si la otra pareja gana más que pierde
    let score = 50
    score += Math.max(0, 30 - levelDiff * 10)      // nivel similar suma hasta 30
    score += (cStreak.streakType === 'win' ? 15 : cStreak.streakType === 'loss' ? 5 : 10)
    if (withC.played > 0 && withC.totalPartnerLosses) score -= withC.totalPartnerLosses * 8  // si antes perdía con esa pareja, castiga
    return { player: c, score }
  }).sort((a, b) => b.score - a.score)

  return {
    recommendChange: true,
    rachaPerdedora: struggle.consecutiveLosses,
    conParejaActual: partnerName(currentPartnerId),
    parejaRecomendada: scored[0]?.player?.name || null,
    razon: `Llevas ${struggle.consecutiveLosses} derrotas seguidas con ${partnerName(currentPartnerId)}. Te propongo probar con ${scored[0]?.player?.name || 'otra pareja'} que está en mejor momento.`,
  }
}

// ------------------------------------------------------------------
// PROGRESO / RETENCIÓN del jugador
// Mide evolución, frecuencia de juego y riesgo de abandono.
// ------------------------------------------------------------------
export function getPlayerProgress(playerId: string) {
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(playerId) as any
  if (!player) return null

  const results = db.prepare(`
    SELECT * FROM match_player_results WHERE player_id = ? ORDER BY played_at ASC
  `).all(playerId) as any[]

  const wins = results.filter((r) => r.won === 1).length
  const losses = results.filter((r) => r.won === 0).length
  const total = results.length

  // Frecuencia: partidos en los últimos 30 días
  const last30 = db.prepare(`
    SELECT COUNT(*) AS n FROM match_player_results
    WHERE player_id = ? AND played_at >= datetime('now', '-30 days')
  `).get(playerId) as any
  const matchesLast30 = last30.n

  // Días desde el último partido
  const lastMatch = results[results.length - 1]
  let daysSinceLast = null
  if (lastMatch) {
    const playedAt = new Date(lastMatch.played_at.replace(' ', 'T') + 'Z')
    daysSinceLast = Math.floor((Date.now() - playedAt.getTime()) / 86400000)
  }

  // Riesgo de abandono: >14 días sin jugar = riesgo medio, >30 = alto
  let retentionRisk = 'bajo'
  if (daysSinceLast !== null) {
    if (daysSinceLast >= 30) retentionRisk = 'alto'
    else if (daysSinceLast >= 14) retentionRisk = 'medio'
  }

  const streak = getPlayerStreak(playerId)

  return {
    player: { id: player.id, name: player.name, categoria: player.categoria, nivel: player.nivel },
    totalMatches: total,
    wins,
    losses,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    matchesLast30,
    daysSinceLastMatch: daysSinceLast,
    retentionRisk,
    currentStreak: streak,
  }
}

// ------------------------------------------------------------------
// PLAN DE PROGRESO PERSONALIZADO (FASE 3 — diferenciador)
// Combina la FICHA del socio (categoria, modalidad, horario, objetivo)
// con su HISTORIAL (progreso, rachas, recomendacion de pareja)
// para generar una estrategia unica de mejora y retencion.
// ------------------------------------------------------------------
export function crearPlanProgreso(playerId: string) {
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(playerId) as any
  if (!player) return null

  const progress = getPlayerProgress(playerId)
  if (!progress) return null

  // Datos de la ficha (con defaults para no romper)
  const objetivo = player.objetivo || 'divertirme'
  const modalidad = player.modalidad || 'cualquiera'
  const horarioPref = player.horario_preferido || 'cualquiera'
  const categoria = player.categoria || '6ª'
  const categoriaDeseada = player.categoria_deseada || categoria
  const diasPref = player.dias_preferidos || 'cualquiera'
  const experiencia = player.experiencia || 'nuevo'

  const catRank: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }
  const actual = catRank[categoria] ?? 6
  const deseada = catRank[categoriaDeseada] ?? 6

  // Consejos por objetivo
  const consejosObjetivo: Record<string, string> = {
    'divertirme': 'Prioriza jugar seguido en tu horario preferido y con parejas de tu nivel para disfrutar sin presión. La constancia es lo que más retiene.',
    'competir': 'Busca partidos con rivales un nivel arriba. Registra cada resultado para que el club arme tus partidos con oponentes que te exijan.',
    'subir de nivel': `Para subir de ${categoria} a ${categoriaDeseada}, juega 2 veces por semana y prueba con parejas del nivel superior (${categoriaDeseada}). Pide el match de nivel adecuado.`,
    'conocer gente': 'Únete a partidos abiertos de tu nivel. Es la mejor forma de conocer parejas y rivales regulares.',
  }
  const consejo = consejosObjetivo[objetivo] || consejosObjetivo['divertirme']

  // Consejo por modalidad
  const consejoModalidad = modalidad === 'pareja fija'
    ? 'Al jugar con pareja fija, la química importa: si van en racha perdedora, considera rotar ocasionalmente.'
    : modalidad === 'solo'
    ? 'Al jugar solo (buscando pareja), aprovecha el matchmaking por nivel para encontrar compañeros compatibles.'
    : 'Tu flexibilidad te permite cubrir cupos libres con facilidad, ideal para llenar horarios y jugar más seguido.'

  // Frecuencia recomendada según retención
  let frecuencia = 'Semanal'
  let consejoFrecuencia = ''
  if (progress.daysSinceLastMatch === null || progress.daysSinceLastMatch > 7) {
    frecuencia = '2 veces por semana'
    consejoFrecuencia = `⚠️ No juegas hace ${progress.daysSinceLastMatch ?? 'algo'} días. Para no perder ritmo, te sugiero reservar en tus horarios preferidos (${horarioPref}).`
  } else {
    consejoFrecuencia = `Sigue jugando ${frecuencia.toLowerCase()} para mantener el ritmo y el progreso.`
  }

  return {
    socio: {
      nombre: player.name,
      categoria,
      categoria_deseada: categoriaDeseada,
      modalidad,
      horario_preferido: horarioPref,
      dias_preferidos: diasPref,
      objetivo,
      experiencia,
    },
    historial: {
      partidos: progress.totalMatches,
      ganados: progress.wins,
      perdidos: progress.losses,
      winrate: progress.winRate,
      racha_actual: progress.currentStreak,
      riesgo_retencion: progress.retentionRisk,
    },
    estrategia: {
      frecuencia_recomendada: frecuencia,
      consejo_objetivo: consejo,
      consejo_modalidad: consejoModalidad,
      consejo_frecuencia: consejoFrecuencia,
      recomendacion_pareja: player.name ? buscarRecomendacionPareja(player, catRank) : null,
    },
    mensaje: `🎯 **Plan de progreso para ${player.name}**\n\n` +
      `${consejoFrecuencia}\n\n` +
      `${consejo}\n\n` +
      `${consejoModalidad}\n\n` +
      (player.name ? buscarRecomendacionPareja(player, catRank)?.mensaje || '' : ''),
  }
}

function buscarRecomendacionPareja(player: any, catRank: Record<string, number>) {
  // Encontrar mejor pareja potencial por nivel similar / en racha ganadora
  const clubId = player.club_id
  const candidates = db.prepare(`SELECT * FROM players WHERE club_id = ? AND id != ?`).all(clubId, player.id) as any[]
  const scored = candidates.map((c) => {
    const diff = Math.abs((catRank[c.categoria] ?? 5) - (catRank[player.categoria] ?? 5))
    const streak = getPlayerStreak(c.id)
    let score = 100 - diff * 20
    if (streak.streakType === 'win') score += 15
    return { perfil: c, score, diff }
  }).sort((a, b) => b.score - a.score)

  const mejor = scored[0]
  if (!mejor) return null
  return {
    pareja_sugerida: mejor.perfil.name,
    diferencia_nivel: mejor.diff,
    mensaje: `💡 Tu pareja ideal en el club es **${mejor.perfil.name}** (${mejor.perfil.categoria}). Jugar con ${mejor.perfil.name} puede mejorar tu ritmo de juego.`,
  }
}

// ------------------------------------------------------------------
// BUSCAR PARTIDO POR NIVEL
// Dado el nivel del jugador (3ª-6ª), encuentra jugadores compatibles
// ------------------------------------------------------------------
export function findPlayersByLevel(clubId: string, categoria: string, limit = 10) {
  const catRank: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }
  const target = catRank[categoria] ?? 4
  const players = db.prepare(`SELECT * FROM players WHERE club_id = ?`).all(clubId) as any[]
  const scored = players
    .map((p) => {
      const diff = Math.abs((catRank[p.categoria] ?? 4) - target)
      return { ...p, _compat: Math.max(0, 100 - diff * 25) }
    })
    .sort((a, b) => b._compat - a._compat)
    .slice(0, limit)
  return scored.map(({ _compat, ...p }) => ({ ...p, compatibilidad: _compat }))
}

function partnerName(partnerId: string): string {
  const p = db.prepare(`SELECT name FROM players WHERE id = ?`).get(partnerId) as any
  return p?.name || 'su pareja actual'
}
