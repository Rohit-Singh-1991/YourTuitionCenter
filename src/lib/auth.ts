import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminMobile } from "@/lib/permissions";

export type AppRole = "admin" | "branch_admin" | "teacher" | "parent" | "student";

export function normalizeMobile(mobile: string) {
  return mobile.replace(/\D/g, "").slice(-10);
}

export function mobileToEmail(mobile: string) {
  return `${normalizeMobile(mobile)}@teachnation.app`;
}

export type SessionUser = {
  userId: string;
  profile: {
    id: string;
    full_name: string;
    mobile: string;
    email: string | null;
    branch_id: string | null;
    avatar_url: string | null;
    status: string;
    address: string | null;
    designation: string | null;
  } | null;
  roles: AppRole[];
};

export async function fetchSessionUser(): Promise<SessionUser | null> {
  // Read the locally persisted session first: it is synchronous-ish, works right
  // after a fresh sign-in, and avoids a network round trip that can transiently
  // fail while the SDK is still settling a new session.
  const { data: sessionData } = await supabase.auth.getSession();
  let user = sessionData.session?.user ?? null;
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, mobile, email, branch_id, avatar_url, status, address, designation")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  return {
    userId: user.id,
    profile: profile ?? null,
    roles: (roles ?? []).map((r) => r.role as AppRole),
  };
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["session-user"],
    queryFn: fetchSessionUser,
    staleTime: 30_000,
    // Guards mount right after a redirect from sign-in; always revalidate so a
    // `null` cached from the signed-out state can never deny a signed-in user.
    refetchOnMount: "always",
  });
  const roles = query.data?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isSuperAdmin = isAdmin && isSuperAdminMobile(query.data?.profile?.mobile);
  const isBranchAdmin = roles.includes("branch_admin");
  const isTeacher = roles.includes("teacher");
  return {
    ...query,
    user: query.data ?? null,
    isAdmin,
    // Full admin = the designated contact number holding the admin role.
    isSuperAdmin,
    isBranchAdmin,
    isTeacher,
    // Admin account that is not an owner number: website/CMS content only.
    isCmsAdmin: isAdmin && !isSuperAdmin && !isBranchAdmin && !isTeacher,
    isStaff:
      roles.includes("admin") || roles.includes("branch_admin") || roles.includes("teacher"),
    roles,
  };
}

export function useAuthListener() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Never call back into supabase-js from inside this callback: doing so can
      // deadlock or resolve against the pre-event session, which is what made the
      // second sign-in resolve to `null` and show "Staff access only".
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["session-user"] });
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);
}