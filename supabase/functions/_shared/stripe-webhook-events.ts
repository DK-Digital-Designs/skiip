export interface AuditLogger {
  warn(message: string, context?: Record<string, unknown>): void
}

export interface StripeConnectEventLike {
  account?: string | null
}

export interface StripeAccountLikeWithId {
  id?: string | null
}

export function getStripeConnectAccountId(
  event: StripeConnectEventLike,
  account: StripeAccountLikeWithId,
) {
  return event.account || account.id || null
}

export function getStripeObjectId(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' ? id : null
  }

  return null
}

export async function handleStripeDisputeCreated({
  supabase,
  dispute,
  eventId,
  log,
}: {
  supabase: any
  dispute: {
    id: string
    charge?: unknown
    amount?: number | null
    currency?: string | null
    reason?: string | null
    status?: string | null
  }
  eventId: string
  log: AuditLogger
}) {
  const chargeId = getStripeObjectId(dispute.charge)
  let orderId: string | null = null

  if (chargeId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('charge_id', chargeId)
      .maybeSingle()

    if (error) {
      throw error
    }

    orderId = data?.id || null
  }

  const payload = {
    dispute_id: dispute.id,
    charge_id: chargeId,
    order_id: orderId,
    amount: typeof dispute.amount === 'number' ? dispute.amount / 100 : null,
    currency: dispute.currency || null,
    reason: dispute.reason || null,
    status: dispute.status || null,
    stripe_event_id: eventId,
  }

  log.warn('Stripe dispute created', payload)

  const { error } = await supabase.from('audit_logs').insert({
    event_type: 'stripe_dispute_created',
    entity_type: orderId ? 'order' : 'stripe_dispute',
    entity_id: orderId,
    actor_role: 'system',
    payload,
  })

  if (error) {
    throw error
  }

  return payload
}
