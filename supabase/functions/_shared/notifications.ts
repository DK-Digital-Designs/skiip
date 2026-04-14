import { logger } from './logger.ts'

const log = logger('notifications')

type NotificationEvent =
  | 'order_paid'
  | 'order_preparing'
  | 'order_ready'
  | 'order_cancelled'
  | 'order_refunded'

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
  order_paid: Deno.env.get('TWILIO_TEMPLATE_ORDER_CONFIRMATION'),
  order_preparing: Deno.env.get('TWILIO_TEMPLATE_ORDER_PREPARING'),
  order_ready: Deno.env.get('TWILIO_TEMPLATE_READY_FOR_COLLECTION'),
  order_cancelled: Deno.env.get('TWILIO_TEMPLATE_ORDER_CANCELLED'),
  order_refunded: Deno.env.get('TWILIO_TEMPLATE_ORDER_REFUNDED'),
}

function normalizePhone(customerPhone: string) {
  const trimmed = customerPhone.trim()
  if (trimmed.startsWith('+')) {
    return trimmed
  }
  return `+44${trimmed.startsWith('0') ? trimmed.slice(1) : trimmed}`
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2)
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
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
  const webhookToken = Deno.env.get('TWILIO_WEBHOOK_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const templateSid = WHATSAPP_TEMPLATE_MAP[eventType]

  if (
    !twilioAccountSid ||
    !twilioAuthToken ||
    !twilioWhatsappNumber ||
    !templateSid ||
    !supabaseUrl ||
    !order.whatsapp_opt_in ||
    !order.customer_phone
  ) {
    return { skipped: true }
  }

  const logId = await insertNotificationLog(supabase, {
    order_id: order.id,
    channel: 'whatsapp',
    event_type: eventType,
    provider: 'twilio',
    recipient: order.customer_phone,
    status: 'queued',
  })

  const callbackBase = `${supabaseUrl}/functions/v1/whatsapp-status-webhook`
  const callbackUrl = webhookToken
    ? `${callbackBase}?token=${encodeURIComponent(webhookToken)}`
    : callbackBase

  const formData = new URLSearchParams()
  formData.append('To', `whatsapp:${normalizePhone(order.customer_phone)}`)
  formData.append('From', `whatsapp:${twilioWhatsappNumber}`)
  formData.append('ContentSid', templateSid)
  formData.append(
    'ContentVariables',
    JSON.stringify({
      1: order.order_number,
      2: order.stores?.name || 'SKIIP vendor',
      3: formatMoney(eventType === 'order_refunded' ? order.refund_amount || order.total : order.total),
    }),
  )
  formData.append('StatusCallback', callbackUrl)

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
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

    throw new Error(`Twilio API error: ${payload?.message || response.statusText}`)
  }

  await supabase
    .from('notification_logs')
    .update({
      status: 'sent',
      message_sid: payload?.sid || null,
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
