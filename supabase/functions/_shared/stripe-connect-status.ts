export type StripeConnectStatus =
  | 'not_started'
  | 'onboarding'
  | 'restricted'
  | 'pending_verification'
  | 'ready'

export interface StripeAccountLike {
  id?: string | null
  charges_enabled?: boolean | null
  payouts_enabled?: boolean | null
  details_submitted?: boolean | null
  capabilities?: {
    card_payments?: string | null
    transfers?: string | null
  } | null
  requirements?: {
    currently_due?: string[] | null
    past_due?: string[] | null
    pending_verification?: string[] | null
    disabled_reason?: string | null
  } | null
}

export interface DerivedStripeConnectStatus {
  stripe_connect_status: StripeConnectStatus
  stripe_onboarding_complete: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean
  stripe_card_payments_status: string | null
  stripe_transfers_status: string | null
  stripe_requirements_currently_due: string[]
  stripe_requirements_past_due: string[]
  stripe_requirements_pending_verification: string[]
  stripe_requirements_disabled_reason: string | null
}

type StoreStatusSnapshot = Partial<DerivedStripeConnectStatus>

function normalizeRequirementList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string').sort()
}

function sameStringArray(left: unknown, right: unknown) {
  const leftList = normalizeRequirementList(left)
  const rightList = normalizeRequirementList(right)

  return leftList.length === rightList.length
    && leftList.every((value, index) => value === rightList[index])
}

function valueChanged(current: StoreStatusSnapshot, key: keyof DerivedStripeConnectStatus, next: unknown) {
  const currentValue = current[key]
  if (Array.isArray(next)) {
    return !sameStringArray(currentValue, next)
  }

  return currentValue !== next
}

export function deriveStripeConnectStatus(account: StripeAccountLike | null | undefined): DerivedStripeConnectStatus {
  if (!account?.id) {
    return {
      stripe_connect_status: 'not_started',
      stripe_onboarding_complete: false,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_card_payments_status: null,
      stripe_transfers_status: null,
      stripe_requirements_currently_due: [],
      stripe_requirements_past_due: [],
      stripe_requirements_pending_verification: [],
      stripe_requirements_disabled_reason: null,
    }
  }

  const currentlyDue = normalizeRequirementList(account.requirements?.currently_due)
  const pastDue = normalizeRequirementList(account.requirements?.past_due)
  const pendingVerification = normalizeRequirementList(account.requirements?.pending_verification)
  const disabledReason = account.requirements?.disabled_reason || null
  const cardPaymentsStatus = account.capabilities?.card_payments || null
  const transfersStatus = account.capabilities?.transfers || null
  const chargesEnabled = account.charges_enabled === true
  const payoutsEnabled = account.payouts_enabled === true
  const capabilitiesReady = cardPaymentsStatus === 'active' && transfersStatus === 'active'

  let status: StripeConnectStatus
  if (
    chargesEnabled
    && payoutsEnabled
    && capabilitiesReady
    && !disabledReason
    && currentlyDue.length === 0
    && pastDue.length === 0
    && pendingVerification.length === 0
  ) {
    status = 'ready'
  } else if (!disabledReason && currentlyDue.length === 0 && pastDue.length === 0 && pendingVerification.length > 0) {
    status = 'pending_verification'
  } else if (disabledReason || pastDue.length > 0 || (account.details_submitted === true && !capabilitiesReady)) {
    status = 'restricted'
  } else {
    status = 'onboarding'
  }

  return {
    stripe_connect_status: status,
    stripe_onboarding_complete: status === 'ready',
    stripe_charges_enabled: chargesEnabled,
    stripe_payouts_enabled: payoutsEnabled,
    stripe_card_payments_status: cardPaymentsStatus,
    stripe_transfers_status: transfersStatus,
    stripe_requirements_currently_due: currentlyDue,
    stripe_requirements_past_due: pastDue,
    stripe_requirements_pending_verification: pendingVerification,
    stripe_requirements_disabled_reason: disabledReason,
  }
}

export function buildStripeConnectStoreUpdate(
  currentStore: StoreStatusSnapshot,
  derivedStatus: DerivedStripeConnectStatus,
  checkedAt = new Date().toISOString(),
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    stripe_connect_last_checked_at: checkedAt,
  }

  for (const [key, value] of Object.entries(derivedStatus) as [keyof DerivedStripeConnectStatus, unknown][]) {
    if (valueChanged(currentStore, key, value)) {
      update[key] = value
    }
  }

  return update
}

export function canReconcileStripeConnectStore(
  user: { id: string; role: string },
  store: { user_id: string },
) {
  return user.role === 'admin' || store.user_id === user.id
}
