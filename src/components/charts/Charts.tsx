import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type Point = { label: string; value: number };

const PALETTE = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
];

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 } as const;
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: "0.8rem",
};

function hasData(rows: Point[]) {
  return rows.length > 0 && rows.some((r) => r.value > 0);
}

export function BarChartCard({ rows, empty, height = 240 }: { rows: Point[]; empty: string; height?: number }) {
  if (!hasData(rows)) return <Empty text={empty} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axis} interval={0} angle={-20} textAnchor="end" height={54} />
        <YAxis tick={axis} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]} fill="var(--chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartCard({ rows, empty, height = 240 }: { rows: Point[]; empty: string; height?: number }) {
  if (!hasData(rows)) return <Empty text={empty} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="label" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
          {rows.map((r, i) => (
            <Cell key={r.label} fill={PALETTE[i % PALETTE.length]} stroke="var(--background)" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineChartCard({ rows, empty, height = 240, seriesName = "Value" }: { rows: Point[]; empty: string; height?: number; seriesName?: string }) {
  if (!hasData(rows)) return <Empty text={empty} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axis} />
        <YAxis tick={axis} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" name={seriesName} stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
