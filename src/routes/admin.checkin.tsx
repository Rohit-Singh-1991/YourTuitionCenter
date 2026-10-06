import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { StaffGuard } from "@/components/admin/StaffGuard";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/data";

export const Route = createFileRoute("/admin/checkin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Check in / out — Teach Nation Admin" },
      { name: "description", content: "PIN based check-in and check-out for children and staff at Teach Nation." },
      { property: "og:title", content: "Check in / out — Teach Nation Admin" },
      { property: "og:description", content: "Record arrivals and departures in seconds using a secure PIN." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <CheckInPage />
    </StaffGuard>
  ),
});

type LogLine = { name: string; action: string; time: string };

function CheckInPage() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = pin.trim();
    if (code.length < 4) {
      toast.error("Enter the 4-6 digit PIN");
      return;
    }
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toTimeString().slice(0, 8);

      const { data: student } = await supabase
        .from("students")
        .select("id, full_name, branch_id")
        .eq("pin_code", code)
        .maybeSingle();
      const { data: teacher } = student
        ? { data: null }
        : await supabase
            .from("teachers")
            .select("id, full_name, branch_id")
            .eq("pin_code", code)
            .maybeSingle();

      const person = student ?? teacher;
      if (!person) throw new Error("No student or faculty member found for this PIN");
      const isStudent = Boolean(student);

      const { data: existing } = await supabase
        .from("attendance")
        .select("id, check_in, check_out")
        .eq("attendance_date", today)
        .eq(isStudent ? "student_id" : "teacher_id", person.id)
        .maybeSingle();

      let action = "checked in";
      if (existing && !existing.check_out) {
        const { error } = await supabase
          .from("attendance")
          .update({ check_out: now })
          .eq("id", existing.id);
        if (error) throw error;
        action = "checked out";
      } else if (!existing) {
        const { error } = await supabase.from("attendance").insert({
          person_type: isStudent ? "student" : "staff",
          person_name: person.full_name,
          branch_id: person.branch_id,
          attendance_date: today,
          check_in: now,
          status: "present",
          method: "pin",
          ...(isStudent ? { student_id: person.id } : { teacher_id: person.id }),
        });
        if (error) throw error;
      } else {
        throw new Error(`${person.full_name} already checked out today`);
      }

      await logAudit(action.replace(" ", "_"), "attendance", person.id);
      setLog((l) => [{ name: person.full_name, action, time: now }, ...l].slice(0, 12));
      toast.success(`${person.full_name} ${action}`);
      setPin("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Check in / out</h1>
        <p className="text-sm text-muted-foreground">
          Enter a student or faculty PIN. The first scan of the day checks in, the next checks out.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 4821"
                className="h-14 text-center text-2xl tracking-[0.4em]"
              />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
              <ScanLine className="mr-2 h-5 w-5" />
              {busy ? "Recording…" : "Record attendance"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded in this session yet.</p>
          ) : (
            <ul className="space-y-2">
              {log.map((l, i) => (
                <li key={`${l.name}-${i}`} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-muted-foreground">
                    {l.action} · {l.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
