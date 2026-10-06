/**
 * Single source of truth for Teach Nation Coaching Institute brand + factual data.
 * Sourced from the Teach Nation master profile.
 */

export const BRAND = {
  name: "Teach Nation Coaching Institute",
  shortName: "Teach Nation",
  tagline: "Learn Today, Lead Tomorrow",
  founded: 2009,
  city: "New Delhi",
  rating: 4.9,
  reviewCount: "125+",
  phones: ["+91 9716777769", "+91 9711362000"],
  primaryPhone: "+919716777769",
  whatsapp: "919716777769",
  emails: ["teachnationinfo@gmail.com", "teachnationinformation@gmail.com"],
  website: "https://www.teachnation.in/",
  instagram: "https://www.instagram.com/teachnation/",
  origin: "https://www.teachnation.in",
  phone1: "+91 9716777769",
  phone2: "+91 9711362000",
  email1: "teachnationinfo@gmail.com",
} as const;

export type BranchInfo = {
  key: string;
  name: string;
  address: string;
  phones: string[];
  scope: string;
  mapUrl?: string;
  inCharge?: string;
};

export const BRANCHES: BranchInfo[] = [
  {
    key: "palam-village",
    name: "Palam Village (Head Office)",
    address: "WZ 908, Bata Chowk, Palam, New Delhi 110045",
    phones: ["+91 8588841399"],
    inCharge: "Monika Sisodia",
    scope:
      "Secondary & Senior Secondary board preparation across Commerce, Science and Arts streams.",
  },
  {
    key: "mangla-puri",
    name: "Mangla Puri Branch",
    address: "D-20, Gali No. 9, Mangla Puri Village, Palam, New Delhi",
    phones: ["+91 7807415754"],
    inCharge: "Neha Rajput",
    scope:
      "Core CBSE school batches, curated test series and structured assignment banks.",
  },
  {
    key: "rajnagar-extension",
    name: "Rajnagar Extension Node",
    address: "WZ-440, Gali No. 1, Rajnagar Part-II, Near Maya Medicos, New Delhi",
    phones: ["+91 9891438635"],
    inCharge: "Musharif",
    scope:
      "Extension centre integrated with the Palam grid, serving Rajnagar, Palam Extension and Sadh Nagar.",
    mapUrl: "https://maps.google.com/maps?cid=11106824455556621493",
  },
];

export type CourseBand = {
  key: string;
  band: string;
  title: string;
  subjects: string[];
  blurb: string;
  highlight?: string;
};

export const COURSE_BANDS: CourseBand[] = [
  {
    key: "foundation",
    band: "Classes 1–5",
    title: "Foundation Programme",
    subjects: ["English", "Hindi", "Mathematics", "EVS"],
    blurb:
      "Concept-first CBSE coaching that builds reading, writing and number sense with small batches and weekly practice.",
  },
  {
    key: "middle",
    band: "Classes 6–8",
    title: "Middle School Programme",
    subjects: ["Mathematics", "Science", "Social Science", "English"],
    blurb:
      "Chapter-wise mentoring, structured assignment banks and monthly tests to keep school performance consistent.",
  },
  {
    key: "board-9-10",
    band: "Classes 9–10",
    title: "CBSE Board Preparation",
    subjects: ["Mathematics", "Science", "Social Science", "English"],
    blurb:
      "Board-pattern practice, NCERT mastery, sample papers and pre-board test series with doubt-clearing sessions.",
    highlight: "Board pattern",
  },
  {
    key: "commerce",
    band: "Classes 11–12",
    title: "Commerce Excellence Hub",
    subjects: ["Accountancy", "Business Studies", "Economics", "Applied Maths"],
    blurb:
      "Our flagship track. Specialist Class XII Commerce mentoring with accounts drills, case studies and full-length papers.",
    highlight: "Flagship",
  },
  {
    key: "science-arts",
    band: "Classes 11–12",
    title: "Science & Humanities",
    subjects: ["Physics", "Chemistry", "Mathematics", "Political Science"],
    blurb:
      "Senior secondary coaching for Science and Arts streams with concept classes and regular board-level assessment.",
  },
  {
    key: "banking",
    band: "Competitive",
    title: "Banking Exam Preparation",
    subjects: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"],
    blurb:
      "Structured speed-test tactics and syllabus pathways built for IBPS PO, IBPS Clerk and IBPS RRB selection.",
    highlight: "IBPS / RRB / Clerk",
  },
];

export const INSTITUTE_STATS = [
  { k: "2009", v: "Established" },
  { k: "3", v: "Delhi branches" },
  { k: "1–12", v: "CBSE classes" },
  { k: "4.9★", v: "125+ reviews" },
];

export const WHY_US = [
  {
    title: "Commerce specialists",
    copy: "A dedicated Class XII Commerce hub covering Accountancy, Business Studies, Economics and Maths.",
  },
  {
    title: "Test series & assignments",
    copy: "Curated chapter tests, pre-boards and structured assignment banks with detailed performance feedback.",
  },
  {
    title: "Experienced faculty",
    copy: "Subject-specialist educators mentoring students step by step under CBSE standard parameters.",
  },
];