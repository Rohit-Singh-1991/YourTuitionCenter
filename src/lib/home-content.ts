import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, INSTITUTE_STATS, WHY_US } from "@/lib/brand";
import heroClassroom from "@/assets/tn-hero-classroom.jpg";
import toppersImg from "@/assets/tn-toppers.jpg";

/**
 * No-code homepage content. Every value has a default equal to the copy that
 * was previously hardcoded in `src/routes/index.tsx`, so an empty
 * `site_content` table renders exactly the original page.
 */
export const HOME_DEFAULTS: Record<string, string> = {
  // Promo strip
  "home.promo.visible": "true",
  "home.promo.text": "Early-bird admission offer open for the new session — talk to a counsellor today",
  "home.promo.cta_label": "Enrol now",
  "home.promo.cta_link": "/admissions",

  // Hero
  "home.hero.badge": "Since 2009 · Palam, New Delhi",
  "home.hero.heading": "Teach Nation Coaching Institute in Delhi",
  "home.hero.heading_highlight": "Teach Nation",
  "home.hero.tagline": BRAND.tagline,
  "home.hero.subheading":
    "CBSE coaching for Classes 1 to 12, a specialised Class XII Commerce hub and structured training for IBPS, IBPS RRB and IBPS Clerk banking examinations — across three branches in the Palam region.",
  "home.hero.image": "",
  "home.hero.image_alt": "Teach Nation students studying Accountancy in a bright coaching classroom",
  "home.hero.image_caption": "Commerce specialists",
  "home.hero.cta1_label": "Apply for admission",
  "home.hero.cta1_link": "/admissions",
  "home.hero.cta2_label": "Explore courses",
  "home.hero.cta2_link": "/courses",

  // Stats band
  "home.stats.visible": "true",
  ...Object.fromEntries(
    INSTITUTE_STATS.flatMap((s, i) => [
      [`home.stats.${i}.value`, s.k],
      [`home.stats.${i}.label`, s.v],
    ]),
  ),

  // Quick tiles + courses section
  "home.courses.visible": "true",
  "home.courses.eyebrow": "Programmes",
  "home.courses.title": "CBSE, Commerce & banking coaching",
  "home.courses.body":
    "Step-by-step mentoring from Class 1 to 12, a Commerce specialisation hub and IBPS banking batches — see every course, batch timing and fee structure on the Courses page.",
  "home.courses.cta1_label": "Explore all courses",
  "home.courses.cta1_link": "/courses",
  "home.courses.cta2_label": "Apply for a batch",
  "home.courses.cta2_link": "/admissions",

  // Why us / features
  "home.why.visible": "true",
  ...Object.fromEntries(
    WHY_US.flatMap((w, i) => [
      [`home.why.${i}.title`, w.title],
      [`home.why.${i}.copy`, w.copy],
    ]),
  ),

  // Toppers & results
  "home.toppers.visible": "true",
  "home.toppers.eyebrow": "Toppers & results",
  "home.toppers.title": "A legacy of board results since 2009",
  "home.toppers.body":
    "Our Commerce and Board batches are built around evaluated practice: chapter tests, pre-boards and personal performance reviews. Latest topper lists are published every session on the results page.",
  "home.toppers.image": "",
  "home.toppers.image_alt": "Teach Nation students celebrating their CBSE board results",
  "home.toppers.cta_label": "See our results",
  "home.toppers.cta_link": "/results",
  "home.toppers.0.value": "95%+",
  "home.toppers.0.label": "Class XII Commerce top scorers",
  "home.toppers.1.value": "4.9★",
  "home.toppers.1.label": "Rated by 125+ students & parents",
  "home.toppers.2.value": "15+",
  "home.toppers.2.label": "Years of board results",
  "home.toppers.3.value": "1:15",
  "home.toppers.3.label": "Faculty to student ratio",

  // Updates band
  "home.updates.visible": "true",
  "home.updates.eyebrow": "What's running now",
  "home.updates.title": "Exam & crash-course updates",
  "home.updates.0.tag": "Board 2026",
  "home.updates.0.title": "Class 10 & 12 pre-board test series",
  "home.updates.0.copy": "Full-syllabus CBSE pattern papers with evaluated answer sheets and one-to-one feedback.",
  "home.updates.1.tag": "Crash course",
  "home.updates.1.title": "60-day Commerce crash course",
  "home.updates.1.copy": "Accountancy, Business Studies and Economics revision sprints before the board exams.",
  "home.updates.2.tag": "Banking",
  "home.updates.2.title": "IBPS Clerk & RRB batch",
  "home.updates.2.copy": "Speed-test tactics, quant shortcuts and weekly full-length mocks for banking aspirants.",

  // Testimonials
  "home.reviews.visible": "true",

  // Contact CTA
  "home.cta.visible": "true",
  "home.cta.title": "Book a free counselling session",
  "home.cta.body":
    "Talk to our academic team about the right batch, timings and fees for your class and stream. Admissions are open for CBSE, Commerce and banking batches.",
  "home.cta.cta1_label": "Start an application",
  "home.cta.cta1_link": "/admissions",
  "home.cta.cta2_label": "Contact a branch",
  "home.cta.cta2_link": "/contact",
};

/** Fallback images bundled with the app when no upload has replaced them. */
export const HOME_FALLBACK_IMAGES: Record<string, string> = {
  "home.hero.image": heroClassroom,
  "home.toppers.image": toppersImg,
};

/** Sections that can be reordered on the page (hero/promo stay pinned). */
export const REORDERABLE = ["courses", "why", "toppers", "updates", "reviews", "cta"] as const;
export type SectionId = (typeof REORDERABLE)[number];
export const ORDER_KEY = "home.section_order";

export function parseOrder(value: string | undefined): SectionId[] {
  const raw = (value ?? "").split(",").map((s) => s.trim()).filter(Boolean) as SectionId[];
  const kept = raw.filter((s) => (REORDERABLE as readonly string[]).includes(s));
  return [...kept, ...REORDERABLE.filter((s) => !kept.includes(s))];
}

export type HomeContent = {
  get: (key: string) => string;
  bool: (key: string) => boolean;
  img: (key: string) => string;
  order: SectionId[];
};

export function buildHomeContent(map: Record<string, string>): HomeContent {
  const get = (key: string) => {
    const v = map[key];
    return v !== undefined && v !== "" ? v : (HOME_DEFAULTS[key] ?? "");
  };
  return {
    get,
    bool: (key: string) => get(key) !== "false",
    img: (key: string) => map[key] || HOME_FALLBACK_IMAGES[key] || "",
    order: parseOrder(map[ORDER_KEY]),
  };
}

async function fetchHomeMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .eq("page", "home");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value ?? "";
  return map;
}

export function useHomeContentMap() {
  return useQuery({
    queryKey: ["home-content"],
    queryFn: fetchHomeMap,
    staleTime: 60_000,
  });
}

export function useHomeContent(): HomeContent {
  const { data } = useHomeContentMap();
  return buildHomeContent(data ?? {});
}

/** Editor schema — drives the admin form. */
export type FieldType = "text" | "textarea" | "image" | "link";
export type Field = { key: string; label: string; type?: FieldType; hint?: string };
export type SectionDef = {
  id: string;
  label: string;
  hint: string;
  visibilityKey?: string;
  fields: Field[];
};

export const HOME_SECTIONS: SectionDef[] = [
  {
    id: "promo",
    label: "Top promo strip",
    hint: "The thin coloured bar above the hero.",
    visibilityKey: "home.promo.visible",
    fields: [
      { key: "home.promo.text", label: "Message", type: "textarea" },
      { key: "home.promo.cta_label", label: "Button text" },
      { key: "home.promo.cta_link", label: "Button link", type: "link" },
    ],
  },
  {
    id: "hero",
    label: "Hero",
    hint: "The main banner: heading, intro, image and the two call-to-action buttons.",
    fields: [
      { key: "home.hero.badge", label: "Badge text" },
      { key: "home.hero.heading", label: "Heading" },
      { key: "home.hero.heading_highlight", label: "Highlighted words", hint: "Part of the heading shown in the brand colour." },
      { key: "home.hero.tagline", label: "Tagline (quoted line)" },
      { key: "home.hero.subheading", label: "Sub-heading", type: "textarea" },
      { key: "home.hero.image", label: "Hero image", type: "image" },
      { key: "home.hero.image_alt", label: "Hero image alt text" },
      { key: "home.hero.image_caption", label: "Image caption pill" },
      { key: "home.hero.cta1_label", label: "Primary button text" },
      { key: "home.hero.cta1_link", label: "Primary button link", type: "link" },
      { key: "home.hero.cta2_label", label: "Secondary button text" },
      { key: "home.hero.cta2_link", label: "Secondary button link", type: "link" },
    ],
  },
  {
    id: "stats",
    label: "Stats band",
    hint: "The four dark tiles under the hero.",
    visibilityKey: "home.stats.visible",
    fields: INSTITUTE_STATS.flatMap((_, i) => [
      { key: `home.stats.${i}.value`, label: `Stat ${i + 1} — number` },
      { key: `home.stats.${i}.label`, label: `Stat ${i + 1} — caption` },
    ]),
  },
  {
    id: "courses",
    label: "Courses section",
    hint: "Quick tiles plus the programmes headline and buttons.",
    visibilityKey: "home.courses.visible",
    fields: [
      { key: "home.courses.eyebrow", label: "Eyebrow" },
      { key: "home.courses.title", label: "Title" },
      { key: "home.courses.body", label: "Description", type: "textarea" },
      { key: "home.courses.cta1_label", label: "Primary button text" },
      { key: "home.courses.cta1_link", label: "Primary button link", type: "link" },
      { key: "home.courses.cta2_label", label: "Secondary button text" },
      { key: "home.courses.cta2_link", label: "Secondary button link", type: "link" },
    ],
  },
  {
    id: "why",
    label: "About / why us cards",
    hint: "Three feature cards describing the institute.",
    visibilityKey: "home.why.visible",
    fields: WHY_US.flatMap((_, i) => [
      { key: `home.why.${i}.title`, label: `Card ${i + 1} — title` },
      { key: `home.why.${i}.copy`, label: `Card ${i + 1} — text`, type: "textarea" as FieldType },
    ]),
  },
  {
    id: "toppers",
    label: "Toppers & results",
    hint: "Results photo, headline and the four highlight tiles.",
    visibilityKey: "home.toppers.visible",
    fields: [
      { key: "home.toppers.eyebrow", label: "Eyebrow" },
      { key: "home.toppers.title", label: "Title" },
      { key: "home.toppers.body", label: "Description", type: "textarea" },
      { key: "home.toppers.image", label: "Section image", type: "image" },
      { key: "home.toppers.image_alt", label: "Image alt text" },
      { key: "home.toppers.cta_label", label: "Button text" },
      { key: "home.toppers.cta_link", label: "Button link", type: "link" },
      ...[0, 1, 2, 3].flatMap((i) => [
        { key: `home.toppers.${i}.value`, label: `Highlight ${i + 1} — number` },
        { key: `home.toppers.${i}.label`, label: `Highlight ${i + 1} — caption` },
      ]),
    ],
  },
  {
    id: "updates",
    label: "Exam & crash-course updates",
    hint: "The dark banner with three update cards.",
    visibilityKey: "home.updates.visible",
    fields: [
      { key: "home.updates.eyebrow", label: "Eyebrow" },
      { key: "home.updates.title", label: "Title" },
      ...[0, 1, 2].flatMap((i) => [
        { key: `home.updates.${i}.tag`, label: `Card ${i + 1} — tag` },
        { key: `home.updates.${i}.title`, label: `Card ${i + 1} — title` },
        { key: `home.updates.${i}.copy`, label: `Card ${i + 1} — text`, type: "textarea" as FieldType },
      ]),
    ],
  },
  {
    id: "reviews",
    label: "Parent reviews",
    hint: "Testimonials block. Individual reviews are managed in the reviews list.",
    visibilityKey: "home.reviews.visible",
    fields: [],
  },
  {
    id: "cta",
    label: "Closing call to action",
    hint: "The final dark card inviting a counselling session.",
    visibilityKey: "home.cta.visible",
    fields: [
      { key: "home.cta.title", label: "Title" },
      { key: "home.cta.body", label: "Description", type: "textarea" },
      { key: "home.cta.cta1_label", label: "Primary button text" },
      { key: "home.cta.cta1_link", label: "Primary button link", type: "link" },
      { key: "home.cta.cta2_label", label: "Secondary button text" },
      { key: "home.cta.cta2_link", label: "Secondary button link", type: "link" },
    ],
  },
];

export const HOME_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  HOME_SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, `${s.label} — ${f.label}`])),
);
