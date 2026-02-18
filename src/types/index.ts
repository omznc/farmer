export interface Commit {
	hash: string;
	author: string;
	timestamp: Date;
	message: string;
	filesChanged: string[];
	repoPath: string;
	repoName?: string;
	remoteUrl?: string;
}

export interface WorkDay {
	date: string;
	commits: Commit[];
	totalCommits: number;
	firstCommitTime?: string;
	lastCommitTime?: string;
	repoPath?: string;
	repoName?: string;
}

export interface WorkSchedule {
	workingDays: string[];
	gitAuthors: string[];
	weekendAttribution: "friday" | "monday";
}

export type AIProviderType = "claude-code" | "opencode" | "openapi" | "openai";

export interface AIProvider {
	id: string;
	type: AIProviderType;
	name: string;
	enabled: boolean;
	config: {
		command?: string;
		baseUrl?: string;
		apiKey?: string;
		model?: string;
	};
}

export interface AIConfig {
	providers: AIProvider[];
	selectedProvider?: string;
	customPrompt?: string;
}

export type View = "repository" | "settings" | "about";

export interface AppState {
	currentView: View;
	repoPath: string | null;
	repoHistory: string[];
	activeRepos: string[];
	filterByGitAuthors: boolean;
	workSchedule: WorkSchedule;
	aiConfig: AIConfig;
	workDays: WorkDay[];
	isLoading: boolean;
	error: string | null;
}
