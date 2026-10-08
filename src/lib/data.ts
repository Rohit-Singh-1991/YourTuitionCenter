import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Branch = { id: string; name: string; code: string };

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async (): Promise<Branch[]> => {
      const { data, error } = await supabase.rpc("public_branches");
      if (error) throw error;
      return ((data ?? []) as { id: string; name: string; code: string }[]).map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

export function useSiteContent() {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").order("sort_order");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return { rows: data ?? [], map };
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUploadBranch(branchId?: string | null) {
  if (branchId && UUID_RE.test(branchId)) return branchId;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return "shared";
  const { data } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", userData.user.id)
    .maybeSingle();
  return data?.branch_id ?? "shared";
}

export async function uploadMedia(file: File, folder: string, branchId?: string | null) {
  const branch = await resolveUploadBranch(branchId);
  const path = `${branch}/${folder}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signErr) throw signErr;
  return data.signedUrl;
}

export async function logAudit(action: string, entity: string, entityId?: string, details?: unknown) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    details: (details ?? null) as never,
  });
}

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]) {
  const head = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}