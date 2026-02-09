import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  x: number;
  y: number;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, x, y, onClose, duration = 1500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true);
    });

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-all duration-300 ${
        visible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-75"
      }`}
      style={{
        left: `${x}px`,
        top: `${y - 40}px`,
        transform: `translateX(-50%) ${visible ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(1rem)'}`,
        transitionTimingFunction: visible ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 1, 1)',
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-success shadow-lg">
        <Check className="w-4 h-4 text-success" />
        <span className="text-sm font-medium text-fg-primary">{message}</span>
      </div>
    </div>
  );
}
