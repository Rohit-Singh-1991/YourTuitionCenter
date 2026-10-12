import { useState } from "react";
import { BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrochureModal } from "@/components/site/BrochureModal";
import { brochureFileName, brochurePdfUrl } from "@/lib/brochure";

export function BrochureButtons({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full px-3"
          onClick={() => setOpen(true)}
        >
          <BookOpen className="h-4 w-4 sm:mr-1.5" />
          <span className={compact ? "hidden sm:inline" : ""}>Preview Brochure</span>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full px-3">
          <a href={brochurePdfUrl} download={brochureFileName}>
            <Download className="h-4 w-4 sm:mr-1.5" />
            <span className={compact ? "hidden sm:inline" : ""}>Download Brochure</span>
          </a>
        </Button>
      </div>
      <BrochureModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}