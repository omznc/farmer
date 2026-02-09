import { useAppStore } from "../../stores/appStore";
import type { View } from "../../types";
import { cn } from "../../lib/utils";
import { Folder, Settings, Info, LucideIcon } from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  view: View;
  shortcut?: string[];
}

const sidebarItems: SidebarItem[] = [
  { id: "repository", label: "Repository", icon: Folder, view: "repository", shortcut: ["Ctrl", "P"] },
  { id: "settings", label: "Settings", icon: Settings, view: "settings" },
  { id: "about", label: "About", icon: Info, view: "about" },
];

export function Sidebar() {
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  return (
    <aside className="flex select-none w-56 flex-col border-r border-border bg-bg-secondary rounded-bl-lg overflow-hidden">
      <div className="flex h-14 items-center px-5 border-b border-border">
        <span className="text-lg font-semibold text-fg-primary">
          Profico Farmer
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3 pb-3">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.view)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
              currentView === item.view
                ? "bg-bg-tertiary text-fg-primary"
                : "text-fg-secondary hover:bg-bg-hover hover:text-fg-primary"
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </span>
            {item.shortcut && (
              <span className="flex gap-0.5">
                {item.shortcut.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-1.5 py-0.5 text-xs font-medium text-fg-muted bg-bg-tertiary border border-border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
