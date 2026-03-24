import { clsx } from "clsx";

type Color = "indigo" | "green" | "yellow" | "red" | "slate" | "blue" | "purple" | "teal";

const colors: Record<Color, string> = {
  indigo: "bg-indigo-900/60 text-indigo-300 border-indigo-700/50",
  green:  "bg-green-900/60 text-green-300 border-green-700/50",
  yellow: "bg-yellow-900/60 text-yellow-300 border-yellow-700/50",
  red:    "bg-red-900/60 text-red-300 border-red-700/50",
  slate:  "bg-slate-800 text-slate-300 border-slate-700",
  blue:   "bg-blue-900/60 text-blue-300 border-blue-700/50",
  purple: "bg-purple-900/60 text-purple-300 border-purple-700/50",
  teal:   "bg-teal-900/60 text-teal-300 border-teal-700/50",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  className?: string;
}

export function Badge({ children, color = "slate", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
