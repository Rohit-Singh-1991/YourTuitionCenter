import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const plan = body.plan === "enterprise" ? "enterprise" : "pro";
          const amount = plan === "enterprise" ? 499 : 299;
          const name = typeof body.instituteName === "string" ? body.instituteName.trim() : "";
          const slug = typeof body.slug === "string" ? body.slug.trim() : "";
          const staffAccessCode = typeof body.staffAccessCode === "string" ? body.staffAccessCode : "";

          if (!name || !slug || staffAccessCode.length < 4) {
            return Response.json({ error: "Institute name, website slug and staff access code are required." }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID;
          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          if (!keyId || !keySecret) return Response.json({ error: "Razorpay is not configured." }, { status: 503 });

          const receipt = "YTC-" + Date.now().toString(36).toUpperCase();
          const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
          const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: amount * 100,
              currency: "INR",
              receipt,
              notes: { plan, instituteName: name, slug },
            }),
          });

          const data = await response.json();
          if (!response.ok || !data.id) {
            return Response.json({ error: data.error?.description || "Unable to create Razorpay order." }, { status: 502 });
          }

          return Response.json({ keyId, orderId: data.id, amount, currency: "INR", receipt, plan, instituteName: name, slug, staffAccessCode });
        } catch {
          return Response.json({ error: "Unable to create payment order." }, { status: 500 });
        }
      },
    },
  },
});