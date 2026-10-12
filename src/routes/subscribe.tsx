import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

declare global {
  interface Window { Razorpay?: new (options: any) => any; }
}

export const Route = createFileRoute("/subscribe")({
  validateSearch: (s: any) => ({ plan: s.plan === "free" || s.plan === "enterprise" || s.plan === "pro" ? s.plan : "pro" }),
  component: Subscribe,
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function Subscribe() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">(search.plan);
  const [instituteName, setInstituteName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const amount = plan === "free" ? 0 : plan === "pro" ? 299 : 499;

  async function submit(e: any) {
    e.preventDefault();
    setMessage("");
    const cleanName = instituteName.trim();
    const cleanSlug = slugify(slug);
    if (!cleanName || !cleanSlug) {
      setMessage("Enter your tuition centre name. A website address will be generated automatically.");
      return;
    }

    if (plan === "free") {
      localStorage.setItem("ytc_setup", JSON.stringify({
        plan, instituteName: cleanName, slug: cleanSlug,
        paymentMethod: "free", paymentAmount: 0, paymentStatus: "not-required",
      }));
      nav({ to: "/dashboard" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, instituteName: cleanName, slug: cleanSlug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start recurring billing.");

      await loadRazorpay();
      const gateway = new window.Razorpay!({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Your Tuition Center",
        description: plan === "pro" ? "Pro monthly subscription" : "Enterprise monthly subscription",
        prefill: {},
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (payment: any) => {
          try {
            const verify = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            });
            const result = await verify.json();
            if (!verify.ok || !result.ok) throw new Error(result.error || "Subscription verification failed.");
            localStorage.setItem("ytc_setup", JSON.stringify({
              plan: result.plan,
              instituteName: result.instituteName,
              slug: result.slug,
              paymentMethod: "Razorpay Subscription",
              paymentAmount: amount,
              paymentStatus: result.status,
              subscriptionId: result.subscriptionId,
              paymentId: result.paymentId,
              currentEnd: result.currentEnd,
            }));
            nav({ to: "/dashboard" });
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to verify subscription.");
            setLoading(false);
          }
        },
      });
      gateway.on("payment.failed", (failure: any) => {
        setMessage(failure?.error?.description || "Payment authorisation failed. Please try again.");
        setLoading(false);
      });
      gateway.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start recurring subscription.");
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
    <Card className="w-full max-w-2xl rounded-3xl p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Centre setup</p>
      <h1 className="mt-2 text-3xl font-extrabold">Set up Your Tuition Center</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your Tuition Center is the app name. Enter your own tuition centre name to create your workspace.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div>
          <Label>Tuition centre name</Label>
          <Input required maxLength={120} value={instituteName} onChange={e => {
            const next = e.target.value;
            setInstituteName(next);
            if (!slugEdited) setSlug(slugify(next));
          }} placeholder="e.g. Bright Future Academy" />
        </div>
        <div>
          <Label>Website slug</Label>
          <Input required maxLength={70} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e => {
            setSlugEdited(true);
            setSlug(slugify(e.target.value));
          }} placeholder="bright-future-academy" />
          <p className="mt-1 text-xs text-muted-foreground">This is the centre's unique web address name.</p>
        </div>
        <div>
          <Label>Subscription plan</Label>
          <select className="h-10 w-full rounded-md border bg-background px-3" value={plan} onChange={e => setPlan(e.target.value as "free" | "pro" | "enterprise")}>
            <option value="free">Free — ₹0</option>
            <option value="pro">Pro — ₹299/month</option>
            <option value="enterprise">Enterprise — ₹499/month</option>
          </select>
        </div>

        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <Button disabled={loading} className="w-full rounded-full">
          {loading ? "Opening secure checkout…" : plan === "free" ? "Create free centre" : `Start ₹${amount}/month subscription`}
        </Button>
      </form>

      {plan !== "free" && <p className="mt-4 text-xs leading-5 text-muted-foreground">Paid plans use recurring monthly billing. Razorpay creates or reuses the monthly plan automatically; checkout becomes available when the Razorpay secret is configured securely in Vercel. No UPI payment is accepted without server-side verification.</p>}
    </Card>
  </main>;
}