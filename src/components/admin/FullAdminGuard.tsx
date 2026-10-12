import type { ReactNode } from "react";
import { RoleGuard } from "./RoleGuard";

/**
 * Full administrative area: restricted to the single designated admin contact
 * number. Row level security enforces the same rule in the database, so hiding
 * the menu is never the only protection.
 */
export function FullAdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      roles={["admin"]}
      superAdmin
      title="Full admin access only"
      message="This section is limited to the institute's primary admin account."
    >
      {children}
    </RoleGuard>
  );
}
