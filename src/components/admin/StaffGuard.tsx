import type { ReactNode } from "react";
import { RoleGuard } from "./RoleGuard";

export function StaffGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      roles={["admin", "branch_admin", "teacher"]}
      title="Staff access only"
      message="Sign in with a teacher, branch admin or admin account to open this dashboard."
    >
      {children}
    </RoleGuard>
  );
}