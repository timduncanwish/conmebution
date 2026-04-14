/**
 * Home Page — Bento Grid Dashboard
 */

import Navigation from '../components/Navigation';
import Link from 'next/link';

const icons = {
  create: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  library: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  publish: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  analytics: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = messages.home;

  const quickActions = [
    { title: t.quickActions.createContent, desc: t.quickActions.createContentDesc, href: '/create', icon: icons.create, color: 'bg-indigo-50 text-indigo-600' },
    { title: t.quickActions.viewLibrary, desc: t.quickActions.viewLibraryDesc, href: '/content', icon: icons.library, color: 'bg-emerald-50 text-emerald-600' },
    { title: t.quickActions.publish, desc: t.quickActions.publishDesc, href: '/publish', icon: icons.publish, color: 'bg-amber-50 text-amber-600' },
    { title: t.quickActions.analytics, desc: t.quickActions.analyticsDesc, href: '/analytics', icon: icons.analytics, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            {t.welcome}
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {t.subtitle}
          </p>
        </div>

        {/* Bento Grid — Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={`/${locale}${action.href}`}
              className="bento-card group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4`}>
                {action.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                {action.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* Main Bento — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Recent Activity — spans 2 cols */}
          <div className="lg:col-span-2 bento-card-static">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {t.recentActivity}
              </h2>
              <span className="pill text-xs">{locale === 'zh' ? '查看全部' : 'View All'}</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm">{t.noRecentActivity}</p>
            </div>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-4">
            <div className="bento-card-static flex-1">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t.stats.totalContent}</p>
              <p className="text-3xl font-bold num-accent text-[var(--color-text)]">0</p>
            </div>
            <div className="bento-card-static flex-1">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t.stats.published}</p>
              <p className="text-3xl font-bold num-accent text-emerald-600">0</p>
            </div>
            <div className="bento-card-static flex-1">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t.stats.costThisMonth}</p>
              <p className="text-3xl font-bold num-accent text-[var(--color-primary)]">¥0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
