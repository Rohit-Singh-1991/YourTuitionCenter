import { Gamepad2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function KidGamesButton({ className, full }: { className?: string; full?: boolean }) {
  return (
    <a
      href="/kid-games"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buy Kids Games"
      className={cn(
        "sparkle-btn group relative inline-flex shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-3 py-2 text-sm font-bold text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.7)] sm:px-4",
        full && "w-full py-3 text-base",
        className,
      )}
    >
      <span aria-hidden className="sparkle-btn__wave" />
      <Gamepad2 className="relative h-4 w-4 shrink-0" />
      <span className="relative hidden whitespace-nowrap sm:inline">Buy Kids Games</span>
      <span className={cn("relative whitespace-nowrap sm:hidden", full && "inline")}>{full ? "Buy Kids Games" : "Games"}</span>
      <Sparkles aria-hidden className="relative hidden h-3.5 w-3.5 animate-pulse sm:inline" />
    </a>
  );
}
