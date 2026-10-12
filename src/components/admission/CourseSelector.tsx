import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Search, ShoppingCart, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/admission";
import { useAuth } from "@/lib/auth";
import {
  PLANS,
  computeTotals,
  offeringSku,
  planPrice,
  useCourseOfferings,
  useDirectApplySettings,
  type CourseOffering,
  type PlanKey,
} from "@/lib/direct-apply";
import { guestSaveOrder } from "@/lib/guest-admission.functions";

type CartEntry = { offering: CourseOffering; plan: PlanKey };

const NO_STREAM = "__none__";

export function CourseSelector({
  applicationId,
  initialSkus,
  defaultClass,
  onBack,
  onContinue,
  guestToken,
}: {
  applicationId: string;
  initialSkus?: string[];
  defaultClass?: string | null;
  onBack: () => void;
  onContinue: () => void;
  guestToken?: string | null;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: offerings = [], isLoading } = useCourseOfferings();
  const { data: settings } = useDirectApplySettings();

  const classes = useMemo(
    () => [...new Set(offerings.map((o) => o.class_label))],
    [offerings],
  );
  const [klass, setKlass] = useState<string>("");
  const effectiveClass =
    klass || (defaultClass && classes.includes(defaultClass) ? defaultClass : "");

  const streams = useMemo(
    () =>
      [
        ...new Set(
          offerings
            .filter((o) => o.class_label === effectiveClass && o.stream)
            .map((o) => o.stream as string),
        ),
      ],
    [offerings, effectiveClass],
  );
  const [stream, setStream] = useState<string>("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});

  // Restore a saved cart once the catalogue is available.
  const [restored, setRestored] = useState(false);
  if (!restored && offerings.length && initialSkus?.length) {
    const next: Record<string, CartEntry> = {};
    for (const sku of initialSkus) {
      const m = /^CO-(.+)-(monthly|quarterly|annual)$/.exec(sku);
      const offering = m ? offerings.find((o) => o.id === m[1]) : undefined;
      if (offering && m) next[sku] = { offering, plan: m[2] as PlanKey };
    }
    setCart(next);
    const first = Object.values(next)[0]?.offering;
    if (first) {
      setKlass(first.class_label);
      if (first.stream) setStream(first.stream);
    }
    setRestored(true);
  }

  const streamRequired = streams.length > 0;
  const visible = offerings.filter((o) => {
    if (!effectiveClass || o.class_label !== effectiveClass) return false;
    if (streamRequired && stream && stream !== NO_STREAM && o.stream !== stream) return false;
    if (streamRequired && !stream) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!`${o.course_name} ${o.description ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const entries = Object.entries(cart);
  const itemsTotal = entries.reduce((s, [, e]) => s + planPrice(e.offering, e.plan), 0);
  const totals = computeTotals(itemsTotal, settings ?? null);

  const add = (offering: CourseOffering, plan: PlanKey) =>
    setCart((prev) => {
      const next = { ...prev };
      // one plan per course
      for (const p of PLANS) delete next[offeringSku(offering.id, p.key)];
      next[offeringSku(offering.id, plan)] = { offering, plan };
      return next;
    });

  const remove = (sku: string) =>
    setCart((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });

  const itemRows = entries.map(([sku, e]) => ({
    sku,
    name: `${e.offering.course_name} · ${e.offering.class_label}${
      e.offering.stream ? ` ${e.offering.stream}` : ""
    } · ${PLANS.find((p) => p.key === e.plan)!.label}`,
    kind: "course",
    unit_price: planPrice(e.offering, e.plan),
    quantity: 1,
    image_url: e.offering.image_url ?? null,
  }));

  const save = useMutation({
    mutationFn: async () => {
      if (!itemRows.length) throw new Error("Add at least one course plan to continue.");
      const payload = {
        admission_fee: totals.admissionFee,
        items_total: totals.itemsTotal,
        tax_amount: totals.taxAmount,
        other_charges: totals.otherCharges,
        total_amount: totals.total,
      };
      if (guestToken) {
        await guestSaveOrder({ data: { token: guestToken, ...payload, items: itemRows } });
        return;
      }
      const { data: order, error } = await supabase
        .from("admission_orders")
        .upsert({
          application_id: applicationId,
          // Row-level security requires the order to be owned by the parent.
          parent_user_id: user?.userId ?? null,
          status: "pending_payment",
          ...payload,
        }, {
          onConflict: "application_id",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: delErr } = await supabase
        .from("admission_order_items")
        .delete()
        .eq("order_id", order.id);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase
        .from("admission_order_items")
        .insert(itemRows.map((i) => ({ ...i, order_id: order.id })));
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-admission-order"] });
      void queryClient.invalidateQueries({ queryKey: ["guest-admission"] });
      onContinue();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <Card className="rounded-2xl p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="da-class">
                Class <span className="text-destructive">*</span>
              </Label>
              <Select
                value={effectiveClass}
                onValueChange={(v) => {
                  setKlass(v);
                  setStream("");
                }}
              >
                <SelectTrigger id="da-class" className="mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="da-stream">
                Stream {streamRequired && <span className="text-destructive">*</span>}
              </Label>
              <Select value={stream} onValueChange={setStream} disabled={!streamRequired}>
                <SelectTrigger id="da-stream" className="mt-1">
                  <SelectValue
                    placeholder={streamRequired ? "Select stream" : "Not applicable"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="da-search">Search courses</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="da-search"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Accountancy"
                />
              </div>
            </div>
          </div>
        </Card>

        {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
        {!isLoading && !effectiveClass && (
          <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
            Select a class to see the courses available for it.
          </Card>
        )}
        {!isLoading && effectiveClass && streamRequired && !stream && (
          <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
            {effectiveClass} has streams — pick a stream to see its courses.
          </Card>
        )}
        {!isLoading && visible.length === 0 && effectiveClass && (!streamRequired || stream) && (
          <Card className="rounded-2xl p-6 text-sm text-muted-foreground">
            No courses match your search.
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((o) => {
            const chosen = PLANS.find((p) => cart[offeringSku(o.id, p.key)]);
            return (
              <Card
                key={o.id}
                className={`overflow-hidden rounded-2xl p-0 ${chosen ? "ring-2 ring-primary" : ""}`}
              >
                {o.image_url && (
                  <img
                    src={o.image_url}
                    alt={o.course_name}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{o.course_name}</h3>
                    <Badge variant="secondary">
                      {o.class_label}
                      {o.stream ? ` · ${o.stream}` : ""}
                    </Badge>
                  </div>
                  {o.description && (
                    <p className="text-xs text-muted-foreground">{o.description}</p>
                  )}
                  <div className="grid gap-2">
                    {PLANS.map((p) => {
                      const sku = offeringSku(o.id, p.key);
                      const active = Boolean(cart[sku]);
                      const price = planPrice(o, p.key);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => (active ? remove(sku) : add(o, p.key))}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/60"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              {p.label}
                              {p.key === "annual" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                                  <Sparkles className="h-3 w-3" /> Best Value
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-muted-foreground">{p.note}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-primary">
                            {formatINR(price)}
                            {active && <Check className="h-4 w-4" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="h-fit rounded-2xl bg-cream p-5 lg:sticky lg:top-24">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingCart className="h-4 w-4" /> Your cart
        </h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No course plans added yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {itemRows.map((i) => (
              <li key={i.sku} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0">{i.name}</span>
                <span className="flex shrink-0 items-center gap-2 font-semibold">
                  {formatINR(i.unit_price)}
                  <button
                    type="button"
                    aria-label={`Remove ${i.name}`}
                    onClick={() => remove(i.sku)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <Line label="Course plans" value={totals.itemsTotal} />
          <Line label="Admission fee" value={totals.admissionFee} />
          {totals.otherCharges > 0 && (
            <Line label={settings?.other_charges_label ?? "Other charges"} value={totals.otherCharges} />
          )}
          {totals.taxAmount > 0 && (
            <Line label={`Taxes (${settings?.tax_percent}%)`} value={totals.taxAmount} />
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total payable</dt>
            <dd>{formatINR(totals.total)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={onBack}>
            Back
          </Button>
          <Button
            className="rounded-full"
            disabled={save.isPending || entries.length === 0}
            onClick={() => save.mutate()}
          >
            Review &amp; pay
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd>{formatINR(value)}</dd>
    </div>
  );
}
