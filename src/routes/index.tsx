import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, ShieldCheck, Users, LayoutDashboard, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/")({ component: YourTuitionCenterHome });

const plans = [
  { key:"free", name:"Free", price:"₹0", suffix:"", desc:"Launch a professional tuition-centre website and start building your digital presence.", features:["Professional public website","Centre profile and contact details","Course/service showcase","Parent enquiry entry points"] },
  { key:"pro", name:"Pro", price:"₹299", suffix:"/month", desc:"Run your centre with the complete platform, with selected advanced admin and staff controls restricted.", features:["Everything in Free","Parent portal","Academic & batch management","Fees, admissions & enquiries","CMS for your complete website","Staff workspace","Selected admin controls restricted"] },
  { key:"enterprise", name:"Enterprise", price:"₹499", suffix:"/month", desc:"Everything enabled for serious tuition centres that want complete operational control.", features:["Everything in Pro","Full admin dashboard","Full staff dashboard","Complete CMS","All operational modules","Advanced settings & controls","Priority-ready architecture"] },
] as const;

function YourTuitionCenterHome() {
 return <SiteLayout>
  <main className="min-h-screen">
   <section className="relative overflow-hidden bg-[image:var(--gradient-brand)] px-4 py-20 text-primary-foreground sm:py-28">
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"/>
    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"/>
    <div className="relative mx-auto max-w-6xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em]"><Sparkles className="h-4 w-4"/> Education centre SaaS</span>
      <div className="mt-7 max-w-4xl">
       <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">Your Tuition Center.<br/><span className="text-white/75">Your brand. Your digital campus.</span></h1>
       <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">YourTuitionCenter gives tuition centres a professional website, parent experience, academic operations, staff management and a powerful CMS — all under the centre's own identity.</p>
       <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90"><a href="#plans">Explore plans <ArrowRight className="ml-2 h-4 w-4"/></a></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"><Link to="/auth?mode=signup">Create account</Link></Button>
       </div>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
       {[["One platform","Website + CMS + operations"],["Multi-role","Admin + staff + parents"],["Built to scale","From free website to full SaaS"]].map(([a,b])=><div key={a} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="font-bold">{a}</div><div className="mt-1 text-sm text-white/70">{b}</div></div>)}
      </div>
    </div>
   </section>

   <section id="plans" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
    <div className="text-center"><span className="text-xs font-bold uppercase tracking-[.18em] text-primary">Simple monthly plans</span><h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Choose the level that fits your centre</h2><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Start with a website. Upgrade when you're ready to run your complete tuition-centre operation online.</p></div>
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
     {plans.map((p)=> <Card key={p.key} className={`relative rounded-3xl p-7 ${p.key==="pro"?"border-primary shadow-[var(--shadow-glow)]":""}`}>
       {p.key==="pro" && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">MOST POPULAR</span>}
       <div className="text-sm font-bold uppercase tracking-widest text-primary">{p.name}</div>
       <div className="mt-4"><span className="text-4xl font-extrabold">{p.price}</span><span className="text-sm text-muted-foreground">{p.suffix}</span></div>
       <p className="mt-3 min-h-16 text-sm text-muted-foreground">{p.desc}</p>
       <div className="mt-5 space-y-3">{p.features.map(f=><div key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span>{f}</span></div>)}</div>
       <Button asChild className="mt-7 w-full rounded-full" variant={p.key==="enterprise"?"default":"outline"}><Link to="/auth?mode=signup">{p.key==="free"?"Start Free":"Choose "+p.name}</Link></Button>
     </Card>)}
    </div>
   </section>

   <section className="bg-muted/40 px-4 py-16">
    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
     {[{i:LayoutDashboard,t:"Your own CMS",d:"After subscribing, configure your centre name, branding, content, courses, branches and public website from the admin workspace."},{i:Users,t:"Role-based access",d:"Admin and staff signup uses your private access code. Parents can create accounts without an access code and can continue with Google."},{i:ShieldCheck,t:"Subscription controlled",d:"Your plan determines exactly which admin and staff capabilities are available. Enterprise unlocks the complete platform."}].map(({i:Icon,t,d})=><Card key={t} className="rounded-3xl p-7"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></span><h3 className="mt-5 text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p></Card>)}
    </div>
   </section>

   <footer className="px-4 py-10 text-center text-xs text-muted-foreground">
    <p>About & Contact · YourTuitionCenter is powered by Digicreators</p>
    <p className="mt-2">Digicreators · <a className="font-semibold text-primary underline" href="https://digicreators.shop" target="_blank" rel="noreferrer">digicreators.shop</a> · <a className="font-semibold text-primary" href="tel:9910474663">9910474663</a></p>
   </footer>
  </main>
 </SiteLayout>
}