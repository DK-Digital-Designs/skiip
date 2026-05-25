# Password Recovery

Read this when deploying or testing account password reset for the product app.

## Implemented Flow

- The unified sign-in page links to `/#/forgot-password`.
- The request form calls Supabase Auth `resetPasswordForEmail()` with a return URL for `/#/reset-password`.
- The product app uses Supabase PKCE auth and `HashRouter`; the emailed callback exchanges the PKCE code and then exposes the password form only after Supabase emits the password-recovery session event.
- The password form calls `updateUser({ password })`, signs out the recovery session, and returns the user to sign-in.
- The request confirmation does not disclose whether an email address exists.

No schema migration or edge function deployment is required for this flow.

## Hosted Supabase Setup

This is external configuration and must be completed separately for each Supabase environment:

1. In Auth URL Configuration, allow the deployed product-app password callback URL.
   - Production: `https://www.skiip.co.uk/#/reset-password`
   - Staging: use the matching staged product-app origin with `/#/reset-password`
2. Confirm the Site URL points to the correct product-app origin for the environment.
3. Configure a production SMTP provider for Supabase Auth recovery emails. Supabase's default mail sender is intended only for testing and is rate limited.

For local Supabase testing, add the local Vite callback origin, such as `http://127.0.0.1:5173/#/reset-password`, to the local Auth redirect allow-list before testing email links.

## Verification

1. Open `/#/login` and choose `Forgot password?`.
2. Request a link for a test buyer account and confirm the response remains generic.
3. Open the delivered email link in the same browser used to request it, because the PKCE verifier is stored in that browser.
4. Set a new password on `/#/reset-password`.
5. Confirm the recovery session signs out and that the account can sign in with the new password.
6. Repeat against staging before enabling the production callback and mail configuration.
