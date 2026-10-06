export function BranchBadge({ index }: { index: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary ring-1 ring-primary/20">
      Branch {index + 1}
    </span>
  );
}