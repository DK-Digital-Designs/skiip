export interface AggregatedOrderItem {
  product_id: string
  quantity: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class OrderItemValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderItemValidationError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseAndAggregateOrderItems(items: unknown): AggregatedOrderItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderItemValidationError('At least one item is required')
  }

  const quantitiesByProduct = new Map<string, number>()

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

    const nextQuantity = (quantitiesByProduct.get(productId) ?? 0) + quantity
    if (!Number.isSafeInteger(nextQuantity)) {
      throw new OrderItemValidationError('Item quantity is too large')
    }

    quantitiesByProduct.set(productId, nextQuantity)
  }

  return [...quantitiesByProduct.entries()].map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }))
}
