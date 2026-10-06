import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMISSION_FEE,
  CATALOG,
  KIND_LABEL,
  UPI_ID,
  branchPayment,
  formatINR,
  type CatalogItem,
} from "@/lib/admission";
import { useBranches } from "@/lib/data";
import { guestSaveOrder } from "@/lib/guest-admission.functions";

export function SupplySelector({
  applicationId,
  initial,
  onBack,
  onContinue,
  guestToken,
  branchId,
}: {
  applicationId: string;
  initial?: Record<string, number>;
  onBack: () => void;
  onContinue: () => void;
  guestToken?: string | null;
  branchId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState<Record<string, number>>(initial ?? {});

  // Each campus collects admission money into its own UPI account.
  const { data: branches = [] } = useBranches();
  const branchCode = branches.find((b) => b.id === branchId)?.code ?? null;
  const payUpiId = branchPayment(branchCode)?.upiId ?? UPI_ID;

  const change = (item: CatalogItem, delta: number) =>
    setQty((p) => {
      const nextValue = Math.max(0, Math.min(item.stock, (p[item.sku] ?? 0) + delta));
      const copy = { ...p };
      if (nextValue === 0) delete copy[item.sku];
      else copy[item.sku] = nextValue;
      return copy;
    });

  const selected = CATALOG.filter((i) => (qty[i.sku] ?? 0) > 0);
  const itemsTotal = selected.reduce((s, i) => s + i.price * (qty[i.sku] ?? 0), 0);
  const total = ADMISSION_FEE + itemsTotal;

  const save = useMutation({
    mutationFn: async () => {
      if (guestToken) {
        await guestSaveOrder({
          data: {
            token: guestToken,
            admission_fee: ADMISSION_FEE,
            items_total: itemsTotal,
            total_amount: total,
            items: selected.map((i) => ({
              sku: i.sku,
              name: i.name,
              kind: i.kind,
              unit_price: i.price,
              quantity: qty[i.sku] ?? 1,
            })),
          },
        });
        return;
      }
      const { data: order, error } = await supabase
        .from("admission_orders")
        .upsert(
          {
            application_id: applicationId,
            admission_fee: ADMISSION_FEE,
            items_total: itemsTotal,
            total_amount: total,
            upi_id: payUpiId,
            status: "pending_payment",
          },
          { onConflict: "application_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      const { error: delErr } = await supabase
        .from("admission_order_items")
        .delete()
        .eq("order_id", order.id);
      if (delErr) throw delErr;
      if (selected.length) {
        const { error: insErr } = await supabase.from("admission_order_items").insert(
          selected.map((i) => ({
            order_id: order.id,
            sku: i.sku,
            name: i.name,
            kind: i.kind,
            unit_price: i.price,
            quantity: qty[i.sku] ?? 1,
          })),
        );
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-admission-order"] });
      void queryClient.invalidateQueries({ queryKey: ["guest-admission"] });
      onContinue();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {(["book", "uniform", "accessory"] as const).map((kind) => (
        <section key={kind}>
          <h2 className="text-lg font-bold">{KIND_LABEL[kind]}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATALOG.filter((i) => i.kind === kind).map((item) => {
              const count = qty[item.sku] ?? 0;
              return (
                <Card
                  key={item.sku}
                  className={`overflow-hidden rounded-[1.75rem] p-0 shadow-[var(--shadow-soft)] ${
                    count > 0 ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    width={640}
                    height={640}
                    className="h-40 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <h3 className="text-sm font-bold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.stock} in stock</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-primary">{formatINR(item.price)}</span>
                      {count === 0 ? (
                        <Button size="sm" className="rounded-full" onClick={() => change(item, 1)}>
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => change(item, -1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-border"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">{count}</span>
                          <button
                            type="button"
                            aria-label={`Add one ${item.name}`}
                            onClick={() => change(item, 1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-border"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <Card className="rounded-[2rem] bg-mint/40 p-6">
        <h2 className="text-lg font-bold">Order summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Admission fee</dt>
            <dd>{formatINR(ADMISSION_FEE)}</dd>
          </div>
          {selected.map((i) => (
            <div key={i.sku} className="flex justify-between text-muted-foreground">
              <dt>
                {i.name} × {qty[i.sku]}
              </dt>
              <dd>{formatINR(i.price * (qty[i.sku] ?? 0))}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2">
            <dt>Items subtotal</dt>
            <dd>{formatINR(itemsTotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total payable</dt>
            <dd>{formatINR(total)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={onBack}>
            Back to form
          </Button>
          <Button className="rounded-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Continue to payment
          </Button>
        </div>
      </Card>
    </div>
  );
}