# Password Recovery

Read this when deploying or testing account password reset for the product app.

## Implemented Flow

- The unified sign-in page links to `/#/forgot-password`.
- The request form calls Supabase Auth `resetPasswordForEmail()` with a return URL for `/#/reset-password`.
- The product app uses Supabase PKCE auth and `HashRouter`; it explicitly exchanges a returned `?code=` before normal auth routing, identifies the recovery session, and opens `/#/reset-password` even if hosted configuration returned the link to `/#/login`.
- If Supabase returns an expired/invalid OTP failure in URL fragments, the app normalizes the callback into `/#/reset-password?reason=expired` rather than rendering a hash-router 404.
- The password form calls `updateUser({ password })`, signs out the recovery session, and returns the user to sign-in.
- The request confirmation does not disclose whether an email address exists.

No schema migration or edge function deployment is required for this flow.

## Hosted Supabase Setup

This is external configuration and must be completed separately for each Supabase environment:

1. In Auth URL Configuration, allow the deployed product-app password callback URL.
   - Verified current production app origin: `https://skiip.vercel.app/#/reset-password`
   - Add `https://www.skiip.co.uk/#/reset-password` only if that custom domain serves the product app's authentication screens.
   - Staging: use the matching staged product-app origin with `/#/reset-password`
2. Confirm the Site URL points to the correct product-app origin for the environment.
3. Configure a custom production SMTP provider for Supabase Auth recovery emails. Without custom SMTP, Supabase's hosted default sender is best-effort/test-only, rate limited, and does not deliver to addresses outside the project's team. See [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
4. If the hosted recovery email template was customized, ensure the action link uses `{{ .RedirectTo }}` rather than always returning users to `{{ .SiteURL }}`.

A received link shaped like `https://skiip.vercel.app/?code=...#/login` indicates delivery is working but the hosted return path is still not honoring the password-reset redirect. The app hotfix handles that return safely after a valid exchange; correct the Supabase URL/template configuration as well so newly issued links return directly to `/#/reset-password`.

The reset request uses the browser's current product-app origin, so every approved origin from which password reset can be requested must have its matching `/#/reset-password` callback allowed in Supabase. For local testing, add a callback such as `http://127.0.0.1:5173/#/reset-password`. For approved Vercel previews, add the exact preview callback or a narrowly scoped preview wildcard as described in the Supabase redirect URL guide.

For a recovery-email delivery failure such as issue #79, do not close the issue based on a successful UI submission. Record the target environment, test timestamp, custom SMTP/provider delivery result, receipt of the message in a controlled buyer inbox, and successful link redemption/sign-in.

## Verification

1. Open `/#/login` and choose `Forgot password?`.
2. Request a link for a test buyer account and confirm the response remains generic.
3. Open the delivered email link in the same browser used to request it, because the PKCE verifier and short-lived recovery intent are stored in that browser.
4. Set a new password on `/#/reset-password`.
5. Confirm the recovery session signs out and that the account can sign in with the new password.
6. Request a new email if Supabase reports `otp_expired`; recovery links are single-use and can be consumed by an earlier click or email security-link scanner.
7. Repeat against staging before enabling the production callback and mail configuration.
