# Order Lifecycle

Read this when you need the order lifecycle details from [Operations](../OPERATIONS.md).

Current intended operational flow:

- `pending`
- `paid`
- `preparing`
- `ready`
- `collected`

Allowed side paths:

- `paid -> cancelled`
- `preparing -> cancelled`
- `ready -> cancelled`
- `paid -> refunded`
- `preparing -> refunded`
- `ready -> refunded`
- `collected -> refunded`

Important current meanings:

- `pending` is the pre-payment state and is shown in the vendor UI as waiting for payment
- `refunded` is an admin/system financial outcome, not a normal vendor status transition

Legacy schema statuses still exist but are not part of the current UI flow:

- `processing`
- `shipped`
- `delivered`
