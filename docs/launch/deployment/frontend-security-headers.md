# Frontend Security Headers

Read this when you need the frontend security headers details from [Deployment](../DEPLOYMENT.md).

The product app deploy uses [`app/vercel.json`](../../../app/vercel.json) to set baseline browser hardening headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, and geolocation
- `Strict-Transport-Security`
