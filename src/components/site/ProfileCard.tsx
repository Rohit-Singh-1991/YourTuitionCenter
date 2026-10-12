import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

/** Shared profile summary shown on the staff dashboard and the parent portal. */
export function ProfileCard({ title = "My details" }: { title?: string }) {
  const { user } = useAuth();
  const p = user?.profile;
  const rows = [
    { label: "Full name", value: p?.full_name },
    { label: "Email", value: p?.email },
    { label: "Phone number", value: p?.mobile },
    { label: "Address", value: p?.address },
    { label: "Designation / profession", value: p?.designation },
    { label: "Role", value: user?.roles.join(", ") },
  ];
  return (
    <Card className="rounded-3xl p-6">
      <div className="flex items-center gap-4">
        {p?.avatar_url ? (
          <img
            src={p.avatar_url}
            alt={p.full_name ? `${p.full_name} profile photo` : "Profile photo"}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
            {(p?.full_name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="font-semibold break-words">{r.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}