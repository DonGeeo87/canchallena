# PLAN — CanchaLlena

El organizador inteligente de partidos de pádel. Bot WhatsApp que reserva y llena canchas.

## Stack
- **Panel:** React 19 + Vite + Tailwind v4
- **API:** Express 5 + TypeScript
- **DB:** PostgreSQL (club → canchas → slots → reservas → jugadores)
- **WhatsApp:** GoWA (REST + webhook)
- **Automatización:** Hermes cron (recordatorios, matchmaking)

## Estructura
```
canchallena/
├── docs/       # brief, roadmap, flujo bot, modelo datos, plan
├── app/        # panel admin React
├── api/        # backend Express
│   └── db/     # schema.sql
├── bot/        # flujo WhatsApp (webhook)
├── scripts/    # crons
└── .github/workflows/
```

## Issues (GitHub)
- #1 Sprint 1: Scaffold + DB + Auth
- #2 Sprint 2: Booking engine + panel
- #3 Sprint 3: Bot WhatsApp (GoWA)
- #4 Sprint 4: No-show + UX
- #5 Sprint 5: Deploy + piloto
- #6 Fase 2: Matchmaking valle

## Preguntas abiertas (docs/01)
1. Anticipo por Flow o sin pago en MVP?
2. Matchmaking valle en el mismo MVP o despues?
3. Multi-tenant desde el inicio?
4. Nombre final: CanchaLlena?

## Estado
- [x] Fase 0: documentacion (docs/)
- [x] Repo + issues creados
- [ ] Sprint 1: scaffold + schema + auth
- [ ] Sprint 2: booking + panel
- [ ] Sprint 3: bot WhatsApp
- [ ] Sprint 4: no-show + UX
- [ ] Sprint 5: deploy + piloto (3 canchas, 359 socios)
