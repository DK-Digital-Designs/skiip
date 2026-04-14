import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RequestUser {
  id: string
  role: string
}

export async function requireUser(req: Request): Promise<RequestUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase auth environment')
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const { data: userData, error: userError } = await authedClient.auth.getUser()
  if (userError || !userData?.user) {
    throw new Error('Invalid user token')
  }

  const { data: profile, error: profileError } = await authedClient
    .from('user_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError) {
    throw new Error('Unable to read user profile')
  }

  return { id: userData.user.id, role: profile?.role ?? 'buyer' }
}
