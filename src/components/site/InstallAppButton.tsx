import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Mobile-only "Install App" button: native prompt where supported, iOS instructions otherwise. */
export function InstallAppButton() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(inStandalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) return null;
  if (!deferred && !isIos) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setShowIosHelp(true);
  }

  return (
    <>
      <Button
        size="sm"
        variant="default"
        aria-label="Install the Teach Nation app"
        title="Install"
        className="h-9 shrink-0 rounded-xl px-3 text-xs font-semibold sm:hidden"
        onClick={install}
      >
        Install
      </Button>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Install Teach Nation</DialogTitle>
            <DialogDescription>
              On iPhone and iPad, Safari installs apps from the share menu.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-primary" /> 1. Tap the Share button in Safari.
            </li>
            <li>2. Choose &ldquo;Add to Home Screen&rdquo;.</li>
            <li>3. Tap Add — the Teach Nation icon appears on your home screen.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}