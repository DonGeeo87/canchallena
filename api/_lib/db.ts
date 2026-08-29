import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

// En desarrollo local: SQLite embebido (rápido, sin depender del VPS).
// En producción (VPS): se usa PostgreSQL real (ver docs/04-modelo-datos.md).
// El schema se mantiene portable: tipos simples, sin features SQLite-only.
const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(path.join(DATA_DIR, 'canchallena.db'))
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')
