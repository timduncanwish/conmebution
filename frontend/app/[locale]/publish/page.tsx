/**
 * Publish Page — Bento Platform Grid
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

interface Platform {
  id: string;
  name: string;
  region: 'china' | 'international';
  color: string;
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
  const searchParams = useSearchParams();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any>(null);

  const contentParam = searchParams.get('content');
  const passedContent = contentParam ? (() => { try { return JSON.parse(decodeURIComponent(contentParam)); } catch { return null; } })() : null;

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

  const toggle = (id: string) => setSelectedPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handlePublish = async () => {
    if (!selectedPlatforms.length) return;
    setPublishing(true); setPublishResults(null);
    try {
      const content = passedContent || { title: 'Published content', description: '' };
      const credentials: Record<string, { accessToken: string }> = {};
      selectedPlatforms.forEach(p => { credentials[p] = { accessToken: 'demo_token' }; });
      const res = await api.publishToPlatforms('content-id', selectedPlatforms, credentials);
      setPublishResults(res);
    } catch (error: any) {
      setPublishResults({ success: false, error: { message: error.message || t('publishFailed') } });
    } finally { setPublishing(false); }
  };

  const renderGrid = (region: 'china' | 'international', title: string) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {platforms.filter(p => p.region === region).map(platform => {
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

        {passedContent && (
          <div className="bento-card-static mb-4 border-l-4 border-l-[var(--color-primary)]">
            <p className="text-xs font-medium text-[var(--color-primary)] mb-1">{t('contentToPublish')}</p>
            <p className="text-sm text-[var(--color-text)] line-clamp-2">{passedContent.data?.content || JSON.stringify(passedContent).substring(0, 200)}</p>
          </div>
        )}

        <div className="bento-card-static mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('selectPlatforms')}</h2>
          {renderGrid('china', t('domesticPlatforms'))}
          {renderGrid('international', t('internationalPlatforms'))}
        </div>

        {/* Publish Settings */}
        <div className="bento-card-static mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">{t('publishSettings')}</h3>
          <div className="flex gap-2">
            <button className="pill pill-active cursor-pointer">{t('immediate')}</button>
            <button className="pill cursor-pointer">{t('scheduled')}</button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handlePublish} disabled={!selectedPlatforms.length || publishing} className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer">
            {publishing ? t('publishing') : t('publish')}
          </button>
          <button className="py-3 px-6 border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
            {t('cancel')}
          </button>
        </div>

        {/* Results */}
        {publishResults && (
          <div className={`bento-card-static mt-4 border-l-4 ${publishResults.success ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">{publishResults.success ? t('publishSuccess') : t('publishFailed')}</h2>
            {!publishResults.success && publishResults.error && <p className="text-sm text-red-600">{publishResults.error.message}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
