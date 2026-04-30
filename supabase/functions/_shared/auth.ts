import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RequestUser {
  id: string
  role: string
}

export class EdgeAuthError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'EdgeAuthError'
    this.status = status
    this.code = code
  }
}

export function getAuthErrorStatus(error: unknown) {
  return error instanceof EdgeAuthError ? error.status : null
}

export async function requireUser(req: Request): Promise<RequestUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new EdgeAuthError('Missing bearer token', 401, 'missing_bearer_token')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase auth environment')
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    throw new EdgeAuthError('Missing bearer token', 401, 'missing_bearer_token')
  }

  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const { data: userData, error: userError } = await authedClient.auth.getUser()
  if (userError || !userData?.user) {
    throw new EdgeAuthError('Invalid or expired user token', 401, 'invalid_user_token')
  }

  const { data: profile, error: profileError } = await authedClient
    .from('user_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    throw new EdgeAuthError('Unable to read user profile', 403, 'profile_unavailable')
  }

  return { id: userData.user.id, role: profile?.role ?? 'buyer' }
}
