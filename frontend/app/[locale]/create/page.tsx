/**
 * Create Page — Bento Split Layout
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTranslations } from 'next-intl';
import api from '../../lib/api';

const typeIcons: Record<string, React.ReactNode> = {
  text: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  all: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
};

export default function CreatePage() {
  const t = useTranslations('create');
  const locale = useParams().locale as string;
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

  const saveDraft = (content: any) => {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]');
    drafts.unshift({ id: Date.now(), prompt, contentType, content, timestamp: new Date().toISOString() });
    localStorage.setItem('drafts', JSON.stringify(drafts.slice(0, 10)));
    setSavedDrafts(drafts.slice(0, 10));
  };

  const loadDrafts = () => {
    setSavedDrafts(JSON.parse(localStorage.getItem('drafts') || '[]'));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 10) { setError(t('minPromptError')); return; }
    setIsGenerating(true); setError(''); setResult(null);
    try {
      if (contentType === 'text' || contentType === 'all') {
        const res = await api.generateTextSync(prompt, 'doubao');
        setResult(res.success ? { type: 'text', data: res.data } : null);
        if (!res.success) setError(res.error?.message || t('generating'));
      } else if (contentType === 'image') {
        const res = await api.generateImage(prompt, { n: 1 });
        setResult(res.success ? { type: 'image', data: res.data } : null);
        if (!res.success) setError(res.error?.message || t('generating'));
      } else if (contentType === 'video') {
        const res = await api.generateVideo(prompt, { duration: 15 });
        setResult(res.success ? { type: 'video', data: res.data } : null);
        if (!res.success) setError(res.error?.message || t('generating'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setIsGenerating(false); }
  };

  const handleEstimateCost = async () => {
    if (!prompt.trim() || prompt.length < 10) return;
    try {
      const res = await api.estimateCost(prompt, 'doubao');
      if (res.success) setEstimatedCost(res.data.estimatedCost);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left — Form (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Prompt Card */}
            <div className="bento-card-static">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('describeContent')}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none transition-shadow duration-150"
                placeholder={t('promptPlaceholder')}
              />
              <div className="mt-2 flex justify-between items-center">
                <span className={`text-xs ${prompt.length < 10 ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}>
                  {prompt.length}{t('promptMaxLength')} ({t('promptMinLength')})
                </span>
                <button onClick={handleEstimateCost} disabled={prompt.length < 10} className="text-xs text-[var(--color-primary)] hover:underline disabled:text-[var(--color-text-muted)] disabled:no-underline cursor-pointer transition-colors">
                  {t('estimateCost')}
                </button>
              </div>
              {estimatedCost !== null && (
                <div className="mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm text-emerald-800">{t('estimatedCostLabel')}: <span className="font-semibold num-accent">${estimatedCost.toFixed(4)}</span> USD</p>
                </div>
              )}
            </div>

            {/* Type Selector */}
            <div className="bento-card-static">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-3">{t('contentType')}</label>
              <div className="flex flex-wrap gap-2">
                {(['text', 'image', 'video', 'all'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={`pill flex items-center gap-1.5 cursor-pointer ${contentType === type ? 'pill-active' : ''}`}
                  >
                    {typeIcons[type]}
                    {t(`types.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || prompt.length < 10 || isGenerating}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
              >
                {isGenerating && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                )}
                {isGenerating ? t('generating') : t('startCreating')}
              </button>
              <button
                onClick={() => { setResult(null); setError(''); setEstimatedCost(null); }}
                className="py-3 px-5 border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors duration-150 cursor-pointer"
              >
                {t('clearResults')}
              </button>
            </div>
          </div>

          {/* Right — Result Preview (2 cols) */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="bento-card-static border-l-4 border-l-[var(--color-primary)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('resultTitle')}</h2>
                  <div className="flex gap-1.5">
                    <button onClick={() => { saveDraft(result); alert(t('draftSaved')); }} className="pill text-xs cursor-pointer">{t('saveDraft')}</button>
                    <button onClick={() => { setIsEditing(!isEditing); if (!isEditing && result.type === 'text') setEditedContent(result.data.content); }} className="pill text-xs cursor-pointer">{isEditing ? t('cancelEdit') : t('editContent')}</button>
                    <button onClick={() => { if (confirm(t('confirmPublish'))) router.push(`/${locale}/publish?content=${encodeURIComponent(JSON.stringify(result))}`); }} className="pill pill-active text-xs cursor-pointer">{t('goPublish')}</button>
                  </div>
                </div>

                {result.type === 'text' && (
                  <>
                    {isEditing ? (
                      <div>
                        <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={10} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setResult({ ...result, data: { ...result.data, content: editedContent } }); setIsEditing(false); }} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors">{t('saveChanges')}</button>
                          <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{t('cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-[var(--color-bg)] rounded-xl mb-4">
                        <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">{result.data.content}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: t('provider'), value: result.data.provider },
                        { label: t('tokenUsage'), value: result.data.tokensUsed.total },
                        { label: t('cost'), value: `$${result.data.cost.toFixed(4)}` },
                      ].map((s) => (
                        <div key={s.label} className="py-2">
                          <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
                          <p className="text-sm font-semibold num-accent text-[var(--color-text)] mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {result.type === 'image' && result.data.images && result.data.images.map((img: any, idx: number) => (
                  <img key={idx} src={img.url} alt={`Generated ${idx + 1}`} className="w-full rounded-xl mb-3" />
                ))}
                {result.type === 'video' && (
                  <div className="text-center py-6 text-[var(--color-text-muted)]">
                    <p className="text-sm">{t('generatingVideo')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bento-card-static flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-30">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <p className="text-sm">{locale === 'zh' ? '输入提示词开始创作' : 'Enter a prompt to start creating'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: t('loadDrafts'), action: loadDrafts },
            { label: t('clearDrafts'), action: () => { if (confirm(t('confirmClearDrafts'))) { localStorage.removeItem('drafts'); setSavedDrafts([]); } } },
            { label: t('templateLibrary'), action: () => router.push(`/${locale}/templates`) },
            { label: t('goPublish'), action: () => router.push(`/${locale}/publish`) },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action} className="bento-card text-sm text-[var(--color-text-secondary)] text-center cursor-pointer">
              {btn.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
