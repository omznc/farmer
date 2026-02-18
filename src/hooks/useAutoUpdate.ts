import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";

export interface UpdateInfo {
	version: string;
	date?: string;
	body?: string;
}

export type UpdateStatus =
	| "idle"
	| "checking"
	| "available"
	| "downloading"
	| "ready"
	| "no-update"
	| "error";

export interface UseAutoUpdateReturn {
	status: UpdateStatus;
	updateInfo: UpdateInfo | null;
	error: string | null;
	checkForUpdates: () => Promise<void>;
	installUpdate: () => Promise<void>;
	downloadProgress: number;
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

export function useAutoUpdate(
	autoCheck = true,
	checkIntervalMs = CHECK_INTERVAL_MS,
): UseAutoUpdateReturn {
	const [status, setStatus] = useState<UpdateStatus>("idle");
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [downloadProgress, setDownloadProgress] = useState(0);

	const checkForUpdates = useCallback(async () => {
		try {
			setStatus("checking");
			setError(null);
			console.log("[AutoUpdate] Checking for updates...");

			const update = await check();

			if (update) {
				console.log(
					`[AutoUpdate] Update available: ${update.version} (current: ${update.currentVersion})`,
				);
				setUpdateInfo({
					version: update.version,
					date: update.date,
					body: update.body,
				});
				setStatus("available");
			} else {
				console.log("[AutoUpdate] No updates available");
				setUpdateInfo(null);
				setStatus("no-update");
			}
		} catch (err) {
			console.error("[AutoUpdate] Failed to check for updates:", err);
			setError(String(err));
			setStatus("error");
		}
	}, []);

	const installUpdate = useCallback(async () => {
		try {
			setStatus("downloading");
			setError(null);
			setDownloadProgress(0);
			console.log("[AutoUpdate] Starting update installation...");

			const update = await check();
			if (!update) {
				console.log("[AutoUpdate] No update found during installation");
				setStatus("no-update");
				return;
			}

			let downloaded = 0;
			let contentLength = 0;

			await update.downloadAndInstall((event) => {
				switch (event.event) {
					case "Started":
						contentLength = event.data.contentLength || 0;
						console.log(
							`[AutoUpdate] Download started: ${contentLength} bytes`,
						);
						break;
					case "Progress": {
						downloaded += event.data.chunkLength;
						const progress = contentLength
							? Math.round((downloaded / contentLength) * 100)
							: 0;
						setDownloadProgress(progress);
						console.log(
							`[AutoUpdate] Progress: ${progress}% (${downloaded}/${contentLength})`,
						);
						break;
					}
					case "Finished":
						console.log("[AutoUpdate] Download finished");
						setDownloadProgress(100);
						break;
				}
			});

			console.log(
				"[AutoUpdate] Installation complete, preparing to relaunch...",
			);
			setStatus("ready");

			// Give user a moment to see the success message before restarting
			setTimeout(async () => {
				console.log("[AutoUpdate] Relaunching application...");
				await relaunch();
			}, 1500);
		} catch (err) {
			console.error("[AutoUpdate] Failed to install update:", err);
			setError(String(err));
			setStatus("error");
			setDownloadProgress(0);
		}
	}, []);

	// Auto-check on mount and at intervals
	useEffect(() => {
		if (!autoCheck) return;

		// Check immediately on mount
		checkForUpdates();

		// Set up interval for periodic checks
		const intervalId = setInterval(() => {
			console.log("[AutoUpdate] Periodic update check");
			checkForUpdates();
		}, checkIntervalMs);

		return () => {
			clearInterval(intervalId);
		};
	}, [autoCheck, checkIntervalMs, checkForUpdates]);

	return {
		status,
		updateInfo,
		error,
		checkForUpdates,
		installUpdate,
		downloadProgress,
	};
}
