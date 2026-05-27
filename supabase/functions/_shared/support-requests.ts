export const BUYER_ISSUE_TYPES = new Set([
  'refund_request',
  'wrong_order',
  'cold_food',
  'vendor_cancelled',
  'collection_issue',
  'payment_issue',
  'app_bug',
  'general_query',
])

export const BUYER_ORDER_REQUIRED_ISSUE_TYPES = new Set([
  'refund_request',
  'wrong_order',
  'cold_food',
  'vendor_cancelled',
  'collection_issue',
  'payment_issue',
])

export const VENDOR_ISSUE_TYPES = new Set([
  'app_bug',
  'payment_payout_concern',
  'order_operation_issue',
  'general_query',
])

export function createSupportReferenceCode(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `SUP-${date}-${token}`
}
