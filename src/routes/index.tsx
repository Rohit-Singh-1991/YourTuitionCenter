import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, GraduationCap, Sparkles, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Tuition Center | Simple plans for growing tuition centres" },
      { name: "description", content: "Choose Free, Pro or Enterprise for Your Tuition Center. Set up your centre's own name and manage your tuition centre online." },
      { property: "og:title", content: "Your Tuition Center — Your centre, beautifully organised" },
      { property: "og:description", content: "One calm, simple workspace for your tuition centre. Start free and grow when you're ready." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: YourTuitionCenterHome,
});

const plans = [
  { key: "free", name: "Free", price: "₹0", suffix: "forever", eyebrow: "A simple start", desc: "Get online with the essentials.", mobileSummary: "Centre profile · Courses · Enquiries", icon: GraduationCap, features: ["Public centre profile & contact details", "Basic course showcase", "Parent enquiry entry points", "Essential centre settings"], cta: "Start for free" },
  { key: "pro", name: "Pro", price: "₹299", suffix: "/month", eyebrow: "For growing centres", desc: "More time teaching, less admin.", mobileSummary: "Parent portal · Batches · Fees · Staff", icon: Zap, features: ["Everything in Free", "Parent portal", "Academic & batch management", "Fees, admissions & enquiries", "Website content editor", "Staff workspace"], cta: "Choose Pro" },
  { key: "enterprise", name: "Enterprise", price: "₹499", suffix: "/month", eyebrow: "The complete workspace", desc: "Full control across your operations.", mobileSummary: "All Pro features · Full dashboards · All modules", icon: ShieldCheck, features: ["Everything in Pro", "Complete admin & staff dashboards", "All operational modules enabled", "Full CMS & advanced settings", "Complete platform access"], cta: "Unlock everything" },
] as const;

function YourTuitionCenterHome() {
  return <main className="relative min-h-[100svh] overflow-hidden bg-[#f6f8fc] px-3 pb-3 pt-3 text-slate-900 sm:px-5 sm:pb-5 sm:pt-4">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,_rgba(91,123,255,0.15),_transparent_65%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
    <div className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-6xl flex-col">
      <header className="flex shrink-0 items-center justify-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"><GraduationCap className="h-5 w-5" /></div>
        <div className="text-left"><div className="text-sm font-extrabold tracking-tight sm:text-base">Your Tuition Center</div><div className="text-[10px] font-medium tracking-wide text-slate-500 sm:text-[11px]">A better way to run your centre</div></div>
      </header>

      <section className="mx-auto mt-3 max-w-3xl shrink-0 text-center sm:mt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[10px] font-semibold text-indigo-700 shadow-sm sm:text-xs"><Sparkles className="h-3 w-3" /> Less admin. More teaching.</div>
        <h1 className="mt-2 text-[clamp(1.45rem,4.1vw,2.65rem)] font-black leading-[1.06] tracking-[-0.04em] text-slate-950">Your centre deserves a <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">smarter classroom.</span></h1>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Choose a plan that fits your centre today. Add your own centre name during setup.</p>
      </section>

      <section aria-label="Subscription plans" className="mt-3 grid flex-1 grid-cols-1 content-start items-stretch gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        {plans.map((p) => {
          const Icon = p.icon;
          const featured = p.key === "pro";
          return <Card key={p.key} className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-3 sm:rounded-[1.35rem] sm:p-4 lg:p-5 ${featured ? "border-indigo-400 bg-white shadow-[0_14px_35px_-22px_rgba(79,70,229,0.45)]" : "border-slate-200/80 bg-white/95 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.25)]"}`}>
            {featured && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />}
            {featured && <span className="absolute right-3 top-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-indigo-700 sm:right-3 sm:top-3 sm:text-[9px]">Popular</span>}
            <div className="flex items-center gap-2.5 sm:block">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${p.key === "enterprise" ? "bg-slate-900 text-white" : p.key === "pro" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
              <div className="min-w-0 flex-1 sm:mt-3">
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-500 sm:text-[10px]">{p.eyebrow}</p>
                <div className="flex items-baseline gap-2 sm:mt-0.5 sm:block">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{p.name}</h2>
                  <div className="flex items-baseline gap-0.5"><span className="text-xl font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-2xl">{p.price}</span><span className="text-[10px] font-medium text-slate-500 sm:text-xs">{p.suffix}</span></div>
                </div>
              </div>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-600 sm:mt-2 sm:min-h-8 sm:text-xs sm:leading-5">{p.desc}</p>
            <p className="mt-1.5 text-[10px] font-medium leading-4 text-slate-600 sm:hidden">{p.mobileSummary}</p>
            <div className="my-2 h-px bg-slate-100 sm:my-3" />
            <ul className="hidden flex-1 space-y-2 sm:block lg:space-y-2.5">{p.features.map((f) => <li key={f} className="flex gap-2 text-xs leading-4 text-slate-700 lg:text-[13px]"><span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${featured ? "bg-indigo-100 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}><Check className="h-2.5 w-2.5" strokeWidth={3}/></span><span>{f}</span></li>)}</ul>
            <Button asChild className={`mt-1.5 h-9 w-full rounded-lg text-xs font-bold shadow-none sm:mt-4 sm:h-10 sm:text-sm ${featured ? "bg-indigo-600 text-white hover:bg-indigo-700" : p.key === "enterprise" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"}`} variant={p.key === "pro" || p.key === "enterprise" ? "default" : "outline"}><Link to="/subscribe" search={{ plan: p.key } as any}>{p.cta}<ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </Card>;
        })}
      </section>

      <footer className="mt-2 shrink-0 pb-1 text-center text-[9px] leading-4 text-slate-500 sm:mt-3 sm:text-[10px]">Start with Free. Upgrade any time as your centre grows. <span className="hidden sm:inline">Built for tutors, coaching centres and growing classrooms.</span></footer>
    </div>
  </main>;
}