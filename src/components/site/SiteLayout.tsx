import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Phone, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/teach-nation-logo.svg";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { PublicSidebar } from "@/components/site/PublicSidebar";
import { MenuToggle } from "@/components/site/MenuToggle";
import { useAuth } from "@/lib/auth";
import { BrochureButtons } from "@/components/site/BrochureButtons";
import { InstallAppButton } from "@/components/site/InstallAppButton";
import { MapLink } from "@/components/site/MapLink";
import { EnquiryDialog } from "@/components/site/EnquiryDialog";
import aiMarkAsset from "@/assets/ai-assistant-mark.png";
import { BRAND, BRANCHES } from "@/lib/brand";
import { BranchBadge } from "@/components/site/BranchBadge";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, isStaff } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <PublicSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:px-5">
              <MenuToggle />
              <Link
                to="/"
                className="flex min-w-0 shrink items-center gap-2 md:hidden"
                aria-label="Teach Nation home"
              >
                <span className="truncate font-display text-base font-extrabold tracking-[-0.015em]">
                  Teach <span className="text-primary">Nation</span>
                </span>
              </Link>
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <a
                  href={`tel:${BRAND.primaryPhone}`}
                  aria-label={`Call ${BRAND.phone1}`}
                  className="icon-btn grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-card sm:hidden"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <EnquiryDialog className="rounded-xl" size="sm" />
                <InstallAppButton />
                <BrochureButtons compact />
                <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
                  <Link to={user ? (isStaff ? "/dashboard" : "/parent") : "/auth"}>
                    <User className="mr-1.5 h-4 w-4" />
                    {user ? "My account" : "Sign In"}
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <div id="main-content" className="flex-1">
            {children}
          </div>

          <footer className="mt-16 border-t border-border/60 bg-cream">
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={logo}
              alt="Teach Nation Coaching Institute logo"
              width={512}
              height={512}
              loading="lazy"
              className="h-14 w-14 rounded-2xl bg-card object-contain p-1 shadow-[var(--shadow-soft)]"
            />
            <h3 className="mt-2 text-lg font-bold">{BRAND.shortName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              CBSE Classes 1&ndash;12, Class XII Commerce specialisation and banking exam
              preparation in Palam, New Delhi since {BRAND.founded}.
            </p>
            <p className="mt-3 text-sm">
              <a className="font-semibold text-primary" href={`mailto:${BRAND.email1}`}>
                {BRAND.email1}
              </a>
            </p>
          </div>
          {BRANCHES.map((b, i) => (
            <div key={b.key} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <BranchBadge index={i} />
                <h4 className="font-bold">{b.name}</h4>
              </div>
              {b.inCharge && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  In charge · {b.inCharge}
                </p>
              )}
              {b.scope && <p className="mt-1 text-muted-foreground">{b.scope}</p>}
              <p className="mt-2 flex flex-wrap items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0">{b.address}</span>
                <MapLink address={b.address} label={b.name} withText />
              </p>
              {b.phones.map((ph) => (
                <p key={ph} className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a className="font-semibold text-primary" href={`tel:${ph.replace(/\s/g, "")}`}>
                    {ph}
                  </a>
                </p>
              ))}
            </div>
          ))}
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 border-t border-border/60 px-4 py-6">
          <a
            href={`https://wa.me/${BRAND.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 32 32" aria-hidden className="h-5 w-5 fill-[#25D366]">
              <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.8 6.5L3 29l6.7-1.8c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1.1 1.1-3.9-.3-.4a10.6 10.6 0 1119.2-6.2c0 5.9-4.8 10.7-10.7 10.7zm6-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2-.4.2-.7 0c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.2-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z" />
            </svg>
            WhatsApp support
          </a>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
          >
            <img
              src={aiMarkAsset}
              alt="Teach Nation AI assistant"
              width={512}
              height={512}
              loading="lazy"
              className="h-5 w-5 object-contain"
            />
            AI assistant
          </Link>
        </div>
        <p className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
