import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ParentShell } from "./ParentShell";

/**
 * Gate for the parent dashboard. Any signed-in account may open it; the data it
 * shows is limited by the same row-level rules the rest of the app relies on.
 */
export function ParentGuard({ children }: { children: ReactNode }) {
  const { isLoading, isFetching, user } = useAuth();

  if (isLoading || (isFetching && !user)) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-bold">Please sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your parent account to see your child&apos;s updates.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ParentShell>{children}</ParentShell>;
}
