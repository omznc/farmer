export interface Commit {
  hash: string;
  author: string;
  timestamp: Date;
  message: string;
  filesChanged: string[];
  repoPath: string;
  remoteUrl?: string;
}

export interface WorkDay {
  date: string;
  commits: Commit[];
  totalCommits: number;
  firstCommitTime?: string;
  lastCommitTime?: string;
}

export interface HarvestConfig {
  accessToken: string;
  accountId: string;
  refreshToken?: string;
  defaultProjectId: number;
  defaultTaskId: number;
  meetingProjectId?: number;
  meetingTaskId?: number;
}

export interface HarvestAccount {
  id: number;
  name: string;
  baseCurrency: string;
}

export interface HarvestUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface HarvestTimeEntryResponse {
  id: number;
  spentDate: string;
  hours: number;
  notes: string | null;
  project?: {
    id: number;
    name: string;
    code?: string;
  };
  task?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HarvestProject {
  id: number;
  name: string;
  code?: string;
  clientId: number;
  clientName: string;
}

export interface HarvestTask {
  id: number;
  name: string;
  billable: boolean;
  hourlyRate?: number;
}

export interface TimeEntry {
  id?: number;
  projectId: number;
  taskId: number;
  spentDate: Date;
  hours: number;
  notes: string;
  externalReference?: string;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  calendarSource: "google" | "outlook" | "ical";
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
  filterByGitAuthors: boolean;
  workSchedule: WorkSchedule;
  aiConfig: AIConfig;
  workDays: WorkDay[];
  isLoading: boolean;
  error: string | null;
}
