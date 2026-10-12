import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import booksImg from "@/assets/shop/books.jpg";
import uniformImg from "@/assets/shop/uniform.jpg";
import bagImg from "@/assets/shop/bag.jpg";
import bottleImg from "@/assets/shop/bottle.jpg";
import dss1Qr from "@/assets/payments/dss1-qr.jpeg.asset.json";
import dss2Qr from "@/assets/payments/dss2-qr.jpeg.asset.json";

export const ADMISSION_FEE = 2500;
export const UPI_ID = "9910474663@icici";
export const UPI_PAYEE = "Teach Nation Coaching Institute";

export type CatalogItem = {
  sku: string;
  name: string;
  description: string;
  kind: "book" | "uniform" | "accessory";
  price: number;
  stock: number;
  image: string;
};

export const CATALOG: CatalogItem[] = [
  {
    sku: "BK-PRE-01",
    name: "Class 9-10 module set",
    description: "4 workbooks — patterns, colours, numbers and rhymes.",
    kind: "book",
    price: 950,
    stock: 40,
    image: booksImg,
  },
  {
    sku: "BK-NUR-02",
    name: "Class 11-12 Commerce kit",
    description: "Alphabet, number and story books with crayons.",
    kind: "book",
    price: 1150,
    stock: 32,
    image: booksImg,
  },
  {
    sku: "BK-KG-03",
    name: "LKG / UKG book bundle",
    description: "English, Maths, EVS and writing practice books.",
    kind: "book",
    price: 1400,
    stock: 25,
    image: booksImg,
  },
  {
    sku: "UN-SUM-01",
    name: "Summer uniform set",
    description: "Shirt and shorts / skirt with school monogram.",
    kind: "uniform",
    price: 1200,
    stock: 50,
    image: uniformImg,
  },
  {
    sku: "UN-WIN-02",
    name: "Winter uniform set",
    description: "Sweater, track pants and full-sleeve shirt.",
    kind: "uniform",
    price: 1650,
    stock: 30,
    image: uniformImg,
  },
  {
    sku: "UN-SPT-03",
    name: "Sports day t-shirt",
    description: "Institute t-shirt for events and competitions.",
    kind: "uniform",
    price: 480,
    stock: 60,
    image: uniformImg,
  },
  {
    sku: "AC-BAG-01",
    name: "Teach Nation school bag",
    description: "Light, padded bag sized for little shoulders.",
    kind: "accessory",
    price: 890,
    stock: 45,
    image: bagImg,
  },
  {
    sku: "AC-BTL-02",
    name: "Water bottle + tiffin box",
    description: "BPA-free bottle with a leak-proof lunch box.",
    kind: "accessory",
    price: 640,
    stock: 55,
    image: bottleImg,
  },
  {
    sku: "AC-ID-03",
    name: "ID card & belt set",
    description: "Printed ID card, lanyard and school belt.",
    kind: "accessory",
    price: 260,
    stock: 80,
    image: bagImg,
  },
];

export const KIND_LABEL: Record<CatalogItem["kind"], string> = {
  book: "Books",
  uniform: "Uniforms",
  accessory: "Accessories",
};

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Uploads to the private `admissions` bucket under the parent's own folder. */
export async function uploadAdmissionFile(file: File, folder: string) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Please sign in again to upload files.");
  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${uid}/${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("admissions").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function signAdmissionFile(path: string) {
  const { data, error } = await supabase.storage
    .from("admissions")
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export type AdmissionApplication = {
  id: string;
  parent_user_id: string;
  branch_id: string | null;
  class_applied: string | null;
  student_name: string | null;
  form: Record<string, unknown>;
  documents: Record<string, string>;
  status: "draft" | "submitted" | "paid" | "rejected";
  submitted_at: string | null;
};

export type AdmissionOrder = {
  id: string;
  application_id: string;
  admission_fee: number;
  items_total: number;
  tax_amount?: number;
  other_charges?: number;
  total_amount: number;
  upi_id: string;
  utr: string | null;
  screenshot_url: string | null;
  status: "pending_payment" | "pending_verification" | "paid" | "rejected";
  rejection_reason: string | null;
};

export function useMyApplication(enabled: boolean) {
  return useQuery({
    queryKey: ["my-admission-application"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as AdmissionApplication | null) ?? null;
    },
  });
}

export function useMyOrder(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["my-admission-order", applicationId],
    enabled: Boolean(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_orders")
        .select("*, admission_order_items(*)")
        .eq("application_id", applicationId!)
        .maybeSingle();
      if (error) throw error;
      return data as (AdmissionOrder & { admission_order_items: { sku: string; name: string; kind: string; unit_price: number; quantity: number }[] }) | null;
    },
  });
}
/* ---------- Branch-specific admission payment destinations ---------- */

export type BranchPayment = {
  label: string;
  /** Scannable QR image supplied by the school for this campus. */
  qrUrl: string;
  /** UPI ID shown for manual entry — omitted when the campus only shares a QR. */
  upiId?: string;
  payeeName?: string;
};

/** Keyed by branch code (PALAM, MANGLAPURI, RAJNAGAR). */
export const BRANCH_PAYMENTS: Record<string, BranchPayment> = {
  PALAM: {
    label: "Palam Village (Head Office)",
    qrUrl: dss1Qr.url,
    upiId: "9560419145@kotakbank",
    payeeName: "JAANVI JAIN",
  },
  MANGLAPURI: {
    label: "Mangla Puri Branch",
    qrUrl: dss2Qr.url,
  },
  RAJNAGAR: {
    label: "Rajnagar Extension Node",
    qrUrl: dss1Qr.url,
    upiId: "9560419145@kotakbank",
    payeeName: "JAANVI JAIN",
  },
};

export function branchPayment(code?: string | null): BranchPayment | null {
  if (!code) return null;
  return BRANCH_PAYMENTS[code.toUpperCase()] ?? null;
}
