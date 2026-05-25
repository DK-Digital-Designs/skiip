export const PAYMENT_CONTROLS_KEY = 'payment_controls'

export interface PaymentControls {
  enabled: boolean
  reason: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export const DEFAULT_PAYMENT_CONTROLS: PaymentControls = {
  enabled: true,
  reason: null,
  updatedAt: null,
  updatedBy: null,
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizePaymentControls(value: unknown): PaymentControls {
  if (!isObject(value)) {
    return { ...DEFAULT_PAYMENT_CONTROLS }
  }

  return {
    enabled: value.enabled !== false,
    reason: typeof value.reason === 'string' && value.reason.trim()
      ? value.reason.trim()
      : null,
    updatedAt: typeof value.updatedAt === 'string' && value.updatedAt
      ? value.updatedAt
      : null,
    updatedBy: typeof value.updatedBy === 'string' && value.updatedBy
      ? value.updatedBy
      : null,
  }
}

export async function getPaymentControls(supabase: any): Promise<PaymentControls> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', PAYMENT_CONTROLS_KEY)
    .maybeSingle()

  if (error) {
    throw error
  }

  return normalizePaymentControls(data?.value)
}

export function buildPaymentControlsUpdate({
  enabled,
  reason,
  updatedBy,
  updatedAt = new Date().toISOString(),
}: {
  enabled: boolean
  reason?: string | null
  updatedBy: string
  updatedAt?: string
}): PaymentControls {
  return {
    enabled,
    reason: reason?.trim() || null,
    updatedAt,
    updatedBy,
  }
}
