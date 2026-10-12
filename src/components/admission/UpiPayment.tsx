import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Copy, Paperclip, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  UPI_ID,
  UPI_PAYEE,
  branchPayment,
  formatINR,
  uploadAdmissionFile,
  type AdmissionOrder,
} from "@/lib/admission";
import { useBranches } from "@/lib/data";
import { uploadGuestFile } from "@/lib/guest-admission";
import { guestSubmitPayment } from "@/lib/guest-admission.functions";
import { useDirectApplySettings, usePaymentDestination } from "@/lib/direct-apply";
import { finalizeAdmission } from "@/lib/direct-apply.functions";

/** Step 3 — manual UPI collection. Replaceable later by a verified gateway. */
export function UpiPayment({
  order,
  onBack,
  guestToken,
  branchId,
  applicationId,
}: {
  order: AdmissionOrder;
  onBack: () => void;
  guestToken?: string | null;
  branchId?: string | null;
  applicationId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [utr, setUtr] = useState(order.utr ?? "");
  const [screenshot, setScreenshot] = useState<string | null>(order.screenshot_url);
  const [uploading, setUploading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const { data: branches = [] } = useBranches();
  const { data: payTo } = usePaymentDestination(guestToken ?? null);
  const { data: settings } = useDirectApplySettings();
  const branchCode = branches.find((b) => b.id === branchId)?.code ?? null;
  const destination = branchPayment(branchCode);
  const payUpiId = payTo?.upi_id || destination?.upiId || UPI_ID;
  const payeeName = payTo?.upi_payee || destination?.payeeName || UPI_PAYEE;
  /** Campuses with their own QR image show it instead of a generated one. */
  const staticQr = payTo?.qr_image_url || destination?.qrUrl || null;

  const link = `upi://pay?pa=${encodeURIComponent(payUpiId)}&pn=${encodeURIComponent(
    payeeName,
  )}&am=${order.total_amount}&cu=INR&tn=${encodeURIComponent(`Admission ${order.id.slice(0, 8)}`)}`;

  useEffect(() => {
    if (staticQr) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(link, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link, staticQr]);

  const submit = useMutation({
    mutationFn: async () => {
      if (utr.trim().length < 6) throw new Error("Enter the UTR / transaction ID from your UPI app.");
      if (guestToken) {
        await guestSubmitPayment({ data: { token: guestToken, utr: utr.trim(), screenshot } });
        return;
      }
      const { data: updated, error } = await supabase
        .from("admission_orders")
        .update({
          utr: utr.trim(),
          screenshot_url: screenshot,
          status: "pending_verification",
          rejection_reason: null,
        })
        .eq("id", order.id)
        .select("id");
      if (error) throw error;
      // A permission mismatch updates zero rows without raising — never report
      // success for a payment that was not actually recorded.
      if (!updated || updated.length === 0) {
        throw new Error(
          "We could not record your payment. Please refresh and try again, or contact the branch office.",
        );
      }
    },
    onSuccess: async () => {
      toast.success("Payment submitted — pending verification by the school.");
      try {
        await finalizeAdmission({
          data: {
            applicationId: guestToken ? null : (applicationId ?? null),
            token: guestToken ?? null,
          },
        });
      } catch {
        /* registration ID is issued by the office if this fails */
      }
      void queryClient.invalidateQueries({ queryKey: ["my-admission-order"] });
      void queryClient.invalidateQueries({ queryKey: ["guest-admission"] });
      void queryClient.invalidateQueries({ queryKey: ["parent", "children"] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const locked = order.status === "pending_verification" || order.status === "paid";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-[2rem] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Pay {formatINR(order.total_amount)} by UPI</h2>
          <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Manual UPI transfer
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {destination
            ? `Scan this ${destination.label} QR with any UPI app`
            : "Scan the QR with any UPI app"}
          {destination && !destination.upiId
            ? ". The payee details appear in your UPI app after scanning."
            : ", or pay to the UPI ID below."}
        </p>
        {(staticQr || qr) && (
          <img
            src={staticQr ?? qr!}
            alt={`UPI payment QR code for ${destination?.label ?? "Teach Nation"}`}
            width={320}
            height={320}
            className="mx-auto mt-4 h-56 w-56 rounded-2xl border border-border bg-card object-contain p-2"
          />
        )}
        {destination && !destination.upiId ? (
          <p className="mt-4 rounded-2xl bg-cream p-3 text-sm">
            Please pay only by scanning this QR — it is the {destination.label} collection account.
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-cream p-3">
              <div className="min-w-0">
                <span className="block truncate font-mono text-sm font-semibold">{payUpiId}</span>
                <span className="block truncate text-xs text-muted-foreground">{payeeName}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-full"
                onClick={() => {
                  void navigator.clipboard.writeText(payUpiId);
                  toast.success("UPI ID copied");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
            <Button asChild variant="secondary" className="mt-3 w-full rounded-full">
              <a href={link}>Open in UPI app</a>
            </Button>
          </>
        )}
        <dl className="mt-5 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Course plans</dt>
            <dd>{formatINR(order.items_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Admission fee</dt>
            <dd>{formatINR(order.admission_fee)}</dd>
          </div>
          {Number(order.other_charges ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt>{settings?.other_charges_label ?? "Other charges"}</dt>
              <dd>{formatINR(Number(order.other_charges))}</dd>
            </div>
          )}
          {Number(order.tax_amount ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt>Taxes</dt>
              <dd>{formatINR(Number(order.tax_amount))}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatINR(order.total_amount)}</dd>
          </div>
        </dl>
        {payTo?.payment_note && (
          <p className="mt-3 rounded-2xl bg-cream p-3 text-xs text-muted-foreground">
            {payTo.payment_note}
          </p>
        )}
      </Card>

      <Card className="rounded-[2rem] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-bold">Confirm your payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          After paying, share the UTR / transaction ID. Our team verifies it manually — the
          application is marked paid only after that check.
        </p>
        {order.status === "rejected" && order.rejection_reason && (
          <p className="mt-3 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            Payment rejected: {order.rejection_reason}
          </p>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="utr">UTR / transaction ID</Label>
            <Input
              id="utr"
              value={utr}
              disabled={locked}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 412345678901"
            />
          </div>
          <div>
            <p className="text-sm font-medium">Payment screenshot (optional)</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
              <Paperclip className="h-4 w-4" />
              {uploading ? "Uploading…" : screenshot ? "Replace screenshot" : "Upload screenshot"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={locked}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    setScreenshot(
                      guestToken
                        ? await uploadGuestFile(file, "payments", guestToken)
                        : await uploadAdmissionFile(file, "payments"),
                    );
                    toast.success("Screenshot uploaded");
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>
          {order.status === "pending_verification" ? (
            <p className="flex items-center gap-2 rounded-2xl bg-sunny/50 p-3 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" /> Payment received — pending verification.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full" onClick={onBack}>
                Back to items
              </Button>
              <Button
                className="rounded-full"
                disabled={submit.isPending || locked}
                onClick={() => submit.mutate()}
              >
                I have completed the payment
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}