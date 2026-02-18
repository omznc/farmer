import { useAppStore } from "../stores/appStore";
import { summarizeWithProvider } from "./aiProviders";

export async function summarizeCommits(commits: string[]): Promise<string> {
	console.log("[AI] Starting summarization");
	const state = useAppStore.getState();
	const { aiConfig } = state;

	console.log("[AI] Config:", {
		selectedProvider: aiConfig.selectedProvider,
		providers: aiConfig.providers.map((p) => ({
			id: p.id,
			enabled: p.enabled,
			type: p.type,
		})),
		customPrompt: aiConfig.customPrompt,
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

	console.log("[AI] Calling summarizeWithProvider");
	return summarizeWithProvider(provider, commits, aiConfig.customPrompt);
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
