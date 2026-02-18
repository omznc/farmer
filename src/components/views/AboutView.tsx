import { Github } from "lucide-react";

export function AboutView() {
	return (
		<div className="flex flex-col gap-6 p-8">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-fg-primary">About</h2>
				<p className="text-sm text-fg-secondary">
					Git-powered time tracking automation
				</p>
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
