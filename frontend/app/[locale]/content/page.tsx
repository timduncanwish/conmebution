/**
 * Content Library — 内容库 (真实后端)
 * 列出已生成内容,支持按状态筛选、查看、复用、删除
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import { contentApi } from '../../lib/api';

interface ContentItem {
  id: string;
  prompt: string;
  type: string;
  status: 'draft' | 'generated' | 'published';
  createdAt: string;
  cost?: number | null;
  generatedContent: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
  generated: { bg: 'bg-blue-50', text: 'text-blue-600' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function preview(raw: string): { kind: string; text?: string; images?: { url: string }[]; videoUrl?: string } {
  try {
    const g = JSON.parse(raw);
    if (typeof g.content === 'string') return { kind: 'text', text: g.content };
    if (Array.isArray(g.images)) return { kind: 'image', images: g.images };
    if (g.videoUrl) return { kind: 'video', videoUrl: g.videoUrl };
  } catch { /* ignore */ }
  return { kind: 'text', text: raw };
}

export default function ContentLibraryPage() {
  const t = useTranslations('content');
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const router = useRouter();

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'generated' | 'published'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contentApi.list({ limit: 50, ...(filter === 'all' ? {} : { status: filter }) });
      setContents((res.data?.items || []) as ContentItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm(zh ? '删除这条内容?' : 'Delete this content?')) return;
    await contentApi.delete(id);
    await load();
  };

  const handleReuse = (item: ContentItem) => {
    router.push(`/${locale}/create?prompt=${encodeURIComponent(item.prompt)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'draft', 'generated', 'published'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`pill cursor-pointer ${filter === f ? 'pill-active' : ''}`}>
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>
        ) : contents.length === 0 ? (
          <div className="bento-card-static text-center py-16">
            <p className="text-[var(--color-text-muted)]">{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((content) => {
              const sc = statusConfig[content.status] || statusConfig.draft;
              const isOpen = expandedId === content.id;
              const pv = isOpen ? preview(content.generatedContent) : null;
              return (
                <div key={content.id} className="bento-card">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">{content.prompt}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${sc.bg} ${sc.text} flex-shrink-0`}>{t(`status.${content.status}`)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        <span>{content.type}</span>
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                        {content.cost ? <span className="num-accent">¥{content.cost}</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setExpandedId(isOpen ? null : content.id)} className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{isOpen ? (zh ? '收起' : 'Hide') : t('actions.view')}</button>
                      <button onClick={() => handleReuse(content)} className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">{t('actions.edit')}</button>
                      <button onClick={() => handleDelete(content.id)} className="px-3 py-1.5 rounded-xl border border-red-200 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer">{t('actions.delete')}</button>
                    </div>
                  </div>
                  {isOpen && pv && (
                    <div className="mt-3 px-4 py-3 bg-[var(--color-bg)] rounded-xl">
                      {pv.kind === 'text' && <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{pv.text}</p>}
                      {pv.kind === 'image' && (
                        <div className="flex flex-wrap gap-2">{pv.images?.map((im, i) => <img key={i} src={im.url} alt="" className="w-32 h-32 object-cover rounded-lg" />)}</div>
                      )}
                      {pv.kind === 'video' && <a href={pv.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-primary)] hover:underline">{zh ? '查看视频 →' : 'View video →'}</a>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
