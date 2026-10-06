import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/lib/auth";
import { can, CMS_ADMIN_ROUTES } from "@/lib/permissions";
import { AdminShell } from "./AdminShell";

/**
 * Modular route guard: gate any current or future module by role or permission.
 * <RoleGuard roles={["admin"]}> or <RoleGuard permission="fees:write">
 */
export function RoleGuard({
  children,
  roles,
  permission,
  superAdmin,
  title = "You don't have access",
  message = "Ask a school admin to grant your account the right role.",
}: {
  children: ReactNode;
  roles?: AppRole[];
  permission?: string;
  superAdmin?: boolean;
  title?: string;
  message?: string;
}) {
  const { isLoading, isFetching, user, roles: myRoles, isSuperAdmin, isCmsAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Session may be cached as `null` from before sign-in; while it is being
  // refetched we must not render the denial screen (false "Staff access only").
  if (isLoading || (isFetching && !user)) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const roleOk = roles ? roles.some((r) => myRoles.includes(r)) : true;
  const permissionOk = permission ? can(myRoles, permission) : true;
  const superOk = superAdmin ? isSuperAdmin : true;

  if (!user || !roleOk || !permissionOk || !superOk) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild className="rounded-full">
            <Link to={user ? "/parent" : "/auth"}>{user ? "Go to my dashboard" : "Go to sign in"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Non-owner admin accounts may only open website/CMS sections.
  if (isCmsAdmin && !CMS_ADMIN_ROUTES.includes(pathname)) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-md space-y-3 py-16 text-center">
          <h1 className="text-xl font-bold">Content access only</h1>
          <p className="text-sm text-muted-foreground">
            Your account can manage website content. The full institute dashboard is limited to the
            owner admin accounts.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/admin/home-page">Go to Home Page editor</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}