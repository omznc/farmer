import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/appStore";
import type { Commit, FileDiff } from "../types";
import type { CancellablePromise, StreamCallback } from "./aiProviders";
import {
	summarizeWithProvider,
	summarizeWithProviderStream,
} from "./aiProviders";

async function fetchCommitDiffs(
	commits: Commit[],
	maxFileSizeKB: number,
	maxFilesPerCommit: number,
	retryCount = 2,
): Promise<Map<string, FileDiff[]>> {
	const diffMap = new Map<string, FileDiff[]>();

	const commitsByRepo = new Map<string, Commit[]>();
	for (const commit of commits) {
		const existing = commitsByRepo.get(commit.repoPath) || [];
		existing.push(commit);
		commitsByRepo.set(commit.repoPath, existing);
	}

	for (const [repoPath, repoCommits] of commitsByRepo) {
		for (const commit of repoCommits) {
			let lastError: Error | null = null;
			for (let attempt = 0; attempt <= retryCount; attempt++) {
				try {
					const diffs = await invoke<FileDiff[]>("get_commit_diffs", {
						repoPath: repoPath,
						commitHash: commit.hash,
						maxFileSizeKb: maxFileSizeKB,
						maxFiles: maxFilesPerCommit,
					});
					if (diffs.length > 0) {
						diffMap.set(commit.hash, diffs);
					}
					lastError = null;
					break;
				} catch (err) {
					lastError = err as Error;
					if (attempt < retryCount) {
						await new Promise((r) => setTimeout(r, 500));
					}
				}
			}
			if (lastError) {
				console.error(
					`[Deep Analysis] Failed to get diffs for ${commit.hash} after ${retryCount + 1} attempts:`,
					lastError,
				);
			}
		}
	}

	return diffMap;
}

function formatCommitsWithDiffs(
	commitMessages: string[],
	commits: Commit[],
	diffs: Map<string, FileDiff[]>,
): string {
	const parts: string[] = [];

	for (let i = 0; i < commitMessages.length; i++) {
		const msg = commitMessages[i];
		const commit = commits[i];
		const commitDiffs = diffs.get(commit?.hash || "");

		parts.push(`${i + 1}. ${msg}`);

		if (commitDiffs && commitDiffs.length > 0) {
			const filesToShow = commitDiffs.slice(0, 5);
			for (const diff of filesToShow) {
				const diffLines = diff.diff.split("\n").slice(0, 15);
				const truncated = diff.diff.split("\n").length > 15;
				parts.push(
					`   📁 ${diff.path} (+${diff.additions}/-${diff.deletions})`,
				);
				for (const line of diffLines) {
					parts.push(`      ${line}`);
				}
				if (truncated) {
					parts.push("      ... (truncated)");
				}
			}
			if (commitDiffs.length > 5) {
				parts.push(`   ... and ${commitDiffs.length - 5} more files changed`);
			}
		}
	}

	return parts.join("\n");
}

export async function summarizeCommits(
	commitMessages: string[],
	commits?: Commit[],
): Promise<string> {
	console.log("[AI] Starting summarization");
	const state = useAppStore.getState();
	const { aiConfig, deepAnalysisSettings } = state;

	console.log("[AI] Config:", {
		selectedProvider: aiConfig.selectedProvider,
		providers: aiConfig.providers.map((p) => ({
			id: p.id,
			enabled: p.enabled,
			type: p.type,
		})),
		customPrompt: aiConfig.customPrompt,
		verbosity: aiConfig.verbosity,
		deepAnalysis: deepAnalysisSettings.enabled,
	});

	if (!aiConfig.selectedProvider) {
		throw new Error("No AI provider selected. Configure one in Settings.");
	}

	const provider = aiConfig.providers.find(
		(p) => p.id === aiConfig.selectedProvider,
	);

	console.log("[AI] Found provider:", provider);

	if (!provider) {
		throw new Error("Selected AI provider not found");
	}

	if (!provider.enabled) {
		throw new Error("Selected AI provider is disabled");
	}

	let enhancedCommits = commitMessages;

	if (deepAnalysisSettings.enabled && commits && commits.length > 0) {
		console.log("[AI] Deep analysis enabled, fetching diffs...");
		try {
			const diffs = await fetchCommitDiffs(
				commits,
				deepAnalysisSettings.maxFileSizeKB,
				deepAnalysisSettings.maxFilesPerCommit,
			);
			enhancedCommits = formatCommitsWithDiffs(
				commitMessages,
				commits,
				diffs,
			).split("\n");
			console.log("[AI] Enhanced commits with diffs");
		} catch (err) {
			console.error("[AI] Failed to fetch diffs, using plain messages:", err);
		}
	}

	console.log("[AI] Calling summarizeWithProvider");
	return summarizeWithProvider(
		provider,
		enhancedCommits,
		aiConfig.customPrompt,
		aiConfig.verbosity,
		deepAnalysisSettings.enabled,
	);
}

export function summarizeCommitsStream(
	commitMessages: string[],
	onChunk: StreamCallback,
	commits?: Commit[],
): CancellablePromise<string> {
	console.log("[AI Stream] Starting summarization");
	console.log("[AI Stream] Commit count:", commitMessages.length);
	const state = useAppStore.getState();
	const { aiConfig, deepAnalysisSettings } = state;

	console.log(
		"[AI Stream] Provider:",
		aiConfig.selectedProvider,
		"Deep:",
		deepAnalysisSettings.enabled,
	);

	if (!aiConfig.selectedProvider) {
		throw new Error("No AI provider selected. Configure one in Settings.");
	}

	const provider = aiConfig.providers.find(
		(p) => p.id === aiConfig.selectedProvider,
	);

	if (!provider) {
		throw new Error("Selected AI provider not found");
	}

	if (!provider.enabled) {
		throw new Error("Selected AI provider is disabled");
	}

	const abortController = new AbortController();
	let providerCancellable: CancellablePromise<string> | null = null;

	const promise = (async () => {
		let enhancedCommits = commitMessages;

		if (deepAnalysisSettings.enabled && commits && commits.length > 0) {
			console.log("[AI Stream] Deep analysis enabled, fetching diffs...");
			if (abortController.signal.aborted) {
				throw new Error("Cancelled");
			}

			const totalCommits = commits.length;

			try {
				const diffs = await fetchCommitDiffs(
					commits,
					deepAnalysisSettings.maxFileSizeKB,
					deepAnalysisSettings.maxFilesPerCommit,
				);
				console.log(
					`[AI Stream] Fetched diffs for ${diffs.size}/${totalCommits} commits`,
				);

				enhancedCommits = formatCommitsWithDiffs(
					commitMessages,
					commits,
					diffs,
				).split("\n");
				console.log("[AI Stream] Enhanced commits with diffs");
			} catch (err) {
				console.error("[AI Stream] Failed to fetch diffs:", err);
				throw new Error(
					`Deep analysis failed: ${err}. Try disabling deep analysis in settings.`,
				);
			}
		}

		if (abortController.signal.aborted) {
			throw new Error("Cancelled");
		}

		console.log("[AI Stream] Calling provider stream for:", provider.type);
		providerCancellable = summarizeWithProviderStream(
			provider,
			enhancedCommits,
			onChunk,
			aiConfig.customPrompt,
			aiConfig.verbosity,
			deepAnalysisSettings.enabled,
		);

		console.log("[AI Stream] Waiting for provider promise...");
		try {
			const result = await providerCancellable.promise;
			console.log(
				"[AI Stream] Provider promise resolved, length:",
				result.length,
			);
			return result;
		} catch (err) {
			console.error("[AI Stream] Provider promise rejected:", err);
			throw err;
		}
	})();

	return {
		promise,
		cancel: () => {
			console.log("[AI Stream] Cancel called");
			abortController.abort();
			if (providerCancellable) {
				providerCancellable.cancel();
			} else {
				console.log("[AI Stream] No provider cancellable yet");
			}
		},
	};
}

export function isAIConfigured(): boolean {
	const state = useAppStore.getState();
	const { aiConfig } = state;

	if (!aiConfig.selectedProvider) return false;

	const provider = aiConfig.providers.find(
		(p) => p.id === aiConfig.selectedProvider,
	);
	return !!provider?.enabled;
}
