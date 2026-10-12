import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/subscription")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const plan = body.plan === "enterprise" ? "enterprise" : body.plan === "pro" ? "pro" : null;
          const instituteName = typeof body.instituteName === "string" ? body.instituteName.trim().slice(0, 120) : "";
          const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
          const staffAccessCode = typeof body.staffAccessCode === "string" ? body.staffAccessCode : "";

          if (!plan || !instituteName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || staffAccessCode.length < 4 || staffAccessCode.length > 64) {
            return Response.json({ error: "Enter a valid centre name, website slug and staff access code." }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID;
          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          const planId = plan === "pro" ? process.env.RAZORPAY_PRO_PLAN_ID : process.env.RAZORPAY_ENTERPRISE_PLAN_ID;
          if (!keyId || !keySecret || !planId) {
            return Response.json({
              error: "Recurring billing is not configured yet. Add RAZORPAY_KEY_SECRET and the matching Razorpay monthly plan ID in Vercel."
            }, { status: 503 });
          }

          const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
          const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_id: planId,
              total_count: 120,
              quantity: 1,
              customer_notify: 1,
              notes: { plan, instituteName, slug, staffAccessCode },
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.id) {
            return Response.json({ error: data.error?.description || "Unable to create a recurring subscription." }, { status: 502 });
          }

          return Response.json({
            keyId,
            subscriptionId: data.id,
            plan,
            amount: plan === "pro" ? 299 : 499,
            currency: "INR",
            instituteName,
            slug,
          });
        } catch {
          return Response.json({ error: "Unable to start recurring subscription checkout." }, { status: 500 });
        }
      },
    },
  },
});