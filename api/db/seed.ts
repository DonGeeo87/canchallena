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

// Ampliación del club demo a 50 socios (38 adicionales) para simulaciones realistas
// Distribución objetivo (50 total): 3ª=5, 4ª=15, 5ª=18, 6ª=12
const demoExtra = [
  // 3ª (2)
  ['Rodrigo Contreras', '+5692-0001', '3ª', 0, 1, 'Avanzado', 12],
  ['Matías Herrera', '+5692-0002', '3ª', 0, 2, 'Avanzado', 11],
  // 4ª (11)
  ['Ignacio Vera', '+5692-0003', '4ª', 0, 3, 'Medio', 8],
  ['Sebastián Rojas', '+5692-0004', '4ª', 0, 4, 'Medio', 7],
  ['Cristóbal Paredes', '+5692-0005', '4ª', 0, 1, 'Medio', 9],
  ['Tomás Fuenzalida', '+5692-0006', '4ª', 0, 2, 'Medio', 6],
  ['Vicente Morales', '+5692-0007', '4ª', 0, 5, 'Medio', 7],
  ['Benjamín Soto', '+5692-0008', '4ª', 0, 3, 'Medio', 8],
  ['Martín Navarro', '+5692-0009', '4ª', 0, 6, 'Medio', 5],
  ['Joaquín Espinoza', '+5692-0010', '4ª', 0, 2, 'Medio', 9],
  ['Andrés Carrasco', '+5692-0011', '4ª', 0, 4, 'Medio', 6],
  ['Francisca Jara', '+5692-0012', '4ª', 0, 1, 'Medio', 10],
  ['Catalina Ríos', '+5692-0013', '4ª', 0, 3, 'Medio', 8],
  // 5ª (16)
  ['Pablo Muñoz', '+5692-0014', '5ª', 0, 5, 'Medio', 4],
  ['Diego Salinas', '+5692-0015', '5ª', 0, 2, 'Medio', 5],
  ['Felipe Cáceres', '+5692-0016', '5ª', 0, 7, 'Medio', 3],
  ['Nicolás Vega', '+5692-0017', '5ª', 0, 3, 'Medio', 5],
  ['Gonzalo Fuentes', '+5692-0018', '5ª', 0, 1, 'Medio', 6],
  ['Cristian Lagos', '+5692-0019', '5ª', 0, 4, 'Medio', 4],
  ['Fernando Bustos', '+5692-0020', '5ª', 0, 6, 'Medio', 3],
  ['Rodrigo Pino', '+5692-0021', '5ª', 0, 2, 'Medio', 5],
  ['Mauricio Valdés', '+5692-0022', '5ª', 0, 8, 'Medio', 2],
  ['Patricio Gálvez', '+5692-0023', '5ª', 0, 3, 'Medio', 4],
  ['Sergio Riquelme', '+5692-0024', '5ª', 0, 5, 'Medio', 3],
  ['Marcelo Vidal', '+5692-0025', '5ª', 0, 2, 'Medio', 5],
  ['Alexis Palma', '+5692-0026', '5ª', 0, 7, 'Medio', 2],
  ['Cristóbal Barrios', '+5692-0027', '5ª', 0, 4, 'Medio', 4],
  ['Daniel Araya', '+5692-0028', '5ª', 0, 1, 'Medio', 6],
  ['Eduardo Zamora', '+5692-0029', '5ª', 0, 6, 'Medio', 3],
  // 6ª (9)
  ['Lucas Medina', '+5692-0030', '6ª', 1, 9, 'Nuevo', 0],
  ['Emilio Sepúlveda', '+5692-0031', '6ª', 1, 11, 'Nuevo', 0],
  ['Valentina Salazar', '+5692-0032', '6ª', 1, 7, 'Nuevo', 1],
  ['Antonia Bravo', '+5692-0033', '6ª', 1, 12, 'Nuevo', 0],
  ['Joaquina Silva', '+5692-0034', '6ª', 1, 8, 'Nuevo', 0],
  ['Renato Cabrera', '+5692-0035', '6ª', 1, 10, 'Nuevo', 1],
  ['Sofía Vergara', '+5692-0036', '6ª', 1, 9, 'Nuevo', 0],
  ['Isidora Parra', '+5692-0037', '6ª', 1, 13, 'Nuevo', 0],
  ['Gaspar Toledo', '+5692-0038', '6ª', 1, 11, 'Nuevo', 1],
]
for (const [name, phone, categoria, es_nuevo, dias, nivel, ganados] of demoExtra) {
  db.prepare(`INSERT OR IGNORE INTO players (id, club_id, name, phone, categoria, es_nuevo, dias_sin_jugar, nivel, ganados) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), demoId, name, phone, categoria, es_nuevo, dias, nivel, ganados)
}

console.log('✅ Seed: club piloto (2 canchas, 12 jug) + club DEMO Los Guerreros (4 canchas, 50 jugadores realistas).')

