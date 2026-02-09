import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface KeyboardShortcutProps extends HTMLAttributes<HTMLElement> {
  keys: string[];
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <span className={cn("flex items-center gap-1 text-xs text-fg-muted", className)}>
      {keys.map((key, index) => (
        <span key={key} className="flex items-center">
          {index > 0 && <span className="mx-0.5">+</span>}
          <kbd>{key}</kbd>
        </span>
      ))}
    </span>
  );
}
