import { createFileRoute } from "@tanstack/react-router";
import { StaffGuard } from "@/components/admin/StaffGuard";
import { CrudPage } from "@/components/admin/CrudPage";
import { MODULES } from "@/lib/modules";

const config = MODULES["attendance"]!;

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: `${config.title} — Teach Nation Admin` },
      { name: "description", content: config.description ?? config.title },
      { property: "og:title", content: `${config.title} — Teach Nation Admin` },
      { property: "og:description", content: config.description ?? config.title },
    ],
  }),
  component: () => (
    <StaffGuard>
      <CrudPage {...config} />
    </StaffGuard>
  ),
});
