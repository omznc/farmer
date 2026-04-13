import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
	({ checked, onChange, disabled = false, className }, ref) => {
		return (
			<button
				ref={ref}
				type="button"
				role="switch"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => !disabled && onChange(!checked)}
				className={cn(
					"relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary",
					checked ? "bg-accent" : "bg-bg-tertiary",
					disabled && "opacity-50 cursor-not-allowed",
					className,
				)}
			>
				<span
					className={cn(
						"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
						checked ? "translate-x-4" : "translate-x-0.5",
					)}
				/>
			</button>
		);
	},
);

Switch.displayName = "Switch";
