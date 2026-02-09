import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const buttonVariants = {
  variant: {
    primary: "bg-accent text-black hover:bg-accent-hover disabled:bg-inactive disabled:cursor-not-allowed",
    secondary: "bg-bg-tertiary text-fg hover:bg-bg-hover disabled:bg-inactive disabled:cursor-not-allowed",
    ghost: "text-fg hover:bg-bg-tertiary disabled:text-fg-muted disabled:cursor-not-allowed",
    danger: "bg-error text-black hover:bg-error disabled:bg-inactive disabled:cursor-not-allowed",
  },
  size: {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
