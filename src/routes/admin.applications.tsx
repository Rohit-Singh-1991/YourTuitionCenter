import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { StaffGuard } from "@/components/admin/StaffGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, signAdmissionFile } from "@/lib/admission";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Online applications — Teach Nation Admin" },
      { name: "description", content: "Review parent admission applications and verify UPI payments." },
      { property: "og:title", content: "Online applications — Teach Nation Admin" },
      { property: "og:description", content: "Verify or reject admission payments submitted by parents." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <ApplicationsPage />
    </StaffGuard>
  ),
});

type Row = {
  id: string;
  student_name: string | null;
  class_applied: string | null;
  status: string;
  submitted_at: string | null;
  documents: Record<string, string> | null;
  admission_orders: {
    id: string;
    total_amount: number;
    utr: string | null;
    screenshot_url: string | null;
    status: string;
    rejection_reason: string | null;
  }[];
};

function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_applications")
        .select("id, student_name, class_applied, status, submitted_at, documents, admission_orders(id, total_amount, utr, screenshot_url, status, rejection_reason)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({
      row,
      approve,
    }: {
      row: Row;
      approve: boolean;
    }) => {
      const order = row.admission_orders[0];
      if (!order) throw new Error("No order for this application.");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("admission_orders")
        .update({
          status: approve ? "paid" : "rejected",
          rejection_reason: approve ? null : (reason[order.id] ?? "Payment could not be verified"),
          verified_by: userData.user?.id ?? null,
          verified_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      if (error) throw error;
      const { error: appErr } = await supabase
        .from("admission_applications")
        .update({ status: approve ? "paid" : "submitted" })
        .eq("id", row.id);
      if (appErr) throw appErr;
    },
    onSuccess: () => {
      toast.success("Payment status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function open(path: string) {
    try {
      window.open(await signAdmissionFile(path), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Online applications</h1>
        <p className="text-sm text-muted-foreground">
          Verify UPI payments manually. Nothing is marked paid automatically.
        </p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      )}
      {rows.map((row) => {
        const order = row.admission_orders[0];
        const docs = Object.entries(row.documents ?? {});
        return (
          <Card key={row.id} className="rounded-[1.5rem] p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-bold">{row.student_name ?? "Unnamed student"}</h2>
                <p className="text-xs text-muted-foreground">
                  {row.class_applied ?? "—"} ·{" "}
                  {row.submitted_at
                    ? new Date(row.submitted_at).toLocaleDateString()
                    : "draft, not submitted"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {order?.status ?? row.status}
              </span>
            </div>

            {docs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {docs.map(([key, path]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => void open(path)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs"
                  >
                    {key.replace(/_/g, " ")} <ExternalLink className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {order && (
              <div className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm">
                <p className="font-semibold">{formatINR(order.total_amount)}</p>
                <p className="text-muted-foreground">UTR: {order.utr ?? "not provided"}</p>
                {order.screenshot_url && (
                  <button
                    type="button"
                    onClick={() => void open(order.screenshot_url!)}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    View payment screenshot <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                {order.status === "pending_verification" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ row, approve: true })}
                    >
                      Verify &amp; mark paid
                    </Button>
                    <Input
                      className="h-9 w-56"
                      placeholder="Rejection reason"
                      value={reason[order.id] ?? ""}
                      onChange={(e) =>
                        setReason((p) => ({ ...p, [order.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ row, approve: false })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {order.status === "rejected" && order.rejection_reason && (
                  <p className="mt-2 text-xs text-destructive">{order.rejection_reason}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}