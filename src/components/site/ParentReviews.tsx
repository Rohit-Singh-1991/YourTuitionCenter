import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/site/Reveal";
import { GoogleReviewsBlock } from "@/components/site/GoogleReviewsBlock";
import { PARENT_TESTIMONIALS } from "@/lib/reviews";

export function ParentReviews() {
  const reviews = PARENT_TESTIMONIALS;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="parent-reviews">
      <Reveal>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Parent reviews
        </span>
        <h2 id="parent-reviews" className="mt-1 text-2xl font-bold sm:text-3xl">
          What parents say
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Experiences shared by Teach Nation families across our two Palam, Delhi campuses.
        </p>
      </Reveal>

      {reviews.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal as="li" key={`${r.author}-${i}`} delay={(i % 3) * 90} className="h-full">
              <Card className="card-lift flex h-full flex-col gap-4 rounded-sm border-t-4 border-t-primary bg-cream p-6 hover:bg-card">
                <Quote className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  {r.quote}
                </blockquote>
                <figcaption className="mt-auto text-sm">
                  <span className="font-bold">{r.author}</span>
                  <span className="block text-xs text-muted-foreground">
                    Parent · {r.group}
                    {r.date ? ` · ${r.date}` : ""}
                  </span>
                </figcaption>
              </Card>
            </Reveal>
          ))}
        </ul>
      ) : (
        <Reveal>
          <Card className="mt-6 rounded-sm border-l-4 border-l-primary bg-cream p-6 text-sm text-muted-foreground">
            We are collecting reviews from our parent community. If your child studies with us, we
            would love to hear about your experience on Google.
          </Card>
        </Reveal>
      )}

      <Reveal delay={120}>
        <div className="mt-6">
          <GoogleReviewsBlock />
        </div>
      </Reveal>
    </section>
  );
}
