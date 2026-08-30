// Matriz de pruebas automatizada del bot CanchaLlena (P0 robustez)
// Uso: BASE=... DB_PATH=... node scripts/matriz-pruebas.mjs
// El webhook responde 200 y procesa async → se espera un tick entre disparo y verificación.
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'

const BASE = process.env.BASE || 'http://localhost:3015/api'
const DB_PATH = process.env.DB_PATH || 'data/canchallena.db'
const db = new DatabaseSync(DB_PATH)

let passed = 0
let failed = 0
function assert(name, cond, detail = '') {
  if (cond) { passed++; console.log(`   ✅ ${name}`) }
  else { failed++; console.log(`   ❌ ${name} ${detail}`) }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function webhook(text, from, msgId) {
  const r = await fetch(`${BASE}/webhook/gowa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: '56939688275@s.whatsapp.net',
      event: 'message',
      payload: { body: text, from, is_from_me: false },
      id: msgId,
    }),
  })
  await sleep(400) // dar tiempo al procesamiento async
  return r.status
}

const CARLOS = '56994912874@s.whatsapp.net'
const CARLOS_PHONE = '56994912874'
const CLUB = 'club-piloto'
const utcToday = new Date().toISOString().slice(0, 10)

// ── Preparar DB determinista ──
db.prepare(`DELETE FROM bot_events`).run()
db.prepare(`DELETE FROM bot_sessions`).run()
db.prepare(`DELETE FROM reservations WHERE source='bot'`).run()
db.prepare(`UPDATE slots SET status='libre' WHERE court_id IN (SELECT id FROM courts WHERE club_id=?)`).run(CLUB)
// Slot de hoy conocido
const slotX = db.prepare(`SELECT id FROM slots WHERE court_id IN (SELECT id FROM courts WHERE club_id=?) LIMIT 1`).get(CLUB)
const slotId = slotX.id
db.prepare(`UPDATE slots SET starts_at=?, ends_at=?, status='libre' WHERE id=?`).run(`${utcToday}T20:00:00`, `${utcToday}T21:30:00`, slotId)

console.log('\n=== Matriz de pruebas P0 ===\n')

// 1. Evento con id ACK (no message body real) — se procesa como consulta o nada; no rompe
let st = await webhook('hola', CARLOS, `W-${randomUUID()}`)
assert('Primer mensaje responde 200', st === 200)

// 2. Consulta disponibilidad → crea sesión choosing_court
st = await webhook('que canchas hay', CARLOS, `M1-${randomUUID()}`)
const sesion = db.prepare(`SELECT state FROM bot_sessions WHERE phone=?`).get(CARLOS_PHONE)
assert('Consulta crea sesión choosing_court', sesion?.state === 'choosing_court', JSON.stringify(sesion))

// 3. Número inválido → pide elección válida (sesión sigue activa)
st = await webhook('999', CARLOS, `M2-${randomUUID()}`)
const sesionInvalida = db.prepare(`SELECT state FROM bot_sessions WHERE phone=?`).get(CARLOS_PHONE)
assert('Número inválido conserva sesión', sesionInvalida?.state === 'choosing_court')

// 4. Selección '1' → reserva real anti-doble
st = await webhook('1', CARLOS, `M3-${randomUUID()}`)
const resBot = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
assert('Selección crea reserva bot', resBot >= 1, `reservas=${resBot}`)
const slotsReservados = db.prepare(`SELECT COUNT(*) n FROM slots WHERE status='reservada'`).get().n
assert('Al menos un slot quedó reservada', slotsReservados >= 1, `slots=${slotsReservados}`)

// 5. Idempotencia: mismo id de selección NO doble-procesa
// (Re-ofrecemos canchas → el jugador elige '1' con un id → reenviamos el mismo id)
await webhook('que canchas hay', CARLOS, `M5a-${randomUUID()}`)  // nueva sesión
const msgIdSel = `M5b-${randomUUID()}`
const antes = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
await webhook('1', CARLOS, msgIdSel)        // procesa → reserva
const medio = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
await webhook('1', CARLOS, msgIdSel)        // mismo id → debe ignorar
const despues = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
assert('Idempotencia: mismo id no doble-procesa', despues === medio, `${medio}→${despues}`)
const dups = db.prepare(`SELECT COUNT(*) n FROM bot_events WHERE event='duplicado'`).get().n
assert('Evento duplicado registrado', dups >= 1, `duplicados=${dups}`)

// 6. Observabilidad: eventos registrados
const eventos = db.prepare(`SELECT COUNT(*) n FROM bot_events`).get().n
assert('Eventos de observabilidad registrados', eventos >= 4, `eventos=${eventos}`)

console.log(`\n=== RESULTADO: ${passed} OK / ${failed} FAIL ===\n`)
process.exit(failed ? 1 : 0)
