import * as React from "react";
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className="", ...props }, ref) => React.createElement("input", { ref, className: ["h-10 w-full rounded-md border bg-background px-3 py-2 text-sm", className].join(" "), ...props })
);
Input.displayName = "Input";
