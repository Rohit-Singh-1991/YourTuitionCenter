const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Checkout is not configured for this build yet. Complete payments go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-amber-400/50 bg-amber-400/15 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-300">
        Payments in the preview run in test mode — no real money is charged.
      </div>
    );
  }
  return null;
}
