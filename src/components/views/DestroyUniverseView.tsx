import { Power } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

export function DestroyUniverseView() {
	const setKonamiActivated = useAppStore((state) => state.setKonamiActivated);
	const setCurrentView = useAppStore((state) => state.setCurrentView);

	const handleDisable = () => {
		setKonamiActivated(false);
		setCurrentView("repository");
	};

	return (
		<div className="relative flex items-center justify-center h-full w-full bg-black">
			<div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-green-500/30">
				<span className="text-green-500 font-mono text-sm tracking-wider">
					DESTROY_UNIVERSE {"//"} TRANSMISSION ACTIVE
				</span>
				<button
					onClick={handleDisable}
					className="flex items-center gap-2 px-3 py-1.5 text-green-500 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors font-mono text-sm border border-green-500/30 hover:border-green-500/60"
				>
					<Power className="w-4 h-4" />
					DISABLE CRT MODE
				</button>
			</div>
			<iframe
				src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&fs=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=dQw4w9WgXcQ&disablekb=1&iv_load_policy=3&playsinline=1"
				title="DESTROY_UNIVERSE"
				className="w-full h-full border-0"
				allow="autoplay; encrypted-media"
				allowFullScreen={false}
			/>
		</div>
	);
}
