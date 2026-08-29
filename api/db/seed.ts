import { randomUUID } from 'node:crypto'
import { db } from '../_lib/db.js'

// Seed de desarrollo basado en el prototipo de bot-padel-simulacion.html
const clubId = 'club-piloto'

db.exec(`
INSERT INTO clubs (id, name, slug, city) VALUES
  ('${clubId}', 'Club Piloto CanchaLlena', 'club-piloto', 'Chile')
  ON CONFLICT(id) DO NOTHING;

INSERT INTO club_hours (club_id, day_of_week, open_time, close_time) VALUES
  ('${clubId}', 1, '09:00', '22:00'),
  ('${clubId}', 2, '09:00', '22:00'),
  ('${clubId}', 3, '09:00', '22:00'),
  ('${clubId}', 4, '09:00', '22:00'),
  ('${clubId}', 5, '09:00', '22:00'),
  ('${clubId}', 6, '10:00', '22:00'),
  ('${clubId}', 0, '10:00', '20:00');
`)

const courts = [
  ['court-1', 'Cancha 1', 7500],
  ['court-2', 'Cancha 2', 7500],
]
for (const [id, name, price] of courts) {
  db.prepare(`INSERT OR IGNORE INTO courts (id, club_id, name, price_per_slot) VALUES (?, ?, ?, ?)`).run(id, clubId, name, price)
}

db.prepare(`INSERT OR IGNORE INTO admins (id, club_id, name, phone) VALUES (?, ?, ?, ?)`)
  .run(randomUUID(), clubId, 'Admin Club', '+56911111111')

// Jugadores del prototipo (categorías chilenas 3ª-6ª, es_nuevo, dias_sin_jugar)
// [name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados]
const jugadores = [
  ['Carlos G.', '+56999491287', '3ª', 0, 5, 'Avanzado', 4],
  ['Pedro M.', '+56966554433', '3ª', 0, 2, 'Avanzado', 3],
  ['Luis A.',  '+56966544330', '3ª', 0, 3, 'Medio', 2],
  ['Mario R.', '+56955443322', '4ª', 0, 6, 'Medio', 1],
  ['Ana T.',   '+56944332211', '4ª', 0, 9, 'Medio', 0],
  ['Jorge V.', '+56933221100', '5ª', 0, 4, 'Medio', 1],
  ['Tomás F.', '+56922110099', '6ª', 1, 12, 'Nuevo', 0],
  ['Diego N.', '+56911008877', '6ª', 1, 10, 'Nuevo', 0],
  ['Valentina L.', '+56987654321', '4ª', 0, 7, 'Medio', 2],
  ['Felipe C.', '+56976543210', '5ª', 0, 8, 'Medio', 0],
  ['Matías S.', '+56965432109', '5ª', 0, 3, 'Medio', 1],
  ['Rodrigo P.', '+56954321098', '6ª', 1, 14, 'Nuevo', 0],
]
for (const [name, phone, categoria, es_nuevo, dias, nivel, ganados] of jugadores) {
  db.prepare(`
    INSERT OR IGNORE INTO players
      (id, club_id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), clubId, name, phone, categoria, es_nuevo, dias, nivel, ganados)
}

console.log('✅ Seed aplicado: club piloto (2 canchas), 8 jugadores del prototipo + 4 extra, admin.')
