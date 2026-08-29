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
| **1. MVP** | Bot WhatsApp + panel admin + PostgreSQL + **matchmaking valle** + multi-tenant | 1 club real lo usa 2 semanas, reserva sin tocar al admin, llena ≥1 cancha valle/día |
| **2. Producto comercial** | Facturación, pasarela de pago, onboarding multi-club | ≥2 clubes pagando |
| **3. No construir aún** | Torneos, ranking, POS, contabilidad | Solo con demanda real |

## Decisiones técnicas clave

- **Sin NestJS ni BullMQ/Redis en el MVP.** Un Express con pocas rutas + un cron de recordatorios basta. Complejidad solo con necesidad real (regla MVP-first).
- **Multi-tenant desde el inicio** (cada club con sus canchas/jugadores/horarios; tabla `clubs` ya está en el modelo).
- **Matchmaking SÍ va en el MVP** (decisión 29-Ago-2026): el partido abierto valle se integra con la reserva.
- **Matchmaking = filtro SOLO por nivel** (rango) + el jugador decide. NO exigir múltiples criterios (disponibilidad+radio+historial) que vacían el pool.
- **Pago en persona, sin anticipos** (decisión 29-Ago-2026): MVP sin Flow/pasarela.

## Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| No-show mata la confianza | Media | Alto | Aviso al club + (fase 2) amonestaciones |
| GoWA se cae / ban de WhatsApp Web | Media | Alto | Webhook + reconexión, migrar a Cloud API en comercial |
| Club chico no quiere pagar | Media | Medio | Precio bajo, piloto gratis, medir ROI en no-show/valle |
| El matchmaking vacía el pool | Baja (con 359 socios) | Medio | Solo nivel + decisión del jugador, nunca llenado forzado |

## Deploy al VPS

Patrón estándar del skill `local-to-vps-pipeline` / `project-scaffold-workflow`: build local, tarball, construir imagen en VPS, container, nginx proxy host, dominio. Ver `05-plan-desarrollo.md`.
