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

          if (!plan || !instituteName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            return Response.json({ error: "Enter a valid centre name and website slug." }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID;
          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          if (!keyId || !keySecret) {
            return Response.json({ error: "Razorpay recurring billing needs RAZORPAY_KEY_SECRET configured in Vercel." }, { status: 503 });
          }

          const amount = plan === "pro" ? 299 : 499;
          const planName = plan === "pro" ? "Your Tuition Center Pro Monthly" : "Your Tuition Center Enterprise Monthly";
          const auth = "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64");
          const plansResponse = await fetch("https://api.razorpay.com/v1/plans?count=100", {
            headers: { Authorization: auth },
          });
          const plansData = await plansResponse.json();
          if (!plansResponse.ok || !Array.isArray(plansData.items)) {
            return Response.json({ error: plansData.error?.description || "Unable to check Razorpay monthly plans." }, { status: 502 });
          }

          let planRecord = plansData.items.find((item: any) =>
            item.item?.name === planName &&
            item.item?.amount === amount * 100 &&
            item.item?.currency === "INR" &&
            item.period === "monthly" &&
            item.interval === 1
          );

          if (!planRecord) {
            const createPlanResponse = await fetch("https://api.razorpay.com/v1/plans", {
              method: "POST",
              headers: { Authorization: auth, "Content-Type": "application/json" },
              body: JSON.stringify({
                period: "monthly",
                interval: 1,
                item: {
                  name: planName,
                  amount: amount * 100,
                  currency: "INR",
                  description: plan === "pro" ? "Monthly Pro plan for Your Tuition Center" : "Monthly Enterprise plan for Your Tuition Center",
                },
                notes: { product: "Your Tuition Center", plan },
              }),
            });
            planRecord = await createPlanResponse.json();
            if (!createPlanResponse.ok || !planRecord.id) {
              return Response.json({ error: planRecord.error?.description || "Unable to configure the monthly billing plan." }, { status: 502 });
            }
          }

          const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: { Authorization: auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_id: planRecord.id,
              total_count: 120,
              quantity: 1,
              customer_notify: 1,
              notes: { plan, instituteName, slug },
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
            amount,
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