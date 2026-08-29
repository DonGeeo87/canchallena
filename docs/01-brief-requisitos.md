# 01 — Brief y Requisitos (CanchaLlena)

## Problema exacto

Un club de pádel de comuna pequeña / mediana gestiona sus canchas de forma **100% manual**:
anota reservas en la libreta o en WhatsApp, contesta mensajes a cada rato, y pierde plata cuando
la gente reserva y no llega (no-show) o cuando canchas quedan vacías en horarios valle.

## Qué construimos (una sola cosa extraordinaria)

> **El bot de WhatsApp que toma reservas por el club, solo.**
> La gente reserva, confirma y llega — sin que el administrador conteste un solo mensaje.

Después, encima de esa base, añadimos el **matchmaking para llenar las canchas del horario valle**.

## Personas (User personas)

### 1. Administrador del club ("Don Papá")
- Operador real: anota en libreta, administra 1-3 canchas, 1-3 sedes, 100-400 socios.
- **Dolor:** clavado al WhatsApp, no-show, canchas vacías en la tarde (valle).
- **Quiere:** dejar de contestar, que se llene el valle.
- **NO quiere:** maquinaria pesada, POS, contabilidad, aprender un sistema complejo.
- **Paga:** entre $15.000 y $30.000/mes si le quita el teléfono de la mano.

### 2. Jugador / Socio
- Reserva en tandas de 1.5h. Usa el finde y el horario peak. A veces no llega.
- **Quiere:** reservar en 30 segundos desde WhatsApp, sin instalar app.
- **Valora:** la confirmación clara y el recordatorio.

## Funcionalidades por fase

### MVP (Fase 1) — Reserva por bot
- [ ] Admin configura canchas/horarios/precios (panel simple).
- [ ] Jugador escribe al bot → selecciona cancha+bloque → cotiza → reserva.
- [ ] Confirmación automática por WhatsApp.
- [ ] Recordatorio automático X horas antes.
- [ ] Panel admin: tablero de canchas por franja, confirmar/cancelar en 1 clic.
- [ ] Detección de no-show (aviso al club).

### Fase 2 — Matchmaking valle (con 359 socios reales es viable)
- [ ] Crear "partido abierto" a partir de una cancha libre en horario valle.
- [ ] Push por WhatsApp a socios compatibles (filtro SOLO nivel, rango) con botón Sí/No.
- [ ] El jugador decide; quien acepta llenar los 4 cupos.
- [ ] Lista de espera automática.
- [ ] No-show con lista negra / amonestaciones.

### Fase 3+ — No construir hasta tener clientes pagando
- Torneos, ranking, POS, contabilidad, facturación, app nativa, AutoFill avanzado.

## Criterios de éxito (MVP)

- [ ] El club puede configurar el bot en < 30 min sin ayuda técnica.
- [ ] Un jugador reserva de punta a punta por WhatsApp sin intervención del admin.
- [ ] El admin NO tiene que contestar mensajes de reserva.
- [ ] Al menos 1 club real de prueba (el club con 359 socios) lo usa 2 semanas.

## Reglas del dominio (pádel)

- Partido = 4 jugadores (2 vs 2).
- Se arrienda por tandas de 1.5h.
- Horario típico: L-V 12:00–23:00; finde 10:00–23:00. (Configurable por club.)
- Nivel: rango (ej. 2.5–3.5), NO puntaje exacto, para el matchmaking.

## ⚠️ Preguntas abiertas

1. ¿Cobra el anticipo por Flow/transferencia, o la reserva es sin pago por ahora?
2. ¿El matchmaking valle entra en el mismo MVP o se valida primero el bot de reserva solo?
3. ¿Multi-tenant desde el inicio o un solo club en el piloto?
4. ¿Nombre final: CanchaLlena u otro?
