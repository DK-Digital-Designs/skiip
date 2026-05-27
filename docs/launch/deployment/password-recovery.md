# Password Recovery

Read this when deploying or testing account password reset for the product app.

## Implemented Flow

- The unified sign-in page links to `/#/forgot-password`.
- The request form calls Supabase Auth `resetPasswordForEmail()` with the production canonical return URL `https://www.skiip.co.uk/#/reset-password`; local/staging deployments can supply their environment-specific public origin.
- The product app uses Supabase PKCE auth and `HashRouter`; it explicitly exchanges a returned `?code=` before normal auth routing, identifies the recovery session, and opens `/#/reset-password`.
- Requests reaching legacy production origins (`https://skiip.vercel.app` or bare `https://skiip.co.uk`) are redirected to `https://www.skiip.co.uk` before PKCE exchange so the browser uses one canonical auth origin.
- If Supabase returns an expired/invalid OTP failure in URL fragments, the app normalizes the callback into `/#/reset-password?reason=expired` rather than rendering a hash-router 404.
- The password form calls `updateUser({ password })`, signs out the recovery session, and returns the user to sign-in.
- The request confirmation does not disclose whether an email address exists.

No schema migration or edge function deployment is required for this flow.

## Hosted Supabase Setup

This is external configuration and must be completed separately for each Supabase environment:

1. In Auth URL Configuration, allow the deployed product-app password callback URL.
   - Production canonical callback: `https://www.skiip.co.uk/#/reset-password`
   - Do not use `https://skiip.vercel.app` for production authentication emails.
   - Staging: use the matching staged product-app origin with `/#/reset-password`
2. Set the production Site URL to `https://www.skiip.co.uk/`.
3. Configure a custom production SMTP provider for Supabase Auth recovery emails. Without custom SMTP, Supabase's hosted default sender is best-effort/test-only, rate limited, and does not deliver to addresses outside the project's team. See [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
4. Configure the hosted reset-password email template with the branded source file [`supabase/templates/recovery.html`](../../../supabase/templates/recovery.html) and subject `Reset your SKIIP password`.
   - The button must use `{{ .ConfirmationURL }}` so Supabase verifies the one-time recovery token before sending the browser to the application.
   - Do not use `{{ .RedirectTo }}` as the button URL; it is only the application destination carried through the verification flow.

A received email link shaped like `https://skiip.vercel.app/?code=...` indicates that Supabase hosted URL/template configuration is stale. With PKCE, a callback crossing from the requesting app origin to another origin cannot access the original code verifier, so the first link can be consumed without opening reset. The app canonical-origin guard redirects stale Vercel callbacks before exchange, but hosted configuration must still be corrected so email links visibly use `https://www.skiip.co.uk`.

Production reset requests use the canonical public origin. Set `VITE_PUBLIC_APP_ORIGIN=https://www.skiip.co.uk` in Vercel production so configuration is explicit; the code also defaults production builds to that origin. For local testing, set the variable to a callback such as `http://127.0.0.1:5173` and allow `http://127.0.0.1:5173/#/reset-password` in Supabase. For approved previews or staging, set their matching public origin and allow its exact callback as described in the Supabase redirect URL guide.

## Branded Email Template

The repository-managed recovery template is [`supabase/templates/recovery.html`](../../../supabase/templates/recovery.html). It includes:

- the SKIIP logo served from the canonical production app domain
- a branded password-reset call to action
- single-use/expiry guidance and ignore-if-unrequested security copy
- a canonical `www.skiip.co.uk` footer link

For the hosted Supabase project, apply this template in **Authentication > Email Templates > Reset password**, or patch only `mailer_subjects_recovery` and `mailer_templates_recovery_content` through the Supabase Management API. Do not use `supabase config push` from this repository for production template-only changes: the committed `supabase/config.toml` also contains local-development auth URL settings.

After applying the hosted template, request a fresh reset email and confirm:

1. The email displays SKIIP branding and the `Choose new password` button.
2. Clicking the button once opens `https://www.skiip.co.uk/#/reset-password`.
3. The new password can be saved and used to sign in.
4. Provider email-link tracking is disabled, because rewritten recovery links can break Supabase Auth verification.

For a recovery-email delivery failure such as issue #79, do not close the issue based on a successful UI submission. Record the target environment, test timestamp, custom SMTP/provider delivery result, receipt of the message in a controlled buyer inbox, and successful link redemption/sign-in.

## Verification

1. Open `https://www.skiip.co.uk/#/login` and choose `Forgot password?`.
2. Request a link for a test buyer account and confirm the response remains generic.
3. Confirm the delivered email link starts with `https://www.skiip.co.uk`, then open it in the same browser used to request it, because the PKCE verifier and short-lived recovery intent are stored in that browser origin.
4. Set a new password on `/#/reset-password`.
5. Confirm the recovery session signs out and that the account can sign in with the new password.
6. Request a new email if Supabase reports `otp_expired`; recovery links are single-use and can be consumed by an earlier click or email security-link scanner.
7. Repeat against staging before enabling the production callback and mail configuration.
