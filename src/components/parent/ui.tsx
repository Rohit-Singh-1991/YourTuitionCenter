import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function ListCard({
  title,
  empty,
  loading,
  rows,
  children,
}: {
  title?: string;
  empty: string;
  loading?: boolean;
  rows: unknown[] | undefined;
  children: ReactNode;
}) {
  return (
    <section>
      {title && <h2 className="mb-2 font-bold">{title}</h2>}
      <Card className="divide-y divide-border rounded-3xl p-0">
        {loading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : !rows || rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{empty}</p>
        ) : (
          children
        )}
      </Card>
    </section>
  );
}

export function Row({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: ReactNode; tone: string }) {
  return (
    <Card className={`rounded-3xl p-5 ${tone}`}>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </Card>
  );
}
