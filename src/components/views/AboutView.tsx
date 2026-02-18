import { AlertCircle, CheckCircle, Download, Github } from "lucide-react";
import { useAutoUpdate } from "../../hooks/useAutoUpdate";
import { Button } from "../ui/Button";

export function AboutView() {
	const {
		status,
		updateInfo,
		error,
		checkForUpdates,
		installUpdate,
		downloadProgress,
	} = useAutoUpdate(true); // Auto-check enabled

	const currentVersion = "0.1.1";

	return (
		<div className="flex flex-col gap-6 p-8">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-fg-primary">About</h2>
				<p className="text-sm text-fg-secondary">
					Git-powered time tracking automation
				</p>
			</div>

			{/* Version and Update Status */}
			<div className="rounded-lg border border-border bg-bg-secondary p-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-sm font-medium text-fg-primary">Version</h3>
						<p className="text-xs text-fg-muted mt-1">v{currentVersion}</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={checkForUpdates}
						disabled={status === "checking" || status === "downloading"}
					>
						{status === "checking" ? (
							<>
								<div className="w-3 h-3 border-2 border-fg-secondary border-t-transparent rounded-full animate-spin mr-2" />
								Checking...
							</>
						) : (
							<>
								<Download className="w-3 h-3 mr-2" />
								Check for Updates
							</>
						)}
					</Button>
				</div>

				{status === "available" && updateInfo && (
					<div className="p-3 rounded-md bg-accent/10 border border-accent/20 mb-4">
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-start gap-2">
								<Download className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
								<div>
									<p className="text-sm font-medium text-accent">
										Update Available
									</p>
									<p className="text-xs text-fg-secondary mt-1">
										Version {updateInfo.version} is ready to install
									</p>
									{updateInfo.body && (
										<p className="text-xs text-fg-muted mt-2 max-w-md line-clamp-3">
											{updateInfo.body}
										</p>
									)}
								</div>
							</div>
							<Button
								variant="primary"
								size="sm"
								onClick={installUpdate}
								disabled={status === "downloading"}
							>
								Install Now
							</Button>
						</div>
					</div>
				)}

				{status === "downloading" && (
					<div className="p-3 rounded-md bg-accent/10 border border-accent/20 mb-4">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
								<div className="flex-1">
									<p className="text-sm font-medium text-accent">
										Downloading Update
									</p>
									<p className="text-xs text-fg-secondary mt-1">
										Please wait while the update is being downloaded and
										installed...
									</p>
								</div>
							</div>
							{downloadProgress > 0 && (
								<div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
									<div
										className="bg-accent h-full transition-all duration-300"
										style={{ width: `${downloadProgress}%` }}
									/>
								</div>
							)}
						</div>
					</div>
				)}

				{status === "ready" && (
					<div className="p-3 rounded-md bg-success/10 border border-success/20 mb-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
							<div>
								<p className="text-sm font-medium text-success">
									Update Installed
								</p>
								<p className="text-xs text-fg-secondary mt-1">
									Restarting application...
								</p>
							</div>
						</div>
					</div>
				)}

				{status === "no-update" && (
					<div className="p-3 rounded-md bg-success/10 border border-success/20 mb-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
							<p className="text-sm text-success">You're up to date!</p>
						</div>
					</div>
				)}

				{status === "error" && error && (
					<div className="p-3 rounded-md bg-error/10 border border-error/20 mb-4">
						<div className="flex items-start gap-2">
							<AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
							<div>
								<p className="text-sm font-medium text-error">Update Failed</p>
								<p className="text-xs text-fg-secondary mt-1">{error}</p>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="rounded-lg border border-border bg-bg-secondary p-6">
				<h3 className="text-sm font-medium text-fg-primary mb-4">
					What is this?
				</h3>
				<p className="text-sm text-fg-secondary leading-relaxed mb-4">
					Farmer analyzes your Git commits and uses AI to generate professional
					summaries of your work. It automatically tracks your development
					activity, making it easier to log time and report on what you've
					accomplished.
				</p>

				<div className="pt-4 border-t border-border">
					<h4 className="text-xs font-medium text-fg-primary mb-3">
						Key Features
					</h4>
					<ul className="space-y-2 text-sm text-fg-secondary">
						<li className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">•</span>
							<span>Analyze Git repositories and group commits by workday</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">•</span>
							<span>
								AI-powered summaries using Claude Code, OpenCode, OpenAI, or
								Ollama
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">•</span>
							<span>One-click copy to clipboard with commit URLs</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">•</span>
							<span>Filter commits by author for team repositories</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">•</span>
							<span>Automatic updates with manual check option</span>
						</li>
					</ul>
				</div>
			</div>

			<div className="rounded-lg border border-border gap-4 flex flex-col bg-bg-secondary p-6">
				<a
					href="https://github.com/omznc"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 text-sm text-purple-500 hover:text-purple-400 transition-colors"
				>
					<Github className="w-4 h-4" />
					github.com/omznc
				</a>
				<p className="text-xs text-fg-muted">
					Built with Rust and React (thanks Tauri)
				</p>
			</div>
		</div>
	);
}
