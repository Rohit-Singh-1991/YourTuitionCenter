import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return Response.json({ error: "Webhook secret is not configured" }, { status: 503 });

        const signature = request.headers.get("x-razorpay-signature");
        const raw = Buffer.from(await request.arrayBuffer());
        const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");

        if (!signature || signature.length !== expected.length ||
            !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
          return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
        }

        try {
          const event = JSON.parse(raw.toString("utf8"));
          console.log("razorpay_webhook", event.event, event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || "");
          return Response.json({ received: true });
        } catch {
          return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
        }
      },
    },
  },
});
