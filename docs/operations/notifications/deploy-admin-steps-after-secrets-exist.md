# Deploy / Admin Steps After Secrets Exist

Read this when you need the deploy / admin steps after secrets exist details from [Notifications](../NOTIFICATIONS.md).

After the real provider values exist:

1. Update `supabase/.env.functions` locally or the hosted Supabase secrets store.
2. Run `supabase secrets set --env-file supabase/.env.functions`.
3. Deploy edge functions.
4. Confirm the Resend webhook is pointing at the hosted function endpoint, not local dev.
5. Confirm the Twilio sender and template SIDs match the enabled event scope.
6. Decide whether retry sweeps will be operator-triggered or externally scheduled.
7. If sweeps are required, store `NOTIFICATION_DISPATCH_SECRET` in the system that will call `notification-dispatch`.
