# 05 — Plan de Desarrollo (CanchaLlena)

## Estructura del repo

```
canchallena/
├── docs/                    # documentación (Fase 0)
├── app/                     # panel admin (React 19 + Vite + Tailwind v4)
│   └── src/components/admin/ # AdminButton, PageHeader, Pagination (estándar CG)
├── api/                     # backend Express 5 + TypeScript
│   ├── routes/
│   ├── _lib/                # db, auth, gowa client
│   └── db/                  # schema.sql, seeds
├── bot/                     # lógica del flujo WhatsApp (webhook handler)
├── scripts/                 # crons: recordatorios, matchmaking
│   └── .github/workflows/   # deploy
└── .hermes/plans/PLAN.md
```

## API Endpoints (MVP)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | health check |
| POST | `/api/auth/login` | login admin (JWT) |
| GET | `/api/club` | config del club + canchas |
| PUT | `/api/club/hours` | horarios |
| GET | `/api/courts` | canchas del club |
| POST | `/api/courts` | crear cancha |
| GET | `/api/slots?date=` | slots por fecha |
| POST | `/api/slots` | abrir/cerrar slot |
| POST | `/api/booking` | crear reserva (desde bot) |
| GET | `/api/booking?player=` | reservas del jugador |
| POST | `/api/booking/:id/cancel` | cancelar reserva |
| GET | `/api/reservations/today` | tablero del admin (HOY) |
| POST | `/api/booking/:id/confirm` | confirmar / marcar jugado |
| POST | `/api/webhook/gowa` | entrada WhatsApp (flujo bot) |

## Sprint Plan (mínimo viable)

### Sprint 1 — Scaffold + DB
- [ ] Scaffold Express + React + Vite + Tailwind (skill project-scaffold-workflow).
- [ ] Schema PostgreSQL (docs/04) aplicado en VPS + túnel, o container local.
- [ ] Auth admin (JWT) + CRUD club/canchas/horarios.

### Sprint 2 — Booking engine
- [ ] Modelo slots + reservas.
- [ ] Tablero admin HOY (canchas por franja).
- [ ] Endpoints de reserva + cancelación.

### Sprint 3 — Bot WhatsApp (GoWA)
- [ ] Levantar GoWA, vincular número, webhook.
- [ ] Flujo: Hola → reservar → elegir cancha/bloque → confirmar (docs/03).
- [ ] Recordatorio cron 2h antes.

### Sprint 4 — No-show + pulido
- [ ] Detección de no-show, aviso al admin.
- [ ] UX mobile del panel.

### Sprint 5 — Deploy + piloto
- [ ] Docker + nginx proxy + dominio `canchallena.codigoguerrero.dev`.
- [ ] Configurar club piloto (3 canchas, 359 socios, horarios reales).
- [ ] 2 semanas de uso real, medir: reservas sin tocar admin.

## Fase 2 — Matchmaking valle (después del MVP)

- [ ] Crear `open_matches` desde slot libre en horario valle.
- [ ] Push GoWA a socios compatibles (filtro nivel rango).
- [ ] Aceptación/rechazo, llena 4 cupos.
- [ ] Lista de espera + amonestaciones por no-show.

## Herramientas de automatización CG (reutilizar)

- **GoWA** — capa WhatsApp (REST + webhook), skill `gowa-session-ops`.
- **Hermes cron** — recordatorios y disparo de matchmaking.
- **PostgreSQL en VPS** — container + túnel SSH (skill `project-scaffold-workflow` ref).

## Cómo medir éxito del piloto

- % de reservas hechas por el bot sin intervención del admin.
- Canchas valle ocupadas vs. antes.
- No-show rate antes vs. después.
- Tiempo del admin contestando WhatsApp al día.
