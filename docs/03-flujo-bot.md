# 03 — Flujo del jugador por WhatsApp (la interfaz killer)

GoWA expone REST + webhook. El bot recibe el mensaje del socio, consulta la agenda real en PostgreSQL,
y responde. **El backend es la autoridad; el bot es solo la cara.**

## Flujo 1 — Reservar (MVP, la base)

Socio escribe al número del club:

```
[Hola]
🤖 ¡Hola Carlos! 🎾
¿Qué quieres hacer?
1️⃣ Reservar cancha
2️⃣ Mis reservas
3️⃣ Cambiar disponibilidad
```

```
[1]
🤖 ¿Qué día y hora?
📅 [Hoy] [Mañana] [Elegir fecha]
```

```
[Hoy]
🤖 Canchas libres HOY:
🟢 13:30 — Cancha 1 — $7.500
🟢 15:00 — Cancha 2 — $7.500
🟢 18:30 — Cancha 3 — $7.500
Elige una (ej: "Cancha 1"):
```

```
[Cancha 1]
🤖 Reserva CONFIRMADA ✅
📅 Hoy 13:30 (1.5h)
🏟 Cancha 1
💰 $7.500
Te recuerdo 2h antes. ¡Nos vemos en la cancha! 🎾
```

## Flujo 2 — Matchmaking valle (Fase 2)

Admin activa "crear partido abierto" o el sistema lo propone en horario valle.

```
🎾 Tenemos un partido abierto que podría interesarte:
📅 Hoy 15:00
🏟 Cancha 2
👥 Nivel 2.5–3.5 · Faltan 3
¿Quieres jugar?
[Sí] [No]
```

```
[Sí]
🎾 ¡Listo! Estás dentro.
Faltan 2 jugadores.
Te aviso cuando se complete. 🎾
```

## Estados de entidades

- **Reserva:** `pendiente` → `confirmada` → `jugada` | `cancelada` | `no_show`
- **Partido abierto (Fase 2):** `buscando` → `completo` → `confirmado` | `cancelado`
- **Invitation (Fase 2):** `pendiente` → `aceptada` | `rechazada` | `expirada`

## Consideraciones

- **No exige disponibilidad múltiple**: el matchmaking filtra SOLO por nivel (rango) y publica. El socio decide.
- **Recordatorios**: cron envía aviso 2h antes; se cancela en `no_show` si no llega.
- **GoWA**: escaneo QR para vincular el número del club; webhook para recibir mensajes entrantes.
- **Multi-número futuro**: un bot por club (multi-tenant GoWA), o número maestro + lógica por club.
