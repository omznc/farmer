import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div className="top-0 left-0 right-0 h-8 bg-bg-secondary flex items-center pl-4 select-none z-50 border-b border-border rounded-t-lg">
      <div
        data-tauri-drag-region
        className="flex-1 h-full cursor-move"
      />

      <div className="flex items-center h-full gap-1">
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-bg-hover transition-colors text-text-secondary hover:text-text"
          aria-label="Minimize"
        >
          <Minus className="w-3 h-3" />
        </button>

        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-bg-hover transition-colors text-text-secondary hover:text-text"
          aria-label="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>

        <button
          onClick={handleClose}
          className="h-full pl-4 pr-4 hover:bg-error/20 hover:text-error transition-colors text-text-secondary hover:text-error rounded-tr-lg"
          aria-label="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
