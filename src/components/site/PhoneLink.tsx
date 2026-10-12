type Props = { number: string | null | undefined; className?: string; children?: React.ReactNode };

/** Formats an Indian number as a tap-to-call tel: link (opens the dial pad on mobile). */
export function telHref(number: string | null | undefined) {
  const digits = String(number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return `tel:+91${national}`;
}

export function PhoneLink({ number, className, children }: Props) {
  const href = telHref(number);
  if (!href) return <span className={className}>—</span>;
  return (
    <a href={href} className={className ?? "font-semibold text-primary"}>
      {children ?? `+91 ${String(number).replace(/\D/g, "").slice(-10)}`}
    </a>
  );
}
