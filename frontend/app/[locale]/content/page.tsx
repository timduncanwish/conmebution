/**
 * Content Library — Bento Card List
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';

interface ContentItem { id: string; prompt: string; type: string; status: 'draft' | 'generated' | 'published'; createdAt: string; cost?: number; }

const statusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
  generated: { bg: 'bg-blue-50', text: 'text-blue-600' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

export default function ContentLibraryPage() {
  const t = useTranslations('content');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'generated' | 'published'>('all');

  useEffect(() => {
    setContents([
      { id: '1', prompt: 'Spring skincare product recommendations', type: 'all', status: 'published', createdAt: '2025-03-10T14:30:00Z', cost: 2.5 },
      { id: '2', prompt: 'AI technology trend analysis', type: 'text', status: 'generated', createdAt: '2025-03-09T10:15:00Z', cost: 1.2 },
    ]);
    setLoading(false);
  }, []);

  const filtered = filter === 'all' ? contents : contents.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'draft', 'generated', 'published'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`pill cursor-pointer ${filter === f ? 'pill-active' : ''}`}>
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bento-card-static text-center py-16">
            <p className="text-[var(--color-text-muted)]">{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(content => {
              const sc = statusConfig[content.status];
              return (
                <div key={content.id} className="bento-card flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">{content.prompt}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${sc.bg} ${sc.text} flex-shrink-0`}>{t(`status.${content.status}`)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span>{content.type}</span>
                      <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      {content.cost && <span className="num-accent">${content.cost.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{t('actions.view')}</button>
                    <button className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">{t('actions.edit')}</button>
                    <button className="px-3 py-1.5 rounded-xl border border-red-200 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer">{t('actions.delete')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
