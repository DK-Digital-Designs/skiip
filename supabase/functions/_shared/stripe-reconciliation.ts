import Stripe from 'https://esm.sh/stripe@14.10.0'

export interface PaymentReconciliation {
  paymentIntentId: string
  chargeId: string | null
  platformFee: number
  stripeFee: number
  vendorNet: number
  paidAt: string
}

function getExpandedLatestCharge(paymentIntent: Stripe.PaymentIntent) {
  const latestCharge = paymentIntent.latest_charge as Stripe.Charge | string | null
  if (!latestCharge || typeof latestCharge === 'string') {
    return {
      chargeId: latestCharge || null,
      balanceTransaction: null,
    }
  }

  const balanceTransaction = latestCharge.balance_transaction as Stripe.BalanceTransaction | string | null
  return {
    chargeId: latestCharge.id,
    balanceTransaction: typeof balanceTransaction === 'string' ? null : balanceTransaction,
  }
}

export async function retrievePaymentIntentWithCharge(
  stripe: Stripe,
  paymentIntentId: string,
) {
  return await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  })
}

export function buildPaymentReconciliation(
  paymentIntent: Stripe.PaymentIntent,
  orderTotal: number,
): PaymentReconciliation {
  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment intent ${paymentIntent.id} is not succeeded`)
  }

  const { chargeId, balanceTransaction } = getExpandedLatestCharge(paymentIntent)
  const platformFee = Number(paymentIntent.application_fee_amount || 0) / 100
  const stripeFee = Number(balanceTransaction?.fee || 0) / 100

  return {
    paymentIntentId: paymentIntent.id,
    chargeId,
    platformFee,
    stripeFee,
    vendorNet: Number(orderTotal || 0) - platformFee - stripeFee,
    paidAt: new Date().toISOString(),
  }
}

export function buildPaidOrderUpdates(reconciliation: PaymentReconciliation) {
  return {
    status: 'paid',
    payment_status: 'succeeded',
    payment_intent_id: reconciliation.paymentIntentId,
    charge_id: reconciliation.chargeId,
    paid_at: reconciliation.paidAt,
    payment_failed_at: null,
    payment_failure_code: null,
    payment_failure_message: null,
    platform_fee: reconciliation.platformFee,
    stripe_fee: reconciliation.stripeFee,
    vendor_net: reconciliation.vendorNet,
  }
}
