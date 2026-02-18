import { invoke } from "@tauri-apps/api/core";
import {
	endOfDay,
	endOfWeek,
	format,
	startOfDay,
	startOfWeek,
	subWeeks,
} from "date-fns";
import { Calendar, Clock, FolderOpen, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../../stores/appStore";
import type { Commit, WorkDay } from "../../types";
import { CommitTimeline } from "../repository/CommitTimeline";
import { RepositorySelector } from "../repository/RepositorySelector";
import { Button } from "../ui/Button";

const EMPTY_AUTHORS: string[] = [];

const REPO_COLORS = [
	{ bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/50" },
	{
		bg: "bg-green-500/20",
		text: "text-green-400",
		border: "border-green-500/50",
	},
	{
		bg: "bg-purple-500/20",
		text: "text-purple-400",
		border: "border-purple-500/50",
	},
	{
		bg: "bg-orange-500/20",
		text: "text-orange-400",
		border: "border-orange-500/50",
	},
	{ bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/50" },
	{ bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" },
	{
		bg: "bg-yellow-500/20",
		text: "text-yellow-400",
		border: "border-yellow-500/50",
	},
	{ bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" },
];

export function getRepoColor(index: number) {
	return REPO_COLORS[index % REPO_COLORS.length];
}

function getRepoName(path: string): string {
	const parts = path.split("/");
	return parts[parts.length - 1] || path;
}

export function RepositoryView() {
	const [showSelector, setShowSelector] = useState(false);
	const workDays = useAppStore((state) => state.workDays);
	const setWorkDays = useAppStore((state) => state.setWorkDays);
	const repoPath = useAppStore((state) => state.repoPath);
	const repoHistory = useAppStore((state) => state.repoHistory);
	const setRepoPath = useAppStore((state) => state.setRepoPath);
	const activeRepos = useAppStore((state) => state.activeRepos);
	const toggleActiveRepo = useAppStore((state) => state.toggleActiveRepo);
	const addRepoToHistory = useAppStore((state) => state.addRepoToHistory);
	const isLoading = useAppStore((state) => state.isLoading);
	const setLoading = useAppStore((state) => state.setLoading);
	const setError = useAppStore((state) => state.setError);
	const gitAuthors = useAppStore(
		(state) => state.workSchedule?.gitAuthors ?? EMPTY_AUTHORS,
	);
	const filterByGitAuthors = useAppStore((state) => state.filterByGitAuthors);
	const setFilterByGitAuthors = useAppStore(
		(state) => state.setFilterByGitAuthors,
	);

	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [showDatePicker, setShowDatePicker] = useState(false);
	const hasAutoLoaded = useRef(false);

	const reposToAnalyze =
		activeRepos.length > 0 ? activeRepos : repoPath ? [repoPath] : [];

	const handleAnalyzeRepositories = useCallback(
		async (paths: string[], overrideFilter?: boolean) => {
			if (paths.length === 0) return;

			try {
				setLoading(true);
				const shouldFilter =
					overrideFilter !== undefined ? overrideFilter : filterByGitAuthors;
				const authorsToUse = shouldFilter ? gitAuthors : [];

				console.log("[Repository] Analyzing repos:", paths);

				const commitsByDate = new Map<string, Commit[]>();

				for (const path of paths) {
					try {
						const days = await invoke<WorkDay[]>("analyze_repository", {
							repoPath: path,
							gitAuthors: authorsToUse,
						});

						const repoName = getRepoName(path);

						for (const day of days) {
							const commitsWithRepo = day.commits.map((c) => ({
								...c,
								repoPath: path,
								repoName,
							}));

							const existing = commitsByDate.get(day.date) || [];
							commitsByDate.set(day.date, [...existing, ...commitsWithRepo]);
						}
					} catch (e) {
						console.error(`Failed to analyze ${path}:`, e);
					}
				}

				const mergedWorkDays: WorkDay[] = [];
				commitsByDate.forEach((commits, date) => {
					commits.sort(
						(a, b) =>
							new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
					);

					const times = commits.map((c) => new Date(c.timestamp));
					const firstCommit = times.reduce((a, b) => (a < b ? a : b));
					const lastCommit = times.reduce((a, b) => (a > b ? a : b));

					mergedWorkDays.push({
						date,
						commits,
						totalCommits: commits.length,
						firstCommitTime: firstCommit.toLocaleTimeString("en-US", {
							hour: "numeric",
							minute: "2-digit",
							hour12: true,
						}),
						lastCommitTime: lastCommit.toLocaleTimeString("en-US", {
							hour: "numeric",
							minute: "2-digit",
							hour12: true,
						}),
					});
				});

				mergedWorkDays.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);

				setWorkDays(mergedWorkDays);

				if (paths.length === 1) {
					setRepoPath(paths[0]);
				}
			} catch (e) {
				setError(String(e));
			} finally {
				setLoading(false);
			}
		},
		[
			filterByGitAuthors,
			gitAuthors,
			setLoading,
			setError,
			setWorkDays,
			setRepoPath,
		],
	);

	useEffect(() => {
		if (
			reposToAnalyze.length > 0 &&
			workDays.length === 0 &&
			!hasAutoLoaded.current
		) {
			hasAutoLoaded.current = true;
			console.log("[Repository] Auto-loading repositories on mount");
			handleAnalyzeRepositories(reposToAnalyze);
		}
	}, [
		reposToAnalyze.length,
		workDays.length,
		handleAnalyzeRepositories,
		reposToAnalyze,
	]);

	const handleSelectRepository = async (path: string) => {
		addRepoToHistory(path);
		if (!activeRepos.includes(path)) {
			toggleActiveRepo(path);
		}
		await handleAnalyzeRepositories([path]);
		setShowSelector(false);
	};

	const handleRefresh = () => {
		if (reposToAnalyze.length > 0) {
			handleAnalyzeRepositories(reposToAnalyze);
		}
	};

	const setDateRange = (start: Date, end: Date) => {
		setStartDate(format(start, "yyyy-MM-dd"));
		setEndDate(format(end, "yyyy-MM-dd"));
		setShowDatePicker(false);
	};

	const handleThisWeek = () => {
		const start = startOfWeek(new Date(), { weekStartsOn: 1 });
		const end = endOfWeek(new Date(), { weekStartsOn: 1 });
		setDateRange(start, end);
	};

	const handleLastWeek = () => {
		const lastWeek = subWeeks(new Date(), 1);
		const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
		const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
		setDateRange(start, end);
	};

	const handleToday = () => {
		const today = new Date();
		setDateRange(startOfDay(today), endOfDay(today));
	};

	const filteredWorkDays = useMemo(() => {
		return workDays.filter((day) => {
			if (!startDate || !endDate) return true;
			const dayDate =
				typeof day.date === "string"
					? day.date
					: format(new Date(day.date), "yyyy-MM-dd");
			return dayDate >= startDate && dayDate <= endDate;
		});
	}, [workDays, startDate, endDate]);

	const repoColorMap = useMemo(() => {
		const map = new Map<string, { bg: string; text: string; border: string }>();
		reposToAnalyze.forEach((path, index) => {
			map.set(path, getRepoColor(index));
		});
		return map;
	}, [reposToAnalyze]);

	return (
		<div className="flex flex-col gap-6 p-8">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-fg-primary">
						Repository Analysis
					</h2>
					<p className="text-sm text-fg-secondary">
						Analyze Git commits to generate copy-pasteable work summaries
					</p>
				</div>
				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={filterByGitAuthors}
							onChange={(e) => {
								const newValue = e.target.checked;
								console.log("[Repository] Checkbox changed to:", newValue);
								setFilterByGitAuthors(newValue);
								if (reposToAnalyze.length > 0) {
									handleAnalyzeRepositories(reposToAnalyze, newValue);
								}
							}}
							className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
						/>
						<span className="text-sm text-fg-secondary">
							Filter by authors{" "}
							{filterByGitAuthors &&
								gitAuthors.length === 0 &&
								"(⚠️ no authors configured)"}
						</span>
					</label>
					<Button onClick={() => setShowSelector(true)}>
						<FolderOpen className="w-4 h-4 mr-2" />
						Add Repository
					</Button>
				</div>
			</div>

			{activeRepos.length > 0 && (
				<div className="rounded-lg border border-border bg-bg-secondary p-4">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<p className="text-xs text-fg-secondary mb-2">
								Active Repositories ({activeRepos.length})
							</p>
							<div className="flex flex-wrap gap-2">
								{activeRepos.map((path, index) => {
									const color = getRepoColor(index);
									const name = getRepoName(path);
									return (
										<div
											key={path}
											className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${color.bg} ${color.text}`}
										>
											<span className="max-w-[150px] truncate" title={path}>
												{name}
											</span>
										</div>
									);
								})}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								size="sm"
								onClick={handleRefresh}
								disabled={isLoading}
							>
								<RefreshCw
									className={`w-3 h-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									useAppStore.getState().setActiveRepos([]);
									setWorkDays([]);
								}}
							>
								Clear All
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="rounded-lg border border-border bg-bg-secondary p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4 text-fg-secondary" />
						<span className="text-sm font-medium text-fg-primary">
							Date Range
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" onClick={handleToday}>
							Today
						</Button>
						<Button variant="secondary" size="sm" onClick={handleThisWeek}>
							This Week
						</Button>
						<Button variant="secondary" size="sm" onClick={handleLastWeek}>
							Last Week
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setShowDatePicker(!showDatePicker)}
						>
							Custom...
						</Button>
					</div>
				</div>

				{showDatePicker && (
					<div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
						<div>
							<label className="block text-xs font-medium text-fg-secondary mb-2">
								Start Date
							</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-fg-secondary mb-2">
								End Date
							</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
							/>
						</div>
					</div>
				)}

				{(startDate || endDate) && (
					<div className="mt-3 pt-3 border-t border-border text-xs text-fg-secondary">
						{startDate && endDate ? (
							<span>
								Showing: {startDate} to {endDate}
							</span>
						) : startDate ? (
							<span>From: {startDate}</span>
						) : (
							<span>Until: {endDate}</span>
						)}
					</div>
				)}
			</div>

			{repoHistory.length > 0 && (
				<div className="rounded-lg border border-border bg-bg-secondary">
					<div className="p-4 border-b border-border">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-fg-secondary" />
								<h3 className="text-sm font-medium text-fg-primary">
									Recent Repositories
								</h3>
							</div>
							<span className="text-xs text-fg-secondary">
								{activeRepos.length} selected
							</span>
						</div>
					</div>
					<div className="divide-y divide-border">
						{repoHistory.slice(0, 10).map((path, index) => {
							const isActive = activeRepos.includes(path);
							const color = getRepoColor(activeRepos.indexOf(path));
							const name = getRepoName(path);

							return (
								<div
									key={index}
									className="p-3 hover:bg-bg-tertiary transition-colors flex items-center gap-3"
								>
									<button
										onClick={() => {
											toggleActiveRepo(path);
											setTimeout(() => {
												const newActiveRepos =
													useAppStore.getState().activeRepos;
												handleAnalyzeRepositories(
													newActiveRepos.length > 0 ? newActiveRepos : [path],
												);
											}, 0);
										}}
										className={`relative w-5 h-5 rounded border-2 transition-all flex-shrink-0 ${
											isActive
												? `${color.bg} ${color.border}`
												: "border-border bg-transparent hover:border-fg-secondary"
										}`}
										title={isActive ? "Deselect" : "Select"}
									>
										{isActive && (
											<svg
												className={`w-3 h-3 absolute inset-0.5 ${color.text}`}
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M2 6L5 9L10 3"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										)}
									</button>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-mono text-fg-primary truncate block">
											{path}
										</span>
									</div>
									{isActive && (
										<span
											className={`text-xs px-2 py-0.5 rounded ${color.bg} ${color.text}`}
										>
											{name}
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{showSelector && (
				<RepositorySelector
					onSelect={handleSelectRepository}
					onClose={() => setShowSelector(false)}
				/>
			)}

			{isLoading && (
				<div className="flex flex-col items-center justify-center py-16">
					<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
					<p className="text-sm text-fg-secondary">Analyzing repositories...</p>
				</div>
			)}

			{!isLoading &&
				filteredWorkDays.length === 0 &&
				activeRepos.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
						<FolderOpen className="w-12 h-12 text-fg-muted mb-4" />
						<p className="text-fg-secondary mb-1">No repositories selected</p>
						<p className="text-sm text-fg-muted">
							Select one or more repositories from the list above
						</p>
					</div>
				)}

			{!isLoading &&
				filteredWorkDays.length === 0 &&
				activeRepos.length > 0 &&
				workDays.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
						<FolderOpen className="w-12 h-12 text-fg-muted mb-4" />
						<p className="text-fg-secondary mb-1">No commits found</p>
						<p className="text-sm text-fg-muted">
							{filterByGitAuthors && gitAuthors.length > 0
								? "No commits found from configured git authors in the last 90 days"
								: "No commits found in the last 90 days"}
						</p>
					</div>
				)}

			{!isLoading && filteredWorkDays.length === 0 && workDays.length > 0 && (
				<div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
					<Calendar className="w-12 h-12 text-fg-muted mb-4" />
					<p className="text-fg-secondary mb-1">
						No commits in selected date range
					</p>
					<p className="text-sm text-fg-muted">Try a different date range</p>
				</div>
			)}

			{!isLoading && filteredWorkDays.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-fg-primary">
							Work Days Found
						</h3>
						<span className="text-sm text-fg-secondary">
							{filteredWorkDays.length} days with commits
						</span>
					</div>
					<CommitTimeline
						workDays={filteredWorkDays}
						repoColorMap={repoColorMap}
					/>
				</div>
			)}
		</div>
	);
}
