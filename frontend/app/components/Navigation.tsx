/**
 * Navigation — Floating Bento Style
 * Frosted glass navbar with Lucide-style SVG icons
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isAuthenticated, clearToken } from '../lib/api';

// Lucide-style inline SVG icons
const Icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  template: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  create: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  library: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  publish: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  login: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const [loggedIn, setLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathSegments = pathname.split('/').filter(Boolean);
  const locale = (pathSegments[0] === 'zh' || pathSegments[0] === 'en') ? pathSegments[0] : 'zh';

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    router.push(`/${locale}/login`);
  };

  const href = (path: string) => `/${locale}${path ? `/${path}` : ''}`;

  const navItems = [
    { path: '', label: t('home'), icon: Icons.home },
    { path: 'templates', label: t('templates'), icon: Icons.template },
    { path: 'create', label: t('create'), icon: Icons.create },
    { path: 'content', label: t('content'), icon: Icons.library },
    { path: 'publish', label: t('publish'), icon: Icons.publish },
    { path: 'analytics', label: t('analytics'), icon: Icons.analytics },
  ];

  const isActive = (path: string) => {
    if (!path) return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(`/${locale}/${path}`);
  };

  return (
    <>
      {/* Desktop & Tablet Navbar — Floating */}
      <nav className="fixed top-4 left-4 right-4 z-50 hidden lg:block">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl px-2 py-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={href('')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-bg)] transition-colors duration-150 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-semibold text-[var(--color-text)]">Conmebution</span>
            </Link>

            {/* Nav Pills */}
            <div className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={href(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    isActive(item.path)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <Link
                href={href('settings')}
                className={`p-2 rounded-xl transition-colors duration-150 cursor-pointer ${
                  isActive('settings')
                    ? 'bg-[var(--color-bg-alt)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)]'
                }`}
                aria-label="Settings"
              >
                {Icons.settings}
              </Link>
              {loggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                >
                  {Icons.logout}
                  <span className="hidden xl:inline">Logout</span>
                </button>
              ) : (
                <Link
                  href={href('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors duration-150 cursor-pointer"
                >
                  {Icons.login}
                  <span className="hidden xl:inline">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50 lg:hidden">
        <div className="bg-white/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <Link href={href('')} className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-base font-semibold text-[var(--color-text)]">Conmebution</span>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? Icons.close : Icons.menu}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileOpen && (
            <div className="mt-2 pt-2 border-t border-[var(--color-border)] grid grid-cols-3 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={href(item.path)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer ${
                    isActive(item.path)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <Link
                href={href('settings')}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  isActive('settings')
                    ? 'bg-[var(--color-bg-alt)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                }`}
              >
                {Icons.settings}
                {t('settings')}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />
    </>
  );
}
