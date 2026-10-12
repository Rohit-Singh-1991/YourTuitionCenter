import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, GraduationCap, Sparkles, ShieldCheck, Zap, ArrowUpRight, BookOpen, Users, WalletCards, BarChart3 } from "lucide-react";
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
  { key: "free", name: "Free", price: "₹0", suffix: "forever", eyebrow: "A simple start", desc: "Get your tuition centre online with the essentials.", icon: GraduationCap, features: ["Public centre profile & contact details", "Basic course showcase", "Parent enquiry entry points", "Essential centre settings"], cta: "Start for free" },
  { key: "pro", name: "Pro", price: "₹299", suffix: "/month", eyebrow: "For growing centres", desc: "Spend less time coordinating and more time teaching.", icon: Zap, features: ["Everything in Free", "Parent portal", "Academic & batch management", "Fees, admissions & enquiries", "Website content editor", "Staff workspace"], cta: "Choose Pro" },
  { key: "enterprise", name: "Enterprise", price: "₹499", suffix: "/month", eyebrow: "The complete workspace", desc: "Full visibility and control across your centre's operations.", icon: ShieldCheck, features: ["Everything in Pro", "Complete admin & staff dashboards", "All operational modules enabled", "Full CMS & advanced settings", "Complete platform access"], cta: "Unlock everything" },
] as const;

function YourTuitionCenterHome() {
  return <main className="relative min-h-screen overflow-hidden bg-[#f6f8fc] px-4 pb-12 pt-7 text-slate-900 sm:pt-10">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_top,_rgba(91,123,255,0.15),_transparent_65%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-28 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
    <div className="relative mx-auto max-w-6xl">
      <div className="flex items-center justify-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"><GraduationCap className="h-6 w-6" /></div>
        <div className="text-left"><div className="text-base font-extrabold tracking-tight">Your Tuition Center</div><div className="text-[11px] font-medium tracking-wide text-slate-500">A better way to run your centre</div></div>
      </div>

      <section className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Less admin. More teaching.</div>
        <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl">Your centre deserves<br className="hidden sm:block" /> a <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">smarter classroom.</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Manage your online presence, students and everyday operations from one thoughtfully designed workspace. Pick a plan that fits your centre today.</p>
      </section>

      <section aria-label="Platform highlights" className="mx-auto mt-9 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
        {[{icon:BookOpen,label:"Courses"},{icon:Users,label:"Students & parents"},{icon:WalletCards,label:"Fees & operations"}].map(({icon:Icon,label})=><div key={label} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white bg-white/75 px-2 py-4 text-center shadow-sm shadow-slate-200/60 sm:flex-row sm:gap-3 sm:py-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-4 w-4"/></span><span className="text-xs font-semibold text-slate-700 sm:text-sm">{label}</span></div>)}
      </section>

      <section aria-label="Subscription plans" className="mt-12 grid items-stretch gap-5 md:grid-cols-3 sm:mt-14">
        {plans.map((p) => {
          const Icon = p.icon;
          const featured = p.key === "pro";
          return <Card key={p.key} className={`relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border ${featured ? "border-indigo-400 bg-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.45)] md:-translate-y-2" : "border-slate-200/80 bg-white/90 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.25)]"} p-6 sm:p-7`}>
            {featured && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />}
            {featured && <span className="absolute right-5 top-5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Most popular</span>}
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${p.key === "enterprise" ? "bg-slate-900 text-white" : p.key === "pro" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}><Icon className="h-5 w-5" /></div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500">{p.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{p.name}</h2>
            <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{p.desc}</p>
            <div className="mt-6 flex items-baseline gap-1"><span className="text-[2.65rem] font-black leading-none tracking-[-0.05em] text-slate-950">{p.price}</span><span className="text-sm font-medium text-slate-500">{p.suffix}</span></div>
            <div className="my-6 h-px bg-slate-100" />
            <ul className="flex-1 space-y-3.5">{p.features.map((f) => <li key={f} className="flex gap-2.5 text-sm leading-5 text-slate-700"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${featured ? "bg-indigo-100 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}><Check className="h-3 w-3" strokeWidth={3}/></span><span>{f}</span></li>)}</ul>
            <Button asChild className={`mt-8 h-12 w-full rounded-xl font-bold shadow-none ${featured ? "bg-indigo-600 text-white hover:bg-indigo-700" : p.key === "enterprise" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"}`} variant={p.key === "pro" || p.key === "enterprise" ? "default" : "outline"}><Link to="/subscribe" search={{ plan: p.key } as any}>{p.cta}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </Card>;
        })}
      </section>

      <div className="mx-auto mt-9 flex max-w-3xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs leading-5 text-slate-500">Start with Free. Upgrade any time as your centre grows. Your own centre name is added during setup.</p>
      </div>
      <footer className="mt-12 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">Your Tuition Center <span className="mx-2 text-slate-300">•</span> Built for tutors, coaching centres and growing classrooms</footer>
    </div>
  </main>;
}
