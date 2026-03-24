import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef, AnchorHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:   "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50",
  secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/15",
  ghost:     "text-slate-400 hover:text-white hover:bg-white/10",
  danger:    "bg-red-600 text-white hover:bg-red-500",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

const base =
  "inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900 disabled:cursor-not-allowed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

/** Renders a Link styled as a button — use instead of Button when navigating. */
interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ href, variant = "primary", size = "md", className, children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
