import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

interface RepositorySelectorProps {
	onSelect: (path: string) => void;
	onClose: () => void;
}

export function RepositorySelector({
	onSelect,
	onClose,
}: RepositorySelectorProps) {
	const [path, setPath] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		requestAnimationFrame(() => {
			setVisible(true);
		});
	}, []);

	const handleBrowse = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const selected = await open({
				directory: true,
				multiple: false,
				title: "Select Git Repository",
			});

			if (selected) {
				setPath(selected as string);
			}
		} catch (e) {
			setError(String(e));
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelect = async () => {
		if (!path.trim()) {
			setError("Please select a repository path");
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			await invoke("analyze_repository", { repoPath: path, gitAuthors: [] });
			onSelect(path);
		} catch (e) {
			setError(String(e));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className={`absolute inset-0 bg-bg/80 transition-opacity duration-300 ${
					visible ? "opacity-100" : "opacity-0"
				}`}
				onClick={onClose}
			/>
			<div
				className={`relative w-full max-w-lg rounded-lg border border-border bg-bg-secondary shadow-xl transition-all duration-300 ${
					visible
						? "opacity-100 translate-y-0 scale-100"
						: "opacity-0 translate-y-4 scale-95"
				}`}
				style={{
					transitionTimingFunction: visible
						? "cubic-bezier(0.34, 1.56, 0.64, 1)"
						: "cubic-bezier(0.4, 0, 1, 1)",
				}}
			>
				<div className="flex items-center justify-between p-5 border-b border-border">
					<h2 className="text-lg font-semibold text-fg-primary">
						Select Repository
					</h2>
					<button
						onClick={onClose}
						className="text-fg-muted hover:text-fg-primary transition-colors p-1 hover:bg-bg-tertiary rounded"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-fg-primary mb-2">
								Repository Path
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={path}
									onChange={(e) => setPath(e.target.value)}
									placeholder="/path/to/repository"
									className="flex-1 px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isLoading}
								/>
								<Button
									variant="secondary"
									onClick={handleBrowse}
									disabled={isLoading}
									type="button"
								>
									Browse...
								</Button>
							</div>
						</div>

						{error && (
							<div className="p-3 rounded-md bg-error/10 border border-error/20">
								<p className="text-sm text-error">{error}</p>
							</div>
						)}
					</div>

					<div className="flex items-center justify-end gap-3 pt-2">
						<Button
							variant="secondary"
							onClick={onClose}
							disabled={isLoading}
							type="button"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSelect}
							disabled={isLoading || !path.trim()}
							type="button"
						>
							{isLoading ? "Loading..." : "Select Repository"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
