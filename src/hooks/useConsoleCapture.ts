import { useEffect, useState } from "react";

interface LogEntry {
	timestamp: Date;
	level: "log" | "info" | "warn" | "error";
	message: string;
}

const MAX_LOGS = 500;

let globalLogs: LogEntry[] = [];
const logListeners: Set<() => void> = new Set();
let isInitialized = false;

function addLog(level: LogEntry["level"], args: unknown[]) {
	const message = args
		.map((arg) => {
			if (typeof arg === "object") {
				try {
					return JSON.stringify(arg, null, 2);
				} catch {
					return String(arg);
				}
			}
			return String(arg);
		})
		.join(" ");

	globalLogs = [
		...globalLogs,
		{
			timestamp: new Date(),
			level,
			message,
		},
	].slice(-MAX_LOGS);

	for (const listener of logListeners) {
		listener();
	}
}

export function initConsoleCapture() {
	if (isInitialized) return;

	const originalLog = console.log;
	const originalInfo = console.info;
	const originalWarn = console.warn;
	const originalError = console.error;

	console.log = (...args: unknown[]) => {
		originalLog(...args);
		addLog("log", args);
	};

	console.info = (...args: unknown[]) => {
		originalInfo(...args);
		addLog("info", args);
	};

	console.warn = (...args: unknown[]) => {
		originalWarn(...args);
		addLog("warn", args);
	};

	console.error = (...args: unknown[]) => {
		originalError(...args);
		addLog("error", args);
	};

	isInitialized = true;
	console.log("[ConsoleCapture] Initialized");
}

export function useConsoleCapture() {
	const [logs, setLogs] = useState<LogEntry[]>(globalLogs);

	useEffect(() => {
		initConsoleCapture();

		const updateLogs = () => setLogs([...globalLogs]);
		logListeners.add(updateLogs);

		return () => {
			logListeners.delete(updateLogs);
		};
	}, []);

	const clearLogs = () => {
		globalLogs = [];
		setLogs([]);
	};

	const exportLogs = () => {
		return logs
			.map((log) => {
				const time = log.timestamp.toLocaleTimeString();
				const level = log.level.toUpperCase().padEnd(5);
				return `[${time}] ${level} ${log.message}`;
			})
			.join("\n");
	};

	return { logs, clearLogs, exportLogs };
}
