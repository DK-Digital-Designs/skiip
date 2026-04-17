import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"
import { dispatchPendingNotifications } from "../_shared/notifications.ts"

const log = logger("notification-dispatch")
const DISPATCH_SECRET = Deno.env.get("NOTIFICATION_DISPATCH_SECRET")?.trim()

serve(async (req: Request) => {
  const origin = req.headers.get("origin")
  const corsHeaders = buildCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin)
  }

  if (!DISPATCH_SECRET) {
    return jsonResponse(
      { error: "NOTIFICATION_DISPATCH_SECRET is not configured" },
      503,
      origin,
    )
  }

  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${DISPATCH_SECRET}`) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin)
  }

  try {
    const rawBody = (await req.text()).trim()
    const body = rawBody ? JSON.parse(rawBody) : {}
    const batchSize = Number.parseInt(String(body.batchSize || ""), 10)
    const maxBatches = Number.parseInt(String(body.maxBatches || ""), 10)

    const supabase = createServiceClient()
    const result = await dispatchPendingNotifications({
      supabase,
      reason: "manual-endpoint",
      batchSize: Number.isNaN(batchSize) ? undefined : batchSize,
      maxBatches: Number.isNaN(maxBatches) ? undefined : maxBatches,
    })

    return jsonResponse({ success: true, ...result }, 200, origin)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log.error("Notification dispatch endpoint failed", { error: message })
    return jsonResponse({ error: message }, 500, origin)
  }
})
