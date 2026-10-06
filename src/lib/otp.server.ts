/**
 * Server-only helpers for Indian mobile OTP login.
 * Never imported by client code (filename is blocked from client bundles).
 */

export const OTP_TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const MAX_SENDS_PER_HOUR = 5;

/** Accept Indian mobile numbers only, normalized to +91XXXXXXXXXX. */
export function toE164India(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10 || !/^[6-9]/.test(local)) return null;
  return `+91${local}`;
}

export function localFromE164(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function isTestMode() {
  return process.env["OTP_TEST_MODE"] === "true";
}

export function testCode() {
  return process.env["OTP_TEST_CODE"] || "123456";
}

export function generateOtp() {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

/** SHA-256 hash of phone + code + server pepper. Plaintext OTPs are never stored or logged. */
export async function hashOtp(phone: string, code: string) {
  const pepper = process.env["OTP_PEPPER"] || process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  const data = new TextEncoder().encode(`${phone}:${code}:${pepper}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const TEXTBEE_BASE = "https://api.textbee.dev/api/v1";

/** Masks a phone for logs: +9199****4663 */
function maskPhone(phone: string) {
  return phone.length > 8 ? `${phone.slice(0, 5)}****${phone.slice(-4)}` : "****";
}

/**
 * Reads the gateway device so send failures can be attributed to config,
 * an offline device, or a SIM with no carrier service.
 */
async function inspectDevice(apiKey: string, deviceId: string) {
  try {
    const res = await fetch(`${TEXTBEE_BASE}/gateway/devices`, { headers: { "x-api-key": apiKey } });
    if (!res.ok) {
      console.warn("[otp][textbee] device list failed", { status: res.status });
      return null;
    }
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const devices = json.data ?? [];
    // Prefer the configured gateway phone; fall back to the account default so
    // swapping in a new sender phone only needs the TextBee app registration.
    const device =
      devices.find((d) => String(d["_id"]) === deviceId) ??
      devices.find((d) => d["isDefault"] === true) ??
      devices[0];
    if (!device) {
      console.error("[otp][textbee] TEXTBEE_DEVICE_ID not found on account", {
        configuredDeviceId: deviceId,
        availableDeviceIds: devices.map((d) => String(d["_id"])),
      });
      return null;
    }
    const sims =
      ((device["simInfo"] as { sims?: Array<{ displayName?: string; carrierName?: string }> })
        ?.sims ?? []).map((s) => ({ sim: s.displayName, carrier: s.carrierName }));
    const noService = sims.length > 0 && sims.every((s) => /emergency calls only|no service|unknown/i.test(s.carrier ?? ""));
    console.log("[otp][textbee] device", {
      deviceId: String(device["_id"]),
      configuredDeviceId: deviceId,
      name: device["name"],
      enabled: device["enabled"],
      appVersion: (device["appVersionInfo"] as { versionName?: string } | undefined)?.versionName,
      lastSeen: device["updatedAt"],
      battery: (device["batteryInfo"] as { percentage?: number } | undefined)?.percentage,
      sims,
      noCarrierService: noService,
    });
    if (noService) {
      console.error(
        "[otp][textbee] gateway phone has no carrier service (SIM shows 'Emergency calls only') — SMS will show as 'Not sent' on the device",
      );
    }
    return device;
  } catch (err) {
    console.warn("[otp][textbee] device inspection failed", err);
    return null;
  }
}

/** Send an arbitrary SMS through TextBee. Credentials stay server-side. */
export async function sendSmsMessage(phone: string, message: string) {
  const apiKey = process.env["TEXTBEE_API_KEY"]?.trim();
  const configuredDeviceId = process.env["TEXTBEE_DEVICE_ID"]?.trim();

  // TEXTBEE_DEVICE_ID is optional: when it is not configured, use the
  // account's default/first registered device. This avoids breaking OTP after
  // a TextBee device is replaced or the deployment only has the API key.
  if (!apiKey) {
    console.error("[otp][textbee] missing config", {
      hasApiKey: false,
      hasDeviceId: Boolean(configuredDeviceId),
    });
    throw new Error("sms_not_configured");
  }
  // Guard: TextBee needs strict E.164 (+91XXXXXXXXXX).
  if (!/^\+91[6-9]\d{9}$/.test(phone)) {
    console.error("[otp][textbee] recipient not in E.164 form", { recipient: maskPhone(phone) });
    throw new Error("sms_invalid_recipient");
  }

  const started = Date.now();
  const body: Record<string, unknown> = {
    recipients: [phone],
    message,
  };
  if (configuredDeviceId) body["deviceId"] = configuredDeviceId;
  const res = await fetch(`${TEXTBEE_BASE}/gateway/send-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
  });
  const bodyText = await res.text().catch(() => "");
  console.log("[otp][textbee] send-sms response", {
    status: res.status,
    ms: Date.now() - started,
    recipient: maskPhone(phone),
    deviceId: configuredDeviceId || "default",
    body: bodyText.slice(0, 500),
  });

  if (res.status === 401 || res.status === 403) {
    console.error("[otp][textbee] auth rejected — check TEXTBEE_API_KEY");
    throw new Error("sms_auth_failed");
  }
  if (res.status === 429 || /quota|limit|exceed/i.test(bodyText)) {
    console.error("[otp][textbee] quota or rate limit reached", { status: res.status });
    throw new Error("sms_quota_exceeded");
  }
  if (!res.ok) throw new Error("sms_send_failed");
}

/** Send the OTP SMS through TextBee. The OTP is never logged. */
export async function sendSms(phone: string, code: string) {
  await sendSmsMessage(
    phone,
    `${code} is your Teach Nation verification code. It expires in 5 minutes. Do not share it.`,
  );
}
