import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { TitleBar } from "./components/layout/TitleBar";
import { AboutView } from "./components/views/AboutView";
import { RepositoryView } from "./components/views/RepositoryView";
import { SettingsView } from "./components/views/SettingsView";
import { initConsoleCapture } from "./hooks/useConsoleCapture";
import { useAppStore } from "./stores/appStore";

initConsoleCapture();

function App() {
	const currentView = useAppStore((state) => state.currentView);
	const error = useAppStore((state) => state.error);
	const clearError = useAppStore((state) => state.clearError);
	const loadSettings = useAppStore((state) => state.loadSettings);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey) {
				if (e.key === "p") {
					e.preventDefault();
					useAppStore.getState().setCurrentView("repository");
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const renderView = () => {
		switch (currentView) {
			case "repository":
				return <RepositoryView />;
			case "settings":
				return <SettingsView />;
			case "about":
				return <AboutView />;
			default:
				return <RepositoryView />;
		}
	};

	return (
		<ErrorBoundary>
			<div className="flex flex-col h-screen overflow-hidden rounded-lg">
				<TitleBar />

				{error && (
					<div className="flex items-center justify-between bg-error/10 border-b border-error/50 px-4 py-2">
						<div className="flex items-center gap-2">
							<AlertCircle className="w-4 h-4 text-error" />
							<span className="text-sm text-error">{error}</span>
						</div>
						<button
							onClick={clearError}
							className="text-sm text-error hover:text-error/80 transition-colors"
						>
							Dismiss
						</button>
					</div>
				)}

				<div className="flex flex-1 overflow-hidden">
					<Sidebar />

					<div className="flex flex-1 flex-col overflow-hidden rounded-br-lg">
						<Header />
						<main className="flex-1 overflow-y-auto bg-bg-primary rounded-br-lg">
							{renderView()}
						</main>
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}

export default App;
