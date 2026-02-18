import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error);
		console.error("Error info:", errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-bg-primary">
					<div className="max-w-lg w-full rounded-lg border border-border bg-bg-secondary p-8 text-center">
						<div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
							<AlertTriangle className="w-8 h-8 text-error" />
						</div>

						<h1 className="text-xl font-semibold text-fg-primary mb-2">
							Something went wrong
						</h1>

						<p className="text-sm text-fg-secondary mb-6">
							An unexpected error occurred. This has been logged to the console.
						</p>

						{this.state.error && (
							<details className="mb-6 text-left">
								<summary className="text-xs font-medium text-fg-secondary cursor-pointer hover:text-fg-primary mb-2">
									Error details
								</summary>
								<div className="p-3 rounded bg-bg-tertiary border border-border">
									<code className="text-xs text-fg-muted break-words">
										{this.state.error.toString()}
									</code>
								</div>
							</details>
						)}

						<div className="flex gap-3 justify-center">
							<button
								onClick={() => window.location.reload()}
								className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-md font-medium hover:bg-accent-hover transition-colors"
							>
								<RefreshCw className="w-4 h-4" />
								Reload App
							</button>
							<button
								onClick={() => {
									this.setState({ hasError: false, error: null });
								}}
								className="px-4 py-2 bg-bg-tertiary text-fg-primary rounded-md font-medium hover:bg-bg-hover transition-colors"
							>
								Try Again
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
