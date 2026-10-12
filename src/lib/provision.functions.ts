import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = {
  fullName?: string;
  mobile?: string;
  email?: string;
  address?: string;
  designation?: string;
  branchId?: string;
  role?: "parent" | "teacher" | "admin";
  accessCode?: string;
};

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

/**
 * Creates the profile row and the role row for the signed-in account.
 * Runs after sign-up and (idempotently) after every sign-in, so accounts can
 * never end up without a profile or a role.
 */
export const provisionAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => ({
    fullName: str(input?.fullName, 120),
    mobile: str(input?.mobile, 20).replace(/\D/g, "").slice(-10),
    email: str(input?.email, 200).toLowerCase(),
    address: str(input?.address, 300),
    designation: str(input?.designation, 100),
    branchId: str(input?.branchId, 64),
    role: (["parent", "teacher", "admin"] as const).includes(input?.role as never)
      ? (input!.role as "parent" | "teacher" | "admin")
      : ("parent" as const),
    accessCode: str(input?.accessCode, 120),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, string>;

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        full_name: data.fullName || meta["full_name"] || "",
        mobile: data.mobile || meta["mobile"] || "",
        email: data.email || authUser?.user?.email || null,
        branch_id: data.branchId || meta["branch_id"] || null,
        address: data.address || meta["address"] || null,
        designation: data.designation || meta["designation"] || null,
      });
    }

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const currentRoles = (existingRoles ?? []).map((r) => r.role as "parent" | "teacher" | "admin");
    const wantedRole = data.role === "teacher" ? "teacher" : data.role === "admin" ? "admin" : "parent";
    const wantsStaffRole = wantedRole === "teacher" || wantedRole === "admin";

    // The signup trigger may seed a parent role. Do not treat that as the final
    // role when the user is deliberately provisioning a teacher/admin account.
    if (currentRoles.includes(wantedRole)) {
      return { ok: true as const, roles: currentRoles };
    }

    let role: "parent" | "teacher" | "admin" = "parent";
    if (wantsStaffRole) {
      const { verifyStaffAccessCode } = await import("./staff-access.server");
      const valid = await verifyStaffAccessCode(supabaseAdmin, data.accessCode);
      if (!valid) {
        return { ok: false as const, message: "That staff access code is not valid." };
      }
      role = data.role;
    }

    if (!currentRoles.includes(role)) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    }
    return { ok: true as const, roles: [...currentRoles, role] };
  });
