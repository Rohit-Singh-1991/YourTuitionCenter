import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { brochurePages } from "@/lib/brochure";

export function BrochureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const total = brochurePages.length;

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prev, next]);

  if (!open || total === 0) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Teach Nation Coaching Institute brochure"
      className="fixed inset-0 z-[100] flex flex-col bg-foreground/90 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 text-background">
        <span className="text-sm font-semibold">
          Brochure — page {index + 1} of {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close brochure"
          className="grid h-10 w-10 place-items-center rounded-full bg-background/15 hover:bg-background/25"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-16">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous page"
          className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-soft)] hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <img
          src={brochurePages[index]}
          alt={`Teach Nation Coaching Institute brochure page ${index + 1}`}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[var(--shadow-soft)]"
        />
        <button
          type="button"
          onClick={next}
          aria-label="Next page"
          className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-soft)] hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return typeof document === "undefined" ? content : createPortal(content, document.body);
}