const DEFAULT_ALLOWED_ORIGINS = ['https://skiip.co.uk', 'http://localhost:5173', 'http://127.0.0.1:5173']

function parseAllowedOrigins(): Set<string> {
  const fromEnv = Deno.env.get('ALLOWED_ORIGINS')
  const origins = fromEnv
    ? fromEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS

  return new Set(origins)
}

export function buildCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = parseAllowedOrigins()
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : 'null'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  })
}
