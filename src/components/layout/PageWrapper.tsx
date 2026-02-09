import type { ViewComponentProps } from "./types";

export function PageWrapper({ view, children }: ViewComponentProps) {

  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-fg-primary">
            {view === "repository" && "Repository Analysis"}
            {view === "settings" && "Settings"}
          </h2>
          <p className="text-sm text-fg-secondary">
            {view === "repository" && "Analyze Git commits to automatically generate time entries"}
            {view === "settings" && "Configure your Profico Farmer preferences"}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
