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
