/**
 * Publish Page — 多平台发布 (F4 单平台 / F6 多平台)
 * 选择已生成内容 → 选平台 → 立即发布(写分发记录,接入分析/收件箱闭环)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import { contentApi, publishContent, type PublishResult } from '../../lib/api';

interface Platform {
  id: string;
  name: string;
  region: 'china' | 'international';
  color: string;
}

interface ContentItem {
  id: string;
  prompt: string;
  type: string;
  status: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  douyin: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 100 8 4 4 0 000-8z"/><path d="M15 8a4 4 0 01-4-4V3"/><path d="M15 8a4 4 0 004 4"/><circle cx="9" cy="12" r="1"/></svg>,
  bilibili: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="4"/><path d="M8 2l4 4M16 2l-4 4M10 10v6M14 10v6"/></svg>,
  xiaohongshu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  'wechat-mp': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  'wechat-channel': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  youtube: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98"/></svg>,
  twitter: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>,
  medium: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M7 8v8M17 8v8M12 8v8"/></svg>,
};

export default function PublishPage() {
  const t = useTranslations('publish');
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const router = useRouter();

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentId, setContentId] = useState('');
  const [loadingContents, setLoadingContents] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    contentApi.list({ limit: 50 })
      .then((res) => {
        const items = (res.data?.items || []) as ContentItem[];
        setContents(items);
        if (items[0]) setContentId(items[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingContents(false));
  }, []);

  const platforms: Platform[] = [
    { id: 'douyin', name: t('platforms.douyin'), region: 'china', color: 'bg-rose-50 text-rose-600' },
    { id: 'bilibili', name: t('platforms.bilibili'), region: 'china', color: 'bg-blue-50 text-blue-600' },
    { id: 'xiaohongshu', name: t('platforms.xiaohongshu'), region: 'china', color: 'bg-red-50 text-red-600' },
    { id: 'wechat-mp', name: t('platforms.wechatMp'), region: 'china', color: 'bg-green-50 text-green-600' },
    { id: 'wechat-channel', name: t('platforms.wechatChannel'), region: 'china', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'youtube', name: t('platforms.youtube'), region: 'international', color: 'bg-red-50 text-red-600' },
    { id: 'twitter', name: t('platforms.twitter'), region: 'international', color: 'bg-sky-50 text-sky-600' },
    { id: 'medium', name: t('platforms.medium'), region: 'international', color: 'bg-gray-100 text-gray-600' },
  ];

  const toggle = (id: string) => setSelectedPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handlePublish = async () => {
    if (!contentId || !selectedPlatforms.length) return;
    setPublishing(true);
    setResults(null);
    setError('');
    try {
      const res = await publishContent(contentId, selectedPlatforms);
      setResults(res.data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  };

  const renderGrid = (region: 'china' | 'international', title: string) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {platforms.filter((p) => p.region === region).map((platform) => {
          const selected = selectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              onClick={() => toggle(platform.id)}
              className={`bento-card flex items-center gap-3 cursor-pointer ${selected ? 'border-[var(--color-primary)] bg-indigo-50/50 shadow-sm' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center flex-shrink-0`}>
                {platformIcons[platform.id]}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[var(--color-text)]">{platform.name}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${selected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        {/* Content selector */}
        <div className="bento-card-static mb-4">
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? '选择要发布的内容' : 'Content to publish'}</label>
          {loadingContents ? (
            <p className="text-sm text-[var(--color-text-muted)]">{zh ? '加载中…' : 'Loading…'}</p>
          ) : contents.length === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-text-muted)]">{zh ? '内容库为空,请先到创作页生成内容' : 'No content yet — create some first'}</p>
              <button onClick={() => router.push(`/${locale}/create`)} className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-primary)] text-white cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors">{zh ? '去创作' : 'Create'}</button>
            </div>
          ) : (
            <select value={contentId} onChange={(e) => setContentId(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              {contents.map((c) => (
                <option key={c.id} value={c.id}>{`[${c.type}] ${(c.prompt || c.id).slice(0, 50)}`}</option>
              ))}
            </select>
          )}
        </div>

        <div className="bento-card-static mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('selectPlatforms')}</h2>
          {renderGrid('china', t('domesticPlatforms'))}
          {renderGrid('international', t('internationalPlatforms'))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handlePublish} disabled={!contentId || !selectedPlatforms.length || publishing} className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer">
            {publishing ? t('publishing') : t('publish')}
          </button>
          <button onClick={() => router.push(`/${locale}/calendar`)} className="py-3 px-6 border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
            {zh ? '改为排期' : 'Schedule instead'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bento-card-static mt-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
              {results.every((r) => r.status === 'success') ? t('publishSuccess') : `${results.filter((r) => r.status === 'success').length}/${results.length} ${zh ? '成功' : 'succeeded'}`}
            </h2>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.platform} className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-[var(--color-text)]">{platforms.find((p) => p.id === r.platform)?.name || r.platform}</span>
                  </div>
                  {r.status === 'success' && r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-primary)] hover:underline truncate max-w-[50%]">{zh ? '查看' : 'View'} →</a>
                  ) : (
                    <span className="text-xs text-red-600">{r.error || (zh ? '失败' : 'Failed')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
