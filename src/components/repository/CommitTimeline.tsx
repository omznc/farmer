import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { format } from "date-fns";
import { Clock, Copy, GitCommit, Sparkles } from "lucide-react";
import { useState } from "react";
import { isAIConfigured, summarizeCommits } from "../../lib/ai";
import { useAppStore } from "../../stores/appStore";
import type { Commit, WorkDay } from "../../types";
import { Button } from "../ui/Button";
import { Toast } from "../ui/Toast";

interface CommitTimelineProps {
	workDays: WorkDay[];
	repoColorMap?: Map<string, { bg: string; text: string; border: string }>;
}

const DEFAULT_COLOR = {
	bg: "bg-gray-500/20",
	text: "text-gray-400",
	border: "border-gray-500/50",
};

const getCommitUrl = (remoteUrl: string | undefined, hash: string) => {
	if (!remoteUrl) return null;

	const patterns = [
		{
			regex: /github\.com[:/](.+?)(?:\.git)?$/,
			template: (repo: string) => `https://github.com/${repo}/commit/${hash}`,
		},
		{
			regex: /gitlab\.com[:/](.+?)(?:\.git)?$/,
			template: (repo: string) => `https://gitlab.com/${repo}/-/commit/${hash}`,
		},
		{
			regex: /bitbucket\.org[:/](.+?)(?:\.git)?$/,
			template: (repo: string) =>
				`https://bitbucket.org/${repo}/commits/${hash}`,
		},
		{
			regex: /git\.sr\.ht[:/](.+?)(?:\.git)?$/,
			template: (repo: string) => `https://git.sr.ht/${repo}/commit/${hash}`,
		},
		{
			regex: /codeberg\.org[:/](.+?)(?:\.git)?$/,
			template: (repo: string) => `https://codeberg.org/${repo}/commit/${hash}`,
		},
	];

	for (const pattern of patterns) {
		const match = remoteUrl.match(pattern.regex);
		if (match) {
			return pattern.template(match[1]);
		}
	}

	return null;
};

export function CommitTimeline({
	workDays,
	repoColorMap,
}: CommitTimelineProps) {
	if (workDays.length === 0) {
		return (
			<div className="text-center py-12 text-fg-secondary">
				No work days found
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{workDays.map((day, index) => (
				<WorkDayCard
					key={`${day.date}-${index}`}
					workDay={day}
					repoColorMap={repoColorMap}
				/>
			))}
		</div>
	);
}

function WorkDayCard({
	workDay,
	repoColorMap,
}: {
	workDay: WorkDay;
	repoColorMap?: Map<string, { bg: string; text: string; border: string }>;
}) {
	const [toast, setToast] = useState<{ x: number; y: number } | null>(null);
	const [isAiLoading, setIsAiLoading] = useState(false);
	const aiSummary = useAppStore((state) => state.aiSummaries[workDay.date]);
	const setAISummary = useAppStore((state) => state.setAISummary);
	const aiConfigured = isAIConfigured();
	const date = new Date(workDay.date);
	const formattedDate = format(date, "EEEE, MMMM d, yyyy");

	const uniqueRepos = [
		...new Set(workDay.commits.map((c) => c.repoName).filter(Boolean)),
	];

	const copyWorkDay = async (e: React.MouseEvent) => {
		const lines = workDay.commits.map((commit) => {
			const message = commit.message.split("\n")[0];
			const commitUrl = getCommitUrl(commit.remoteUrl, commit.hash);
			const repoPrefix = commit.repoName ? `[${commit.repoName}] ` : "";
			return commitUrl
				? `${repoPrefix}${message} (${commitUrl})`
				: `${repoPrefix}${message}`;
		});

		const text = `${formattedDate}\n\n${lines.join("\n")}`;

		try {
			await writeText(text);
			setToast({ x: e.clientX, y: e.clientY });
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const generateAISummary = async () => {
		console.log("[CommitTimeline] AI Summary clicked");
		setIsAiLoading(true);
		try {
			const commitMessages = workDay.commits.map((c) => {
				const repoPrefix = c.repoName ? `[${c.repoName}] ` : "";
				return `${repoPrefix}${c.message.split("\n")[0]}`;
			});
			console.log("[CommitTimeline] Commit messages:", commitMessages);

			const summary = await summarizeCommits(commitMessages);
			console.log("[CommitTimeline] Got summary:", summary);

			setAISummary(workDay.date, summary);
		} catch (err) {
			console.error("[CommitTimeline] AI summarization failed:", err);
			alert(`AI summarization failed: ${err}`);
		} finally {
			setIsAiLoading(false);
		}
	};

	const copyAISummary = async (e: React.MouseEvent) => {
		if (!aiSummary) return;

		const urls = workDay.commits
			.map((c) => getCommitUrl(c.remoteUrl, c.hash))
			.filter(Boolean)
			.join("\n");

		const text = `${formattedDate}\n\n${aiSummary}${urls ? `\n\nCommits:\n${urls}` : ""}`;

		try {
			await writeText(text);
			setToast({ x: e.clientX, y: e.clientY });
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<>
			<div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
				<div className="px-5 py-4 border-b border-border">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2 mb-1 flex-wrap">
								<h3 className="text-base font-semibold text-fg-primary">
									{formattedDate}
								</h3>
								{uniqueRepos.map((repoName) => {
									const commit = workDay.commits.find(
										(c) => c.repoName === repoName,
									);
									const color =
										repoColorMap?.get(commit?.repoPath || "") || DEFAULT_COLOR;
									const isLocal = !commit?.remoteUrl;
									return (
										<span
											key={repoName}
											className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}
											title={
												isLocal
													? "Local repository (no remote)"
													: commit?.remoteUrl
											}
										>
											{repoName}
											{isLocal && " 📍"}
										</span>
									);
								})}
							</div>
							<div className="flex items-center gap-4 text-sm text-fg-secondary">
								<span className="flex items-center gap-1.5">
									<GitCommit className="w-4 h-4" />
									{workDay.totalCommits} commit
									{workDay.totalCommits !== 1 && "s"}
								</span>
								{workDay.firstCommitTime && (
									<span className="flex items-center gap-1.5">
										<Clock className="w-4 h-4" />
										{String(workDay.firstCommitTime)} -{" "}
										{String(workDay.lastCommitTime || "??:??")}
									</span>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="secondary" size="md" onClick={copyWorkDay}>
								<Copy className="w-3 h-3 mr-1.5" />
								Copy Day
							</Button>
							{aiConfigured && !aiSummary && !isAiLoading && (
								<button
									onClick={generateAISummary}
									className="relative px-3 py-1.5 rounded-md text-sm font-medium text-white overflow-hidden group transition-all animate-pulse-glow"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-[length:200%_100%] animate-gradient" />
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
									<div className="relative flex items-center gap-1.5">
										<Sparkles className="w-3 h-3" />
										AI Summary
									</div>
								</button>
							)}
						</div>
					</div>
				</div>

				{(isAiLoading || aiSummary) && (
					<div className="px-5 py-4 border-b border-border">
						{isAiLoading ? (
							<div className="space-y-3">
								<div className="flex items-center gap-2 mb-4">
									<Sparkles className="w-4 h-4 text-purple-500" />
									<span className="text-xs font-medium text-purple-500">
										Generating summary...
									</span>
								</div>
								<div className="relative h-4 rounded overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20 bg-[length:200%_100%] animate-gradient animate-pulse-glow" />
									<div className="absolute inset-0 overflow-hidden">
										<div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
									</div>
								</div>
								<div
									className="relative h-4 rounded overflow-hidden"
									style={{ width: "80%" }}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20 bg-[length:200%_100%] animate-gradient animate-pulse-glow" />
									<div className="absolute inset-0 overflow-hidden">
										<div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
									</div>
								</div>
								<div
									className="relative h-4 rounded overflow-hidden"
									style={{ width: "60%" }}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20 bg-[length:200%_100%] animate-gradient animate-pulse-glow" />
									<div className="absolute inset-0 overflow-hidden">
										<div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
									</div>
								</div>
							</div>
						) : aiSummary ? (
							<div className="space-y-3">
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-purple-500" />
										<span className="text-xs font-medium text-purple-500">
											AI Summary
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={copyAISummary}
										>
											<Copy className="w-3 h-3 mr-1.5" />
											Copy
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onClick={generateAISummary}
										>
											Regenerate
										</Button>
									</div>
								</div>
								<p className="text-sm text-fg-primary leading-relaxed">
									{aiSummary}
								</p>
								{workDay.commits.some((c) =>
									getCommitUrl(c.remoteUrl, c.hash),
								) && (
									<div className="mt-3 pt-3 border-t border-border/50">
										<p className="text-xs font-medium text-fg-secondary mb-2">
											Commits:
										</p>
										<div className="space-y-1">
											{workDay.commits.map((c) => {
												const url = getCommitUrl(c.remoteUrl, c.hash);
												return url ? (
													<a
														key={c.hash}
														href={url}
														target="_blank"
														rel="noopener noreferrer"
														className="block text-xs text-purple-500 hover:text-purple-400 transition-colors font-mono truncate"
													>
														{url}
													</a>
												) : null;
											})}
										</div>
									</div>
								)}
							</div>
						) : null}
					</div>
				)}

				<div className="p-2">
					<div className="space-y-1">
						{workDay.commits.map((commit) => (
							<CommitItem
								key={commit.hash}
								commit={commit}
								repoColor={repoColorMap?.get(commit.repoPath || "")}
							/>
						))}
					</div>
				</div>
			</div>
			{toast && (
				<Toast
					message="Copied!"
					x={toast.x}
					y={toast.y}
					duration={500}
					onClose={() => setToast(null)}
				/>
			)}
		</>
	);
}

function CommitItem({
	commit,
	repoColor,
}: {
	commit: Commit;
	repoColor?: { bg: string; text: string; border: string };
}) {
	const [toast, setToast] = useState<{ x: number; y: number } | null>(null);
	const commitDate = new Date(commit.timestamp);
	const time = String(
		commitDate.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}),
	);

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const message = commit.message.split("\n")[0];
		const commitUrl = getCommitUrl(commit.remoteUrl, commit.hash);

		const formattedText = commitUrl ? `${message} (${commitUrl})` : message;

		try {
			await writeText(formattedText);
			setToast({ x: e.clientX, y: e.clientY });
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const color = repoColor || DEFAULT_COLOR;

	return (
		<>
			<div
				className="flex items-start gap-3 p-3 rounded-md bg-bg-tertiary hover:bg-bg-hover transition-colors cursor-pointer group"
				onClick={handleCopy}
			>
				<div className="text-xs text-fg-muted font-mono mt-0.5 bg-bg-secondary px-2 py-0.5 rounded">
					{commit.hash.substring(0, 7)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-sm text-fg-primary truncate">
							{commit.message.split("\n")[0]}
						</span>
						{commit.repoName && (
							<span
								className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${color.bg} ${color.text}`}
								title={
									!commit.remoteUrl
										? "Local repository (no remote)"
										: commit.remoteUrl
								}
							>
								{commit.repoName}
								{!commit.remoteUrl && " 📍"}
							</span>
						)}
					</div>
					<div className="flex items-center gap-2 text-xs text-fg-secondary">
						<span className="font-medium">{commit.author}</span>
						<span>•</span>
						<span>{time}</span>
					</div>
				</div>
				<div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
					<Copy className="w-4 h-4 text-fg-secondary" />
				</div>
			</div>
			{toast && (
				<Toast
					message="Copied!"
					x={toast.x}
					y={toast.y}
					duration={500}
					onClose={() => setToast(null)}
				/>
			)}
		</>
	);
}
