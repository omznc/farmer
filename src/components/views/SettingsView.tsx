import { invoke } from "@tauri-apps/api/core";
import { Check, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { discoverProviders } from "../../lib/aiProviders";
import { useAppStore } from "../../stores/appStore";
import type { AIProvider } from "../../types";
import { PageWrapper } from "../layout/PageWrapper";
import { Button } from "../ui/Button";

const DAYS_OF_WEEK = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

export function SettingsView() {
	const workSchedule = useAppStore((state) => state.workSchedule);
	const setWorkSchedule = useAppStore((state) => state.setWorkSchedule);
	const aiConfig = useAppStore((state) => state.aiConfig);
	const setAIConfig = useAppStore((state) => state.setAIConfig);
	const [gitAuthors, setGitAuthors] = useState(
		(workSchedule?.gitAuthors || []).join(", "),
	);
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [customProvider, setCustomProvider] = useState<Partial<AIProvider>>({
		type: "openai",
		name: "",
		config: { apiKey: "", model: "" },
	});

	const handleDiscoverProviders = useCallback(async () => {
		setIsDiscovering(true);
		try {
			const discovered = await discoverProviders();
			const existingIds = aiConfig.providers.map((p) => p.id);
			const newProviders = discovered.filter(
				(p) => !existingIds.includes(p.id),
			);

			setAIConfig({
				...aiConfig,
				providers: [...aiConfig.providers, ...newProviders],
			});
		} catch (error) {
			console.error("Failed to discover providers:", error);
		} finally {
			setIsDiscovering(false);
		}
	}, [aiConfig, setAIConfig]);

	useEffect(() => {
		const loadGitConfig = async () => {
			if (!workSchedule?.gitAuthors || workSchedule.gitAuthors.length === 0) {
				try {
					const authors = await invoke<string[]>("get_git_config");
					if (authors.length > 0 && workSchedule) {
						setGitAuthors(authors.join(", "));
						setWorkSchedule({
							...workSchedule,
							gitAuthors: authors,
						});
					}
				} catch (error) {
					console.error("Failed to load git config:", error);
				}
			}
		};
		loadGitConfig();

		if (aiConfig.providers.length === 0) {
			handleDiscoverProviders();
		}
	}, [
		aiConfig.providers.length,
		handleDiscoverProviders,
		setWorkSchedule,
		workSchedule,
	]);

	const handleDayToggle = (day: string) => {
		if (!workSchedule) return;
		const newDays = workSchedule.workingDays.includes(day)
			? workSchedule.workingDays.filter((d) => d !== day)
			: [...workSchedule.workingDays, day];
		setWorkSchedule({
			...workSchedule,
			workingDays: newDays,
		});
	};

	const handleGitAuthorsChange = (value: string) => {
		if (!workSchedule) return;
		setGitAuthors(value);
		const authors = value
			.split(",")
			.map((a) => a.trim())
			.filter((a) => a.length > 0);
		setWorkSchedule({
			...workSchedule,
			gitAuthors: authors,
		});
	};

	const handleSelectProvider = (id: string) => {
		const updated = aiConfig.providers.map((p) => ({
			...p,
			enabled: p.id === id,
		}));
		setAIConfig({
			...aiConfig,
			providers: updated,
			selectedProvider: id,
		});
	};

	const handleAddCustomProvider = () => {
		const isOpenAI = customProvider.type === "openai";
		const isValid =
			customProvider.name &&
			(isOpenAI
				? customProvider.config?.apiKey
				: customProvider.config?.baseUrl);

		if (!isValid || !customProvider.name || !customProvider.config) return;

		const newProvider: AIProvider = {
			id: `custom-${Date.now()}`,
			type: customProvider.type as AIProvider["type"],
			name: customProvider.name,
			enabled: true,
			config: customProvider.config,
		};

		const updatedProviders = aiConfig.providers.map((p) => ({
			...p,
			enabled: false,
		}));

		setAIConfig({
			...aiConfig,
			providers: [...updatedProviders, newProvider],
			selectedProvider: newProvider.id,
		});

		setCustomProvider({
			type: "openai",
			name: "",
			config: { apiKey: "", model: "" },
		});
	};

	if (!workSchedule) {
		return (
			<PageWrapper view="settings">
				<div className="flex items-center justify-center py-16">
					<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
				</div>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper view="settings">
			<div className="space-y-4">
				<div className="rounded-lg border border-border bg-bg-secondary p-6">
					<h3 className="text-sm font-medium text-fg-primary mb-4">
						Work Schedule
					</h3>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-fg-primary mb-2">
								Working Days
							</label>
							<div className="flex flex-wrap gap-2">
								{DAYS_OF_WEEK.map((day) => (
									<button
										key={day}
										onClick={() => handleDayToggle(day)}
										className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
											workSchedule?.workingDays?.includes(day)
												? "bg-accent text-black"
												: "bg-bg-tertiary text-fg-secondary hover:bg-bg-hover"
										}`}
									>
										{day.charAt(0).toUpperCase() + day.slice(1)}
									</button>
								))}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-fg-primary mb-2">
								Weekend Work Attribution
							</label>
							<div className="flex gap-2">
								<button
									onClick={() =>
										setWorkSchedule({
											...workSchedule,
											weekendAttribution: "friday",
										})
									}
									className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										workSchedule.weekendAttribution === "friday"
											? "bg-accent text-black"
											: "bg-bg-tertiary text-fg-secondary hover:bg-bg-hover"
									}`}
								>
									Previous Friday
								</button>
								<button
									onClick={() =>
										setWorkSchedule({
											...workSchedule,
											weekendAttribution: "monday",
										})
									}
									className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										workSchedule.weekendAttribution === "monday"
											? "bg-accent text-black"
											: "bg-bg-tertiary text-fg-secondary hover:bg-bg-hover"
									}`}
								>
									Next Monday
								</button>
							</div>
							<p className="text-xs text-fg-muted mt-1">
								Attribute weekend commits to the previous Friday or the next
								Monday
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-fg-primary mb-2">
								Git Authors
							</label>
							<input
								type="text"
								value={gitAuthors}
								onChange={(e) => handleGitAuthorsChange(e.target.value)}
								placeholder="e.g., John Doe, jane@example.com"
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
							/>
							<p className="text-xs text-fg-muted mt-1">
								Enter git author names or emails (comma-separated) to filter
								commits. Only commits from these authors will be included in
								time tracking.
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-lg border border-border bg-bg-secondary p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-sm font-medium text-fg-primary flex items-center gap-2">
							<SettingsIcon className="w-4 h-4" />
							AI Providers
						</h3>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleDiscoverProviders}
							disabled={isDiscovering}
						>
							<RefreshCw
								className={`w-3 h-3 mr-1.5 ${isDiscovering ? "animate-spin" : ""}`}
							/>
							Discover
						</Button>
					</div>

					{aiConfig.providers.length === 0 ? (
						<p className="text-sm text-fg-secondary">
							No AI providers configured. Click "Discover" to auto-detect
							installed providers.
						</p>
					) : (
						<div className="space-y-2">
							{aiConfig.providers.map((provider) => (
								<button
									key={provider.id}
									onClick={() => handleSelectProvider(provider.id)}
									className={`w-full flex items-center justify-between p-3 rounded-md transition-colors ${
										aiConfig.selectedProvider === provider.id
											? "bg-accent/10 border border-accent"
											: "bg-bg-tertiary border border-transparent hover:bg-bg-hover"
									}`}
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
												aiConfig.selectedProvider === provider.id
													? "border-accent"
													: "border-border"
											}`}
										>
											{aiConfig.selectedProvider === provider.id && (
												<div className="w-2 h-2 rounded-full bg-accent" />
											)}
										</div>
										<div className="text-left">
											<div className="text-sm font-medium text-fg-primary">
												{provider.name}
											</div>
											<div className="text-xs text-fg-muted">
												{provider.type === "openai" && "OpenAI API"}
												{provider.type === "openapi" && provider.config.baseUrl}
												{provider.type === "claude-code" && "CLI: claude"}
												{provider.type === "opencode" && "CLI: opencode run"}
											</div>
										</div>
									</div>
									{aiConfig.selectedProvider === provider.id && (
										<Check className="w-4 h-4 text-accent" />
									)}
								</button>
							))}
						</div>
					)}

					<div className="mt-6 pt-6 border-t border-border">
						<h4 className="text-xs font-medium text-fg-primary mb-3">
							Add Custom Provider
						</h4>
						<div className="space-y-3">
							<select
								value={customProvider.type}
								onChange={(e) =>
									setCustomProvider({
										type: e.target.value as AIProvider["type"],
										name: "",
										config:
											e.target.value === "openai"
												? { apiKey: "", model: "" }
												: { baseUrl: "", model: "" },
									})
								}
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent [&>option]:bg-bg-tertiary [&>option]:text-fg-primary"
							>
								<option value="openai">OpenAI</option>
								<option value="openapi">
									OpenAPI Compatible (Ollama, etc.)
								</option>
							</select>
							<input
								type="text"
								placeholder="Provider Name"
								value={customProvider.name || ""}
								onChange={(e) =>
									setCustomProvider({ ...customProvider, name: e.target.value })
								}
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
							/>
							{customProvider.type === "openai" ? (
								<input
									type="password"
									placeholder="API Key"
									value={customProvider.config?.apiKey || ""}
									onChange={(e) =>
										setCustomProvider({
											...customProvider,
											config: {
												...customProvider.config,
												apiKey: e.target.value,
											},
										})
									}
									className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
								/>
							) : (
								<input
									type="text"
									placeholder="Base URL (e.g., http://localhost:11434)"
									value={customProvider.config?.baseUrl || ""}
									onChange={(e) =>
										setCustomProvider({
											...customProvider,
											config: {
												...customProvider.config,
												baseUrl: e.target.value,
											},
										})
									}
									className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
								/>
							)}
							<input
								type="text"
								placeholder={
									customProvider.type === "openai"
										? "Model (e.g., gpt-4o-mini)"
										: "Model (e.g., qwen2.5-coder:3b)"
								}
								value={customProvider.config?.model || ""}
								onChange={(e) =>
									setCustomProvider({
										...customProvider,
										config: { ...customProvider.config, model: e.target.value },
									})
								}
								className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
							/>
							<Button
								variant="secondary"
								size="sm"
								onClick={handleAddCustomProvider}
								disabled={
									!customProvider.name ||
									(customProvider.type === "openai"
										? !customProvider.config?.apiKey
										: !customProvider.config?.baseUrl)
								}
							>
								Add Provider
							</Button>
						</div>
					</div>

					<div className="mt-6 pt-6 border-t border-border">
						<h4 className="text-xs font-medium text-fg-primary mb-3">
							Custom Prompt Instructions
						</h4>
						<p className="text-xs text-fg-muted mb-3">
							Add custom instructions to modify the AI summary behavior. This
							will be appended to the default prompt.
						</p>
						<textarea
							value={aiConfig.customPrompt || ""}
							onChange={(e) =>
								setAIConfig({ ...aiConfig, customPrompt: e.target.value })
							}
							placeholder="e.g., Focus on technical details and use bullet points..."
							rows={4}
							className="w-full px-3 py-2 rounded-md border border-border bg-bg-tertiary text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
						/>
					</div>
				</div>
			</div>
		</PageWrapper>
	);
}
