import { randomUUID } from 'node:crypto'
import { db } from '../_lib/db.js'

// Seed de desarrollo: club piloto real (3 canchas, horarios, admin, algunos jugadores).
// Idempotente: INSERT OR IGNORE.

const clubId = 'club-piloto'

db.exec(`
INSERT INTO clubs (id, name, slug, city) VALUES
  ('${clubId}', 'Club Piloto CanchaLlena', 'club-piloto', 'Chile')
  ON CONFLICT(id) DO NOTHING;

INSERT INTO club_hours (club_id, day_of_week, open_time, close_time) VALUES
  ('${clubId}', 1, '12:00', '23:00'),
  ('${clubId}', 2, '12:00', '23:00'),
  ('${clubId}', 3, '12:00', '23:00'),
  ('${clubId}', 4, '12:00', '23:00'),
  ('${clubId}', 5, '12:00', '23:00'),
  ('${clubId}', 6, '10:00', '23:00'),
  ('${clubId}', 0, '10:00', '23:00');
`)

const courts = [
  ['court-1', 'Cancha 1', 7500],
  ['court-2', 'Cancha 2', 7500],
  ['court-3', 'Cancha 3', 7500],
]
for (const [id, name, price] of courts) {
  db.prepare(`INSERT OR IGNORE INTO courts (id, club_id, name, price_per_slot) VALUES (?, ?, ?, ?)`).run(id, clubId, name, price)
}

// Admin y algunos jugadores de prueba
db.prepare(`INSERT OR IGNORE INTO admins (id, club_id, name, phone) VALUES (?, ?, ?, ?)`)
  .run(randomUUID(), clubId, 'Admin Club', '+56911111111')

const players = [
  ['Juan', '+56920000001', 3.0],
  ['Pedro', '+56920000002', 3.2],
  ['Carlos', '+56920000003', 2.9],
  ['Diego', '+56920000004', 3.1],
  ['Andrés', '+56920000005', 2.5],
  ['Sofía', '+56920000006', 3.5],
]
for (const [name, phone, level] of players) {
  db.prepare(`INSERT OR IGNORE INTO players (id, club_id, name, phone, level) VALUES (?, ?, ?, ?, ?)`)
    .run(randomUUID(), clubId, name, phone, level)
}

console.log('✅ Seed aplicado: club piloto (3 canchas), admin, 6 jugadores de prueba.')
