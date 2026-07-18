
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  match?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: 'Meetings',
    href: '/',
    icon: DocumentTextIcon,
    match: (pathname) => pathname === '/' || pathname.startsWith('/meetings'),
  },
  {
    label: 'Search',
    href: '/#search',
    icon: MagnifyingGlassIcon,
    match: (pathname) => pathname === '/',
  },
  { label: 'Analytics', href: '/analytics', icon: ChartBarIcon, comingSoon: true },
  { label: 'Integrations', href: '/integrations', icon: Squares2X2Icon, comingSoon: true },
  { label: 'Settings', href: '/settings', icon: Cog6ToothIcon, comingSoon: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/10 bg-fireflies-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fireflies-primary text-white shadow-sm">
          <span className="text-sm font-semibold">F</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Fireflies</p>
          <p className="truncate text-xs text-white/45">Meeting workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/35">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/8 text-white'
                    : 'text-white/55 hover:bg-white/5 hover:text-white/80',
                ].join(' ')}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-2xl bg-white/5 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">Workspace</p>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fireflies-primary text-xs font-semibold text-white">
              U
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Local Workspace</p>
              <p className="truncate text-xs text-white/40">Free plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}