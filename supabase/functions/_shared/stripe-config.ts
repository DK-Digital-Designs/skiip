import Stripe from 'https://esm.sh/stripe@14.10.0'

export const STRIPE_API_VERSION = '2023-10-16'

export type StripeMode = 'test' | 'live'

export interface EnvReader {
  get(key: string): string | undefined | null
}

export class StripeModeMismatchError extends Error {
  expectedMode: StripeMode
  actualMode: StripeMode

  constructor(expectedMode: StripeMode, actualMode: StripeMode) {
    super(`Stripe event livemode mismatch: expected ${expectedMode}, received ${actualMode}`)
    this.name = 'StripeModeMismatchError'
    this.expectedMode = expectedMode
    this.actualMode = actualMode
  }
}

export function getRequiredStripeMode(env: EnvReader = Deno.env): StripeMode {
  const rawMode = env.get('STRIPE_MODE')?.trim().toLowerCase()

  if (rawMode === 'test' || rawMode === 'live') {
    return rawMode
  }

  throw new Error('STRIPE_MODE must be set to "test" or "live"')
}

export function assertStripeLivemode(
  event: { livemode: boolean },
  env: EnvReader = Deno.env,
) {
  const expectedMode = getRequiredStripeMode(env)
  const expectedLivemode = expectedMode === 'live'

  if (event.livemode !== expectedLivemode) {
    throw new StripeModeMismatchError(expectedMode, event.livemode ? 'live' : 'test')
  }
}

export function isPaymentsEnabled(env: EnvReader = Deno.env) {
  return env.get('PAYMENTS_ENABLED')?.trim().toLowerCase() === 'true'
}

export function parseStripeWebhookSecrets(env: EnvReader = Deno.env) {
  return (env.get('STRIPE_WEBHOOK_SECRET') || '')
    .split(',')
    .map((secret) => secret.trim())
    .filter(Boolean)
}

export async function constructWithWebhookSecrets<T>(
  secrets: string[],
  construct: (secret: string) => Promise<T>,
  getErrorMessage: (error: unknown) => string = (error) =>
    error instanceof Error ? error.message : String(error),
) {
  if (!secrets.length) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  const errors: string[] = []
  for (const secret of secrets) {
    try {
      return await construct(secret)
    } catch (error: unknown) {
      errors.push(getErrorMessage(error))
    }
  }

  throw new Error(errors[0] || 'Stripe webhook signature verification failed')
}

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  })
}
