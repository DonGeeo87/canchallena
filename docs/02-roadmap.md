# 02 — Roadmap (CanchaLlena)

## Stack (infra ya disponible en el ecosistema Código Guerrero)

- **Backend:** Node + Express 5, TypeScript (reutiliza patrones de otros proyectos).
- **Frontend / Panel admin:** React 19 + Vite + Tailwind v4 (patrón `src/components/admin/` estándar).
- **DB:** PostgreSQL (relaciones reales: club → canchas → reservas → jugadores). Vía container en VPS + túnel SSH desde Windows.
- **WhatsApp:** GoWA (capa REST + webhook) para piloto. Escalable a WhatsApp Cloud API en producto comercial.
- **Automatización:** crons Hermes para recordatorios y matchmaking.
- **Despliegue:** VPS (62.146.227.146), Docker, nginx proxy, dominio `canchallena.codigoguerrero.dev`.

## Fases

| Fase | Entregable | Criterio de salida |
|------|-----------|---------------------|
| **0. Documentación** | Brief, roadmap, flujo, modelo datos (ESTE repo) | Validado el flujo del bot con el usuario |
| **1. MVP Reserva** | Bot WhatsApp + panel admin + PostgreSQL | 1 club real lo usa 2 semanas, reserva sin tocar al admin |
| **2. Matchmaking valle** | Partido abierto + push por nivel + lista espera | Llena ≥1 cancha valle/día en el club piloto |
| **3. Producto comercial** | Multi-tenant, facturación, Flow | ≥2 clubes pagando |
| **4. No construir aún** | Torneos, ranking, POS, contabilidad | Solo con demanda real |

## Decisiones técnicas clave

- **Sin NestJS ni BullMQ/Redis en el MVP.** Un Express con pocas rutas + un cron de recordatorios basta. Complejidad solo con necesidad real (regla MVP-first).
- **Sin NestJS:** el dominio no lo justifica al inicio.
- **Matchmaking = filtro SOLO por nivel** (rango) + el jugador decide. NO exigir múltiples criterios (disponibilidad+radio+historial) que vacían el pool.

## Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| No-show mata la confianza | Media | Alto | Aviso al club + (fase 2) amonestaciones |
| GoWA se cae / ban de WhatsApp Web | Media | Alto | Webhook + reconexión, migrar a Cloud API en comercial |
| Club chico no quiere pagar | Media | Medio | Precio bajo, piloto gratis, medir ROI en no-show/valle |
| El matchmaking vacía el pool | Baja (con 359 socios) | Medio | Solo nivel + decisión del jugador, nunca llenado forzado |

## Deploy al VPS

Patrón estándar del skill `local-to-vps-pipeline` / `project-scaffold-workflow`: build local, tarball, construir imagen en VPS, container, nginx proxy host, dominio. Ver `05-plan-desarrollo.md`.
