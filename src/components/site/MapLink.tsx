import { MapPin } from "lucide-react";

/** Opens Google Maps pointing at a campus address. */
export function MapLink({
  address,
  label,
  className = "",
  withText = false,
}: {
  address: string;
  label: string;
  className?: string;
  withText?: boolean;
}) {
  // Opens the Google Maps directions screen (distance + directions) for this campus.
  // The `origin` param is intentionally omitted: when it is absent (rather than empty),
  // Google Maps fills the start field with "Your location" and runs the route search
  // straight away thanks to dir_action=navigate.
  const href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}&travelmode=driving&dir_action=navigate`;

  // Ask for the browser geolocation permission before leaving the page, so Google Maps
  // is far more likely to already have "Your location" available in the new tab.
  const warmUpLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 3000, maximumAge: 300000 },
        );
      } catch {
        /* ignore – directions still work without it */
      }
    }
  };
  return (
    <a
      href={href}
      onClick={warmUpLocation}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Get directions to ${label} in Google Maps`}
      title={`Get directions to ${label} in Google Maps`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/60 hover:bg-primary/10 ${className}`}
    >
      <MapPin className="h-3.5 w-3.5" aria-hidden />
      {withText ? "View on Google Maps" : <span className="sr-only">View on Google Maps</span>}
    </a>
  );
}