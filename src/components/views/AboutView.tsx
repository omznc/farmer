import { AlertCircle, CheckCircle, Download, Github, Copy, Trash2, Terminal } from "lucide-react";
import { useAutoUpdate } from "../../hooks/useAutoUpdate";
import { useConsoleCapture } from "../../hooks/useConsoleCapture";
import { Button } from "../ui/Button";
import { useState, useRef, useEffect } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export function AboutView() {
	const {
		status,
		updateInfo,
		error,
		checkForUpdates,
		installUpdate,
		downloadProgress,
	} = useAutoUpdate(true); // Auto-check enabled

	const { logs, clearLogs, exportLogs } = useConsoleCapture(500);
	const [showLogs, setShowLogs] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);
	const logsEndRef = useRef<HTMLDivElement>(null);

	const currentVersion = "0.1.1";

	// Auto-scroll to bottom when new logs arrive
	useEffect(() => {
		if (showLogs && logsEndRef.current) {
			logsEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs, showLogs]);

	const handleCopyLogs = async () => {
		try {
			const logsText = exportLogs();
			await writeText(logsText);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy logs:", err);
		}
	};

	const getLogColor = (level: string) => {
		switch (level) {
			case "error":
				return "text-error";
			case "warn":
				return "text-warning";
			case "info":
				return "text-accent";
			default:
				return "text-fg-secondary";
		}
	};

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
						onClick={() => checkForUpdates(false)}
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
										<p className="text-xs text-fg-muted mt-2 max-w-md">
											{updateInfo.body}
										</p>
									)}
								</div>
							</div>
							<Button
								variant="primary"
								size="sm"
								onClick={installUpdate}
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
								{error.includes("Could not fetch") && (
									<p className="text-xs text-fg-muted mt-2">
										💡 Your current version (v{currentVersion}) doesn't have updater support.
										Updates will work automatically once you install v0.1.2 or newer from GitHub Releases.
									</p>
								)}
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

			{/* Application Logs */}
			<div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
				<button
					onClick={() => setShowLogs(!showLogs)}
					className="w-full flex items-center justify-between p-6 hover:bg-bg-tertiary transition-colors"
				>
					<div className="flex items-center gap-3">
						<Terminal className="w-4 h-4 text-fg-secondary" />
						<div className="text-left">
							<h3 className="text-sm font-medium text-fg-primary">
								Application Logs
							</h3>
							<p className="text-xs text-fg-muted mt-1">
								{logs.length} log entries • Click to {showLogs ? "hide" : "show"}
							</p>
						</div>
					</div>
					<div className="text-xs text-fg-muted">
						{showLogs ? "▼" : "▶"}
					</div>
				</button>

				{showLogs && (
					<div className="border-t border-border">
						<div className="flex items-center justify-between p-3 bg-bg-tertiary border-b border-border">
							<span className="text-xs font-medium text-fg-secondary">
								Real-time console output
							</span>
							<div className="flex gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={handleCopyLogs}
									disabled={logs.length === 0}
								>
									<Copy className="w-3 h-3 mr-1.5" />
									{copySuccess ? "Copied!" : "Copy All"}
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={clearLogs}
									disabled={logs.length === 0}
								>
									<Trash2 className="w-3 h-3 mr-1.5" />
									Clear
								</Button>
							</div>
						</div>

						<div className="max-h-96 overflow-y-auto bg-bg-primary p-4 font-mono text-xs">
							{logs.length === 0 ? (
								<p className="text-fg-muted text-center py-8">
									No logs yet. Logs will appear here as you use the app.
								</p>
							) : (
								<div className="space-y-1">
									{logs.map((log, index) => (
										<div
											key={index}
											className="flex gap-2 hover:bg-bg-secondary px-2 py-1 rounded"
										>
											<span className="text-fg-muted flex-shrink-0">
												{log.timestamp.toLocaleTimeString()}
											</span>
											<span
												className={`flex-shrink-0 font-semibold ${getLogColor(log.level)}`}
											>
												{log.level.toUpperCase().padEnd(5)}
											</span>
											<span className="text-fg-primary break-all">
												{log.message}
											</span>
										</div>
									))}
									<div ref={logsEndRef} />
								</div>
							)}
						</div>

						<div className="p-3 bg-bg-tertiary border-t border-border">
							<p className="text-xs text-fg-muted">
								💡 Tip: Use these logs to debug issues. Copy and include in bug reports.
							</p>
						</div>
					</div>
				)}
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
