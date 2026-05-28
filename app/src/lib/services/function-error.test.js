import {
  GENERIC_CHECKOUT_ERROR_MESSAGE,
  createCheckoutFunctionError,
} from './function-error';

function functionError(payload, status = 400) {
  return {
    message: 'Edge Function returned a non-2xx status code',
    context: new Response(JSON.stringify(payload), { status }),
  };
}

describe('checkout function error mapping', () => {
  it('uses the product-specific insufficient inventory message from order-create', async () => {
    const error = await createCheckoutFunctionError(functionError({
      code: 'INSUFFICIENT_INVENTORY',
      error: 'Burger only has 1 left, but your cart asks for 2. Please reduce the quantity or remove the item, then try checkout again.',
    }));

    expect(error.code).toBe('INSUFFICIENT_INVENTORY');
    expect(error.buyerMessage).toContain('Burger only has 1 left');
  });

  it('maps unavailable products to a refresh-and-adjust message', async () => {
    const error = await createCheckoutFunctionError(functionError({
      code: 'PRODUCT_UNAVAILABLE',
      error: 'One or more items in your cart are no longer available. Please refresh your cart and try again.',
    }));

    expect(error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(error.buyerMessage).toBe('One or more items in your cart are no longer available. Refresh your cart, adjust the items, and try again.');
  });

  it('recognizes vendor payment setup failures returned as the error field', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'VENDOR_NOT_READY',
      message: 'The vendor has not completed their payment setup.',
    }, 403));

    expect(error.code).toBe('VENDOR_NOT_READY');
    expect(error.buyerMessage).toBe('Oops! This vendor is still setting up their bank account on SKIIP. Please try again later.');
  });

  it('maps scheduled collection validation failures to a buyer-safe message', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'Scheduled collection time must be in the future',
    }));

    expect(error.code).toBeNull();
    expect(error.buyerMessage).toBe('Choose a valid scheduled collection time before checking out.');
  });

  it('maps expired sessions without exposing auth internals', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'Invalid JWT',
    }, 401));

    expect(error.buyerMessage).toBe('Your session expired. Please sign in again before checking out.');
  });

  it('maps paused payments to a buyer-safe no-payment-taken message', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'PAYMENTS_PAUSED',
      message: 'Payments are temporarily unavailable. No payment has been taken.',
    }, 503));

    expect(error.code).toBe('PAYMENTS_PAUSED');
    expect(error.buyerMessage).toBe('Payments are temporarily unavailable. No payment has been taken. Please try again shortly.');
  });

  it('maps stale fee-window orders to a recreate-cart message', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'ORDER_REQUIRES_REFRESH',
      message: 'This order was created before the current zero-fee checkout window. Please recreate your cart before paying.',
    }, 409));

    expect(error.code).toBe('ORDER_REQUIRES_REFRESH');
    expect(error.buyerMessage).toBe('This order was created before the current zero-fee checkout window. Please recreate your cart before paying.');
  });

  it('keeps unknown failures generic', async () => {
    const error = await createCheckoutFunctionError(functionError({
      error: 'database statement timeout at internal.stack.trace',
    }, 500));

    expect(error.buyerMessage).toBe(GENERIC_CHECKOUT_ERROR_MESSAGE);
  });
});
