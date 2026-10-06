import { createFileRoute } from "@tanstack/react-router";
import { FullAdminGuard } from "@/components/admin/FullAdminGuard";
import { CrudPage } from "@/components/admin/CrudPage";
import { MODULES } from "@/lib/modules";

const config = MODULES["accounts"]!;

export const Route = createFileRoute("/admin/accounts")({
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
    <FullAdminGuard>
      <CrudPage {...config} />
    </FullAdminGuard>
  ),
});
