interface CheckoutOrderSnapshot {
  id: string
  checkout_session_id?: string | null
  payment_failed_at?: string | null
  payment_status?: string | null
}

interface CheckoutSessionSnapshot {
  id?: string | null
  status?: string | null
  url?: string | null
}

export function calculateApplicationFeeAmount(
  subtotal: number,
  serviceFee: number,
  platformFeePercent: number,
) {
  return Math.round(subtotal * platformFeePercent * 100) + Math.round(serviceFee * 100)
}

function normalizeIdempotencyPart(value: string | null | undefined) {
  return String(value || 'none').replace(/[^a-zA-Z0-9_.:-]/g, '_')
}

export function buildCheckoutSessionIdempotencyKey(order: CheckoutOrderSnapshot) {
  const existingSessionPart = order.checkout_session_id || 'initial'
  const attemptPart = order.payment_failed_at || order.payment_status || 'pending'

  return [
    'skiip-checkout',
    normalizeIdempotencyPart(order.id),
    normalizeIdempotencyPart(existingSessionPart),
    normalizeIdempotencyPart(attemptPart),
  ].join(':')
}

export function getReusableCheckoutSession(session: CheckoutSessionSnapshot | null | undefined) {
  if (session?.id && session.status === 'open' && session.url) {
    return {
      sessionId: session.id,
      url: session.url,
    }
  }

  return null
}
