import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/** Every student linked to the signed-in parent account. */
export function useMyChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["parent", "children", user?.userId],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, full_name, admission_no, registration_id, class_name, dob, gender, blood_group, photo_url, status, branch_id, guardian_mobile, alt_mobile, address, father_name, mother_name",
        )
        .eq("parent_user_id", user!.userId)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useChildIds() {
  const children = useMyChildren();
  const ids = (children.data ?? []).map((c) => c.id);
  return { ids, ready: children.isSuccess, children };
}

export function useMyAttendance(days = 30) {
  const { ids, ready } = useChildIds();
  return useQuery({
    queryKey: ["parent", "attendance", ids, days],
    enabled: ready && ids.length > 0,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, person_name, attendance_date, check_in, check_out, status, notes")
        .in("student_id", ids)
        .gte("attendance_date", since)
        .order("attendance_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyReports(limit = 30) {
  const { ids, ready } = useChildIds();
  return useQuery({
    queryKey: ["parent", "reports", ids, limit],
    enabled: ready && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("id, student_id, report_date, meals, nap, mood, toilet, learning, notes, media_url")
        .in("student_id", ids)
        .order("report_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyInvoices() {
  const { ids, ready } = useChildIds();
  return useQuery({
    queryKey: ["parent", "invoices", ids],
    enabled: ready && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_no, student_id, student_name, issue_date, due_date, particulars, total_amount, paid_amount, status")
        .in("student_id", ids)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Admission + supplies orders the parent placed through the online wizard. */
export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["parent", "orders", user?.userId],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_orders")
        .select(
          "id, total_amount, admission_fee, items_total, tax_amount, other_charges, student_id, status, created_at, admission_order_items(id, name, kind, quantity, unit_price)",
        )
        .eq("parent_user_id", user!.userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Course plans the parent bought through Direct Apply, per child. */
export function useMyCoursePlans() {
  const orders = useMyOrders();
  const plans = (orders.data ?? []).flatMap((o) =>
    (o.admission_order_items ?? [])
      .filter((i) => i.kind === "course")
      .map((i) => ({
        id: i.id,
        name: i.name,
        amount: Number(i.unit_price),
        studentId: o.student_id as string | null,
        status: o.status as string,
        orderedOn: o.created_at as string,
      })),
  );
  return { plans, isLoading: orders.isLoading };
}

export function useMyGallery() {
  const { ids, ready } = useChildIds();
  return useQuery({
    queryKey: ["parent", "gallery", ids],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("id, title, caption, media_url, media_type, captured_on, student_id")
        .eq("is_published", true)
        .order("captured_on", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyPickups() {
  const { ids, ready } = useChildIds();
  return useQuery({
    queryKey: ["parent", "pickups", ids],
    enabled: ready && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pickup_authorizations")
        .select("id, student_id, student_name, person_name, relation, mobile, id_proof, is_active")
        .in("student_id", ids)
        .order("person_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["parent", "messages", user?.userId],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, body, created_at, sender_id, recipient_id, read_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["parent", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, event_type, event_date, end_date")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date")
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSupplies() {
  return useQuery({
    queryKey: ["parent", "supplies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplies")
        .select("id, name, kind, phase, class_name, price, stock, image_url, remarks")
        .order("kind")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function childNameMap(children: { id: string; full_name: string }[] | undefined) {
  return new Map((children ?? []).map((c) => [c.id, c.full_name]));
}

export const inr = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
