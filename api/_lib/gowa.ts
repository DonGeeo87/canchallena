// Integración GoWA — envío de mensajes WhatsApp (patrón del skill whatsapp-gateway/gowa-session-ops)
// En dev: la API local (Windows) usa la URL pública del VPS.
// En prod (container en el mismo VPS): GOWA_URL=http://gowa:3000
const GOWA_URL = process.env.GOWA_URL || 'https://wa.dongeeo87.site'
const GOWA_AUTH = process.env.GOWA_AUTH || 'admin:G0w4D0nGeeo87!'
const GOWA_DEVICE_ID = process.env.GOWA_DEVICE_ID || 'DonGeeo87' // device de prueba (número principal)

export function getGowaConfig() {
  return { url: GOWA_URL, auth: GOWA_AUTH, deviceId: GOWA_DEVICE_ID }
}

// Envía un mensaje de texto a un número de WhatsApp (teléfono plano, sin + ni @jid)
export async function sendWhatsApp(rawPhone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const phone = String(rawPhone).replace(/[^0-9]/g, '')
  if (!phone) return { ok: false, error: 'Teléfono inválido' }
  const auth64 = Buffer.from(GOWA_AUTH).toString('base64')
  try {
    const res = await fetch(`${GOWA_URL}/wa/send/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth64}`,
        'X-Device-Id': GOWA_DEVICE_ID,
      },
      body: JSON.stringify({ phone, message }),
    })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok || (body as any).code === 'SUCCESS', error: (body as any).message || undefined }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// Mensaje de invitación a partido (flujo del prototipo) — con saltos de línea
export function buildInviteMessage(playerName: string, parejaNombre: string, parejaCat: string, fecha: string, hora: string, cancha: string): string {
  return [
    `¡Hola ${playerName}! 🎾`,
    `¿Juegas pádel el ${fecha} ${hora}, cancha ${cancha}?`,
    `Partido de 1h30.`,
    `Te toca con ${parejaNombre} (${parejaCat}).`,
    `Responde SI o NO.`,
  ].join('\n')
}

// Mensaje de reemplazo — con saltos de línea
export function buildReplacementMessage(playerName: string, parejaNombre: string, parejaCat: string, fecha: string, hora: string): string {
  return [
    `¡Hola ${playerName}! 🎾`,
    `Quedó un cupo para el ${fecha} ${hora}, partido 1h30.`,
    `¿Juegas?`,
    `Te toca con ${parejaNombre} (${parejaCat}).`,
    `Responde SI o NO.`,
  ].join('\n')
}
