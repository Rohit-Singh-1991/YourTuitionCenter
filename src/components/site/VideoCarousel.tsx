import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, Trash2, Plus, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePublishedVideos, toEmbedUrl } from "@/lib/site-videos";
import { Reveal } from "@/components/site/Reveal";

/** Public, admin-managed video carousel. Admins additionally get delete / add controls. */
export function VideoCarousel() {
  const { data: videos = [] } = usePublishedVideos();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play the active clip once the section scrolls into view.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [videos.length, index]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setIndex(0);
      toast.success("Video removed");
      void queryClient.invalidateQueries({ queryKey: ["site-videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (videos.length === 0) {
    if (!isAdmin) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Card className="grid place-items-center gap-4 rounded-[2rem] border-2 border-dashed border-border bg-cream p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sunny/70">
            <Video className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold">No videos yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a video to bring the Life at Teach Nation carousel back.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/admin/videos">
              <Plus className="mr-1.5 h-4 w-4" /> Add video
            </Link>
          </Button>
        </Card>
      </section>
    );
  }

  const active = videos[Math.min(index, videos.length - 1)]!;
  const embed = toEmbedUrl(active.video_url);
  const go = (step: number) => setIndex((i) => (i + step + videos.length) % videos.length);

  return (
    <Reveal as="section" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Our little moments
          </span>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Life at Teach Nation</h2>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild size="sm" variant="outline" className="rounded-full bg-card">
              <Link to="/admin/videos">
                <Plus className="mr-1.5 h-4 w-4" /> Add video
              </Link>
            </Button>
          )}
        {videos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous video"
              onClick={() => go(-1)}
              className="icon-btn icon-nudge-left grid h-10 w-10 place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-soft)] hover:border-primary/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next video"
              onClick={() => go(1)}
              className="icon-btn icon-nudge-right grid h-10 w-10 place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-soft)] hover:border-primary/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        </div>
      </div>

      <Card className="relative mt-5 overflow-hidden rounded-[2rem] p-0 shadow-[var(--shadow-play)]">
        {isAdmin && (
          <button
            type="button"
            aria-label={`Delete ${active.title}`}
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Delete "${active.title}" from the home carousel?`)) {
                remove.mutate(active.id);
              }
            }}
            className="press sheen absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
        <div key={active.id} className="aspect-video w-full animate-[ds-pop_0.35s_ease-out] bg-muted">
          {embed.kind === "iframe" ? (
            <iframe
              key={active.id}
              src={embed.src}
              title={active.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <video
              key={active.id}
              ref={videoRef}
              src={embed.src}
              poster={active.thumbnail_url ?? undefined}
              controls
              playsInline
              muted
              preload="metadata"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold">{active.title}</h3>
          {active.description && (
            <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
          )}
        </div>
      </Card>

      {videos.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {videos.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Play ${v.title}`}
              aria-current={i === index}
              className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl border-2 bg-muted transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] [&_img]:transition-transform [&_img]:duration-500 hover:[&_img]:scale-110 ${
                i === index ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {v.thumbnail_url ? (
                <img
                  src={v.thumbnail_url}
                  alt={v.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-muted-foreground">
                  <PlayCircle className="h-6 w-6" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </Reveal>
  );
}