import type { ReactNode } from "react";
import {
  LayoutDashboard, Baby, CalendarCheck, NotebookPen, Megaphone, CalendarDays,
  FileSpreadsheet, Shirt, Images, UserCheck, MessageCircle, Bot, FileQuestion,
} from "lucide-react";
import { DashShell, type NavGroup } from "@/components/admin/AdminShell";

const PARENT_GROUPS: NavGroup[] = [
  {
    group: "Overview",
    links: [
      { to: "/parent", label: "Dashboard", icon: LayoutDashboard },
      { to: "/parent/child", label: "Child profile", icon: Baby },
      { to: "/parent/assistant", label: "Ask Teach Nation", icon: Bot },
    ],
  },
  {
    group: "Every day",
    links: [
      { to: "/parent/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/parent/reports", label: "Daily reports", icon: NotebookPen },
      { to: "/parent/tests", label: "Online tests", icon: FileQuestion },
      { to: "/parent/gallery", label: "Photos & videos", icon: Images },
    ],
  },
  {
    group: "School updates",
    links: [
      { to: "/parent/notices", label: "Notices", icon: Megaphone },
      { to: "/parent/events", label: "Calendar & events", icon: CalendarDays },
      { to: "/parent/messages", label: "Messages", icon: MessageCircle },
    ],
  },
  {
    group: "Fees & essentials",
    links: [
      { to: "/parent/fees", label: "Fees & invoices", icon: FileSpreadsheet },
      { to: "/parent/shop", label: "Books & accessories", icon: Shirt },
      { to: "/parent/pickup", label: "Pickup authorisation", icon: UserCheck },
    ],
  },
];

export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <DashShell groups={PARENT_GROUPS} roleLabel="Parent" fallbackName="Parent">
      {children}
    </DashShell>
  );
}
