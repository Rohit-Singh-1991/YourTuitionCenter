import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/razorpay/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const subscriptionId = typeof body.razorpay_subscription_id === "string" ? body.razorpay_subscription_id : "";
          const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
          const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
          if (!subscriptionId || !paymentId || !signature) {
            return Response.json({ error: "Incomplete subscription payment response." }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID;
          const secret = process.env.RAZORPAY_KEY_SECRET;
          if (!keyId || !secret) return Response.json({ error: "Razorpay recurring billing is not configured." }, { status: 503 });

          const expected = crypto.createHmac("sha256", secret).update(subscriptionId + "|" + paymentId).digest("hex");
          const expectedBytes = Buffer.from(expected, "hex");
          const receivedBytes = Buffer.from(signature, "hex");
          if (expectedBytes.length !== receivedBytes.length || !crypto.timingSafeEqual(expectedBytes, receivedBytes)) {
            return Response.json({ error: "Subscription payment signature verification failed." }, { status: 400 });
          }

          const auth = Buffer.from(keyId + ":" + secret).toString("base64");
          const response = await fetch("https://api.razorpay.com/v1/subscriptions/" + encodeURIComponent(subscriptionId), {
            headers: { Authorization: "Basic " + auth },
          });
          const subscription = await response.json();
          if (!response.ok || subscription.id !== subscriptionId) {
            return Response.json({ error: "Unable to confirm the subscription with Razorpay." }, { status: 502 });
          }

          const plan = subscription.notes?.plan;
          const expectedPlanId = plan === "pro" ? process.env.RAZORPAY_PRO_PLAN_ID
            : plan === "enterprise" ? process.env.RAZORPAY_ENTERPRISE_PLAN_ID : undefined;
          if (!expectedPlanId || subscription.plan_id !== expectedPlanId) {
            return Response.json({ error: "The subscription does not match a configured plan." }, { status: 400 });
          }
          if (subscription.status !== "authenticated" && subscription.status !== "active") {
            return Response.json({ error: "Razorpay has not confirmed an active subscription yet." }, { status: 402 });
          }

          return Response.json({
            ok: true,
            subscriptionId,
            paymentId,
            plan,
            instituteName: subscription.notes?.instituteName || "",
            slug: subscription.notes?.slug || "",
            status: subscription.status,
            currentEnd: subscription.current_end || null,
          });
        } catch {
          return Response.json({ error: "Unable to verify recurring subscription." }, { status: 500 });
        }
      },
    },
  },
});