/**
 * DashboardStats — 首页真实统计 + 最近活动(客户端,登录后才拉取)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isAuthenticated, analyticsApi, contentApi } from '../lib/api';

interface Labels {
  recentActivity: string;
  noRecentActivity: string;
  viewAll: string;
  totalContent: string;
  published: string;
  costThisMonth: string;
}

interface RecentItem { id: string; prompt: string; status: string; createdAt: string; }

export default function DashboardStats({ locale, labels }: { locale: string; labels: Labels }) {
  const [stats, setStats] = useState({ total: 0, published: 0, cost: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    (async () => {
      try {
        const s = await analyticsApi.summary();
        const o = s.data.overview;
        setStats({ total: o.contentGenerated, published: o.published, cost: o.totalCost });
      } catch { /* ignore */ }
      try {
        const c = await contentApi.list({ limit: 5 });
        setRecent((c.data?.items || []) as RecentItem[]);
      } catch { /* ignore */ }
    })();
  }, []);

  const statusLabel = (s: string) => {
    const zh = locale === 'zh';
    if (s === 'published') return zh ? '已发布' : 'Published';
    if (s === 'generated') return zh ? '已生成' : 'Generated';
    return zh ? '草稿' : 'Draft';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Recent Activity */}
      <div className="lg:col-span-2 bento-card-static">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{labels.recentActivity}</h2>
          <Link href={`/${locale}/content`} className="pill text-xs cursor-pointer">{labels.viewAll}</Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm">{labels.noRecentActivity}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recent.map((r) => (
              <Link key={r.id} href={`/${locale}/content`} className="flex items-center justify-between py-2.5 hover:bg-[var(--color-bg)] -mx-2 px-2 rounded-lg transition-colors">
                <span className="text-sm text-[var(--color-text)] truncate flex-1 mr-3">{r.prompt}</span>
                <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">{statusLabel(r.status)} · {new Date(r.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-4">
        <div className="bento-card-static flex-1">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{labels.totalContent}</p>
          <p className="text-3xl font-bold num-accent text-[var(--color-text)]">{stats.total}</p>
        </div>
        <div className="bento-card-static flex-1">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{labels.published}</p>
          <p className="text-3xl font-bold num-accent text-emerald-600">{stats.published}</p>
        </div>
        <div className="bento-card-static flex-1">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{labels.costThisMonth}</p>
          <p className="text-3xl font-bold num-accent text-[var(--color-primary)]">¥{stats.cost}</p>
        </div>
      </div>
    </div>
  );
}
