/**
 * Dashboard layout
 * Provides sidebar navigation and top header for all dashboard pages
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/feedback', label: 'Feedback', icon: '💬' },
    { href: '/dashboard/insights', label: 'Insights', icon: '🧠' },
    { href: '/dashboard/roadmap', label: 'Roadmap', icon: '🗺️' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6" style={{ color: '#F0A500' }} />
          <span
            className="font-bold text-slate-900"
            style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
          >
            Clairio
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed md:static inset-0 z-40 w-64 text-white transform transition-transform duration-200 ease-in-out md:transform-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ backgroundColor: '#0D1B3E' }}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div
              className="hidden md:flex items-center gap-2 px-6 py-8 border-b"
              style={{ borderColor: '#1565C0' }}
            >
              <Zap className="w-6 h-6" style={{ color: '#F0A500' }} />
              <span
                className="font-bold text-lg text-white"
                style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
              >
                Clairio
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={
                    pathname === item.href
                      ? { backgroundColor: '#1565C0', color: '#FFFFFF' }
                      : { color: '#CADCFC' }
                  }
                  onMouseEnter={(e) => {
                    if (pathname !== item.href) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#1E3A6E';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== item.href) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Sign out button */}
            <div className="p-4 border-t" style={{ borderColor: '#1565C0' }}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ color: '#CADCFC' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1E3A6E';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
