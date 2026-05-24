# Rollback Checklist

Read this when you need the rollback checklist details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

If a release is unstable:

1. Stop pushing further changes until the failure mode is understood.
2. Roll back the frontend first if the regression is clearly UI-only.
3. Roll back edge functions if auth, checkout, refund, or webhook behavior regressed there.
4. Pause new order intake if payment capture, refunds, or order-state progression are unreliable.
5. Do not blindly roll back the database after live payments. Prefer a forward fix unless a restore plan is explicitly prepared.
6. Re-run smoke checks after the rollback before reopening traffic.
