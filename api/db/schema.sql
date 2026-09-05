-- ============================================================
-- CanchaLlena — Schema (portable: SQLite dev / PostgreSQL prod)
-- ============================================================
-- Club (tenant). Multi-tenant desde el inicio.
-- Cada club tiene sus canchas, jugadores, horarios y reservas.

CREATE TABLE IF NOT EXISTS clubs (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  city       TEXT,
  currency   TEXT DEFAULT 'CLP',
  plan       TEXT DEFAULT 'Starter',      -- Starter | Club | Pro
  whatsapp   TEXT DEFAULT '',             -- número WhatsApp del bot del club
  created_at TEXT DEFAULT (datetime('now'))
);

-- Horarios globales del club por día de semana (0=domingo .. 6=sábado)
CREATE TABLE IF NOT EXISTS club_hours (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id     TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time   TEXT NOT NULL,   -- '12:00'
  close_time  TEXT NOT NULL    -- '23:00'
);

CREATE TABLE IF NOT EXISTS courts (
  id             TEXT PRIMARY KEY,
  club_id        TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,             -- 'Cancha 1'
  price_per_slot REAL NOT NULL,             -- CLP
  active         INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admins (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT UNIQUE,
  password_hash TEXT,
  phone      TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,                 -- número WhatsApp (identificador del bot)
  categoria  TEXT DEFAULT '6ª',            -- categoría chilena: 3ª, 4ª, 5ª, 6ª
  es_nuevo   INTEGER DEFAULT 0,            -- 1 = 6ª/nuevo, prioridad SIEMPRE juega
  dias_sin_jugar INTEGER DEFAULT 0,        -- días sin jugar (prioriza al que más espera)
  nivel      TEXT DEFAULT 'Medio',         -- 'Nuevo' | 'Medio' | 'Avanzado'
  ganados    INTEGER DEFAULT 0,            -- partidos ganados (registro del marcador)
  ausencias  INTEGER DEFAULT 0,            -- no-shows / rechazos
  created_at TEXT DEFAULT (datetime('now'))
);

-- Partido confirmado con resultado (paso 8 y 9 del prototipo)
CREATE TABLE IF NOT EXISTS matches (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  slot_id    TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  team_a1    TEXT REFERENCES players(id),
  team_a2    TEXT REFERENCES players(id),
  team_b1    TEXT REFERENCES players(id),
  team_b2    TEXT REFERENCES players(id),
  score      TEXT,                          -- '6-3, 6-4'
  winner     TEXT,                          -- 'A' | 'B'
  status     TEXT DEFAULT 'programado',    -- programado | jugado | cancelado
  duration   TEXT DEFAULT '1h30',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tanda / slot de cancha (bloque arrendable, 1.5h típico)
CREATE TABLE IF NOT EXISTS slots (
  id        TEXT PRIMARY KEY,
  court_id  TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,   -- ISO 8601
  ends_at   TEXT NOT NULL,   -- ISO 8601
  status    TEXT DEFAULT 'libre',        -- libre | reservada | partido_abierto
  price     REAL
);

-- Reserva de un slot por un jugador
CREATE TABLE IF NOT EXISTS reservations (
  id         TEXT PRIMARY KEY,
  club_id    TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  slot_id    TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pendiente',    -- pendiente | confirmada | jugada | cancelada | no_show
  source     TEXT DEFAULT 'bot',          -- bot | admin | web
  price      REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Fase matchmaking: partido abierto (se integra en el MVP)
CREATE TABLE IF NOT EXISTS open_matches (
  id         TEXT PRIMARY KEY,
  slot_id    TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  min_level  REAL,
  max_level  REAL,
  status     TEXT DEFAULT 'buscando',  -- buscando | completo | confirmado | cancelado
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS match_invitations (
  id            TEXT PRIMARY KEY,
  open_match_id TEXT NOT NULL REFERENCES open_matches(id) ON DELETE CASCADE,
  player_id     TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pendiente', -- pendiente | aceptada | rechazada | expirada
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_slots_court_time       ON slots (court_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_messages_player_club   ON players (club_id, phone);

-- ============================================================
-- P0 — Robustez (Sprint V0.2)
-- Sesiones del bot persistentes (reemplaza el Map en memoria)
CREATE TABLE IF NOT EXISTS bot_sessions (
  phone      TEXT PRIMARY KEY,
  club_id    TEXT,
  state      TEXT DEFAULT 'idle',       -- idle | choosing_court
  payload    TEXT,                       -- JSON: slots libres ofrecidos al jugador
  expires_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Idempotencia del webhook: evita procesar dos veces el mismo mensaje
CREATE TABLE IF NOT EXISTS processed_messages (
  message_id   TEXT PRIMARY KEY,
  phone        TEXT NOT NULL,
  intent       TEXT,
  processed_at TEXT DEFAULT (datetime('now'))
);

-- Eventos del bot (observabilidad)
CREATE TABLE IF NOT EXISTS bot_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id    TEXT,                          -- club al que pertenece la acción (multi-tenant)
  player_id  TEXT,                          -- jugador involucrado (si aplica)
  phone      TEXT,                          -- número del jugador / quién disparó
  event      TEXT NOT NULL,   -- mensaje | reserva | invitacion_si | invitacion_no | ...
  data       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_phone ON bot_sessions (phone);
CREATE INDEX IF NOT EXISTS idx_events_phone   ON bot_events (phone, created_at);

-- Configuración global del bot (interruptor on/off persistente)
CREATE TABLE IF NOT EXISTS bot_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ============================================================
-- FASE 3 — Coaching / Rachas / Progreso (diferenciador CanchaLlena)
-- match_player_results: registra el resultado de CADA jugador por partido,
-- incluyendo quién fue su pareja y sus rivales. Es lo que permite:
--   - calcular rachas por pareja (ganar/perder consecutivos con quién)
--   - recomendar cambio de pareja cuando hay racha perdedora
--   - medir progreso individual (evolución de resultados, frecuencia)
CREATE TABLE IF NOT EXISTS match_player_results (
  id          TEXT PRIMARY KEY,
  club_id     TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  match_id    TEXT,                          -- referencia al partido (matches.id) si existe
  player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  partner_id  TEXT REFERENCES players(id),   -- quién fue su pareja de equipo
  opponent1_id TEXT REFERENCES players(id),  -- rivales de esa tanda
  opponent2_id TEXT REFERENCES players(id),
  won         INTEGER NOT NULL,              -- 1 = ganó, 0 = perdió
  score       TEXT,                          -- '6-3, 6-4'
  played_at   TEXT DEFAULT (datetime('now')) -- fecha efectiva del partido
);
CREATE INDEX IF NOT EXISTS idx_res_player  ON match_player_results (player_id, played_at);
CREATE INDEX IF NOT EXISTS idx_res_partner ON match_player_results (partner_id, played_at);
CREATE INDEX IF NOT EXISTS idx_res_club    ON match_player_results (club_id, played_at);
