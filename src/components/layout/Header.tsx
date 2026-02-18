import { useAppStore } from "../../stores/appStore";
import { BarChart3, Folder, Settings } from "lucide-react";

export function Header() {
  const currentView = useAppStore((state) => state.currentView);

  const getViewTitle = () => {
    switch (currentView) {
      case "repository":
        return "Repository Analysis";
      case "settings":
        return "Settings";
      default:
        return "Farmer";
    }
  };

  const getViewIcon = () => {
    switch (currentView) {
      case "repository":
        return Folder;
      case "settings":
        return Settings;
      default:
        return BarChart3;
    }
  };

  const Icon = getViewIcon();

  return (
    <header className="flex select-none h-14 items-center justify-between border-b border-border bg-bg-secondary">
      <div className="flex items-center gap-3 px-6">
        <Icon className="w-5 h-5 text-fg-primary" />
        <h1 className="text-lg font-semibold text-fg-primary">
          {getViewTitle()}
        </h1>
      </div>
    </header>
  );
}
