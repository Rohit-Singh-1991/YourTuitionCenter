import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, LogOut, Menu, X, Sparkles, Users, GraduationCap, Boxes, Camera,
  Shirt, ReceiptText, CalendarCheck, NotebookPen, CalendarDays, HeartPulse, ShieldAlert,
  BookOpen, Target, PlaneTakeoff, Clock, Award, FileText, Images, FileSpreadsheet,
  IndianRupee, UserPlus, Bus, UserCheck, MessageCircle, LifeBuoy, ClipboardList, Megaphone,
  Building2, Settings, ScanLine, Video, MessagesSquare,
  Home, Layers, Library, Wallet, PieChart, PlayCircle, FileQuestion, Bell, BadgeIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/site/NotificationBell";
import { CMS_ADMIN_ROUTES, FULL_ADMIN_ROUTES } from "@/lib/permissions";

export type NavLink = { to: string; label: string; icon: typeof Users };
export type NavGroup = { group: string; links: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    group: "Overview",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/checkin", label: "Check in / out", icon: ScanLine },
    ],
  },
  {
    group: "People",
    links: [
      { to: "/admin/students", label: "Students", icon: Users },
      { to: "/admin/teachers", label: "Faculty & Staff", icon: GraduationCap },
      { to: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/admin/staff-leaves", label: "Faculty leave", icon: PlaneTakeoff },
      { to: "/admin/staff-shifts", label: "Batch timings", icon: Clock },
      { to: "/admin/staff-training", label: "Training", icon: Award },
    ],
  },
  {
    group: "Academics",
    links: [
      { to: "/admin/classes", label: "Classes", icon: Layers },
      { to: "/admin/subjects", label: "Subjects", icon: Library },
      { to: "/admin/batches", label: "Batches", icon: Clock },
      { to: "/admin/student-batches", label: "Batch allotment", icon: Users },
      { to: "/admin/daily-reports", label: "Class reports", icon: NotebookPen },
      { to: "/admin/curriculum", label: "Courses & batches", icon: BookOpen },
      { to: "/admin/progress", label: "Tests & results", icon: Target },
      { to: "/admin/meals", label: "Assignments", icon: NotebookPen },
      { to: "/admin/health", label: "Student wellbeing", icon: HeartPulse },
      { to: "/admin/incidents", label: "Discipline & incidents", icon: ShieldAlert },
    ],
  },
  {
    group: "Learning & exams",
    links: [
      { to: "/admin/content", label: "Learning content", icon: PlayCircle },
      { to: "/admin/tests", label: "Tests & exams", icon: FileQuestion },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    group: "Courses & fees",
    links: [
      { to: "/admin/courses", label: "Courses", icon: BookOpen },
      { to: "/admin/enrollments", label: "Enrollments", icon: UserPlus },
      { to: "/admin/fee-plans", label: "Fee plans", icon: FileSpreadsheet },
      { to: "/admin/fee-installments", label: "Installments & dues", icon: BadgeIndianRupee },
      { to: "/admin/teacher-payments", label: "Faculty payments", icon: Wallet },
      { to: "/admin/accounts", label: "Income & expenses", icon: PieChart },
    ],
  },
  {
    group: "Community",
    links: [
      { to: "/admin/messages", label: "Messages", icon: MessageCircle },
      { to: "/admin/support", label: "WhatsApp support", icon: MessagesSquare },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/admin/events", label: "Calendar & events", icon: CalendarDays },
      { to: "/admin/activities", label: "Events & competitions", icon: Camera },
      { to: "/admin/gallery", label: "Gallery & portfolio", icon: Images },
      { to: "/admin/surveys", label: "Surveys", icon: ClipboardList },
      { to: "/admin/feedback", label: "Feedback & helpdesk", icon: LifeBuoy },
    ],
  },
  {
    group: "Website",
    links: [
      { to: "/admin/home-page", label: "Home Page", icon: Home },
      { to: "/admin/ai-knowledge", label: "AI Knowledge", icon: Sparkles },
      { to: "/admin/videos", label: "Website videos", icon: Video },
      { to: "/admin/media", label: "Manage media", icon: Images },
    ],
  },
  {
    group: "Operations",
    links: [
      { to: "/admin/admissions", label: "Admissions", icon: ReceiptText },
      { to: "/admin/applications", label: "Online applications", icon: ReceiptText },
      { to: "/admin/direct-apply", label: "Direct Apply info", icon: BadgeIndianRupee },
      { to: "/admin/inquiries", label: "Enquiries", icon: UserPlus },
      { to: "/admin/invoices", label: "Fees & dues", icon: FileSpreadsheet },
      { to: "/admin/payments", label: "Payments", icon: IndianRupee },
      { to: "/admin/supplies", label: "Books & study material", icon: Shirt },
      { to: "/admin/game-orders", label: "Material orders", icon: IndianRupee },
      { to: "/admin/inventory", label: "Inventory", icon: Boxes },
      { to: "/admin/transport", label: "Transport", icon: Bus },
      { to: "/admin/pickup", label: "Pickup authorisation", icon: UserCheck },
    ],
  },
  {
    group: "Compliance",
    links: [
      { to: "/admin/documents", label: "Documents & forms", icon: FileText },
      { to: "/admin/branches", label: "Branches", icon: Building2 },
      { to: "/admin/users", label: "Users & roles", icon: UserCheck },
      { to: "/admin/settings", label: "Settings & audit", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { isAdmin, isSuperAdmin, isCmsAdmin } = useAuth();
  // Only the designated full admin sees the full dashboard; everyone else gets
  // the limited CMS. RLS enforces the same split server-side.
  const allowed = (to: string) =>
    isCmsAdmin ? CMS_ADMIN_ROUTES.includes(to) : !FULL_ADMIN_ROUTES.includes(to);
  const groups = isSuperAdmin
    ? GROUPS
    : GROUPS.map((g) => ({
        ...g,
        links: g.links.filter((l) => allowed(l.to)),
      })).filter((g) => g.links.length > 0);
  return (
    <DashShell
      groups={groups}
      roleLabel={isSuperAdmin ? "Administrator" : isAdmin ? "Content admin" : "Branch Admin"}
      fallbackName="Staff member"
    >
      {children}
    </DashShell>
  );
}

/** Shared sidebar + header dashboard chrome, used by both staff and parent areas. */
export function DashShell({
  children,
  groups,
  roleLabel,
  fallbackName,
}: {
  children: ReactNode;
  groups: NavGroup[];
  roleLabel: string;
  fallbackName: string;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={`${open ? "block" : "hidden"} border-b border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r`}
      >
        <div className="hidden items-center gap-2 px-5 py-5 lg:flex">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold">Teach Nation</span>
        </div>
        <nav className="space-y-4 px-3 pb-6">
          {groups.map(({ group, links }) => (
            <div key={group}>
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">
                {group}
              </p>
              <div className="space-y-0.5">
                {links.map(({ to, label, icon: Icon }) => {
                  const active = pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.profile?.full_name || fallbackName}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">View site</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
