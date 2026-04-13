import { useEffect, useRef } from "react";

const KONAMI_CODE = [
	"ArrowUp",
	"ArrowUp",
	"ArrowDown",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowLeft",
	"ArrowRight",
	"KeyB",
	"KeyA",
];

export function useKonamiCode(callback: () => void, enabled = true) {
	const indexRef = useRef(0);

	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const expectedKey = KONAMI_CODE[indexRef.current];

			if (e.code === expectedKey) {
				indexRef.current++;
				if (indexRef.current === KONAMI_CODE.length) {
					callback();
					indexRef.current = 0;
				}
			} else {
				indexRef.current = 0;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [callback, enabled]);
}
