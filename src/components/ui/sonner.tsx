import * as React from "react";
import { Toaster as Sonner } from "sonner";

export function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return React.createElement(Sonner, props);
}
