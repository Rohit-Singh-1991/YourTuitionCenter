import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBranches } from "@/lib/data";

type Form = {
  parent_name: string;
  mobile: string;
  email: string;
  child_name: string;
  class_interest: string;
  branch_id: string;
  notes: string;
};

const EMPTY: Form = {
  parent_name: "",
  mobile: "",
  email: "",
  child_name: "",
  class_interest: "",
  branch_id: "",
  notes: "",
};

export function EnquiryDialog({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const { data: branches = [] } = useBranches();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);


  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.parent_name.trim()) e.parent_name = "Please enter the parent's name.";
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\D/g, "").slice(-10)))
      e.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address.";
    if (!form.child_name.trim()) e.child_name = "Please enter your child's name.";
    if (!form.class_interest.trim()) e.class_interest = "Please enter age or class of interest.";
    if (!form.branch_id) e.branch_id = "Please choose a branch.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase.from("inquiries").insert({
      parent_name: form.parent_name.trim(),
      mobile: form.mobile.replace(/\D/g, "").slice(-10),
      email: form.email.trim() || null,
      child_name: form.child_name.trim(),
      class_interest: form.class_interest.trim(),
      branch_id: form.branch_id,
      notes: form.notes.trim() || null,
      source: "website_enquiry",
      status: "new",
    });
    setSaving(false);
    if (error) {
      toast.error("Could not send your enquiry. Please try again or call the campus.");
      return;
    }
    toast.success("Enquiry sent! The campus team will call you back shortly.");
    setForm(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} className={className}>
          <MessageSquarePlus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Generate enquiry</span>
        </Button>
      </DialogTrigger>


      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate enquiry</DialogTitle>
          <DialogDescription>
            Tell us about your child and we&rsquo;ll get back to you from your preferred campus.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <Field label="Parent name" error={errors.parent_name} htmlFor="enq-parent">
            <Input
              id="enq-parent"
              value={form.parent_name}
              onChange={(e) => set("parent_name", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.mobile} htmlFor="enq-mobile">
              <Input
                id="enq-mobile"
                inputMode="tel"
                placeholder="10-digit mobile"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
              />
            </Field>
            <Field label="Email (optional)" error={errors.email} htmlFor="enq-email">
              <Input
                id="enq-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Child name" error={errors.child_name} htmlFor="enq-child">
              <Input
                id="enq-child"
                value={form.child_name}
                onChange={(e) => set("child_name", e.target.value)}
              />
            </Field>
            <Field label="Age / class" error={errors.class_interest} htmlFor="enq-class">
              <Input
                id="enq-class"
                placeholder="e.g. Class 11 Commerce"
                value={form.class_interest}
                onChange={(e) => set("class_interest", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Preferred branch" error={errors.branch_id} htmlFor="enq-branch">
            <select
              id="enq-branch"
              value={form.branch_id}
              onChange={(e) => set("branch_id", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a campus</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message / question (optional)" htmlFor="enq-notes">
            <Textarea
              id="enq-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Sending…" : "Send enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
