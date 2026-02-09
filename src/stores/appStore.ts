import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AppState, WorkDay, WorkSchedule, AIConfig } from "../types";

interface AppStore extends AppState {
  setCurrentView: (view: AppState["currentView"]) => void;
  setRepoPath: (path: string | null) => void;
  addRepoToHistory: (path: string) => void;
  setFilterByGitAuthors: (filter: boolean) => void;
  setWorkSchedule: (schedule: WorkSchedule) => void;
  setAIConfig: (config: AIConfig) => void;
  setWorkDays: (days: WorkDay[]) => void;
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
  filterByGitAuthors: true,
  workSchedule: DEFAULT_WORK_SCHEDULE,
  aiConfig: {
    providers: [],
    selectedProvider: undefined,
  },
  workDays: [],
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
    const newHistory = [path, ...history.filter(p => p !== path)].slice(0, 10);
    set({ repoHistory: newHistory });
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
        filterByGitAuthors?: boolean | null;
      }>("load_settings");

      const loadedSchedule = settings.workSchedule;
      const validSchedule = loadedSchedule && 
        loadedSchedule.workingDays && 
        Array.isArray(loadedSchedule.workingDays)
        ? loadedSchedule
        : DEFAULT_WORK_SCHEDULE;

      set({
        workSchedule: validSchedule,
        aiConfig: settings.aiConfig ?? { providers: [], selectedProvider: undefined },
        repoPath: settings.repoPath ?? null,
        repoHistory: settings.repoHistory ?? [],
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
        filterByGitAuthors: state.filterByGitAuthors,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  },
}));
