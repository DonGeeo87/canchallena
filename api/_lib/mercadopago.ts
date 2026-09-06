// ============================================================
// MercadoPago Checkout Pro — cobro de planes de CanchaLlena
// Patrón probado (skill mercadopago-checkout-pro): arranca sin
// credenciales y responde 503 (no crashea); webhook responde 200
// primero, luego verifica el pago.
// ============================================================
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { getGowaConfig } from './gowa.js'

export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY
const SITE_URL = process.env.SITE_URL || 'https://canchallena.codigoguerrero.dev'

const mpClient = MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null

// Catálogo de planes (CLP) — se cobra el abono mensual
export const PLANS: Record<string, { title: string; unit_price: number; currency_id: string }> = {
  club: { title: 'Plan Club — CanchaLlena', unit_price: Number(process.env.PRICE_CLUB || 39990), currency_id: 'CLP' },
  pro: { title: 'Plan Pro — CanchaLlena', unit_price: Number(process.env.PRICE_PRO || 69990), currency_id: 'CLP' },
}

// Crea una preferencia de pago para el plan elegido
export async function crearPreferencia({ plan, clubName, clubId, email }: {
  plan: string
  clubName?: string
  clubId?: string
  email?: string
}): Promise<{ init_point: string; preference_id: string; public_key: string | undefined }> {
  if (!mpClient) throw new Error('MercadoPago no configurado')
  const product = PLANS[plan]
  if (!product) throw new Error(`Plan no encontrado: ${plan}`)

  const pref = new Preference(mpClient)
  const result = await pref.create({
    body: {
      items: [{ id: plan, title: product.title, quantity: 1, unit_price: product.unit_price, currency_id: product.currency_id }],
      back_urls: {
        success: `${SITE_URL}/pago-resultado?status=success&plan=${plan}`,
        failure: `${SITE_URL}/pago-resultado?status=failure&plan=${plan}`,
        pending: `${SITE_URL}/pago-resultado?status=pending&plan=${plan}`,
      },
      auto_return: 'approved',
      notification_url: `${SITE_URL}/api/webhook/mercadopago`,
      external_reference: `canchallena-${plan}-${Date.now()}`,
      metadata: { club_name: clubName || '', club_id: clubId || '', plan },
    },
  })
  const init_point: string = result.init_point ?? ''
  return { init_point, preference_id: String(result.id ?? ''), public_key: MP_PUBLIC_KEY }
}

// Verifica el estado real de un pago (no confía en el body del webhook)
export async function getPago(id: string) {
  if (!mpClient) return null
  const payment = await new Payment(mpClient).get({ id })
  return payment
}
