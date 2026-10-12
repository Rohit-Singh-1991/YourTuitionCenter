import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://yourtuitioncenter.vercel.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = ["/"];
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...paths.map((path) => `  <url><loc>${BASE_URL}${path}</loc></url>`),
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
