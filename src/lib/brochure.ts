import pdfAsset from "@/assets/brochure/brochure.pdf.asset.json";

type AssetPointer = { url: string };

const pageModules = import.meta.glob<AssetPointer>(
  "/src/assets/brochure/page-*.jpg.asset.json",
  { eager: true, import: "default" },
);

export const brochurePages: string[] = Object.keys(pageModules)
  .sort()
  .map((key) => pageModules[key]!.url);

export const brochurePdfUrl = pdfAsset.url;
export const brochureFileName = "Teach-Nation-Brochure.pdf";