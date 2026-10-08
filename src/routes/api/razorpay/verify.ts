import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/razorpay/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
          const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
          const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
          if (!orderId || !paymentId || !signature) return Response.json({ error: "Incomplete payment response." }, { status: 400 });

          const secret = process.env.RAZORPAY_KEY_SECRET;
          if (!secret) return Response.json({ error: "Razorpay is not configured." }, { status: 503 });

          const expected = crypto.createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex");
          if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
            return Response.json({ error: "Payment signature verification failed." }, { status: 400 });
          }

          return Response.json({ ok: true, paymentId, orderId });
        } catch {
          return Response.json({ error: "Unable to verify payment." }, { status: 500 });
        }
      },
    },
  },
});