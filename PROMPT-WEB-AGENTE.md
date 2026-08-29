# PROMPT PARA AGENTE — Web completa de CanchaLlena

Eres un desarrollador frontend senior. Vas a construir la **web completa de CanchaLlena** (el organizador inteligente de partidos de pádel) en el monorepo `E:\Projects\Coding\canchallena`. Trabaja dentro de `app/` (React 19 + Vite 6 + Tailwind CSS v4 + react-router-dom). NO toques la carpeta `api/` — esa ya está construida y verificada; limítate a consumirla.

## Contexto del producto (leelo entero antes de empezar)

CanchaLlena es un producto B2B para **clubes de pádel de comuna pequeña/mediana** que hoy gestionan sus canchas de forma 100% manual (libreta + WhatsApp). La promesa central:

> "El bot de WhatsApp que toma reservas por el club, solo. Llena tus canchas y deja de estar pegado al teléfono."

El MVP ya tiene dos motores en la API: (1) **reservas** por WhatsApp y (2) **matchmaking** que en horarios valle auto-genera partidos abiertos e invita a socios compatibles para llenar la cancha.

El producto es **multi-tenant**: cada club tiene sus propias canchas, jugadores, horarios y reservas, identificados por `club_id`. Un solo login de admin gestiona SU club.

**Interfaz killer = WhatsApp.** La web es el complemento: la landing para vender + el panel de administración del club. La página pública de reserva del club es secundaria (el MVP es WhatsApp), pero déjala lista.

**Audiencia:** administradores de club tipo dueño, 40-60 años, no técnicos. Español latino neutro (NO tuteo chileno; usar "usted"). La web debe verse seria, profesional y simple — nada de sobre-ingeniería visual.

---

## Stack y reglas obligatorias

- **React 19 + Vite 6 + Tailwind CSS v4.**
- Tailwind v4 es **CSS-based**, NO existe `tailwind.config.js`. Usa `@theme` en `app/src/index.css`.
- `react-router-dom` v7.
- **NO usar `import.meta.env`** para la URL de la API (se corrompe en MSYS2). Ya existe `export const API_BASE_URL = '/api'` hardcodeado en `App.tsx`.
- Icons: `lucide-react`.
- **Estilo visual:** tema OSCURO coherente, paleta única de la marca (NO mezclar colores). Define la paleta en `@theme`:
  - Base fondo: morado-negro profundo `#14121E`
  - Superficie/cards: `#1E1B2E`
  - Primario (CTA/accent): magenta-violeta `#9333EA`
  - Éxito / "cancha libre": verde `#22C55E`
  - Peligro / "no disponible": rojo `#EF4444`
  - Texto: blanco `#FFFFFF`, secundario `rgba(255,255,255,0.6)`
- Bordes finos `border-white/10`, botones uniformes (misma variante, sin mezclar), compacto, sin sombras exageradas.
- Todo responsive (mobile-first). Mobile-first obligatorio en el panel.

## Estructura de rutas que debes implementar

```
/                    → Home/landing pública (marketing)
/login               → Login admin
/admin               → Layout protegido (requiere token en localStorage 'canchallena_token')
/admin/dashboard     → Tablero HOY (canchas por franja)
/admin/canchas       → CRUD de canchas
/admin/horarios      → Horarios del club por día
/admin/jugadores     → Lista de socios (niveles, búsqueda)
/admin/reservas      → Reservas (todas, por estado)
/admin/matchmaking   → Partidos abiertos + invitaciones
/club/:slug          → Página pública del club (micrositio de reserva, opcional/MVP-lite)
```

**Protección de rutas:** si no hay token en `localStorage.getItem('canchallena_token')`, redirigir a `/login`. Envía siempre `Authorization: Bearer <token>` en las llamadas autenticadas. En localStorage la clave es `canchallena_token`.

---

## Home / Landing `/`  — LA MÁS IMPORTANTE, hazme 12 secciones

Vende el producto a un dueño de club no técnico. Tono directo, beneficio primero, cero jerga. Orden sugerido (puedes ajustar, pero mantén cada sección):

1. **Nav fija** — Logo "CanchaLlena" (icono de pala/tenis), links: Producto, Cómo funciona, Precios, Contacto. Botón CTA "Iniciar sesión" + "Probar gratis" (va a `/login`).
2. **Hero** — Propuesta central en 1 frase: *"Tu cancha disponible no vuelve a quedarse vacía."* Subtítulo: *"El bot de WhatsApp que toma reservas por el club, solo. Llena tus canchas y deja de estar pegado al teléfono."* CTA primario "Probar gratis" + CTA secundario "Cómo funciona". Fondo degradado morado, imagen de cancha de pádel con toque oscuro.
3. **Problema-dolor** — 3 cards de dolores que resuelve: "Contestas WhatsApp a cada rato", "Te dejan plantado (no-show)", "Canchas vacías a la tarde". Íconos, breve.
4. **Solución / Qué es** — Un párrafo + un mockup visual del chat del bot (una burbuja de WhatsApp simulada mostrando "reserva confirmada ✅ cancha 1, hoy 13:30").
5. **El bot en acción** — Los 3 pasos del flujo real: (1) el socio escribe al número del club, (2) el bot muestra canchas libres y horarios, (3) el socio elige, se confirma solo, llega a pagar en persona. Visual secuencial.
6. **Llena el horario valle (matchmaking)** — Explica la frase: mientras el club está lleno en la tarde-noche, las canchas quedan vacías a las 15:00. "El sistema detecta cancha libre, arma un partido abierto y por WhatsApp invita a socios de nivel compatible. La cancha se llena sola." Visual de invitación de bot ("¿Quieres jugar hoy 15:00? [Sí][No]").
7. **Para administradores (público admin)** — Mini-preview de 2-3 funciones del panel: tablero de canchas por franja, confirmar/cancelar en 1 clic, ver quién no llega.
8. **Cómo empezar (3 pasos)** — 1) Cuéntanos de tu club, 2) te configuramos el bot con tus canchas/horarios, 3) compartes el número con tus socios. Sin código, sin instalación, en el WhatsApp que ya usas.
9. **Precios** — 3 planes (tabla):
    - **Starter** — $19.990/mes · 2 canchas · bot WhatsApp · reservas · panel básico
    - **Club** *(Más popular, destacado)* — $39.990/mes · hasta 6 canchas · bot + matchmaking (llena el valle) · jugadores ilimitados · panel completo
    - **Pro** — $69.990/mes · sedes múltiples · analítica · prioridad
    Texto: "Sin anticipos, pago cuando jugas. Sin comisiones por reserva. 14 días de prueba gratis."
10. **FAQ** — 5-6 preguntas: "¿Necesito instalar algo?", "¿Mis socios necesitan app?", "¿Qué pasa si alguien no llega?", "¿Puedo seguir usando mi número de WhatsApp?", "¿Cómo se llenan las canchas del valle?", "¿Tengo que entregar mis datos?".
11. **CTA final** — Fondo morado, "¿Listo para llenar tus canchas?" + botón "Empezar gratis".
12. **Footer** — Logo, "Código Guerrero Dev" (la marca que lo construye), links, copyright.

Nota de marca: al pie aclara "*Hecho por Código Guerrero Dev*" — es tu producto y marca.

---

## Login `/login`

Pantalla centrada, card compacta. Título "CanchaLlena", subtítulo "Panel de administración del club". Campo opcional de teléfono/admin + botón "Iniciar sesión". En demo: POST `/api/auth/login` (sin body) devuelve `{token, admin}` — guarda el token en `canchallena_token` y redirige a `/admin/dashboard`. Muestra error en rojo si falla.

---

## Layout `/admin` (protegido)

Shell con sidebar + topbar:
- **Sidebar** (colapsable en mobile): Dashboard / Canchas / Horarios / Jugadores / Reservas / Matchmaking / (al pie) Nombre del club + botón "Cerrar sesión".
- **Topbar**: título de la sección actual + botón "Salir".
- Contenido debajo, con ruta anidada según la sección.

---

## Dashboard `/admin/dashboard` — Tablero HOY

El corazón operativo. Muestra el día actual como **grilla de canchas × franjas** (bloques de 1.5h).

- Llama `GET /api/admin/today` → `{courts, slots}`.
- **Grilla:** filas = canchas, columnas = franjas de 1.5h desde la apertura a cierre (según `/api/club` → `hours`). Cada celda muestra el estado con color:
  - Libre → verde, "Libre"
  - Reservada → morado, nombre del jugador (si viene) + hora
  - Partido abierto → naranja/acento, "Partido" + cupos
- Encima de la grilla: **resumen de la noche** — "⚠️ X canchas libres esta noche. ¿Crear partidos abiertos?" con botón que va a `/admin/matchmaking`.
- Mobile: las franjas se apilan verticalmente en vez de columnas horizontales.

---

## Canchas `/admin/canchas`

- `GET /api/courts` → lista de canchas del club (`id, name, price_per_slot, active`).
- Tabla/cards: nombre, precio por tanda, estado activo/inactivo.
- Botón "Agregar cancha" → formulario: `name`, `price_per_slot`. POST `/api/courts`.
- Poder activar/desactivar (toggle) una cancha.

---

## Horarios `/admin/horarios`

- `GET /api/club` → `hours` (array `{day_of_week 0-6, open_time, close_time}`).
- Editar el horario de apertura/cierre de cada día de la semana (selección de hora L-V y fin de semana simplificado).
- En el MVP el cambio es visual + persistido via PUT (puedes dejar el PUT preparado aunque el endpoint de update esté pendiente en el backend — documenta qué falta).

---

## Jugadores `/admin/jugadores`

- `GET /api/players` si existe; si no, prepara la pantalla con el contrato de datos (id, name, phone, level). Búsqueda por nombre/teléfono.
- Lista/tabla: nombre, teléfono, nivel (2.0-7.0), partidos jugados (si viene; si no, columna reservada).
- Mostrar niveles con badge/badge de color por rango (2.0-2.9, 3.0-3.9, 4.0-4.9, 5.0+).

---

## Reservas `/admin/reservas`

- Lista de reservas con filtro por estado (pendiente / confirmada / jugada / cancelada / no_show).
- Cards o tabla: jugador, cancha, fecha/hora, estado (badge de color), precio.
- Acciones por reserva (según estado): confirmar, marcar jugada, cancelar, marcar no_show. Deja la API de update preparada (`POST /api/booking/:id/<accion>` como contrato; documenta qué falta en backend).

---

## Matchmaking `/admin/matchmaking`

- `GET /api/matchmaking` (o usa `/api/matchmake/open` de creación). Muestra partidos abiertos: cancha, fecha/hora, rango de nivel, cupos llenos (X/4), estado.
- **Acción principal:** "Crear partido abierto" → formulario: seleccionar slot libre (cancha + franja), rango de nivel min/max. POST `/api/matchmaking/open`.
- Debajo, lista de invitaciones por partido con estado (pendiente/aceptada/rechazada).
- Resalta el beneficio cuando hay cancha valle libre: botón para crear partido desde la celda libre.

---

## Página pública del club `/club/:slug` (MVP-lite, importante para vender)

- Micrositio público de reservas (estilo "página de tu club" que se comparte por WhatsApp).
- Header con nombre del club, ciudad.
- **Calendario/lista de canchas libres HOY** (verde) — el visitante ve qué hay disponible.
- Si el club usa el bot, muestra "Reserva por WhatsApp" con un botón que abre el chat (numero de WhatsApp). Si no, un formulario mínimo de reserva que haga POST `/api/booking` (slot_id, phone, player_name).
- Diseño claro, mobile-first, con la paleta de la marca. Cada club puede tener su propio micrositio (multi-tenant: filtrar por `slug`).

---

## Lo que NO debes hacer

- No construyas contabilidad, POS, torneos, ranking, facturación, ni app móvil nativa.
- No integres pasarela de pago (el pago es en persona).
- No toques `api/` — consume lo que existe.
- No uses componentes de UI de terceros pesados (shadcn, chakra). Usa Tailwind + lucide-react a mano.
- No jerga técnica en texto visible al usuario. Español latino neutro, "usted".
- No mezclar colores fuera de la paleta definida.

## Entregable

Al terminar: `npx vite build` debe pasar sin errores de TypeScript. Cada pantalla funcional consumiendo los endpoints reales de la API (levanta la API con `cd api && PORT=3015 npm run dev` y el frontend con `cd app && npx vite --port 3016`). Reporta: rutas creadas, qué endpoints consumen, qué quedó preparado (contrato) pendiente de backend, y capturas/paths si las generaste.

## Verificación final (no la omitas)

1. `vite build` sin errores.
2. El login → dashboard muestra el tablero HOY con datos reales del seed (club piloto, 3 canchas, 6 jugadores).
3. Navegación protegida funciona (sin token → redirige a /login).
4. Responsive mobile en las pantallas clave (dashboard, matchmaking, home).
