import { useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Download, Printer, Pencil, Trash2, ArrowUpDown, ImageIcon, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { telHref } from "@/components/site/PhoneLink";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBranches } from "@/lib/data";
import { downloadCsv, logAudit, toCsv, uploadMedia } from "@/lib/data";
import { useAuth } from "@/lib/auth";

const db = supabase as unknown as SupabaseClient;

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "branch"
  | "ref"
  | "media"
  | "image"
  | "checkbox";

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  hideInTable?: boolean;
  help?: string;
  /** For type "ref": the table to look up. */
  refTable?: string;
  /** For type "ref": the column shown as the option label (default "name"). */
  refLabel?: string;
};

export type CrudConfig = {
  table: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  orderBy?: string;
  branchScoped?: boolean;
  searchFields?: string[];
  /** Explicit column list for list reads (used when some columns are privilege-restricted). */
  selectColumns?: string;
  /** Optional RPC returning rows keyed by id whose extra columns are merged into the list. */
  mergeRpc?: string;
};

type Row = Record<string, unknown>;

export function CrudPage(config: CrudConfig) {
  const {
    table,
    title,
    description,
    fields,
    orderBy = "created_at",
    branchScoped = true,
    searchFields,
    selectColumns,
    mergeRpc,
  } = config;
  const queryClient = useQueryClient();
  const { data: branches = [] } = useBranches();
  const { isAdmin, user } = useAuth();
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>(orderBy);
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Row>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const branchName = (id: unknown) => branches.find((b) => b.id === id)?.name ?? "—";

  const refTables = useMemo(
    () =>
      [...new Set(fields.filter((f) => f.type === "ref" && f.refTable).map((f) => f.refTable!))].sort(),
    [fields],
  );

  const refQuery = useQuery({
    queryKey: ["crud-refs", refTables],
    enabled: refTables.length > 0,
    queryFn: async () => {
      const out: Record<string, { id: string; label: string }[]> = {};
      for (const t of refTables) {
        const labelCol = fields.find((f) => f.refTable === t)?.refLabel ?? "name";
        const { data } = await db.from(t).select(`id, ${labelCol}`).limit(2000);
        out[t] = ((data ?? []) as unknown as Row[]).map((r) => ({
          id: String(r["id"]),
          label: String(r[labelCol] ?? r["id"]),
        }));
      }
      return out;
    },
  });
  const refOptions = refQuery.data ?? {};
  const refName = (field: FieldDef, id: unknown) =>
    refOptions[field.refTable ?? ""]?.find((o) => o.id === id)?.label ?? "—";

  const listQuery = useQuery({
    queryKey: [table, "list"],
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select(selectColumns ?? "*")
        .order(orderBy, { ascending: true });
      if (error) throw error;
      let list = (data ?? []) as unknown as Row[];
      if (mergeRpc) {
        const { data: extra } = await db.rpc(mergeRpc);
        const byId = new Map(
          ((extra ?? []) as Row[]).map((r) => [String(r["id"]), r] as const),
        );
        list = list.map((r) => ({ ...r, ...(byId.get(String(r["id"])) ?? {}) }));
      }
      return list;
    },
  });

  const rows = useMemo(() => {
    let list = listQuery.data ?? [];
    if (branchScoped && branchFilter !== "all") {
      list = list.filter((r) => r["branch_id"] === branchFilter);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      const keys = searchFields ?? fields.map((f) => f.name);
      list = list.filter((r) =>
        keys.some((k) => String(r[k] ?? "").toLowerCase().includes(term)),
      );
    }
    return [...list].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [listQuery.data, branchFilter, search, sortKey, sortAsc, branchScoped, fields, searchFields]);

  const tableFields = fields.filter((f) => !f.hideInTable);

  function openCreate() {
    const initial: Row = {};
    for (const f of fields) {
      if (f.type === "branch") initial[f.name] = user?.profile?.branch_id ?? branches[0]?.id ?? "";
      else if (f.type === "checkbox") initial[f.name] = true;
      else initial[f.name] = "";
    }
    setForm(initial);
    setEditing(null);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(row: Row) {
    const initial: Row = {};
    for (const f of fields) initial[f.name] = row[f.name] ?? "";
    setForm(initial);
    setEditing(row);
    setErrors({});
    setFormOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: Row) => {
      if (editing) {
        const { error } = await db.from(table).update(payload).eq("id", editing["id"] as string);
        if (error) throw error;
        await logAudit("update", table, String(editing["id"]), payload);
      } else {
        const { error } = await db.from(table).insert(payload);
        if (error) throw error;
        await logAudit("create", table, undefined, payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Record updated" : "Record added");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
      await logAudit("delete", table, id);
    },
    onSuccess: () => {
      toast.success("Record deleted");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    const nextErrors: Record<string, string> = {};
    const payload: Row = {};
    for (const f of fields) {
      const value = form[f.name];
      const empty = value === "" || value === null || value === undefined;
      if (f.required && empty) {
        nextErrors[f.name] = `${f.label} is required`;
        continue;
      }
      if (f.type === "email" && !empty && !/^\S+@\S+\.\S+$/.test(String(value))) {
        nextErrors[f.name] = "Enter a valid email";
        continue;
      }
      if (f.type === "tel" && !empty && String(value).replace(/\D/g, "").length < 10) {
        nextErrors[f.name] = "Enter a valid 10-digit mobile number";
        continue;
      }
      if (empty) payload[f.name] = f.type === "number" ? 0 : null;
      else if (f.type === "number") payload[f.name] = Number(value);
      else payload[f.name] = value;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    saveMutation.mutate(payload);
  }

  async function handleUpload(fieldName: string, file: File) {
    try {
      setUploading(fieldName);
      const url = await uploadMedia(file, table, (form as Record<string, unknown>)["branch_id"] as string | undefined);
      setForm((f) => ({ ...f, [fieldName]: url }));
      toast.success("File uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  function exportCsv() {
    const columns = tableFields.map((f) => ({ key: f.name, label: f.label }));
    downloadCsv(`${table}.csv`, toCsv(rows, columns));
  }

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button onClick={openCreate} className="shrink-0 rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </header>

      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          {branchScoped && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                {tableFields.map((f) => (
                  <th key={f.name} className="px-3 py-2 font-semibold">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => {
                        setSortKey(f.name);
                        setSortAsc(sortKey === f.name ? !sortAsc : true);
                      }}
                    >
                      {f.label}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading && (
                <tr>
                  <td colSpan={tableFields.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={tableFields.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                    No records yet.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={String(row["id"])} className="border-t border-border/70">
                  {tableFields.map((f) => (
                    <td key={f.name} className="px-3 py-2 align-top">
                      {f.type === "image" ? (
                        <ImageCell
                          value={row[f.name]}
                          onUpload={async (file: File) => {
                            const url = await uploadMedia(file, table, row["branch_id"] as string | undefined);
                            const { error } = await db
                              .from(table)
                              .update({ [f.name]: url })
                              .eq("id", row["id"] as string);
                            if (error) throw error;
                            await logAudit("update", table, String(row["id"]), { [f.name]: url });
                            queryClient.invalidateQueries({ queryKey: [table] });
                          }}
                        />
                      ) : (
                        renderCell(row[f.name], f, branchName, refName)
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right print:hidden">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {(isAdmin || true) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(String(row["id"]))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">{rows.length} record(s)</p>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
            <DialogDescription>Fields marked with * are mandatory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label htmlFor={f.name}>
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="mt-1">
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.name}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={f.name}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "branch" ? (
                    <select
                      id={f.name}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select branch…</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "ref" ? (
                    <select
                      id={f.name}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {(refOptions[f.refTable ?? ""] ?? []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input
                      id={f.name}
                      type="checkbox"
                      checked={Boolean(form[f.name])}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                      className="h-5 w-5 rounded border-input"
                    />
                  ) : f.type === "media" || f.type === "image" ? (
                    <div className="space-y-2">
                      <Input
                        id={f.name}
                        value={String(form[f.name] ?? "")}
                        placeholder="Paste a URL or upload"
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                      <Input
                        type="file"
                        accept={f.type === "image" ? "image/*" : "image/*,video/*"}
                        disabled={uploading === f.name}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(f.name, file);
                        }}
                      />
                    </div>
                  ) : (
                    <Input
                      id={f.name}
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    />
                  )}
                </div>
                {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
                {errors[f.name] && (
                  <p className="mt-1 text-xs text-destructive">{errors[f.name]}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function renderCell(
  value: unknown,
  field: FieldDef,
  branchName: (id: unknown) => string,
  refName: (field: FieldDef, id: unknown) => string,
) {
  if (field.type === "image") return null;
  if (field.type === "branch") return <Badge variant="secondary">{branchName(value)}</Badge>;
  if (field.type === "ref")
    return value ? <Badge variant="secondary">{refName(field, value)}</Badge> : <span className="text-muted-foreground">—</span>;
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "media" && value)
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2"
      >
        View
      </a>
    );
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (field.type === "tel") {
    const href = telHref(String(value));
    if (href)
      return (
        <a href={href} className="font-semibold text-primary underline-offset-2 hover:underline">
          {String(value)}
        </a>
      );
  }
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

function ImageCell({
  value,
  onUpload,
}: {
  value: unknown;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const url = typeof value === "string" && value ? value : null;

  return (
    <div className="flex items-center gap-2">
      {url ? (
        <img src={url} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-border bg-muted/40">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            setBusy(true);
            await onUpload(file);
            toast.success("Image uploaded");
          } catch (err) {
            toast.error((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {url ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Eye className="mr-1 h-3.5 w-3.5" /> Preview
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload"}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Photo preview</DialogTitle>
            <DialogDescription>Uploaded image</DialogDescription>
          </DialogHeader>
          {url && <img src={url} alt="Preview" className="w-full rounded-md" />}
          <DialogFooter>
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}