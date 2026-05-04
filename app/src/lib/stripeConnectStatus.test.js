import {
  buildStripeConnectStoreUpdate,
  canReconcileStripeConnectStore,
  deriveStripeConnectStatus,
} from '../../../supabase/functions/_shared/stripe-connect-status.ts';

const readyAccount = {
  id: 'acct_ready',
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  capabilities: {
    card_payments: 'active',
    transfers: 'active',
  },
  requirements: {
    currently_due: [],
    past_due: [],
    pending_verification: [],
    disabled_reason: null,
  },
};

describe('Stripe Connect status derivation', () => {
  it('marks a missing account as not started', () => {
    expect(deriveStripeConnectStatus(null)).toMatchObject({
      stripe_connect_status: 'not_started',
      stripe_onboarding_complete: false,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
    });
  });

  it('marks a fully enabled account as ready', () => {
    expect(deriveStripeConnectStatus(readyAccount)).toMatchObject({
      stripe_connect_status: 'ready',
      stripe_onboarding_complete: true,
      stripe_charges_enabled: true,
      stripe_payouts_enabled: true,
      stripe_card_payments_status: 'active',
      stripe_transfers_status: 'active',
    });
  });

  it('keeps accounts with outstanding onboarding requirements out of ready', () => {
    const status = deriveStripeConnectStatus({
      ...readyAccount,
      details_submitted: false,
      charges_enabled: false,
      payouts_enabled: false,
      requirements: {
        currently_due: ['individual.first_name'],
        past_due: [],
        pending_verification: [],
        disabled_reason: null,
      },
    });

    expect(status.stripe_connect_status).toBe('onboarding');
    expect(status.stripe_onboarding_complete).toBe(false);
  });

  it('marks disabled or past-due accounts as restricted', () => {
    expect(deriveStripeConnectStatus({
      ...readyAccount,
      requirements: {
        currently_due: [],
        past_due: [],
        pending_verification: [],
        disabled_reason: 'requirements.past_due',
      },
    }).stripe_connect_status).toBe('restricted');

    expect(deriveStripeConnectStatus({
      ...readyAccount,
      requirements: {
        currently_due: [],
        past_due: ['external_account'],
        pending_verification: [],
        disabled_reason: null,
      },
    }).stripe_connect_status).toBe('restricted');
  });

  it('marks verification-only accounts as pending verification', () => {
    const status = deriveStripeConnectStatus({
      ...readyAccount,
      requirements: {
        currently_due: [],
        past_due: [],
        pending_verification: ['individual.verification.document'],
        disabled_reason: null,
      },
    });

    expect(status.stripe_connect_status).toBe('pending_verification');
    expect(status.stripe_onboarding_complete).toBe(false);
  });

  it('does not mark accounts ready when a required capability is inactive', () => {
    const status = deriveStripeConnectStatus({
      ...readyAccount,
      capabilities: {
        card_payments: 'pending',
        transfers: 'active',
      },
    });

    expect(status.stripe_connect_status).toBe('restricted');
    expect(status.stripe_onboarding_complete).toBe(false);
  });

  it('supports regression from ready back to not ready', () => {
    const update = buildStripeConnectStoreUpdate(
      {
        stripe_connect_status: 'ready',
        stripe_onboarding_complete: true,
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        stripe_card_payments_status: 'active',
        stripe_transfers_status: 'active',
        stripe_requirements_currently_due: [],
        stripe_requirements_past_due: [],
        stripe_requirements_pending_verification: [],
        stripe_requirements_disabled_reason: null,
      },
      deriveStripeConnectStatus({
        ...readyAccount,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          past_due: ['external_account'],
          pending_verification: [],
          disabled_reason: 'requirements.past_due',
        },
      }),
      '2026-05-04T18:00:00.000Z',
    );

    expect(update).toMatchObject({
      stripe_connect_status: 'restricted',
      stripe_onboarding_complete: false,
      stripe_payouts_enabled: false,
      stripe_requirements_past_due: ['external_account'],
      stripe_requirements_disabled_reason: 'requirements.past_due',
      stripe_connect_last_checked_at: '2026-05-04T18:00:00.000Z',
    });
  });
});

describe('Stripe Connect reconciliation helpers', () => {
  it('authorizes only admins or the owning seller store', () => {
    expect(canReconcileStripeConnectStore(
      { id: 'owner-user', role: 'seller' },
      { user_id: 'owner-user' },
    )).toBe(true);
    expect(canReconcileStripeConnectStore(
      { id: 'other-user', role: 'seller' },
      { user_id: 'owner-user' },
    )).toBe(false);
    expect(canReconcileStripeConnectStore(
      { id: 'admin-user', role: 'admin' },
      { user_id: 'owner-user' },
    )).toBe(true);
  });

  it('keeps repeated reconciliation idempotent except last checked time', () => {
    const derivedStatus = deriveStripeConnectStatus(readyAccount);
    const update = buildStripeConnectStoreUpdate(
      derivedStatus,
      derivedStatus,
      '2026-05-04T18:05:00.000Z',
    );

    expect(update).toEqual({
      stripe_connect_last_checked_at: '2026-05-04T18:05:00.000Z',
    });
  });

  it('converges when return reconciliation runs before the webhook', () => {
    const update = buildStripeConnectStoreUpdate(
      {
        stripe_connect_status: 'onboarding',
        stripe_onboarding_complete: false,
      },
      deriveStripeConnectStatus(readyAccount),
      '2026-05-04T18:10:00.000Z',
    );

    expect(update).toMatchObject({
      stripe_connect_status: 'ready',
      stripe_onboarding_complete: true,
      stripe_connect_last_checked_at: '2026-05-04T18:10:00.000Z',
    });
  });

  it('converges when the webhook runs before return reconciliation', () => {
    const derivedStatus = deriveStripeConnectStatus(readyAccount);
    const update = buildStripeConnectStoreUpdate(
      {
        ...derivedStatus,
        stripe_connect_last_checked_at: '2026-05-04T18:10:00.000Z',
      },
      derivedStatus,
      '2026-05-04T18:11:00.000Z',
    );

    expect(update).toEqual({
      stripe_connect_last_checked_at: '2026-05-04T18:11:00.000Z',
    });
  });
});
