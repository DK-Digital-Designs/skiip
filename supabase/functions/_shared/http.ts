const DEFAULT_ALLOWED_ORIGINS = [
  'https://skiip.co.uk',
  'https://www.skiip.co.uk',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

function parseAllowedOrigins(): Set<string> {
  const fromEnv = Deno.env.get('ALLOWED_ORIGINS')
  const origins = fromEnv
    ? fromEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS

  return new Set(origins)
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return true
  }

  return parseAllowedOrigins().has(origin)
}

export function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return isAllowedOrigin(parsed.origin)
  } catch {
    return false
  }
}

export function buildCorsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : 'null'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
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
