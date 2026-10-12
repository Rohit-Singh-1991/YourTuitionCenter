import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, GraduationCap, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Tuition Center | Plans for Tuition & Coaching Centres" },
      { name: "description", content: "Choose Free, Pro or Enterprise for Your Tuition Center. Set up your centre's own name and manage your tuition centre online." },
      { property: "og:title", content: "Your Tuition Center — Choose Your Plan" },
      { property: "og:description", content: "Simple plans for tuition centres: Free, Pro and Enterprise." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: YourTuitionCenterHome,
});

const plans = [
  { key: "free", name: "Free", price: "₹0", suffix: "forever", desc: "Start with the essentials and establish your centre online.", icon: GraduationCap, features: ["Public centre profile and contact details", "Basic course showcase", "Parent enquiry entry points", "Basic centre settings"] },
  { key: "pro", name: "Pro", price: "₹299", suffix: "/month", desc: "Manage daily centre operations with more tools and control.", icon: Zap, features: ["Everything in Free", "Parent portal", "Academic and batch management", "Fees, admissions and enquiries", "Website CMS and content editing", "Staff workspace"] },
  { key: "enterprise", name: "Enterprise", price: "₹499", suffix: "/month", desc: "Unlock the complete platform for full operational control.", icon: ShieldCheck, features: ["Everything in Pro", "Full admin and staff dashboards", "All operational modules enabled", "Complete CMS and advanced settings", "Full platform capabilities"] },
] as const;

function YourTuitionCenterHome() {
  return <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
    <div className="mx-auto max-w-6xl">
      <header className="mx-auto max-w-3xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Tuition centre management</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Your Tuition Center</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Choose a plan for your tuition centre. During setup, add your own centre name and create your digital campus.</p>
      </header>
      <section aria-label="Subscription plans" className="mt-10 grid items-stretch gap-5 md:grid-cols-3 sm:mt-14">
        {plans.map((p) => {
          const Icon = p.icon;
          return <Card key={p.key} className={`relative flex h-full flex-col rounded-3xl p-6 sm:p-7 ${p.key === "pro" ? "border-primary shadow-[var(--shadow-glow)] md:-translate-y-2" : ""}`}>
            {p.key === "pro" && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">POPULAR</span>}
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <h2 className="mt-5 text-xl font-extrabold">{p.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{p.desc}</p>
            <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-extrabold">{p.price}</span><span className="text-sm text-muted-foreground">{p.suffix}</span></div>
            <div className="my-6 h-px bg-border" />
            <ul className="flex-1 space-y-3">{p.features.map((f) => <li key={f} className="flex gap-2 text-sm leading-5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>)}</ul>
            <Button asChild className="mt-8 w-full rounded-full" variant={p.key === "pro" ? "default" : "outline"}><Link to="/subscribe" search={{ plan: p.key } as any}>{p.key === "free" ? "Get started free" : "Choose " + p.name}</Link></Button>
          </Card>;
        })}
      </section>
      <p className="mt-10 text-center text-xs text-muted-foreground">Your Tuition Center is the platform name. Your own tuition centre name is collected during setup.</p>
    </div>
  </main>;
}
