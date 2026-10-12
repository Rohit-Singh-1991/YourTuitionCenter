import { Menu, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import logo from "@/assets/teach-nation-logo.png";

/** Shows the app icon; on hover/focus it morphs into a hamburger that opens the side nav. */
export function MenuToggle({ className }: { className?: string }) {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isOpen ? "Collapse menu" : "Open menu"}
      aria-expanded={isOpen}
      className={cn(
        "press group relative grid size-11 shrink-0 place-items-center rounded-full border border-border/70 bg-card",
        "shadow-[0_10px_24px_-12px_color-mix(in_oklab,var(--primary)_75%,transparent)]",
        "transition-all duration-300 hover:border-primary/50 hover:shadow-[0_14px_30px_-10px_color-mix(in_oklab,var(--primary)_85%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <img
        src={logo}
        alt=""
        aria-hidden
        width={512}
        height={512}
        className={cn(
          "absolute size-7 object-contain transition-all duration-300",
          isOpen
            ? "scale-50 opacity-0"
            : "scale-100 opacity-100 group-hover:scale-50 group-hover:opacity-0 group-focus-visible:scale-50 group-focus-visible:opacity-0",
        )}
      />
      <Menu
        className={cn(
          "absolute size-[1.15rem] text-primary transition-all duration-300",
          isOpen
            ? "scale-50 rotate-90 opacity-0"
            : "scale-50 rotate-90 opacity-0 group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:rotate-0 group-focus-visible:opacity-100",
        )}
      />
      <X
        className={cn(
          "absolute size-[1.15rem] text-primary transition-all duration-300",
          isOpen ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
