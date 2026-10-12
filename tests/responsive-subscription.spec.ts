import { test, expect } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "https://yourtuitioncenter.vercel.app";
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

test("subscription plans fit on initial load at mobile, tablet, and desktop sizes", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60000 });

    const plans = page.locator('section[aria-label="Subscription plans"] > div');
    await expect(plans).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Free", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start for free/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Choose Pro/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Unlock everything/ })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${viewport.name}`).toBe(false);

    const boxes = await plans.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
      }),
    );
    for (const box of boxes) {
      expect(box.top, `card starts above viewport at ${viewport.name}`).toBeGreaterThanOrEqual(0);
      expect(box.bottom, `card extends below initial viewport at ${viewport.name}`).toBeLessThanOrEqual(viewport.height);
      expect(box.left, `card starts left of viewport at ${viewport.name}`).toBeGreaterThanOrEqual(0);
      expect(box.right, `card extends right of viewport at ${viewport.name}`).toBeLessThanOrEqual(viewport.width);
    }

    await page.screenshot({ path: `test-results/subscription-${viewport.name}.png`, fullPage: false });
  }
});
