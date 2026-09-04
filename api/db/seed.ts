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

// ============================================================
// Club DEMO ("Club Deportivo Los Guerreros") para el sandbox de ventas
// Datos ficticios — la interfaz y flujos son los reales del producto.
// ============================================================
const demoId = 'club-demo'
db.prepare(`INSERT OR IGNORE INTO clubs (id, name, slug, city) VALUES (?, ?, ?, ?)`)
  .run(demoId, 'Club Deportivo Los Guerreros', 'club-demo', 'Santiago')
// Horarios demo
for (const [dow, open, close] of [[1,'09:00','23:00'],[2,'09:00','23:00'],[3,'09:00','23:00'],[4,'09:00','23:00'],[5,'09:00','23:00'],[6,'10:00','23:00'],[0,'10:00','21:00']]) {
  db.prepare(`INSERT OR IGNORE INTO club_hours (club_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)`).run(demoId, dow, open, close)
}
// 4 canchas demo con precios realistas
const demoCourts = [['demo-court-1','Cancha 1',8000],['demo-court-2','Cancha 2',8000],['demo-court-3','Cancha 3',8500],['demo-court-4','Cancha 4',8500]]
for (const [id, name, price] of demoCourts) {
  db.prepare(`INSERT OR IGNORE INTO courts (id, club_id, name, price_per_slot) VALUES (?, ?, ?, ?)`).run(id, demoId, name, price)
}
// 12 jugadores demo
const demoPlayers = [
  ['Andrés Fuentes','+569****1010','3ª',0,2,'Avanzado',5],
  ['Marco Díaz','+569****2020','3ª',0,4,'Avanzado',4],
  ['Lucía Soto','+569****3030','4ª',0,6,'Medio',3],
  ['Javier Muñoz','+569****4040','4ª',0,1,'Medio',2],
  ['Camila Reyes','+569****5050','5ª',0,8,'Medio',1],
  ['Pedro Silva','+569****6060','5ª',0,3,'Medio',2],
  ['Francisca Paz','+569****7070','4ª',0,7,'Medio',3],
  ['Diego Torres','+569****8080','6ª',1,12,'Nuevo',0],
  ['Valentina Cruz','+569****9090','6ª',1,10,'Nuevo',0],
  ['Nicolás Ruiz','+569****1111','3ª',0,1,'Avanzado',6],
  ['Antonia Vega','+569****2222','4ª',0,5,'Medio',1],
  ['Fernando Leal','+569****3333','6ª',1,15,'Nuevo',0],
]
for (const [name, phone, categoria, es_nuevo, dias, nivel, ganados] of demoPlayers) {
  db.prepare(`INSERT OR IGNORE INTO players (id, club_id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), demoId, name, phone, categoria, es_nuevo, dias, nivel, ganados)
}
console.log('✅ Seed: club piloto (2 canchas, 12 jug) + club DEMO Los Guerreros (4 canchas, 12 jug).')

