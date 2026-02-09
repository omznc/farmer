import type { WorkDay } from "../../types";
import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../stores/appStore";
import { RepositorySelector } from "../repository/RepositorySelector";
import { CommitTimeline } from "../repository/CommitTimeline";
import { Button } from "../ui/Button";
import { FolderOpen, Clock, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay } from "date-fns";

const EMPTY_AUTHORS: string[] = [];

export function RepositoryView() {
  const [showSelector, setShowSelector] = useState(false);
  const workDays = useAppStore((state) => state.workDays);
  const setWorkDays = useAppStore((state) => state.setWorkDays);
  const repoPath = useAppStore((state) => state.repoPath);
  const repoHistory = useAppStore((state) => state.repoHistory);
  const setRepoPath = useAppStore((state) => state.setRepoPath);
  const isLoading = useAppStore((state) => state.isLoading);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const gitAuthors = useAppStore((state) => state.workSchedule?.gitAuthors ?? EMPTY_AUTHORS);
  const filterByGitAuthors = useAppStore((state) => state.filterByGitAuthors);
  const setFilterByGitAuthors = useAppStore((state) => state.setFilterByGitAuthors);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const hasAutoLoaded = useRef(false);

  useEffect(() => {
    if (repoPath && workDays.length === 0 && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      console.log("[Repository] Auto-loading repository on mount");
      handleAnalyzeRepository(repoPath);
    }
  }, [repoPath, workDays.length]);

  const handleAnalyzeRepository = async (path: string, overrideFilter?: boolean) => {
    try {
      setLoading(true);
      const shouldFilter = overrideFilter !== undefined ? overrideFilter : filterByGitAuthors;
      const authorsToUse = shouldFilter ? gitAuthors : [];
      console.log("[Repository] Analyzing with:", {
        filterByGitAuthors,
        overrideFilter,
        shouldFilter,
        gitAuthors,
        authorsToUse,
        willFilter: authorsToUse.length > 0
      });
      const days = await invoke<WorkDay[]>("analyze_repository", {
        repoPath: path,
        gitAuthors: authorsToUse,
      });
      setWorkDays(days);
      setRepoPath(path);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepository = async (path: string) => {
    await handleAnalyzeRepository(path);
    setShowSelector(false);
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
    return workDays.filter(day => {
      if (!startDate || !endDate) return true;
      const dayDate = typeof day.date === 'string' ? day.date : format(new Date(day.date), "yyyy-MM-dd");
      return dayDate >= startDate && dayDate <= endDate;
    });
  }, [workDays, startDate, endDate]);

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
                if (repoPath) {
                  handleAnalyzeRepository(repoPath, newValue);
                }
              }}
              className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
            />
            <span className="text-sm text-fg-secondary">
              Filter by authors {filterByGitAuthors && gitAuthors.length === 0 && "(⚠️ no authors configured)"}
            </span>
          </label>
          <Button onClick={() => setShowSelector(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Select Repository
          </Button>
        </div>
      </div>

      {repoPath && (
        <div className="rounded-lg border border-border bg-bg-secondary p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-fg-secondary mb-1">Current Repository</p>
              <p className="text-sm font-mono text-fg-primary">{repoPath}</p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleAnalyzeRepository(repoPath)}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-fg-secondary" />
            <span className="text-sm font-medium text-fg-primary">Date Range</span>
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
              <label className="block text-xs font-medium text-fg-secondary mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary mb-2">End Date</label>
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
              <span>Showing: {startDate} to {endDate}</span>
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
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-fg-secondary" />
              <h3 className="text-sm font-medium text-fg-primary">Recent Repositories</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {repoHistory.slice(0, 5).map((path, index) => (
              <div
                key={index}
                className="p-3 hover:bg-bg-tertiary transition-colors cursor-pointer flex items-center justify-between"
                onClick={() => handleAnalyzeRepository(path)}
              >
                <span className="text-sm font-mono text-fg-primary truncate flex-1">
                  {path}
                </span>
                {path === repoPath && (
                  <span className="text-xs text-accent ml-2">Current</span>
                )}
              </div>
            ))}
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
          <p className="text-sm text-fg-secondary">Analyzing repository...</p>
        </div>
      )}

      {!isLoading && filteredWorkDays.length === 0 && !repoPath && (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
          <FolderOpen className="w-12 h-12 text-fg-muted mb-4" />
          <p className="text-fg-secondary mb-1">No repository selected</p>
          <p className="text-sm text-fg-muted">Select a Git repository to analyze commits</p>
        </div>
      )}

      {!isLoading && filteredWorkDays.length === 0 && repoPath && workDays.length === 0 && (
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
          <p className="text-fg-secondary mb-1">No commits in selected date range</p>
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
          <CommitTimeline workDays={filteredWorkDays} />
        </div>
      )}
    </div>
  );
}
