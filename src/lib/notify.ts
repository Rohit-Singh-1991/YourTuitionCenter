import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type FeedItem = {
  id: string;
  kind: "notification" | "announcement" | "message";
  title: string;
  body: string;
  at: string;
};

const SEEN_KEY = "teachnation.notifications.lastSeen";

function readSeen(userId: string | undefined) {
  if (typeof window === "undefined" || !userId) return 0;
  return Number(window.localStorage.getItem(`${SEEN_KEY}.${userId}`) ?? 0);
}

/** Combined in-app feed: staff notifications, announcements and direct messages. */
export function useNotificationFeed() {
  const { user } = useAuth();
  const userId = user?.userId;

  const query = useQuery({
    queryKey: ["notification-feed", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<FeedItem[]> => {
      const [notifications, announcements, messages] = await Promise.all([
        supabase
          .from("notifications")
          .select("id, title, body, sent_at")
          .order("sent_at", { ascending: false })
          .limit(20),
        supabase
          .from("announcements")
          .select("id, message, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("messages")
          .select("id, subject, body, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const items: FeedItem[] = [
        ...(notifications.data ?? []).map((n) => ({
          id: `n-${n.id}`,
          kind: "notification" as const,
          title: n.title,
          body: n.body,
          at: n.sent_at,
        })),
        ...(announcements.data ?? []).map((a) => ({
          id: `a-${a.id}`,
          kind: "announcement" as const,
          title: "Announcement",
          body: a.message,
          at: a.created_at,
        })),
        ...(messages.data ?? []).map((m) => ({
          id: `m-${m.id}`,
          kind: "message" as const,
          title: m.subject ?? "Message",
          body: m.body,
          at: m.created_at,
        })),
      ];
      return items.sort((x, y) => +new Date(y.at) - +new Date(x.at)).slice(0, 25);
    },
  });

  const [lastSeen, setLastSeen] = useState(0);
  useEffect(() => setLastSeen(readSeen(userId)), [userId]);

  const items = useMemo(() => query.data ?? [], [query.data]);
  const unread = items.filter((i) => +new Date(i.at) > lastSeen).length;

  function markAllRead() {
    const now = Date.now();
    if (typeof window !== "undefined" && userId) {
      window.localStorage.setItem(`${SEEN_KEY}.${userId}`, String(now));
    }
    setLastSeen(now);
  }

  return { items, unread, isLoading: query.isLoading, markAllRead };
}

/** Live push: toast + refresh whenever the school posts something new. */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const userId = user?.userId;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-feed"] });
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["parent", "messages"] });
    };

    const channel = supabase
      .channel(`inapp-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as { title?: string; body?: string };
          toast.info(row.title ?? "New notification", { description: row.body ?? undefined });
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const row = payload.new as { message?: string; is_active?: boolean };
          if (row.is_active === false) return;
          toast.info("New announcement", { description: row.message ?? undefined });
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as { subject?: string | null; body?: string };
          toast.info(row.subject ?? "New message", { description: row.body ?? undefined });
          refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}