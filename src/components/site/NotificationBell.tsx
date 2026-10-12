import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationFeed, useRealtimeNotifications } from "@/lib/notify";

export function NotificationBell() {
  useRealtimeNotifications();
  const { items, unread, isLoading, markAllRead } = useNotificationFeed();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative rounded-full"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 w-80 overflow-y-auto p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-bold">Notifications</p>
        {isLoading && <p className="px-4 py-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="px-4 py-4 text-sm text-muted-foreground">Nothing new right now.</p>
        )}
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="px-4 py-3">
              <p className="text-sm font-semibold">{i.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{i.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(i.at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}