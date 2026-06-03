export interface AggregatedOrderItem {
  product_id: string
  quantity: number
}

export interface ParsedOrderItemLine {
  product_id: string
  quantity: number
  selected_option_ids: string[]
  line_note: string | null
  client_line_id: string | null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_LINE_NOTE_LENGTH = 240

export class OrderItemValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderItemValidationError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanOptionalText(
  value: unknown,
  maxLength: number,
  label: string,
  { truncate = false }: { truncate?: boolean } = {},
) {
  const cleaned = String(value || '').trim().replace(/\s+/g, ' ')
  if (!truncate && cleaned.length > maxLength) {
    throw new OrderItemValidationError(`${label} is too long`)
  }
  return cleaned ? cleaned.slice(0, maxLength) : null
}

function parseSelectedOptionIds(value: unknown) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new OrderItemValidationError('Selected option IDs must be an array')
  }

  const selectedOptionIds = value.map((id) => String(id || '').trim()).filter(Boolean)
  const uniqueOptionIds = new Set(selectedOptionIds)

  if (uniqueOptionIds.size !== selectedOptionIds.length) {
    throw new OrderItemValidationError('Selected option IDs must be unique')
  }

  for (const optionId of selectedOptionIds) {
    if (!UUID_PATTERN.test(optionId)) {
      throw new OrderItemValidationError('Each selected option requires a valid option ID')
    }
  }

  return selectedOptionIds
}

export function parseOrderItemLines(items: unknown): ParsedOrderItemLine[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderItemValidationError('At least one item is required')
  }

  const parsedItems: ParsedOrderItemLine[] = []

  for (const item of items) {
    if (!isObject(item)) {
      throw new OrderItemValidationError('Each item requires a product_id and quantity')
    }

    const productId = typeof item.product_id === 'string' ? item.product_id.trim() : ''
    if (!UUID_PATTERN.test(productId)) {
      throw new OrderItemValidationError('Each item requires a valid product_id')
    }

    const quantity = item.quantity
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new OrderItemValidationError('Each item quantity must be a positive integer')
    }

    const selectedOptionIds = parseSelectedOptionIds(item.selected_option_ids ?? item.selectedOptionIds)
    const lineNote = cleanOptionalText(item.line_note ?? item.lineNote, MAX_LINE_NOTE_LENGTH, 'Line note')
    // Non-authoritative dedup hint (the RPC ignores it); the frontend lineId
    // concatenates product + option UUIDs + note and can exceed the cap, so
    // truncate rather than reject an otherwise-valid configured cart.
    const clientLineId = cleanOptionalText(item.client_line_id ?? item.clientLineId ?? item.lineId, 180, 'Client line ID', { truncate: true })

    parsedItems.push({
      product_id: productId,
      quantity,
      selected_option_ids: selectedOptionIds,
      line_note: lineNote,
      client_line_id: clientLineId,
    })
  }

  return parsedItems
}

export function aggregateOrderItemQuantities(items: ParsedOrderItemLine[]): AggregatedOrderItem[] {
  const quantitiesByProduct = new Map<string, number>()

  for (const item of items) {
    const nextQuantity = (quantitiesByProduct.get(item.product_id) ?? 0) + item.quantity
    if (!Number.isSafeInteger(nextQuantity)) {
      throw new OrderItemValidationError('Item quantity is too large')
    }

    quantitiesByProduct.set(item.product_id, nextQuantity)
  }

  return [...quantitiesByProduct.entries()].map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }))
}

export function parseAndAggregateOrderItems(items: unknown): AggregatedOrderItem[] {
  return aggregateOrderItemQuantities(parseOrderItemLines(items))
}
