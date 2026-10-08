# Production Go-Live Audit — Teachnation

## Scope and status

This is a repository-level audit note, not a declaration that production readiness or payment migration is complete. Do not remove application validation or the online-tests feature as part of test-data cleanup.

## Findings

- The kids-games checkout currently uses Stripe Checkout sessions through the server payment functions.
- Stripe client/server helpers and Stripe-specific checkout/order-summary handling are present.
- Admission UPI is a separate manual-payment flow with staff review; it is not the same as Stripe checkout.
- `PaymentTestModeBanner` warns when payment configuration is missing or uses a Stripe test key. Keep this guard until a verified production gateway is configured; do not hide the warning as a substitute for go-live configuration.
- `src/lib/tests-data.ts` supports the actual online-tests feature and must not be deleted merely because its name contains “tests.”
- Playwright Codegen tooling is developer/test tooling; it should remain out of customer-facing runtime paths, not be blindly deleted.

## Required before switching Stripe to Razorpay

1. Confirm the merchant Razorpay account is activated for live payments.
2. Add server-only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; expose only the publishable key to the browser.
3. Implement server-side order creation using trusted database prices (never client-supplied totals).
4. Implement checkout opening and callback signature verification on the server.
5. Verify payment status server-side before granting game access; make updates idempotent.
6. Add and verify Razorpay webhook signature handling for captured/failed/refunded events.
7. Update order persistence, success/failure/cancel UX, refunds/reconciliation, and remove Stripe dependencies/secrets only after migration is verified.
8. Keep manual UPI admission flow unless there is a separately approved migration for it.
9. Test test-mode success, failure, cancellation, duplicate callback/webhook, invalid signature, and unpaid-access denial; then perform a controlled live low-value transaction and refund.
10. Confirm Vercel/Supabase environment variables and webhook URL for the deployed environment.

## Test-data cleanup

Remove only confirmed demo records from the production database after backing them up and identifying ownership. Do not delete schema seed/migration fixtures, legitimate course/game content, online-test questions, or operational records based solely on names such as `test`, `sample`, or `demo`.

## Verification limitation

This note does not claim a local install/build, browser E2E, Razorpay transaction, or deployment test was run. Complete those checks in the project workspace/CI before enabling live payments.