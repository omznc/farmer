import { useEffect, useState, useRef } from "react";

interface LogEntry {
	timestamp: Date;
	level: "log" | "info" | "warn" | "error";
	message: string;
}

export function useConsoleCapture(maxLogs = 500) {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const originalConsole = useRef<{
		log: typeof console.log;
		info: typeof console.info;
		warn: typeof console.warn;
		error: typeof console.error;
	} | null>(null);

	useEffect(() => {
		// Store original console methods
		if (!originalConsole.current) {
			originalConsole.current = {
				log: console.log,
				info: console.info,
				warn: console.warn,
				error: console.error,
			};
		}

		const addLog = (level: LogEntry["level"], args: unknown[]) => {
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

			setLogs((prev) => {
				const newLogs = [
					...prev,
					{
						timestamp: new Date(),
						level,
						message,
					},
				];
				// Keep only last maxLogs entries
				return newLogs.slice(-maxLogs);
			});
		};

		// Override console methods
		console.log = (...args: unknown[]) => {
			originalConsole.current?.log(...args);
			addLog("log", args);
		};

		console.info = (...args: unknown[]) => {
			originalConsole.current?.info(...args);
			addLog("info", args);
		};

		console.warn = (...args: unknown[]) => {
			originalConsole.current?.warn(...args);
			addLog("warn", args);
		};

		console.error = (...args: unknown[]) => {
			originalConsole.current?.error(...args);
			addLog("error", args);
		};

		// Cleanup: restore original console methods
		return () => {
			if (originalConsole.current) {
				console.log = originalConsole.current.log;
				console.info = originalConsole.current.info;
				console.warn = originalConsole.current.warn;
				console.error = originalConsole.current.error;
			}
		};
	}, [maxLogs]);

	const clearLogs = () => setLogs([]);

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
