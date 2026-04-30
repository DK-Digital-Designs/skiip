import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { normalizeScheduledCollection } from "../_shared/scheduled-collection.ts"
import {
  type AggregatedOrderItem,
  OrderItemValidationError,
  parseAndAggregateOrderItems,
} from "./order-items.ts"

const log = logger('order-create')

interface CreateOrderRequest {
  items?: unknown
  customer_email?: string
  customer_phone?: string
  notes?: string
  whatsapp_opt_in?: boolean
  tip_amount?: number
  scheduled_collection_at?: string | null
  scheduled_collection_timezone?: string | null
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  if (!isAllowedOrigin(origin)) {
    log.warn('Rejected request from disallowed origin', { origin })
    return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
  }

  try {
    const user = await requireUser(req)
    const supabase = createServiceClient()

    const body = (await req.json()) as CreateOrderRequest
    const tipAmount = roundMoney(Math.max(Number(body.tip_amount || 0), 0))
    const customerEmail = (body.customer_email || '').trim()
    const customerPhone = (body.customer_phone || '').trim()
    const scheduledCollection = normalizeScheduledCollection(body)

    let normalizedItems: AggregatedOrderItem[]
    try {
      normalizedItems = parseAndAggregateOrderItems(body.items)
    } catch (err: unknown) {
      if (err instanceof OrderItemValidationError) {
        return jsonResponse({ error: err.message }, 400, origin)
      }
      throw err
    }

    if (!customerEmail) {
      return jsonResponse({ error: 'Customer email is required' }, 400, origin)
    }

    if (body.whatsapp_opt_in === true && !customerPhone) {
      return jsonResponse(
        { error: 'Customer phone is required when WhatsApp updates are enabled' },
        400,
        origin,
      )
    }

    const productIds = normalizedItems.map((item) => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, store_id, name, price, images, status, deleted_at, inventory_quantity')
      .in('id', productIds)

    if (productsError) {
      throw productsError
    }

    if (!products || products.length !== productIds.length) {
      return jsonResponse({ error: 'One or more products could not be found' }, 404, origin)
    }

    const storeIds = [...new Set(products.map((product) => product.store_id))]
    if (storeIds.length !== 1) {
      return jsonResponse({ error: 'All items must belong to the same store' }, 400, origin)
    }

    const productMap = new Map(products.map((product) => [product.id, product]))
    const orderItems = normalizedItems.map((item) => {
      const product = productMap.get(item.product_id)
      if (!product || product.deleted_at || product.status !== 'active') {
        throw new Error(`Product ${item.product_id} is not available for ordering`)
      }
      if ((product.inventory_quantity ?? 0) < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`)
      }
      const unitPrice = roundMoney(Number(product.price))
      return {
        product_id: product.id,
        quantity: item.quantity,
        price: unitPrice,
        total: roundMoney(unitPrice * item.quantity),
        product_snapshot: {
          name: product.name,
          price: unitPrice,
          image: product.images?.[0] || null,
        },
      }
    })

    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.total, 0))
    const total = roundMoney(subtotal + tipAmount)
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .rpc('create_order_with_items_v1', {
        p_order_number: orderNumber,
        p_user_id: user.id,
        p_store_id: storeIds[0],
        p_subtotal: subtotal,
        p_total: total,
        p_tip_amount: tipAmount,
        p_customer_email: customerEmail,
        p_customer_phone: customerPhone || null,
        p_notes: body.notes?.trim() || null,
        p_whatsapp_opt_in: body.whatsapp_opt_in === true,
        p_scheduled_collection_at: scheduledCollection.scheduled_collection_at,
        p_scheduled_collection_timezone: scheduledCollection.scheduled_collection_timezone,
        p_items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          product_snapshot: item.product_snapshot,
        })),
      })
      .single()

    if (orderError || !order) {
      throw orderError || new Error('Failed to create order')
    }

    await supabase.from('audit_logs').insert({
      event_type: 'order_created',
      entity_type: 'order',
      entity_id: order.id,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        store_id: order.store_id,
        subtotal,
        total,
        tip_amount: tipAmount,
        item_count: orderItems.length,
      },
    })

    return jsonResponse({ order }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Order creation failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Order creation failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
