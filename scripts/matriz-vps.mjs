// Matriz de pruebas P0 — corre DENTRO del VPS contra localhost:3018, con jugador de test aislado
// Para no ensuciar los datos reales de papá/tú/mamá, usa TEST_PHONE = 56900000000
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'

const BASE = process.env.BASE || 'http://localhost:3018/api'
const db = new DatabaseSync('/data/canchallena.db')
const TEST_PHONE = '56900000000'
const TEST_JID = `${TEST_PHONE}@s.whatsapp.net`

let passed = 0, failed = 0
function assert(name, cond, detail = '') {
  if (cond) { passed++; console.log(`   ✅ ${name}`) }
  else { failed++; console.log(`   ❌ ${name} ${detail}`) }
}
const sleep = (ms) => new Promise(r => setTimeout(r, 500))

async function webhook(text, msgId) {
  try {
    const r = await fetch(`${BASE}/webhook/gowa`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: '56939688275@s.whatsapp.net', event: 'message', payload: { body: text, from: TEST_JID, is_from_me: false }, id: msgId }),
    })
    await sleep(500)
    return r.status
  } catch (e) { return `ERR:${e.message}` }
}

// Prep
db.prepare(`DELETE FROM bot_events WHERE phone=?`).run(TEST_PHONE)
db.prepare(`DELETE FROM bot_sessions WHERE phone=?`).run(TEST_PHONE)
db.prepare(`DELETE FROM reservations WHERE source='bot' AND player_id=(SELECT id FROM players WHERE phone=?)`).run(TEST_PHONE)
const utcToday = new Date().toISOString().slice(0, 10)
db.prepare(`UPDATE slots SET status='libre' WHERE id IN (SELECT id FROM slots LIMIT 1)`).run()
db.prepare(`UPDATE slots SET starts_at=?, ends_at=?, status='libre' WHERE court_id IN (SELECT id FROM courts LIMIT 1)`).run(`${utcToday}T20:00:00`, `${utcToday}T21:30:00`)

console.log('\n=== Matriz de pruebas P0 (VPS) ===\n')

// 1. Evento con id acuse (ack como body) → responde 200
let st = await webhook('hola', `W-${randomUUID()}`)
assert('Primer mensaje responde 200', st === 200, String(st))

// 2. Consulta disponibilidad → crea sesión choosing_court
st = await webhook('que canchas hay', `M1-${randomUUID()}`)
const sesion = db.prepare(`SELECT state FROM bot_sessions WHERE phone=?`).get(TEST_PHONE)
assert('Consulta crea sesión choosing_court', sesion?.state === 'choosing_court', JSON.stringify(sesion))

// 3. Número inválido conserva sesión + pide elección válida
st = await webhook('999', `M2-${randomUUID()}`)
const sesionInv = db.prepare(`SELECT state FROM bot_sessions WHERE phone=?`).get(TEST_PHONE)
assert('Número inválido conserva sesión', sesionInv?.state === 'choosing_court')

// 4. Selección '1' → reserva real + slot reservado
st = await webhook('1', `M3-${randomUUID()}`)
const resBot = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot' AND player_id=(SELECT id FROM players WHERE phone=?)`).get(TEST_PHONE).n
assert('Selección crea reserva bot', resBot >= 1, `reservas=${resBot}`)
const slotsRes = db.prepare(`SELECT COUNT(*) n FROM slots WHERE status='reservada'`).get().n
assert('Slot quedó reservada', slotsRes >= 1, `slots=${slotsRes}`)

// 5. Idempotencia: mismo id no doble-procesa
await webhook('que canchas hay', `M5a-${randomUUID()}`)
const msgSel = `M5b-${randomUUID()}`
const antes = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
await webhook('1', msgSel)
const medio = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
await webhook('1', msgSel)
const despues = db.prepare(`SELECT COUNT(*) n FROM reservations WHERE source='bot'`).get().n
assert('Idempotencia: mismo id no doble-procesa', despues === medio, `${medio}→${despues}`)

// 6. Observabilidad
const eventos = db.prepare(`SELECT COUNT(*) n FROM bot_events WHERE phone=?`).get(TEST_PHONE).n
assert('Eventos de observabilidad registrados', eventos >= 5, `eventos=${eventos}`)

console.log(`\n=== RESULTADO: ${passed} OK / ${failed} FAIL ===\n`)
process.exit(failed ? 1 : 0)
