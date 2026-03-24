"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  Settings,
  CreditCard,
  LogOut,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/contacts",   label: "Contacts",   icon: Users },
  { href: "/companies",  label: "Companies",  icon: Building2 },
  { href: "/deals",      label: "Deals",      icon: Briefcase },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
];

const BOTTOM_NAV = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing",  label: "Billing",  icon: CreditCard },
];

interface SidebarProps {
  accountName: string;
  userEmail: string;
}

export function Sidebar({ accountName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-white/10 bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{accountName}</p>
          <p className="text-xs text-slate-500">CRM</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="space-y-0.5 border-t border-white/10 p-3">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>

        <div className="mt-2 truncate px-3 py-1 text-xs text-slate-600">{userEmail}</div>
      </div>
    </aside>
  );
}
