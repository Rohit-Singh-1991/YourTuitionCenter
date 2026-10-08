import { createServerFn } from "@tanstack/react-start";

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { mobile: string }) => ({ mobile: String(input?.mobile ?? "") }))
  .handler(async ({ data }) => {
    const otp = await import("./otp.server");
    const phone = otp.toE164India(data.mobile);
    if (!phone) return { ok: false as const, message: "Enter a valid Indian mobile number." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const { data: row } = await supabaseAdmin
      .from("phone_otps")
      .select("id, last_sent_at, send_count, window_started_at")
      .eq("phone", phone)
      .maybeSingle();

    let sendCount = 1;
    let windowStarted = new Date(now).toISOString();
    if (row) {
      if (now - new Date(row.last_sent_at).getTime() < otp.RESEND_COOLDOWN_MS) {
        return {
          ok: false as const,
          message: "Please wait a minute before requesting a new code.",
        };
      }
      const windowAge = now - new Date(row.window_started_at).getTime();
      if (windowAge < 60 * 60 * 1000) {
        if (row.send_count >= otp.MAX_SENDS_PER_HOUR) {
          return { ok: false as const, message: "Too many requests. Please try again later." };
        }
        sendCount = row.send_count + 1;
        windowStarted = row.window_started_at;
      }
    }

    const test = otp.isTestMode();
    const code = test ? otp.testCode() : otp.generateOtp();
    const otp_hash = await otp.hashOtp(phone, code);

    const { error } = await supabaseAdmin.from("phone_otps").upsert(
      {
        phone,
        otp_hash,
        expires_at: new Date(now + otp.OTP_TTL_MS).toISOString(),
        attempts: 0,
        last_sent_at: new Date(now).toISOString(),
        send_count: sendCount,
        window_started_at: windowStarted,
      },
      { onConflict: "phone" },
    );
    if (error) return { ok: false as const, message: "Could not send the code. Please try again." };

    if (!test) {
      try {
        await otp.sendSms(phone, code);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error("[otp] sendSms failed", { reason });

        // A failed delivery should not leave a cooldown-blocking OTP behind.
        await supabaseAdmin.from("phone_otps").delete().eq("phone", phone);

        if (reason === "sms_not_configured") {
          return {
            ok: false as const,
            message: "SMS service is not configured for this deployment.",
          };
        }
        if (reason === "sms_device_not_found") {
          return {
            ok: false as const,
            message: "SMS gateway device is offline or not configured.",
          };
        }
        if (reason === "sms_auth_failed") {
          return {
            ok: false as const,
            message: "SMS gateway authentication failed.",
          };
        }
        if (reason === "sms_quota_exceeded") {
          return {
            ok: false as const,
            message: "SMS limit reached. Please try again later.",
          };
        }
        return {
          ok: false as const,
          message: "Could not send the code. Please try again.",
        };
      }
    }
    return { ok: true as const, testMode: test };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { mobile: string; code: string }) => ({
    mobile: String(input?.mobile ?? ""),
    code: String(input?.code ?? ""),
  }))
  .handler(async ({ data }) => {
    const otp = await import("./otp.server");
    const phone = otp.toE164India(data.mobile);
    const code = data.code.replace(/\D/g, "");
    const invalid = { ok: false as const, message: "Invalid or expired code." };
    if (!phone || code.length !== 6) return invalid;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("phone_otps")
      .select("id, otp_hash, expires_at, attempts")
      .eq("phone", phone)
      .maybeSingle();
    if (!row) return invalid;
    if (row.attempts >= otp.MAX_ATTEMPTS || new Date(row.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("phone_otps").delete().eq("id", row.id);
      return invalid;
    }

    const hash = await otp.hashOtp(phone, code);
    if (hash !== row.otp_hash) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      return invalid;
    }
    await supabaseAdmin.from("phone_otps").delete().eq("id", row.id);

    // Reuse the existing account model: mobile-derived login email, existing
    // profile/roles triggers. Never creates a duplicate user.
    const local = otp.localFromE164(phone);
    // A mobile number can be shared by more than one account (e.g. a parent who
    // also has a staff login), so never use maybeSingle() here: pick the most
    // recently created profile instead of erroring out.
    const { data: matches } = await supabaseAdmin
      .from("profiles")
      .select("id, created_at")
      .eq("mobile", local)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = matches?.[0] ?? null;
    let email = `${local}@teachnation.app`;
    if (existing) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existing.id);
      if (authUser?.user?.email) email = authUser.user.email;
    }
    if (!existing) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { mobile: local, full_name: "" },
      });
      if (created.error && !`${created.error.message}`.includes("already")) {
        return { ok: false as const, message: "Could not sign you in. Please try again." };
      }
    }

    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) {
      return { ok: false as const, message: "Could not sign you in. Please try again." };
    }
    return { ok: true as const, tokenHash };
  });

/**
 * Resolves the login email for a mobile number using the existing account model.
 * Returns a generic result and never reveals whether an account exists.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { mobile: string }) => ({ mobile: String(input?.mobile ?? "") }))
  .handler(async ({ data }) => {
    const local = data.mobile.replace(/\D/g, "").slice(-10);
    const fallback = `${local}@teachnation.app`;
    if (local.length !== 10) return { email: fallback, canReceiveEmail: false, ambiguous: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Duplicate mobiles are possible; take the newest profile rather than failing.
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, created_at")
      .eq("mobile", local)
      .order("created_at", { ascending: false })
      .limit(2);
    const profile = profiles?.[0] ?? null;
    const ambiguous = (profiles ?? []).length > 1;
    if (!profile) return { email: fallback, canReceiveEmail: false, ambiguous };
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email ?? fallback;
    return { email, canReceiveEmail: !email.endsWith("@teachnation.app"), ambiguous };
  });

/** Validates the staff access code server-side; the code itself never reaches the browser. */
export const checkStaffAccessCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: String(input?.code ?? "") }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyStaffAccessCode } = await import("./staff-access.server");
    const ok = await verifyStaffAccessCode(supabaseAdmin, data.code);
    return { ok };
  });

/**
 * One contact number = one account. Tells the sign-up form whether a mobile
 * number is still free. Never reveals who owns it.
 */
export const checkMobileAvailable = createServerFn({ method: "POST" })
  .inputValidator((input: { mobile: string }) => ({ mobile: String(input?.mobile ?? "") }))
  .handler(async ({ data }) => {
    const local = data.mobile.replace(/\D/g, "").slice(-10);
    if (local.length !== 10) return { available: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("mobile", local)
      .limit(1);
    return { available: (rows ?? []).length === 0 };
  });

/**
 * Forgot password: the email typed by the user must match the email stored on
 * the account (resolved by contact number when one is given). Returns only a
 * match / no-match answer so nothing is leaked to unauthenticated visitors.
 */
export const verifyResetEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; mobile?: string }) => ({
    email: String(input?.email ?? "").trim().toLowerCase(),
    mobile: String(input?.mobile ?? "").replace(/\D/g, "").slice(-10),
  }))
  .handler(async ({ data }) => {
    const mismatch = {
      ok: false as const,
      message: "The email you entered does not match this account.",
    };
    if (!data.email.includes("@")) return mismatch;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.mobile.length === 10) {
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("mobile", data.mobile)
        .limit(1);
      const profile = rows?.[0];
      if (!profile) return mismatch;
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      const accountEmail = (authUser?.user?.email ?? "").toLowerCase();
      if (!accountEmail || accountEmail !== data.email) return mismatch;
      return { ok: true as const, email: accountEmail };
    }

    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .limit(1);
    if (!rows || rows.length === 0) return mismatch;
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(rows[0]!.id);
    if ((authUser?.user?.email ?? "").toLowerCase() !== data.email) return mismatch;
    return { ok: true as const, email: data.email };
  });

/**
 * Phone-based password recovery.
 *
 * Supabase cannot deliver a password-reset *link* over its phone auth channel,
 * so we mint the standard Supabase recovery link server-side (same token
 * mechanism as the email flow) and deliver it over the existing TextBee SMS
 * gateway to the number already stored on the account. The response is always
 * generic so it never reveals whether an account exists.
 */
export const requestPhoneReset = createServerFn({ method: "POST" })
  .inputValidator((input: { mobile: string; origin: string }) => ({
    mobile: String(input?.mobile ?? "").replace(/\D/g, "").slice(-10),
    origin: String(input?.origin ?? ""),
  }))
  .handler(async ({ data }) => {
    const generic = {
      ok: true as const,
      message: "If this number is registered, a reset link has been sent by SMS.",
    };
    const otp = await import("./otp.server");
    const phone = otp.toE164India(data.mobile);
    if (!phone) return { ok: false as const, message: "Enter a valid 10-digit mobile number." };
    if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(data.origin)) {
      return { ok: false as const, message: "Could not send the link. Please try again." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Simple cooldown, tracked separately from the login OTP row.
    const rateKey = `${phone}:reset`;
    const now = Date.now();
    const { data: rate } = await supabaseAdmin
      .from("phone_otps")
      .select("id, last_sent_at")
      .eq("phone", rateKey)
      .maybeSingle();
    if (rate && now - new Date(rate.last_sent_at).getTime() < otp.RESEND_COOLDOWN_MS) {
      return { ok: false as const, message: "Please wait a minute before requesting another link." };
    }

    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("mobile", data.mobile)
      .limit(1);
    const profile = rows?.[0];
    if (!profile) return generic;

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const accountEmail = authUser?.user?.email;
    if (!accountEmail) return generic;

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: accountEmail,
      options: { redirectTo: `${data.origin}/reset-password` },
    });
    const actionLink = link?.properties?.action_link;
    if (error || !actionLink) {
      console.error("[reset][sms] generateLink failed", { reason: error?.message });
      return { ok: false as const, message: "Could not send the link. Please try again." };
    }

    await supabaseAdmin.from("phone_otps").upsert(
      {
        phone: rateKey,
        otp_hash: "reset",
        expires_at: new Date(now + 60 * 60 * 1000).toISOString(),
        attempts: 0,
        last_sent_at: new Date(now).toISOString(),
        send_count: 1,
        window_started_at: new Date(now).toISOString(),
      },
      { onConflict: "phone" },
    );

    try {
      await otp.sendSmsMessage(
        phone,
        `Reset your Teach Nation password using this secure link (valid for a short time): ${actionLink}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[reset][sms] send failed", { reason });
      return { ok: false as const, message: "Could not send the SMS. Please try email instead." };
    }
    return generic;
  });
