import { Command } from "@tauri-apps/plugin-shell";
import type { AIProvider, AIVerbosity } from "../types";

export type StreamCallback = (chunk: string) => void;

export interface CancellablePromise<T> {
	promise: Promise<T>;
	cancel: () => void;
}

function getVerbosityInstructions(verbosity: AIVerbosity): string {
	switch (verbosity) {
		case "concise":
			return "Summarize what I accomplished in exactly 1 sentence written in FIRST PERSON. Be brief and to the point.";
		case "detailed":
			return "Summarize what I accomplished in 4-5 sentences written in FIRST PERSON. Include specific details about the changes made, technologies used, and the impact of the work.";
		default:
			return 'Summarize what I accomplished overall in 2-3 sentences written in FIRST PERSON. Use "I" not "we" or "the team".';
	}
}

function buildPrompt(
	commitList: string,
	verbosity: AIVerbosity,
	customPrompt?: string,
	isDeepAnalysis?: boolean,
): string {
	const verbosityInstructions = getVerbosityInstructions(verbosity);

	let prompt = `You are a text summarization assistant. Do NOT use any tools, git commands, or file system access. This is pure text summarization.

Task: These are separate commit messages from a single day of work. Each commit represents a DIFFERENT task or change I made. ${verbosityInstructions}

IMPORTANT: These are independent commits, not steps in a single feature. Don't assume they're related unless the messages clearly indicate they are.`;

	if (isDeepAnalysis) {
		prompt += `\n\nThe commit messages below include actual code diffs (lines starting with + for additions, - for deletions). Use these diffs to provide more specific and technical details about what changed.`;
	}

	prompt += `\n\nCommit messages${isDeepAnalysis ? " with diffs" : ""}:
${commitList}`;

	if (customPrompt?.trim()) {
		prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`;
	}

	prompt += `\n\nRespond with ONLY the summary text, nothing else.`;

	return prompt;
}

async function commandExists(command: string): Promise<boolean> {
	try {
		// Use 'where' on Windows, 'which' on Unix
		// Check multiple methods for Windows detection
		const isWindows =
			navigator.userAgent.toLowerCase().includes("win") ||
			navigator.platform.toLowerCase().includes("win") ||
			(typeof process !== "undefined" && process.platform === "win32");

		const checkCmd = isWindows ? "where" : "which";
		console.log(
			`[commandExists] Checking for '${command}' using '${checkCmd}' (Windows: ${isWindows})`,
		);

		const output = await Command.create(checkCmd, [command]).execute();
		console.log(
			`[commandExists] ${command} - exit code: ${output.code}, stdout: ${output.stdout.substring(0, 100)}`,
		);
		return output.code === 0;
	} catch (error) {
		console.error(`[commandExists] Error checking ${command}:`, error);
		return false;
	}
}

export async function discoverProviders(): Promise<AIProvider[]> {
	const providers: AIProvider[] = [];

	const claudeCode = await checkClaudeCode();
	if (claudeCode) providers.push(claudeCode);

	const opencode = await checkOpenCode();
	if (opencode) providers.push(opencode);

	const ollama = await checkOllama();
	if (ollama) providers.push(ollama);

	return providers;
}

async function checkClaudeCode(): Promise<AIProvider | null> {
	if (!(await commandExists("claude"))) return null;
	return {
		id: "claude-code",
		type: "claude-code",
		name: "Claude Code",
		enabled: false,
		config: {
			command: "claude",
		},
	};
}

async function checkOpenCode(): Promise<AIProvider | null> {
	console.log("[checkOpenCode] Checking for OpenCode...");
	const exists = await commandExists("opencode");
	console.log("[checkOpenCode] OpenCode exists:", exists);
	if (!exists) return null;
	return {
		id: "opencode",
		type: "opencode",
		name: "OpenCode",
		enabled: false,
		config: {
			command: "opencode",
		},
	};
}

async function checkOllama(): Promise<AIProvider | null> {
	try {
		const response = await fetch("http://localhost:11434/api/tags");
		if (response.ok) {
			const data = await response.json();
			if (data.models && data.models.length > 0) {
				return {
					id: "ollama",
					type: "openapi",
					name: "Ollama",
					enabled: false,
					config: {
						baseUrl: "http://localhost:11434",
						model: "qwen2.5-coder:3b",
					},
				};
			}
		}
	} catch {
		// Not available
	}
	return null;
}

export async function summarizeWithProvider(
	provider: AIProvider,
	commits: string[],
	customPrompt?: string,
	verbosity?: AIVerbosity,
	isDeepAnalysis?: boolean,
): Promise<string> {
	console.log(
		`[AI Provider] Using ${provider.type} for ${commits.length} commits (deep: ${isDeepAnalysis ?? false})`,
	);

	const commitList = commits.map((c) => c).join("\n");
	const prompt = buildPrompt(
		commitList,
		verbosity ?? "normal",
		customPrompt,
		isDeepAnalysis,
	);

	console.log("[AI Provider] Prompt length:", prompt.length);

	switch (provider.type) {
		case "claude-code":
			return summarizeWithClaudeCode(provider, prompt);
		case "opencode":
			return summarizeWithOpenCode(provider, prompt);
		case "openai":
			return summarizeWithOpenAI(provider, prompt);
		case "openapi":
			return summarizeWithOpenAPI(provider, prompt);
		default:
			throw new Error(`Unsupported provider type: ${provider.type}`);
	}
}

export function summarizeWithProviderStream(
	provider: AIProvider,
	commits: string[],
	onChunk: StreamCallback,
	customPrompt?: string,
	verbosity?: AIVerbosity,
	isDeepAnalysis?: boolean,
): CancellablePromise<string> {
	console.log(
		`[AI Provider Stream] Using ${provider.type} for ${commits.length} commits (deep: ${isDeepAnalysis ?? false})`,
	);

	const commitList = commits.map((c) => c).join("\n");
	const prompt = buildPrompt(
		commitList,
		verbosity ?? "normal",
		customPrompt,
		isDeepAnalysis,
	);

	console.log("[AI Provider Stream] Prompt length:", prompt.length);

	switch (provider.type) {
		case "claude-code":
			return summarizeWithClaudeCodeStream(provider, prompt, onChunk);
		case "opencode":
			return summarizeWithOpenCodeStream(provider, prompt, onChunk);
		case "openai":
			return summarizeWithOpenAIStream(provider, prompt, onChunk);
		case "openapi":
			return summarizeWithOpenAPIStream(provider, prompt, onChunk);
		default:
			throw new Error(`Unsupported provider type: ${provider.type}`);
	}
}

async function summarizeWithClaudeCode(
	provider: AIProvider,
	prompt: string,
): Promise<string> {
	console.log("[Claude Code] Executing command");
	const command = Command.create(provider.config.command || "claude", [
		"-p",
		prompt,
	]);
	const output = await command.execute();

	console.log("[Claude Code] Exit code:", output.code);
	console.log("[Claude Code] stdout length:", output.stdout.length);
	console.log("[Claude Code] stderr:", output.stderr);

	if (output.code !== 0) {
		throw new Error(`Claude Code failed: ${output.stderr}`);
	}

	return output.stdout.trim();
}

async function summarizeWithOpenCode(
	provider: AIProvider,
	prompt: string,
): Promise<string> {
	console.log("[OpenCode] Executing command");
	const command = Command.create(provider.config.command || "opencode", [
		"run",
		prompt,
	]);
	const output = await command.execute();

	console.log("[OpenCode] Exit code:", output.code);
	console.log("[OpenCode] stdout length:", output.stdout.length);
	console.log("[OpenCode] stderr:", output.stderr);

	if (output.code !== 0) {
		throw new Error(`OpenCode failed: ${output.stderr}`);
	}

	const result = output.stdout.trim();
	if (!result) {
		console.error("[OpenCode] Empty stdout. Full stderr:", output.stderr);
		throw new Error(
			"OpenCode returned empty response. The model may have output to stderr or failed to generate text. Try a different AI provider.",
		);
	}

	return result;
}

async function summarizeWithOpenAI(
	provider: AIProvider,
	prompt: string,
): Promise<string> {
	console.log("[OpenAI] Starting request");
	const apiKey = provider.config.apiKey;
	if (!apiKey) {
		throw new Error("OpenAI API key is required");
	}

	const model = provider.config.model || "gpt-4o-mini";
	console.log("[OpenAI] Using model:", model);

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: 200,
		}),
	});

	console.log("[OpenAI] Response status:", response.status);

	if (!response.ok) {
		const error = await response.text();
		console.error("[OpenAI] Error response:", error);
		throw new Error(
			`OpenAI API request failed: ${response.statusText} - ${error}`,
		);
	}

	const data = await response.json();
	console.log(
		"[OpenAI] Got response, message length:",
		data.choices[0].message.content.length,
	);
	return data.choices[0].message.content.trim();
}

async function summarizeWithOpenAPI(
	provider: AIProvider,
	prompt: string,
): Promise<string> {
	const baseUrl = provider.config.baseUrl || "http://localhost:11434";
	const model = provider.config.model || "qwen2.5-coder:3b";

	console.log(`[OpenAPI] Calling ${baseUrl} with model ${model}`);

	const response = await fetch(`${baseUrl}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model,
			prompt,
			stream: false,
		}),
	});

	console.log("[OpenAPI] Response status:", response.status);

	if (!response.ok) {
		const errorText = await response.text();
		console.error("[OpenAPI] Error response:", errorText);
		throw new Error(
			`API request failed: ${response.statusText} - ${errorText}`,
		);
	}

	const data = await response.json();
	console.log("[OpenAPI] Response length:", data.response?.length || 0);
	return data.response.trim();
}

function summarizeWithClaudeCodeStream(
	provider: AIProvider,
	prompt: string,
	onChunk: StreamCallback,
): CancellablePromise<string> {
	console.log("[Claude Code] Executing command");
	const command = Command.create(provider.config.command || "claude", [
		"-p",
		prompt,
	]);

	let cancelled = false;

	const promise = (async () => {
		console.log("[Claude Code] Calling execute()...");
		const output = await command.execute();
		console.log("[Claude Code] Exit code:", output.code);
		console.log("[Claude Code] stdout length:", output.stdout.length);

		if (cancelled) {
			return "";
		}

		if (output.code !== 0) {
			throw new Error(`Claude Code failed: ${output.stderr}`);
		}

		const result = output.stdout.trim();
		onChunk(result);
		return result;
	})();

	return {
		promise,
		cancel: () => {
			cancelled = true;
			console.log("[Claude Code] Cancel requested");
		},
	};
}

function summarizeWithOpenCodeStream(
	provider: AIProvider,
	prompt: string,
	onChunk: StreamCallback,
): CancellablePromise<string> {
	console.log("[OpenCode] Executing command");
	const command = Command.create(provider.config.command || "opencode", [
		"run",
		prompt,
	]);

	let cancelled = false;

	const promise = (async () => {
		console.log("[OpenCode] Calling execute()...");
		const output = await command.execute();
		console.log("[OpenCode] Exit code:", output.code);
		console.log("[OpenCode] stdout length:", output.stdout.length);

		if (cancelled) {
			return "";
		}

		if (output.code !== 0) {
			throw new Error(`OpenCode failed: ${output.stderr}`);
		}

		const result = output.stdout.trim();
		if (!result) {
			console.error("[OpenCode] Empty stdout. stderr:", output.stderr);
			throw new Error(
				"OpenCode returned empty response. Try a different AI provider.",
			);
		}

		onChunk(result);
		return result;
	})();

	return {
		promise,
		cancel: () => {
			cancelled = true;
			console.log("[OpenCode] Cancel requested");
		},
	};
}

function summarizeWithOpenAIStream(
	provider: AIProvider,
	prompt: string,
	onChunk: StreamCallback,
): CancellablePromise<string> {
	console.log("[OpenAI Stream] Starting request");
	const apiKey = provider.config.apiKey;
	if (!apiKey) {
		throw new Error("OpenAI API key is required");
	}

	const model = provider.config.model || "gpt-4o-mini";
	console.log("[OpenAI Stream] Using model:", model);

	const abortController = new AbortController();

	const promise = (async () => {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [{ role: "user", content: prompt }],
				temperature: 0.7,
				max_tokens: 200,
				stream: true,
			}),
			signal: abortController.signal,
		});

		console.log("[OpenAI Stream] Response status:", response.status);

		if (!response.ok) {
			const error = await response.text();
			console.error("[OpenAI Stream] Error response:", error);
			throw new Error(
				`OpenAI API request failed: ${response.statusText} - ${error}`,
			);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("Response body is not readable");
		}

		const decoder = new TextDecoder();
		let fullContent = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split("\n").filter((line) => line.trim() !== "");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6);
						if (data === "[DONE]") continue;

						try {
							const parsed = JSON.parse(data);
							const content = parsed.choices?.[0]?.delta?.content;
							if (content) {
								fullContent += content;
								onChunk(content);
							}
						} catch {
							// Skip malformed JSON chunks
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}

		console.log("[OpenAI Stream] Got response, length:", fullContent.length);
		return fullContent.trim();
	})();

	return {
		promise,
		cancel: () => {
			abortController.abort();
			console.log("[OpenAI Stream] Request aborted");
		},
	};
}

function summarizeWithOpenAPIStream(
	provider: AIProvider,
	prompt: string,
	onChunk: StreamCallback,
): CancellablePromise<string> {
	const baseUrl = provider.config.baseUrl || "http://localhost:11434";
	const model = provider.config.model || "qwen2.5-coder:3b";

	console.log(`[OpenAPI Stream] Calling ${baseUrl} with model ${model}`);

	const abortController = new AbortController();

	const promise = (async () => {
		const response = await fetch(`${baseUrl}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model,
				prompt,
				stream: true,
			}),
			signal: abortController.signal,
		});

		console.log("[OpenAPI Stream] Response status:", response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[OpenAPI Stream] Error response:", errorText);
			throw new Error(
				`API request failed: ${response.statusText} - ${errorText}`,
			);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("Response body is not readable");
		}

		const decoder = new TextDecoder();
		let fullContent = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split("\n").filter((line) => line.trim() !== "");

				for (const line of lines) {
					try {
						const parsed = JSON.parse(line);
						if (parsed.response) {
							fullContent += parsed.response;
							onChunk(parsed.response);
						}
					} catch {
						// Skip malformed JSON chunks
					}
				}
			}
		} finally {
			reader.releaseLock();
		}

		console.log("[OpenAPI Stream] Response length:", fullContent.length);
		return fullContent.trim();
	})();

	return {
		promise,
		cancel: () => {
			abortController.abort();
			console.log("[OpenAPI Stream] Request aborted");
		},
	};
}
