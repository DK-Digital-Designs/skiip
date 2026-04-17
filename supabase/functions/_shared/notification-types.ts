export const NOTIFICATION_EVENTS = [
  "order_paid",
  "order_preparing",
  "order_ready",
  "order_cancelled",
  "order_refunded",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const NOTIFICATION_CHANNELS = ["email", "whatsapp", "sms"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface NotificationContext {
  supabase: any;
  orderId: string;
  eventType: NotificationEvent;
  channels?: NotificationChannel[];
  correlationId?: string;
  sourceEventId?: string | null;
}

export interface OrderNotificationRecord {
  id: string;
  store_id: string | null;
  order_number: string;
  customer_email: string | null;
  customer_phone: string | null;
  total: number | string | null;
  refund_amount?: number | string | null;
  status: string;
  whatsapp_opt_in: boolean;
  stores?: {
    name?: string | null;
    pickup_location?: string | null;
  } | null;
}

export interface NotificationPayloadSnapshot {
  orderId: string;
  storeId: string | null;
  orderNumber: string;
  customerEmail: string | null;
  customerPhone: string | null;
  total: string;
  refundAmount: string | null;
  status: string;
  whatsappOptIn: boolean;
  storeName: string | null;
  pickupLocation: string | null;
}

export interface NotificationLogRecord {
  id: string;
  order_id: string;
  store_id: string | null;
  channel: NotificationChannel;
  event_type: NotificationEvent;
  provider: string | null;
  recipient: string | null;
  status: string;
  message_sid: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  payload_snapshot: NotificationPayloadSnapshot | null;
  dispatch_attempts: number | null;
  correlation_id: string | null;
  source_event_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
}

export interface ProviderDispatchInput {
  notification: NotificationLogRecord;
  payload: NotificationPayloadSnapshot;
  eventType: NotificationEvent;
}

export interface ProviderDispatchResult {
  messageSid?: string | null;
  metadata?: Record<string, unknown>;
  sentAt?: string | null;
}

interface ProviderDispatchErrorOptions {
  retryable?: boolean;
  metadata?: Record<string, unknown>;
  statusCode?: number;
}

export class ProviderDispatchError extends Error {
  retryable: boolean;
  metadata?: Record<string, unknown>;
  statusCode?: number;

  constructor(
    message: string,
    { retryable = false, metadata, statusCode }: ProviderDispatchErrorOptions = {},
  ) {
    super(message);
    this.name = "ProviderDispatchError";
    this.retryable = retryable;
    this.metadata = metadata;
    this.statusCode = statusCode;
  }
}
