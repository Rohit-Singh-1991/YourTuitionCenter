import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  Landmark,
  Library,
  Award,
  Building2,
  ScrollText,
  MessageSquare,
  LogIn,
  LogOut,
  CircleUserRound,
  UserPlus,
  Phone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import logo from "@/assets/teach-nation-logo.png";

/** Same destinations as the previous header + three-dot menu — nothing added. */
export const PUBLIC_NAV = [
  { to: "/", label: "Home", icon: LayoutGrid, exact: true },
  { to: "/about", label: "About", icon: Landmark },
  { to: "/courses", label: "Courses", icon: Library },
  { to: "/results", label: "Results", icon: Award },
  { to: "/branches", label: "Branches", icon: Building2 },
  { to: "/admissions", label: "Admissions", icon: ScrollText },
  { to: "/contact", label: "Contact", icon: MessageSquare },
] as const;

/** Teach Nation nav item: flat card, left accent bar, boxed icon. */
const navItemClass =
  "group/nav press relative min-h-11 w-full items-center gap-3 overflow-hidden rounded-2xl border border-transparent px-2.5 py-2 text-[0.95rem] font-medium text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!rounded-2xl group-data-[collapsible=icon]:!p-0";

const navActiveClass =
  "!border-transparent !bg-primary !text-primary-foreground shadow-[0_10px_24px_-14px_color-mix(in_oklab,var(--primary)_80%,transparent)] hover:!bg-primary hover:!text-primary-foreground [&_.nav-ico]:!bg-primary-foreground/20 [&_.nav-ico]:!text-primary-foreground [&_.nav-bar]:opacity-100";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="nav-ico grid size-8 shrink-0 place-items-center rounded-xl bg-sidebar-accent/70 text-primary transition-colors duration-200 group-hover/nav:bg-sidebar-accent [&>svg]:size-[1.05rem]">
      {children}
    </span>
  );
}

function NavBar() {
  return (
    <span
      aria-hidden
      className="nav-bar absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground opacity-0 transition-opacity duration-200 group-data-[collapsible=icon]:hidden"
    />
  );
}

export function PublicSidebar() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile, setOpenMobile } = useSidebar();

  function close() {
    if (isMobile) setOpenMobile(false);
  }

  async function signOut() {
    close();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="px-2 py-4">
        <Link
          to="/"
          onClick={close}
          className="group/brand flex items-center gap-3 rounded-2xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-card ring-1 ring-sidebar-border shadow-[0_8px_20px_-14px_color-mix(in_oklab,var(--primary)_90%,transparent)] transition-transform duration-300 group-hover/brand:-translate-y-0.5">
            <img
              src={logo}
              alt="Teach Nation Coaching Institute logo"
              width={512}
              height={512}
              className="size-8 object-contain"
            />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate font-display text-[1.05rem] font-extrabold leading-none tracking-[-0.015em]">
              Teach <span className="text-primary">Nation</span>
            </span>
            <span className="mt-1.5 block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Coaching Institute
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar gap-1 px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {PUBLIC_NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label} className={navItemClass}>
                    <Link
                      to={item.to}
                      onClick={close}
                      activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
                      activeProps={{ className: navActiveClass }}
                    >
                      <NavBar />
                      <NavIcon>
                        <item.icon />
                      </NavIcon>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3 bg-sidebar-border/70" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {user ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My account" className={navItemClass}>
                      <Link to={isStaff ? "/dashboard" : "/parent"} onClick={close}>
                        <NavIcon>
                          <CircleUserRound />
                        </NavIcon>
                        <span className="truncate">
                          {user.profile?.full_name || "My account"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Sign out"
                      className={navItemClass}
                      onClick={() => void signOut()}
                    >
                      <NavIcon>
                        <LogOut />
                      </NavIcon>
                      <span>Sign out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sign In" className={navItemClass}>
                      <Link to="/auth" onClick={close}>
                        <NavIcon>
                          <LogIn />
                        </NavIcon>
                        <span>Sign In</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sign Up" className={navItemClass}>
                      <Link to="/auth" search={{ mode: "signup" as const }} onClick={close}>
                        <NavIcon>
                          <UserPlus />
                        </NavIcon>
                        <span>Sign Up</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <a
          href={`tel:${BRAND.primaryPhone}`}
          className="press flex min-h-11 items-center gap-2.5 rounded-2xl border border-sidebar-border bg-card px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Phone className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Admissions
            </span>
            <span className="block truncate">{BRAND.phone1}</span>
          </span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}