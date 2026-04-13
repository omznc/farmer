import { Flame, Folder, Info, type LucideIcon, Settings } from "lucide-react";
import { useAutoUpdate } from "../../hooks/useAutoUpdate";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../stores/appStore";
import type { View } from "../../types";

interface SidebarItem {
	id: string;
	label: string;
	icon: LucideIcon;
	view: View;
	shortcut?: string[];
}

const sidebarItems: SidebarItem[] = [
	{
		id: "repository",
		label: "Repository",
		icon: Folder,
		view: "repository",
		shortcut: ["Ctrl", "P"],
	},
	{ id: "settings", label: "Settings", icon: Settings, view: "settings" },
	{ id: "about", label: "About", icon: Info, view: "about" },
];

const destroyUniverseItem: SidebarItem = {
	id: "destroy_universe",
	label: "DESTROY_UNIVERSE",
	icon: Flame,
	view: "destroy_universe",
};

export function Sidebar() {
	const currentView = useAppStore((state) => state.currentView);
	const setCurrentView = useAppStore((state) => state.setCurrentView);
	const konamiActivated = useAppStore((state) => state.konamiActivated);
	const { status } = useAutoUpdate(true);
	const hasUpdate = status === "available";

	const allItems = konamiActivated
		? [...sidebarItems, destroyUniverseItem]
		: sidebarItems;

	return (
		<aside className="flex select-none w-56 flex-col border-r border-border bg-bg-secondary rounded-bl-lg overflow-hidden">
			<div className="flex h-14 items-center px-5 border-b border-border">
				<span className="text-lg font-semibold text-fg-primary">Farmer</span>
			</div>

			<nav className="flex-1 space-y-1 p-3 pb-3">
				{allItems.map((item) => (
					<button
						key={item.id}
						onClick={() => setCurrentView(item.view)}
						className={cn(
							"flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
							currentView === item.view
								? "bg-bg-tertiary text-fg-primary"
								: "text-fg-secondary hover:bg-bg-hover hover:text-fg-primary",
							item.id === "destroy_universe" &&
								"text-red-500 hover:text-red-400",
						)}
					>
						<span className="flex items-center gap-3">
							<span className="relative">
								<item.icon className="w-4 h-4" />
								{item.id === "about" && hasUpdate && (
									<span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
								)}
							</span>
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
