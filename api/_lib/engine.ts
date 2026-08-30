import { db } from './db.js'

// Motor de emparejamiento — lógica del prototipo bot-padel-simulacion.html
// Reglas del club:
//   1) Los 6ª (nuevos) SIEMPRE juegan, priorizados por dias_sin_jugar
//   2) Cada 6ª va pareado con un mejor (5ª o 4ª): pareja tipo 6ª+mejor
//   3) Si alguien rechaza, se busca reemplazo de nivel similar SIN sacar al 6ª

export interface PlayerRow {
  id: string
  name: string
  phone: string
  categoria: string
  es_nuevo: number
  dias_sin_jugar: number
  nivel: string
  ganados: number
}

export const CATEGORY_RANK: Record<string, number> = { '3ª': 3, '4ª': 4, '5ª': 5, '6ª': 6 }

// Ranking: menor número = mejor nivel (3ª es mejor que 6ª)
function catRank(cat: string): number {
  return CATEGORY_RANK[cat] ?? 6
}

// Orden de prioridad: 6ª (nuevos) primero desc por dias_sin_jugar, luego el resto por antigüedad.
export function queryCandidates(clubId: string): PlayerRow[] {
  return db.prepare(`
    SELECT id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados
    FROM players
    WHERE club_id = ?
    ORDER BY
      CASE WHEN es_nuevo = 1 THEN 0 ELSE 1 END,
      dias_sin_jugar DESC
  `).all(clubId) as unknown as PlayerRow[]
}

// Empareja 4 jugadores en 2 parejas equilibradas, priorizando a los nuevos (6ª).
// Regla del club: cada 6ª SIEMPRE juega y va con un veterano de mejor nivel.
// Devuelve { parejaA: [p1,p2], parejaB: [p3,p4] } o null si no hay 4.
export function armarPartido(clubId: string): {
  parejaA: PlayerRow[]
  parejaB: PlayerRow[]
} | null {
  const candidatos = queryCandidates(clubId)
  if (candidatos.length < 4) return null

  const nuevos = candidatos.filter((p) => p.es_nuevo === 1)
  const veteranos = candidatos.filter((p) => p.es_nuevo !== 1)

  // Caso 1: hay al menos 1 nuevo -> cada nuevo va con un veterano de mejor nivel.
  if (nuevos.length >= 1) {
    // Necesitamos 2 parejas. Preferimos: 2 nuevos c/u con 1 veterano, o 1 nuevo + 3 veteranos.
    const nuevosUsados = nuevos.slice(0, 2)          // hasta 2 nuevos
    const veteranosDisponibles = veteranos.slice(0, 4 - nuevosUsados.length)

    // Ordena veteranos del mejor al peor nivel.
    const veteranosOrdenados = [...veteranosDisponibles].sort((a, b) => catRank(a.categoria) - catRank(b.categoria))

    const parejas: PlayerRow[][] = []
    let idxV = 0
    for (let i = 0; i < nuevosUsados.length; i++) {
      const comp = veteranosOrdenados[idxV++]          // mejor veterano disponible
      parejas.push([nuevosUsados[i], comp])
    }
    // Si sobraron veteranos (caso 1 nuevo con 3 veteranos), la 2ª pareja son veteranos.
    const veteranosRestantes = veteranosOrdenados.slice(idxV)
    if (veteranosRestantes.length >= 2) {
      parejas.push([veteranosRestantes[0], veteranosRestantes[1]])
    }

    if (parejas.length === 2 && parejas.every((p) => p.length === 2)) {
      return { parejaA: parejas[0], parejaB: parejas[1] }
    }
    // Si no alcanzaron parejas nuevas+veterano, fallback simple con los primeros 4.
    const equipo = [...nuevos.slice(0, 2), ...veteranos.slice(0, 2)]
    if (equipo.length === 4) {
      return { parejaA: [equipo[0], equipo[1]], parejaB: [equipo[2], equipo[3]] }
    }
    return null
  }

  // Caso 2: sin nuevos -> parejas por cercanía de nivel (menor diferencia de rank)
  const ordenado = [...veteranos].slice(0, 4).sort((a, b) => catRank(a.categoria) - catRank(b.categoria))
  if (ordenado.length < 4) return null
  return { parejaA: [ordenado[0], ordenado[3]], parejaB: [ordenado[1], ordenado[2]] }
}

// Reemplazo: buscamos un jugador libre de nivel similar al que salió,
// respetando que NUNCA se saca al 6ª del partido.
export function buscarReemplazo(clubId: string, salio: PlayerRow, yaEnPartido: string[]): PlayerRow | null {
  const candidatos = db.prepare(`
    SELECT id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados
    FROM players
    WHERE club_id = ? AND es_nuevo = 0
  `).all(clubId) as unknown as PlayerRow[]

  return candidatos
    .filter((p) => !yaEnPartido.includes(p.id))
    .sort((a, b) => {
      const da = Math.abs(catRank(a.categoria) - catRank(salio.categoria))
      const db = Math.abs(catRank(b.categoria) - catRank(salio.categoria))
      return da - db
    })[0] ?? null
}

// ============================================================
// Match Score (V0.5) — scoring ponderado de compatibilidad de un candidato
// con el perfil objetivo de un partido. Pesos configurables por club.
// ============================================================
export interface MatchScoreWeights {
  nivel: number       // 0-1 fracción del score total
  dias_sin_jugar: number
  disponibilidad: number
  historial: number
  preferencias: number
}
export const DEFAULT_WEIGHTS: MatchScoreWeights = {
  nivel: 0.40, dias_sin_jugar: 0.25, disponibilidad: 0.15, historial: 0.10, preferencias: 0.10,
}

export interface MatchScoreInput {
  player: PlayerRow
  nivelObjetivo: number       // nivel objetivo del partido (ej 3.0)
  rangoNivel: number          // +/- tolerancia de nivel (ej 0.5)
  disponible: boolean         // está disponible en la franja?
  diasDesdeUltimo: number     // días desde su último partido
  historialAcepta: number     // 0-1 tasa de aceptación histórica
  preferenciasOk: boolean     // cumple preferencias del club (horario/nivel)
}

// Devuelve un score 0-100 + desglose por criterio.
export function matchScore(input: MatchScoreInput, weights: MatchScoreWeights = DEFAULT_WEIGHTS): { score: number; breakdown: Record<string, number> } {
  const { player, nivelObjetivo, rangoNivel, disponible, diasDesdeUltimo, historialAcepta, preferenciasOk } = input

  // Nivel: 100 si está dentro del rango objetivo; decae con la distancia fuera del rango.
  const catNum = CATEGORY_RANK[player.categoria] ?? 6
  const dist = Math.abs(catNum - nivelObjetivo)
  const nivelScore = dist <= rangoNivel ? 100 : Math.max(0, 100 - (dist - rangoNivel) * 30)

  // Días sin jugar: favorece a quien más tiempo lleva esperando (más chances de aceptar).
  const diasScore = Math.min(100, diasDesdeUltimo * 20)

  // Disponibilidad: binario.
  const dispScore = disponible ? 100 : 0

  // Historial de aceptación.
  const histScore = historialAcepta * 100

  // Preferencias.
  const prefScore = preferenciasOk ? 100 : 50

  const breakdown = { nivel: nivelScore, dias: diasScore, disponibilidad: dispScore, historial: histScore, preferencias: prefScore }
  const score = Math.round(
    breakdown.nivel * weights.nivel +
    breakdown.dias * weights.dias_sin_jugar +
    breakdown.disponibilidad * weights.disponibilidad +
    breakdown.historial * weights.historial +
    breakdown.preferencias * weights.preferencias
  )

  return { score, breakdown }
}

// Ordena candidatos por match score para un partido objetivo.
export function rankCandidates(players: PlayerRow[], objetivo: Omit<MatchScoreInput, 'player'>, weights?: MatchScoreWeights): { player: PlayerRow; score: number; breakdown: Record<string, number> }[] {
  return players
    .map((p) => {
      const { score, breakdown } = matchScore({ ...objetivo, player: p }, weights)
      return { player: p, score, breakdown }
    })
    .sort((a, b) => b.score - a.score)
}
