import { readFileSync } from 'node:fs'
import path from 'node:path'
import { db } from '../_lib/db.js'

// Aplica el schema (idempotente). Crea las tablas si no existen.
const schema = readFileSync(path.resolve(process.cwd(), 'db', 'schema.sql'), 'utf-8')
db.exec(schema)

// ── Migraciones (ALTER TABLE) para DBs ya existentes ──
// SQLite no soporta 'ADD COLUMN IF NOT EXISTS', por eso se chequea manualmente.
const columns = (table: string): string[] => {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return rows.map((r) => r.name)
}

// clubs.plan / clubs.whatsapp
let clubCols = columns('clubs')
if (!clubCols.includes('plan')) {
  db.exec(`ALTER TABLE clubs ADD COLUMN plan TEXT DEFAULT 'Starter'`)
  console.log('Migración: clubs.plan añadido')
}
clubCols = columns('clubs')
if (!clubCols.includes('whatsapp')) {
  db.exec(`ALTER TABLE clubs ADD COLUMN whatsapp TEXT DEFAULT ''`)
  console.log('Migración: clubs.whatsapp añadido')
}

// admins.email / admins.password_hash
let adminCols = columns('admins')
if (!adminCols.includes('email')) {
  // NOTA: SQLite no permite ADD COLUMN UNIQUE; la unicidad la valida la app en el register.
  db.exec(`ALTER TABLE admins ADD COLUMN email TEXT`)
  console.log('Migración: admins.email añadido')
}
adminCols = columns('admins')
if (!adminCols.includes('password_hash')) {
  db.exec(`ALTER TABLE admins ADD COLUMN password_hash TEXT`)
  console.log('Migración: admins.password_hash añadido')
}

// bot_events.club_id / bot_events.player_id (actividad del agente multi-tenant)
let evCols = columns('bot_events')
if (!evCols.includes('club_id')) {
  db.exec(`ALTER TABLE bot_events ADD COLUMN club_id TEXT`)
  console.log('Migración: bot_events.club_id añadido')
}
evCols = columns('bot_events')
if (!evCols.includes('player_id')) {
  db.exec(`ALTER TABLE bot_events ADD COLUMN player_id TEXT`)
  console.log('Migración: bot_events.player_id añadido')
}

console.log('✅ Schema aplicado: tablas creadas/verificadas + migraciones en SQLite.')
