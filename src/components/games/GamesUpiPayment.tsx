import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Copy, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatINR, STORE_UPI_ID, type CartItem } from "@/lib/kid-games";
import { getStripeEnvironment } from "@/lib/stripe";
import { submitUpiGamesOrder } from "@/utils/payments.functions";

const PAYEE = "Teach Nation Coaching Institute";
const WHATSAPP = "919205294266";

const APPS = [
  { label: "Google Pay", scheme: "gpay" },
  { label: "PhonePe", scheme: "phonepe" },
  { label: "Paytm", scheme: "paytmmp" },
  { label: "BHIM / Any UPI app", scheme: "upi" },
] as const;

function upiLink(amount: number, note: string, scheme: string) {
  const query = `pa=${encodeURIComponent(STORE_UPI_ID)}&pn=${encodeURIComponent(
    PAYEE,
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  if (scheme === "gpay") return `tez://upi/pay?${query}`;
  if (scheme === "phonepe") return `phonepe://pay?${query}`;
  if (scheme === "paytmmp") return `paytmmp://pay?${query}`;
  return `upi://pay?${query}`;
}

/** Manual UPI / QR payment option for the kids games store. */
export function GamesUpiPayment({
  cart,
  total,
  defaultEmail,
  userId,
  onSubmitted,
}: {
  cart: CartItem[];
  total: number;
  defaultEmail?: string;
  userId?: string;
  onSubmitted?: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const note = `Kids Games ${cart.reduce((n, i) => n + i.quantity, 0)} item(s)`;
  const link = upiLink(total, note, "upi");

  useEffect(() => {
    QRCode.toDataURL(link, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  useEffect(() => {
    if (defaultEmail) setEmail((current) => current || defaultEmail);
  }, [defaultEmail]);

  async function confirmPayment() {
    setSaving(true);
    try {
      const result = await submitUpiGamesOrder({
        data: {
          items: cart.map((item) => ({ priceId: item.priceId, quantity: item.quantity })),
          utr,
          email,
          ...(phone ? { phone } : {}),
          ...(userId ? { userId } : {}),
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) throw new Error(result.error);
      setDone(true);
      toast.success("Payment submitted — we will unlock your games after verification");
      onSubmitted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record your payment");
    } finally {
      setSaving(false);
    }
  }

  const summary = cart.map((i) => `${i.quantity} x ${i.title}`).join(", ");
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hi Teach Nation, I paid ${formatINR(total)} by UPI for kids games: ${summary}. Here is my payment reference / UTR: `,
  )}`;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-3xl border-border/60 p-5 text-center shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold">Scan &amp; pay {formatINR(total)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Works with Google Pay, PhonePe, Paytm, BHIM and any bank UPI app.
        </p>
        {qr ? (
          <img src={qr} alt="UPI QR code to pay Teach Nation" className="mx-auto mt-4 h-56 w-56 rounded-2xl bg-white p-2" />
        ) : (
          <div className="mx-auto mt-4 h-56 w-56 animate-pulse rounded-2xl bg-muted" />
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="font-semibold">{STORE_UPI_ID}</span>
          <button
            type="button"
            aria-label="Copy UPI ID"
            className="grid h-8 w-8 place-items-center rounded-full border border-border"
            onClick={() => {
              void navigator.clipboard.writeText(STORE_UPI_ID);
              toast.success("UPI ID copied");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>

      <Card className="rounded-3xl border-border/60 p-5 shadow-[var(--shadow-soft)]">
        <h3 className="font-display text-lg font-bold">Pay from your phone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap your app to open it with the amount pre-filled.
        </p>
        <div className="mt-4 grid gap-2">
          {APPS.map((app) => (
            <Button
              key={app.scheme}
              asChild
              variant="outline"
              className="w-full justify-start rounded-full"
            >
              <a href={upiLink(total, note, app.scheme)}>
                <Smartphone className="mr-2 h-4 w-4" /> {app.label}
              </a>
            </Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          After paying, enter the UTR / transaction reference below so we can verify and unlock your games.
        </p>

        {done ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Payment received for review. You will get an email once it is verified.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <Input
              type="email"
              placeholder="Email for your receipt"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-full"
            />
            <Input
              type="tel"
              placeholder="Mobile number (optional)"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-full"
            />
            <Input
              placeholder="UPI reference / UTR number"
              value={utr}
              onChange={(event) => setUtr(event.target.value)}
              className="rounded-full"
            />
            <Button
              className="w-full rounded-full"
              disabled={saving || cart.length === 0}
              onClick={() => void confirmPayment()}
            >
              {saving ? "Submitting…" : "I have paid — submit for verification"}
            </Button>
          </div>
        )}

        <Button asChild variant="outline" className="mt-3 w-full rounded-full">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> Need help? WhatsApp us
          </a>
        </Button>
      </Card>
    </div>
  );
}
