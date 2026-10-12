import type { AppRole } from "./auth";

/**
 * Central permission map. Add new school modules here — routes and UI simply
 * ask `can(roles, "students:write")` instead of hardcoding role checks.
 */
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["*"],
  branch_admin: [
    "dashboard:view",
    "students:write",
    "teachers:write",
    "attendance:write",
    "fees:write",
    "notices:write",
    "events:write",
    "users:view",
  ],
  parent: ["portal:view"],
  teacher: [
    "dashboard:view",
    "attendance:write",
    "students:write",
    "notices:write",
    "events:write",
  ],
  student: ["portal:view"],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  branch_admin: "Branch admin",
  parent: "Parent",
  teacher: "Teacher",
  student: "Student",
};

export const ALL_ROLES: AppRole[] = ["admin", "branch_admin", "teacher", "parent", "student"];

/**
 * Owner identities that get the FULL admin dashboard. Never render these
 * values in the UI. The database enforces the same rule
 * (private.is_super_admin); this list only drives navigation and route guards.
 */
const OWNER_MOBILES = ["9716777769", "9910474663"];

export function isSuperAdminMobile(mobile?: string | null) {
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (digits.length < 10) return false;
  return OWNER_MOBILES.some((m) => m.slice(-10) === digits.slice(-10));
}

/** Routes that only the full admin may open. Everything else stays as-is. */
export const FULL_ADMIN_ROUTES = [
  "/admin/users",
  "/admin/settings",
  "/admin/branches",
  "/admin/direct-apply",
  "/admin/accounts",
  "/admin/payments",
  "/admin/invoices",
  "/admin/fee-plans",
  "/admin/fee-installments",
  "/admin/teacher-payments",
];

/**
 * The only sections a non-owner admin account may open: website/CMS content.
 * Everything else in the staff dashboard is owner-only.
 */
export const CMS_ADMIN_ROUTES = [
  "/admin/home-page",
  "/admin/ai-knowledge",
  "/admin/videos",
  "/admin/media",
];

export function can(roles: AppRole[], permission: string) {
  return roles.some((role) => {
    const granted = ROLE_PERMISSIONS[role] ?? [];
    return granted.includes("*") || granted.includes(permission);
  });
}