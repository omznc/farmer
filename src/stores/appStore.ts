import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { AIConfig, AppState, WorkDay, WorkSchedule } from "../types";

interface AppStore extends AppState {
	aiSummaries: Record<string, string>;
	setCurrentView: (view: AppState["currentView"]) => void;
	setRepoPath: (path: string | null) => void;
	addRepoToHistory: (path: string) => void;
	toggleActiveRepo: (path: string) => void;
	setActiveRepos: (paths: string[]) => void;
	setFilterByGitAuthors: (filter: boolean) => void;
	setWorkSchedule: (schedule: WorkSchedule) => void;
	setAIConfig: (config: AIConfig) => void;
	setWorkDays: (days: WorkDay[]) => void;
	setAISummary: (date: string, summary: string) => void;
	getAISummary: (date: string) => string | undefined;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	loadSettings: () => Promise<void>;
	saveSettings: () => Promise<void>;
}

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
	workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
	gitAuthors: [],
	weekendAttribution: "friday",
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
	},
	workDays: [],
	aiSummaries: {},
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
	setWorkDays: (days) => set({ workDays: days }),
	setAISummary: (date, summary) =>
		set((state) => ({
			aiSummaries: { ...state.aiSummaries, [date]: summary },
		})),
	getAISummary: (date) => get().aiSummaries[date],
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
			}>("load_settings");

			const loadedSchedule = settings.workSchedule;
			const validSchedule =
				loadedSchedule?.workingDays && Array.isArray(loadedSchedule.workingDays)
					? loadedSchedule
					: DEFAULT_WORK_SCHEDULE;

			set({
				workSchedule: validSchedule,
				aiConfig: settings.aiConfig ?? {
					providers: [],
					selectedProvider: undefined,
				},
				repoPath: settings.repoPath ?? null,
				repoHistory: settings.repoHistory ?? [],
				activeRepos: settings.activeRepos ?? [],
				filterByGitAuthors: settings.filterByGitAuthors ?? true,
			});
		} catch (error) {
			console.error("Failed to load settings:", error);
			set({ workSchedule: DEFAULT_WORK_SCHEDULE });
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
			});
		} catch (error) {
			console.error("Failed to save settings:", error);
		}
	},
}));
