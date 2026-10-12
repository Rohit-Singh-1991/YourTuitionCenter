import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useBranches } from "@/lib/data";
import { uploadAdmissionFile, type AdmissionApplication } from "@/lib/admission";
import { uploadGuestFile } from "@/lib/guest-admission";
import { guestSaveApplication } from "@/lib/guest-admission.functions";
import { DECLARATIONS, DOC_SLOTS, FORM_PAGES, type Field } from "./form-schema";

type Values = Record<string, string | boolean>;

export function AdmissionForm({
  application,
  onSubmitted,
  guestToken,
}: {
  application: AdmissionApplication | null;
  onSubmitted: (id: string) => void;
  guestToken?: string | null;
}) {
  const { user } = useAuth();
  const { data: branches = [] } = useBranches();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const [values, setValues] = useState<Values>(() => {
    const saved = (application?.form ?? {}) as Values;
    return {
      father_mobile: user?.profile?.mobile ?? "",
      father_email: user?.profile?.email ?? "",
      residential_address: user?.profile?.address ?? "",
      ...saved,
    };
  });
  const [branchId, setBranchId] = useState(
    application?.branch_id ?? user?.profile?.branch_id ?? "",
  );
  const [docs, setDocs] = useState<Record<string, string>>(application?.documents ?? {});
  const [uploading, setUploading] = useState<string | null>(null);

  const totalPages = FORM_PAGES.length + 2; // + documents + declaration
  const set = (name: string, v: string | boolean) => setValues((p) => ({ ...p, [name]: v }));

  const payload = useMemo(
    () => ({
      branch_id: branchId || null,
      student_name: (values["student_name"] as string) || null,
      class_applied: (values["class_applied"] as string) || null,
      form: values as never,
      documents: docs as never,
    }),
    [branchId, values, docs],
  );

  const persist = useMutation({
    mutationFn: async (submit: boolean) => {
      if (guestToken) {
        const res = await guestSaveApplication({
          data: {
            token: guestToken,
            branch_id: payload.branch_id,
            student_name: payload.student_name,
            class_applied: payload.class_applied,
            form: values as Record<string, unknown>,
            documents: docs as Record<string, unknown>,
            submit,
          },
        });
        return res.id;
      }
      const row = {
        ...payload,
        // Required by row-level security: an application must be owned by the
        // signed-in parent, otherwise the insert is rejected.
        parent_user_id: user?.userId ?? null,
        ...(submit ? { status: "submitted", submitted_at: new Date().toISOString() } : {}),
      };
      if (application) {
        const { error } = await supabase
          .from("admission_applications")
          .update(row)
          .eq("id", application.id);
        if (error) throw error;
        return application.id;
      }
      const { data, error } = await supabase
        .from("admission_applications")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id, submit) => {
      void queryClient.invalidateQueries({ queryKey: ["my-admission-application"] });
      void queryClient.invalidateQueries({ queryKey: ["guest-admission"] });
      if (submit) onSubmitted(id);
      else toast.success("Draft saved. You can continue later.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function validatePage(index: number) {
    const p = FORM_PAGES[index];
    if (p) {
      if (p.id === "student" && !branchId) return "Please choose a branch.";
      for (const f of p.fields) {
        if (f.required && !String(values[f.name] ?? "").trim()) return `${f.label} is required.`;
        if (f.type === "tel") {
          const digits = String(values[f.name] ?? "").replace(/\D/g, "");
          if (digits && !/^[6-9]\d{9}$/.test(digits))
            return `${f.label} must be a valid 10-digit Indian mobile number.`;
        }
      }
      return null;
    }
    if (index === FORM_PAGES.length) {
      for (const d of DOC_SLOTS) {
        if (d.required && !docs[d.key]) return `${d.label} is required.`;
      }
      return null;
    }
    for (const d of DECLARATIONS) {
      if (!values[d.key]) return "Please accept all declarations to continue.";
    }
    return null;
  }

  function next() {
    const err = validatePage(page);
    if (err) {
      toast.error(err);
      return;
    }
    setPage((p) => Math.min(p + 1, totalPages - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    for (let i = 0; i < totalPages; i++) {
      const err = validatePage(i);
      if (err) {
        setPage(i);
        toast.error(err);
        return;
      }
    }
    persist.mutate(true);
  }

  async function pickFile(key: string, file: File) {
    const limit = guestToken ? 4 : 8;
    if (file.size > limit * 1024 * 1024) {
      toast.error(`Please upload a file under ${limit} MB.`);
      return;
    }
    setUploading(key);
    try {
      const path = guestToken
        ? await uploadGuestFile(file, "documents", guestToken)
        : await uploadAdmissionFile(file, "documents");
      setDocs((p) => ({ ...p, [key]: path }));
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  const current = FORM_PAGES[page];
  const title =
    current?.title ?? (page === FORM_PAGES.length ? "Documents" : "Declaration");

  return (
    <Card className="rounded-[2rem] p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Page {page + 1} of {totalPages}
          </p>
          <h2 className="truncate text-xl font-bold">{title}</h2>
          {current?.hint && (
            <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${i <= page ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {current?.id === "student" && (
          <div className="sm:col-span-2">
            <Label htmlFor="branch">Branch *</Label>
            <select
              id="branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {current?.fields.map((f) => (
          <FieldInput key={f.name} field={f} value={values[f.name]} onChange={set} />
        ))}

        {page === FORM_PAGES.length &&
          DOC_SLOTS.map((d) => (
            <div key={d.key} className="rounded-2xl border border-border bg-cream/60 p-4">
              <p className="text-sm font-semibold">
                {d.label} {d.required && <span className="text-destructive">*</span>}
              </p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-primary">
                <Paperclip className="h-4 w-4" />
                {uploading === d.key ? "Uploading…" : docs[d.key] ? "Replace file" : "Choose file"}
                <input
                  type="file"
                  accept={d.accept}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void pickFile(d.key, file);
                  }}
                />
              </label>
              {docs[d.key] && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" /> Uploaded securely
                </p>
              )}
            </div>
          ))}

        {page === totalPages - 1 && (
          <div className="space-y-3 sm:col-span-2">
            {DECLARATIONS.map((d) => (
              <label key={d.key} className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={Boolean(values[d.key])}
                  onCheckedChange={(c) => set(d.key, c === true)}
                />
                <span>{d.label}</span>
              </label>
            ))}
            <div>
              <Label htmlFor="signed_by">Signature (type your full name) *</Label>
              <Input
                id="signed_by"
                value={(values["signed_by"] as string) ?? ""}
                onChange={(e) => set("signed_by", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          disabled={persist.isPending}
          onClick={() => persist.mutate(false)}
        >
          Save draft
        </Button>
        {page < totalPages - 1 ? (
          <Button type="button" className="rounded-full" onClick={next}>
            Next
          </Button>
        ) : (
          <Button type="button" className="rounded-full" disabled={persist.isPending} onClick={finish}>
            {persist.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Continue to courses &amp; plans
          </Button>
        )}
      </div>
    </Card>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | boolean | undefined;
  onChange: (name: string, v: string | boolean) => void;
}) {
  const v = typeof value === "boolean" ? "" : (value ?? "");
  const label = (
    <Label htmlFor={field.name}>
      {field.label} {field.required && <span className="text-destructive">*</span>}
    </Label>
  );

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        {label}
        <Textarea
          id={field.name}
          maxLength={field.maxLength}
          value={v}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {field.options?.map((o) => (
            <label
              key={o}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${
                v === o ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={field.name}
                checked={v === o}
                onChange={() => onChange(field.name, o)}
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          id={field.name}
          value={v}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      {label}
      <Input
        id={field.name}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type}
        inputMode={field.type === "tel" || field.type === "number" ? "numeric" : undefined}
        maxLength={field.type === "tel" ? 10 : field.maxLength}
        placeholder={field.type === "tel" ? "10-digit mobile number" : field.placeholder}
        value={v}
        onChange={(e) =>
          onChange(
            field.name,
            field.type === "tel" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value,
          )
        }
      />
    </div>
  );
}