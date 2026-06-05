import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { normalizeSubmittedOperationalPhone, normalizeSubmittedWhatsAppPhone } from "../_shared/phone.ts"
import { normalizeScheduledCollection } from "../_shared/scheduled-collection.ts"
import {
  type AggregatedOrderItem,
  OrderItemValidationError,
  type ParsedOrderItemLine,
  aggregateOrderItemQuantities,
  parseOrderItemLines,
} from "./order-items.ts"

const log = logger('order-create')
const SERVICE_FEE_AMOUNT = 1.5
const PRODUCT_MODIFIER_BACKEND_ENABLED = Deno.env.get('PRODUCT_MODIFIER_BACKEND_ENABLED') === 'true'

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

interface CreatedOrder {
  id: string
  store_id: string
}

interface ProductRow {
  id: string
  store_id: string
  name: string
  price: number | string
  images?: string[] | null
  status: string
  deleted_at?: string | null
  inventory_quantity?: number | null
}

interface ModifierGroupRow {
  id: string
  product_id: string
  name: string
  required: boolean
  min_select: number
  max_select: number
  sort_order: number
}

interface ModifierOptionRow {
  id: string
  group_id: string
  name: string
  price_delta: number | string
  sort_order: number
}

interface SelectedModifier {
  group: ModifierGroupRow
  option: ModifierOptionRow
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function groupByProduct(groups: ModifierGroupRow[]) {
  const grouped = new Map<string, ModifierGroupRow[]>()
  for (const group of groups) {
    const currentGroups = grouped.get(group.product_id) || []
    currentGroups.push(group)
    grouped.set(group.product_id, currentGroups)
  }

  for (const productGroups of grouped.values()) {
    productGroups.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  }

  return grouped
}

function validateAndBuildSelectedModifiers(
  line: ParsedOrderItemLine,
  groupsByProduct: Map<string, ModifierGroupRow[]>,
  optionsById: Map<string, ModifierOptionRow & { group: ModifierGroupRow }>,
) {
  const productGroups = groupsByProduct.get(line.product_id) || []
  const selectedModifiers: SelectedModifier[] = []
  const selectedCountByGroup = new Map<string, number>()

  for (const optionId of line.selected_option_ids) {
    const option = optionsById.get(optionId)
    if (!option || option.group.product_id !== line.product_id) {
      throw new OrderItemValidationError('One or more selected options are no longer available')
    }

    selectedModifiers.push({ group: option.group, option })
    selectedCountByGroup.set(option.group.id, (selectedCountByGroup.get(option.group.id) || 0) + 1)
  }

  for (const group of productGroups) {
    const selectedCount = selectedCountByGroup.get(group.id) || 0
    const minSelect = Number(group.min_select || 0)
    const maxSelect = Number(group.max_select || 1)

    if (group.required && selectedCount < Math.max(minSelect, 1)) {
      throw new OrderItemValidationError(`Choose an option for ${group.name}`)
    }

    if (selectedCount > maxSelect) {
      throw new OrderItemValidationError(`Too many options selected for ${group.name}`)
    }
  }

  return selectedModifiers.sort((a, b) => {
    const groupSort = Number(a.group.sort_order || 0) - Number(b.group.sort_order || 0)
    if (groupSort !== 0) return groupSort
    return Number(a.option.sort_order || 0) - Number(b.option.sort_order || 0)
  })
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
    const submittedPhone = (body.customer_phone || '').trim()
    const customerPhone = body.whatsapp_opt_in === true
      ? normalizeSubmittedWhatsAppPhone(submittedPhone)
      : normalizeSubmittedOperationalPhone(submittedPhone)
    const scheduledCollection = normalizeScheduledCollection(body)

    let parsedLines: ParsedOrderItemLine[]
    let inventoryItems: AggregatedOrderItem[]
    try {
      parsedLines = parseOrderItemLines(body.items)
      inventoryItems = aggregateOrderItemQuantities(parsedLines)
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
        { error: 'A valid WhatsApp phone number including country code is required when WhatsApp updates are enabled' },
        400,
        origin,
      )
    }

    if (body.whatsapp_opt_in !== true && !customerPhone) {
      return jsonResponse({ error: 'A valid customer phone number is required' }, 400, origin)
    }

    const productIds = [...new Set(parsedLines.map((item) => item.product_id))]
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

    const productMap = new Map((products as ProductRow[]).map((product) => [product.id, product]))
    const unavailableItems: string[] = []
    const insufficientItems: Array<{
      product_id: string
      name: string
      requested: number
      available: number
    }> = []

    for (const item of inventoryItems) {
      const product = productMap.get(item.product_id)
      if (!product || product.deleted_at || product.status !== 'active') {
        unavailableItems.push(item.product_id)
        continue
      }
      if ((product.inventory_quantity ?? 0) < item.quantity) {
        insufficientItems.push({
          product_id: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.inventory_quantity ?? 0,
        })
      }
    }

    if (unavailableItems.length > 0) {
      return jsonResponse(
        {
          code: 'PRODUCT_UNAVAILABLE',
          error: 'One or more items in your cart are no longer available. Please refresh your cart and try again.',
          unavailable_items: unavailableItems,
        },
        400,
        origin,
      )
    }

    if (insufficientItems.length > 0) {
      const firstItem = insufficientItems[0]
      const itemLabel = insufficientItems.length === 1
        ? `${firstItem.name} only has ${firstItem.available} left, but your cart asks for ${firstItem.requested}.`
        : 'Some items in your cart do not have enough stock left.'

      return jsonResponse(
        {
          code: 'INSUFFICIENT_INVENTORY',
          error: `${itemLabel} Please reduce the quantity or remove the item, then try checkout again.`,
          insufficient_items: insufficientItems,
        },
        400,
        origin,
      )
    }

    // Modifier support is dark-launchable: until PRODUCT_MODIFIER_BACKEND_ENABLED is
    // set, the function does not touch the modifier tables (so it can be deployed
    // ahead of the migration) and rejects any line that carries option selections
    // rather than silently dropping their price deltas.
    const hasConfiguredLines = parsedLines.some((line) => line.selected_option_ids.length > 0)

    if (!PRODUCT_MODIFIER_BACKEND_ENABLED && hasConfiguredLines) {
      return jsonResponse(
        { error: 'Product modifiers are not enabled for checkout yet' },
        400,
        origin,
      )
    }

    const groupsByProduct = new Map<string, ModifierGroupRow[]>()
    const optionsById = new Map<string, ModifierOptionRow & { group: ModifierGroupRow }>()

    if (PRODUCT_MODIFIER_BACKEND_ENABLED) {
      const { data: modifierGroups, error: groupsError } = await supabase
        .from('product_modifier_groups')
        .select('id, product_id, name, required, min_select, max_select, sort_order')
        .in('product_id', productIds)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      if (groupsError) {
        throw groupsError
      }

      const groups = (modifierGroups || []) as ModifierGroupRow[]
      const groupIds = groups.map((group) => group.id)
      const { data: modifierOptions, error: optionsError } = groupIds.length > 0
        ? await supabase
          .from('product_modifier_options')
          .select('id, group_id, name, price_delta, sort_order')
          .in('group_id', groupIds)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
        : { data: [], error: null }

      if (optionsError) {
        throw optionsError
      }

      for (const [productId, productGroups] of groupByProduct(groups)) {
        groupsByProduct.set(productId, productGroups)
      }
      const groupsById = new Map(groups.map((group) => [group.id, group]))
      for (const option of (modifierOptions || []) as ModifierOptionRow[]) {
        const group = groupsById.get(option.group_id)
        if (!group) continue
        optionsById.set(option.id, { ...option, group })
      }
    }

    const orderItems = parsedLines.map((item) => {
      const product = productMap.get(item.product_id)!
      const selectedModifiers = validateAndBuildSelectedModifiers(item, groupsByProduct, optionsById)
      const basePrice = roundMoney(Number(product.price))
      const modifierTotal = selectedModifiers.reduce((sum, selection) => (
        sum + Number(selection.option.price_delta || 0)
      ), 0)
      const unitPrice = roundMoney(basePrice + modifierTotal)
      const modifierDisplay = selectedModifiers.map((selection) => ({
        groupName: selection.group.name,
        optionName: selection.option.name,
        priceDelta: roundMoney(Number(selection.option.price_delta || 0)),
      }))

      return {
        product_id: product.id,
        quantity: item.quantity,
        price: unitPrice,
        total: roundMoney(unitPrice * item.quantity),
        line_note: item.line_note,
        client_line_id: item.client_line_id,
        modifier_selections: selectedModifiers.map((selection) => ({
          product_modifier_group_id: selection.group.id,
          product_modifier_option_id: selection.option.id,
          group_name: selection.group.name,
          option_name: selection.option.name,
          price_delta: roundMoney(Number(selection.option.price_delta || 0)),
          sort_order: Number(selection.group.sort_order || 0) * 1000 + Number(selection.option.sort_order || 0),
        })),
        product_snapshot: {
          name: product.name,
          price: unitPrice,
          base_price: basePrice,
          basePrice,
          final_unit_price: unitPrice,
          finalUnitPrice: unitPrice,
          image: product.images?.[0] || null,
          modifierDisplay,
          lineNote: item.line_note,
        },
      }
    })

    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.total, 0))
    const serviceFee = SERVICE_FEE_AMOUNT
    const total = roundMoney(subtotal + tipAmount + serviceFee)
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .rpc('create_order_with_items_v1', {
        p_order_number: orderNumber,
        p_user_id: user.id,
        p_store_id: storeIds[0],
        p_subtotal: subtotal,
        p_total: total,
        p_tip_amount: tipAmount,
        p_service_fee: serviceFee,
        p_customer_email: customerEmail,
        p_customer_phone: customerPhone,
        p_notes: body.notes?.trim() || null,
        p_whatsapp_opt_in: body.whatsapp_opt_in === true,
        p_scheduled_collection_at: scheduledCollection.scheduled_collection_at,
        p_scheduled_collection_timezone: scheduledCollection.scheduled_collection_timezone,
        p_items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          line_note: item.line_note,
          client_line_id: item.client_line_id,
          modifier_selections: item.modifier_selections,
          product_snapshot: item.product_snapshot,
        })),
      })
      .single()

    if (orderError || !order) {
      throw orderError || new Error('Failed to create order')
    }

    const createdOrder = order as CreatedOrder

    await supabase.from('audit_logs').insert({
      event_type: 'order_created',
      entity_type: 'order',
      entity_id: createdOrder.id,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        store_id: createdOrder.store_id,
        subtotal,
        total,
        tip_amount: tipAmount,
        service_fee: serviceFee,
        item_count: orderItems.length,
      },
    })

    return jsonResponse({ order: createdOrder }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Order creation failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Order creation failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
