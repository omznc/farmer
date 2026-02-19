import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { CancellablePromise } from "../lib/aiProviders";
import type {
	AIConfig,
	AIVerbosity,
	AppState,
	CopySettings,
	DeepAnalysisSettings,
	WorkDay,
	WorkSchedule,
} from "../types";

interface AppStore extends AppState {
	aiSummaries: Record<string, string>;
	aiLoadingDates: Record<string, boolean>;
	setCurrentView: (view: AppState["currentView"]) => void;
	setRepoPath: (path: string | null) => void;
	addRepoToHistory: (path: string) => void;
	removeRepoFromHistory: (path: string) => void;
	toggleActiveRepo: (path: string) => void;
	setActiveRepos: (paths: string[]) => void;
	setFilterByGitAuthors: (filter: boolean) => void;
	setWorkSchedule: (schedule: WorkSchedule) => void;
	setAIConfig: (config: AIConfig) => void;
	setAIVerbosity: (verbosity: AIVerbosity) => void;
	setCopySettings: (settings: CopySettings) => void;
	setDeepAnalysisSettings: (settings: DeepAnalysisSettings) => void;
	setWorkDays: (days: WorkDay[]) => void;
	setAISummary: (date: string, summary: string) => void;
	getAISummary: (date: string) => string | undefined;
	setAILoading: (date: string, loading: boolean) => void;
	isAILoading: (date: string) => boolean;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	loadSettings: () => Promise<void>;
	saveSettings: () => Promise<void>;
}

const aiCancellables = new Map<string, CancellablePromise<string>>();

export function registerAICancellable(
	date: string,
	cancellable: CancellablePromise<string>,
) {
	aiCancellables.set(date, cancellable);
}

export function unregisterAICancellable(date: string) {
	aiCancellables.delete(date);
}

export function cancelAIGeneration(date: string) {
	const cancellable = aiCancellables.get(date);
	if (cancellable) {
		cancellable.cancel();
		aiCancellables.delete(date);
	}
}

export function isAIGenerating(date: string): boolean {
	return aiCancellables.has(date);
}

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
	workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
	gitAuthors: [],
	weekendAttribution: "friday",
};

const DEFAULT_COPY_SETTINGS: CopySettings = {
	includeDayTitle: true,
};

const DEFAULT_DEEP_ANALYSIS_SETTINGS: DeepAnalysisSettings = {
	enabled: false,
	maxFileSizeKB: 50,
	maxFilesPerCommit: 20,
};

export const useAppStore = create<AppStore>((set, get) => ({
	currentView: "repository",
	repoPath: null,
	repoHistory: [],
	activeRepos: [],
	filterByGitAuthors: true,
	workSchedule: DEFAULT_WORK_SCHEDULE,
	aiConfig: {
		providers: [],
		selectedProvider: undefined,
		verbosity: "normal",
	},
	copySettings: DEFAULT_COPY_SETTINGS,
	deepAnalysisSettings: DEFAULT_DEEP_ANALYSIS_SETTINGS,
	workDays: [],
	aiSummaries: {},
	aiLoadingDates: {},
	isLoading: false,
	error: null,

	setCurrentView: (view) => {
		set({ currentView: view });
		get().saveSettings();
	},
	setRepoPath: (path) => {
		set({ repoPath: path });
		if (path) {
			get().addRepoToHistory(path);
		}
		get().saveSettings();
	},
	addRepoToHistory: (path) => {
		const history = get().repoHistory;
		const newHistory = [path, ...history.filter((p) => p !== path)].slice(
			0,
			10,
		);
		set({ repoHistory: newHistory });
		get().saveSettings();
	},
	removeRepoFromHistory: (path) => {
		const history = get().repoHistory;
		const activeRepos = get().activeRepos;
		set({
			repoHistory: history.filter((p) => p !== path),
			activeRepos: activeRepos.filter((p) => p !== path),
		});
		get().saveSettings();
	},
	toggleActiveRepo: (path) => {
		const activeRepos = get().activeRepos;
		const isActive = activeRepos.includes(path);
		const newActiveRepos = isActive
			? activeRepos.filter((p) => p !== path)
			: [...activeRepos, path];
		set({ activeRepos: newActiveRepos });
		get().saveSettings();
	},
	setActiveRepos: (paths) => {
		set({ activeRepos: paths });
		get().saveSettings();
	},
	setFilterByGitAuthors: (filter) => {
		set({ filterByGitAuthors: filter });
		get().saveSettings();
	},
	setWorkSchedule: (schedule) => {
		set({ workSchedule: schedule });
		get().saveSettings();
	},
	setAIConfig: (config) => {
		set({ aiConfig: config });
		get().saveSettings();
	},
	setAIVerbosity: (verbosity) => {
		set((state) => ({
			aiConfig: { ...state.aiConfig, verbosity },
		}));
		get().saveSettings();
	},
	setCopySettings: (settings) => {
		set({ copySettings: settings });
		get().saveSettings();
	},
	setDeepAnalysisSettings: (settings) => {
		set({ deepAnalysisSettings: settings });
		get().saveSettings();
	},
	setWorkDays: (days) => set({ workDays: days }),
	setAISummary: (date, summary) =>
		set((state) => ({
			aiSummaries: { ...state.aiSummaries, [date]: summary },
		})),
	getAISummary: (date) => get().aiSummaries[date],
	setAILoading: (date, loading) =>
		set((state) => ({
			aiLoadingDates: { ...state.aiLoadingDates, [date]: loading },
		})),
	isAILoading: (date) => get().aiLoadingDates[date] ?? false,
	setLoading: (loading) => set({ isLoading: loading }),
	setError: (error) => set({ error }),
	clearError: () => set({ error: null }),

	loadSettings: async () => {
		try {
			const settings = await invoke<{
				workSchedule?: WorkSchedule | null;
				aiConfig?: AIConfig | null;
				repoPath?: string | null;
				repoHistory?: string[] | null;
				activeRepos?: string[] | null;
				filterByGitAuthors?: boolean | null;
				copySettings?: CopySettings | null;
				deepAnalysisSettings?: DeepAnalysisSettings | null;
			}>("load_settings");

			const loadedSchedule = settings.workSchedule;
			const validSchedule =
				loadedSchedule?.workingDays && Array.isArray(loadedSchedule.workingDays)
					? loadedSchedule
					: DEFAULT_WORK_SCHEDULE;

			set({
				workSchedule: validSchedule,
				aiConfig: {
					providers: settings.aiConfig?.providers ?? [],
					selectedProvider: settings.aiConfig?.selectedProvider ?? undefined,
					customPrompt: settings.aiConfig?.customPrompt ?? undefined,
					verbosity: settings.aiConfig?.verbosity ?? "normal",
				},
				repoPath: settings.repoPath ?? null,
				repoHistory: settings.repoHistory ?? [],
				activeRepos: settings.activeRepos ?? [],
				filterByGitAuthors: settings.filterByGitAuthors ?? true,
				copySettings: settings.copySettings ?? DEFAULT_COPY_SETTINGS,
				deepAnalysisSettings:
					settings.deepAnalysisSettings ?? DEFAULT_DEEP_ANALYSIS_SETTINGS,
			});
		} catch (error) {
			console.error("Failed to load settings:", error);
			set({
				workSchedule: DEFAULT_WORK_SCHEDULE,
				copySettings: DEFAULT_COPY_SETTINGS,
				deepAnalysisSettings: DEFAULT_DEEP_ANALYSIS_SETTINGS,
			});
		}
	},

	saveSettings: async () => {
		try {
			const state = get();
			await invoke("save_settings", {
				workSchedule: state.workSchedule,
				aiConfig: state.aiConfig,
				repoPath: state.repoPath,
				repoHistory: state.repoHistory,
				activeRepos: state.activeRepos,
				filterByGitAuthors: state.filterByGitAuthors,
				copySettings: state.copySettings,
				deepAnalysisSettings: state.deepAnalysisSettings,
			});
		} catch (error) {
			console.error("Failed to save settings:", error);
		}
	},
}));
