import { readFileSync } from 'node:fs'
import path from 'node:path'
import { db } from '../_lib/db.js'

// Aplica el schema (idempotente). Crea las tablas si no existen.
const schema = readFileSync(path.resolve(process.cwd(), 'db', 'schema.sql'), 'utf-8')
db.exec(schema)
console.log('✅ Schema aplicado: tablas creadas/verificadas en SQLite (dev).')
