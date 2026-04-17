import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"

const log = logger('order-create')

interface CreateOrderItem {
  product_id: string
  quantity: number
}

interface CreateOrderRequest {
  items: CreateOrderItem[]
  customer_email?: string
  customer_phone?: string
  notes?: string
  whatsapp_opt_in?: boolean
  tip_amount?: number
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
    const items = Array.isArray(body.items) ? body.items : []
    const tipAmount = roundMoney(Math.max(Number(body.tip_amount || 0), 0))
    const customerEmail = (body.customer_email || '').trim()
    const customerPhone = (body.customer_phone || '').trim()

    if (items.length === 0) {
      return jsonResponse({ error: 'At least one item is required' }, 400, origin)
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

    const normalizedItems = items.map((item) => ({
      product_id: item.product_id,
      quantity: Math.max(1, Number(item.quantity) || 0),
    }))

    if (normalizedItems.some((item) => !item.product_id || item.quantity <= 0)) {
      return jsonResponse({ error: 'Each item requires a product_id and quantity' }, 400, origin)
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.product_id))]
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
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        store_id: storeIds[0],
        status: 'pending',
        subtotal,
        total,
        tip_amount: tipAmount,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        notes: body.notes?.trim() || null,
        whatsapp_opt_in: body.whatsapp_opt_in === true,
        payment_status: 'pending',
      })
      .select('id, order_number, subtotal, total, tip_amount, store_id, status')
      .single()

    if (orderError || !order) {
      throw orderError || new Error('Failed to create order')
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          product_snapshot: item.product_snapshot,
        })),
      )

    if (itemsError) {
      throw itemsError
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
    return jsonResponse({ error: error.message || 'Order creation failed' }, 400, origin)
  }
})
