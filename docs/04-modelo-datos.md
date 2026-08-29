# 04 — Modelo de Datos (CanchaLlena) — PostgreSQL

Relaciones reales (por eso PostgreSQL, no Firestore). Prefijos de tabla por módulo/dominio.

```sql
-- Club (tenant). En piloto: 1 club. Diseñado multi-tenant.
CREATE TABLE clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  city        TEXT,
  currency    TEXT DEFAULT 'CLP',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Horario global del club por día (configuración)
CREATE TABLE club_hours (
  id        SERIAL PRIMARY KEY,
  club_id   UUID REFERENCES clubs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,        -- 0=domingo..6=sábado
  open_time  TIME NOT NULL,
  close_time TIME NOT NULL
);

CREATE TABLE courts (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id   UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,              -- "Cancha 1"
  price_per_slot NUMERIC(10,0) NOT NULL,-- CLP / tanda
  active    BOOLEAN DEFAULT true
);

CREATE TABLE admins (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id   UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name      TEXT,
  phone     TEXT UNIQUE,               -- identificación vía WhatsApp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE players (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id   UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  phone     TEXT UNIQUE NOT NULL,      -- el número de WhatsApp
  level     NUMERIC(3,1),              -- 2.0..7.0 (nullable hasta auto-eval)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tanda / slot de cancha (bloque arrendable, 1.5h típico)
CREATE TABLE slots (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id  UUID REFERENCES courts(id) ON DELETE CASCADE,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'libre',  -- libre | reservada | partido_abierto
  price      NUMERIC(10,0)
);

CREATE TABLE reservations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  slot_id    UUID REFERENCES slots(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pendiente', -- pendiente|confirmada|jugada|cancelada|no_show
  source     TEXT DEFAULT 'bot',             -- bot | admin | web
  price      NUMERIC(10,0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_slots_court_time ON slots (court_id, starts_at);
CREATE INDEX idx_reservations_status ON reservations (status);
```

## Fase 2 — Matchmaking

```sql
CREATE TABLE open_matches (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id   UUID REFERENCES slots(id) ON DELETE CASCADE,
  min_level NUMERIC(3,1),
  max_level NUMERIC(3,1),
  status    TEXT DEFAULT 'buscando',   -- buscando|completo|confirmado|cancelado
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE match_invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_match_id UUID REFERENCES open_matches(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pendiente', -- pendiente|aceptada|rechazada|expirada
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Notas

- **Piloto = 1 club**, pero `clubs` ya existe → multi-tenant es solo configurar N clubes.
- **`phone`** del jugador es la clave única para el bot (se identifica por número de WhatsApp).
- **Nivel** nullable: el matchmaking usa rango `min_level..max_level`; el socio se auto-evalúa o el club lo asigna.
- `slot.status=partido_abierto` separa la lógica de matchmaking de la reserva normal.
