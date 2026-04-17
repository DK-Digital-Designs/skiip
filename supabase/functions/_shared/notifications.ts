import { logger } from './logger.ts'

const log = logger('notifications')

type NotificationEvent =
  | 'order_paid'
  | 'order_preparing'
  | 'order_ready'
  | 'order_cancelled'
  | 'order_refunded'

const EMAIL_EVENTS: NotificationEvent[] = ['order_paid']

interface NotificationContext {
  supabase: any
  orderId: string
  eventType: NotificationEvent
}

interface OrderRecord {
  id: string
  order_number: string
  customer_email: string | null
  customer_phone: string | null
  total: number | string
  status: string
  whatsapp_opt_in: boolean
  refund_amount?: number | string | null
  stores?: {
    name?: string | null
    pickup_location?: string | null
  } | null
}

const EVENT_COPY: Record<NotificationEvent, { subject: string; headline: string; statusLabel: string }> = {
  order_paid: {
    subject: 'Your SKIIP order is confirmed',
    headline: 'Your order has been confirmed and sent to the vendor.',
    statusLabel: 'Confirmed',
  },
  order_preparing: {
    subject: 'Your SKIIP order is being prepared',
    headline: 'The vendor has started preparing your order.',
    statusLabel: 'Preparing',
  },
  order_ready: {
    subject: 'Your SKIIP order is ready for pickup',
    headline: 'Your order is ready to collect now.',
    statusLabel: 'Ready for pickup',
  },
  order_cancelled: {
    subject: 'Your SKIIP order was cancelled',
    headline: 'Your order has been cancelled. If payment was taken, support will advise on the next step.',
    statusLabel: 'Cancelled',
  },
  order_refunded: {
    subject: 'Your SKIIP order has been refunded',
    headline: 'Your refund has been issued.',
    statusLabel: 'Refunded',
  },
}

const WHATSAPP_TEMPLATE_MAP: Record<NotificationEvent, string | undefined> = {
  order_paid: Deno.env.get('META_TEMPLATE_ORDER_PAID'),
  order_preparing: Deno.env.get('META_TEMPLATE_ORDER_PREPARING'),
  order_ready: Deno.env.get('META_TEMPLATE_ORDER_READY'),
  order_cancelled: Deno.env.get('META_TEMPLATE_ORDER_CANCELLED'),
  order_refunded: Deno.env.get('META_TEMPLATE_ORDER_REFUNDED'),
}

function getDefaultCountryCode() {
  const configuredCountryCode = (Deno.env.get('WHATSAPP_DEFAULT_COUNTRY_CODE') || '44')
    .trim()
    .replace(/^\+/, '')

  if (!/^\d{1,3}$/.test(configuredCountryCode)) {
    log.error('Invalid WhatsApp default country code', {
      configuredCountryCode,
      reason: 'invalid_default_country_code',
    })
    return null
  }

  return configuredCountryCode
}

function normalizePhone(customerPhone: string) {
  const stripped = customerPhone.trim().replace(/[\s\-()]/g, '')
  const hasExplicitCountryCode = stripped.startsWith('+') || stripped.startsWith('00')
  const defaultCountryCode = getDefaultCountryCode()

  if (!defaultCountryCode) {
    return null
  }

  let normalized = stripped

  if (stripped.startsWith('+')) {
    normalized = stripped.slice(1)
  } else if (stripped.startsWith('00')) {
    normalized = stripped.slice(2)
  }

  if (!normalized) {
    log.error('Invalid WhatsApp phone number', { customerPhone, normalized, reason: 'non_digit_characters' })
    return null
  }

  if (!hasExplicitCountryCode) {
    if (normalized.startsWith('0')) {
      normalized = `${defaultCountryCode}${normalized.slice(1)}`
    } else if (!normalized.startsWith(defaultCountryCode)) {
      log.error('Invalid WhatsApp phone number', {
        customerPhone,
        normalized,
        defaultCountryCode,
        reason: 'missing_explicit_or_default_country_code',
      })
      return null
    }
  }

  if (/\D/.test(normalized)) {
    log.error('Invalid WhatsApp phone number', { customerPhone, normalized, reason: 'non_digit_characters' })
    return null
  }

  if (normalized.length < 8 || normalized.length > 15) {
    log.error('Invalid WhatsApp phone number', { customerPhone, normalized, reason: 'invalid_length' })
    return null
  }

  return normalized
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2)
}

function getWhatsAppAmount(order: OrderRecord, eventType: NotificationEvent) {
  return formatMoney(eventType === 'order_refunded' ? order.refund_amount || order.total : order.total)
}

function getMetaErrorMessage(payload: any, fallback: string) {
  return payload?.error?.message || payload?.message || fallback
}

function buildEmailBody(order: OrderRecord, eventType: NotificationEvent) {
  const copy = EVENT_COPY[eventType]
  const storeName = order.stores?.name || 'your vendor'
  const pickupLocation = order.stores?.pickup_location
  const refundLine =
    eventType === 'order_refunded'
      ? `<p><strong>Refund amount:</strong> GBP ${formatMoney(order.refund_amount || order.total)}</p>`
      : ''
  const pickupLine =
    pickupLocation && eventType === 'order_ready'
      ? `<p><strong>Pickup location:</strong> ${pickupLocation}</p>`
      : ''

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>${copy.headline}</h2>
      <p><strong>Order:</strong> ${order.order_number}</p>
      <p><strong>Vendor:</strong> ${storeName}</p>
      <p><strong>Status:</strong> ${copy.statusLabel}</p>
      <p><strong>Total:</strong> GBP ${formatMoney(order.total)}</p>
      ${refundLine}
      ${pickupLine}
      <p>You can track the latest order state in the SKIIP app.</p>
    </div>
  `
}

async function insertNotificationLog(
  supabase: any,
  values: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('notification_logs')
    .insert(values)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to persist notification log: ${error?.message || 'unknown error'}`)
  }

  return data.id as string
}

async function sendEmailNotification(supabase: any, order: OrderRecord, eventType: NotificationEvent) {
  if (!EMAIL_EVENTS.includes(eventType)) {
    return { skipped: true }
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL')

  if (!resendApiKey || !fromEmail || !order.customer_email) {
    return { skipped: true }
  }

  const logId = await insertNotificationLog(supabase, {
    order_id: order.id,
    channel: 'email',
    event_type: eventType,
    provider: 'resend',
    recipient: order.customer_email,
    status: 'queued',
  })

  const copy = EVENT_COPY[eventType]
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [order.customer_email],
      subject: copy.subject,
      html: buildEmailBody(order, eventType),
      text: `${copy.headline}\nOrder: ${order.order_number}\nVendor: ${order.stores?.name || 'your vendor'}\nTotal: GBP ${formatMoney(order.total)}`,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    await supabase
      .from('notification_logs')
      .update({
        status: 'failed',
        error_message: payload?.message || response.statusText,
        metadata: payload || {},
      })
      .eq('id', logId)

    throw new Error(`Resend API error: ${payload?.message || response.statusText}`)
  }

  await supabase
    .from('notification_logs')
    .update({
      status: 'sent',
      message_sid: payload?.id || null,
      metadata: payload || {},
      error_message: null,
    })
    .eq('id', logId)

  return { skipped: false }
}

async function sendWhatsAppNotification(supabase: any, order: OrderRecord, eventType: NotificationEvent) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const templateName = WHATSAPP_TEMPLATE_MAP[eventType]?.trim()

  if (
    !accessToken ||
    !phoneNumberId ||
    !templateName ||
    !order.whatsapp_opt_in ||
    !order.customer_phone
  ) {
    return { skipped: true }
  }

  const normalizedPhone = normalizePhone(order.customer_phone)
  if (!normalizedPhone) {
    return { skipped: true }
  }

  const logId = await insertNotificationLog(supabase, {
    order_id: order.id,
    channel: 'whatsapp',
    event_type: eventType,
    provider: 'meta',
    recipient: order.customer_phone,
    status: 'queued',
  })

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.order_number },
              { type: 'text', text: order.stores?.name || 'SKIIP vendor' },
              { type: 'text', text: getWhatsAppAmount(order, eventType) },
            ],
          },
        ],
      },
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMessage = getMetaErrorMessage(payload, response.statusText)

    log.error('Meta WhatsApp API error', {
      orderId: order.id,
      eventType,
      status: response.status,
      payload,
    })

    await supabase
      .from('notification_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        metadata: payload || {},
      })
      .eq('id', logId)

    throw new Error(`Meta WhatsApp API error: ${errorMessage}`)
  }

  const messageSid = payload?.messages?.[0]?.id
  if (!messageSid) {
    const errorMessage = 'Meta WhatsApp API response missing messages[0].id'

    log.error(errorMessage, {
      orderId: order.id,
      eventType,
      payload,
    })

    await supabase
      .from('notification_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        metadata: payload || {},
      })
      .eq('id', logId)

    throw new Error(errorMessage)
  }

  await supabase
    .from('notification_logs')
    .update({
      status: 'sent',
      message_sid: messageSid,
      metadata: payload || {},
      error_message: null,
    })
    .eq('id', logId)

  return { skipped: false }
}

export async function sendTransactionalNotifications({ supabase, orderId, eventType }: NotificationContext) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_phone, total, refund_amount, status, whatsapp_opt_in, stores(name, pickup_location)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error(`Order lookup failed for notifications: ${error?.message || 'missing order'}`)
  }

  const outcomes = await Promise.allSettled([
    sendEmailNotification(supabase, order as OrderRecord, eventType),
    sendWhatsAppNotification(supabase, order as OrderRecord, eventType),
  ])

  outcomes.forEach((result) => {
    if (result.status === 'rejected') {
      log.error('Notification dispatch failed', { orderId, eventType, error: result.reason?.message || String(result.reason) })
    }
  })
}
