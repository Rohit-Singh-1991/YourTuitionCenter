import { Star, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_REVIEWS_URL, GOOGLE_WRITE_REVIEW_URL } from "@/lib/reviews";

export function GoogleReviewsBlock({ compact = false }: { compact?: boolean }) {
  const readUrl = GOOGLE_REVIEWS_URL;
  const writeUrl = GOOGLE_WRITE_REVIEW_URL || GOOGLE_REVIEWS_URL;

  return (
    <div
      className={`rounded-sm border border-border/70 bg-cream ${
        compact ? "p-5" : "p-7"
      } shadow-[var(--shadow-soft)]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold">
            <Star className="h-4 w-4 text-primary" aria-hidden /> Reviews on Google
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Parents can read our Google Business Profile or share their own experience.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {readUrl ? (
            <Button asChild size={compact ? "sm" : "default"} variant="outline" className="rounded-sm">
              <a href={readUrl} target="_blank" rel="noopener noreferrer">
                Read Reviews on Google
              </a>
            </Button>
          ) : (
            <Button size={compact ? "sm" : "default"} variant="outline" className="rounded-sm" disabled>
              Read Reviews on Google
            </Button>
          )}
          {writeUrl ? (
            <Button asChild size={compact ? "sm" : "default"} className="rounded-sm">
              <a href={writeUrl} target="_blank" rel="noopener noreferrer">
                <PenLine className="mr-2 h-4 w-4" aria-hidden /> Write a Review
              </a>
            </Button>
          ) : (
            <Button size={compact ? "sm" : "default"} className="rounded-sm" disabled>
              <PenLine className="mr-2 h-4 w-4" aria-hidden /> Write a Review
            </Button>
          )}
        </div>
      </div>
      {!readUrl && (
        <p className="mt-3 text-xs text-muted-foreground">
          Google review link will be added here soon.
        </p>
      )}
    </div>
  );
}
