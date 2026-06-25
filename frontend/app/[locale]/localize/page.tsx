/**
 * Localize Page — 跨语言本地化 (F16)
 * 选源内容/粘贴文本 → 翻译为多语言 → 可发布到国际平台
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { contentApi, localizeApi, type LangResult } from '../../lib/api';

const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'es', label: 'Español' },
  { key: 'fr', label: 'Français' },
];

const INTL_PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'medium', label: 'Medium' },
];

const PROVIDERS = ['glm-4', 'gpt-4', 'gemini-pro', 'doubao'];

interface ContentItem { id: string; prompt: string; type: string; }

const statusColor: Record<string, string> = {
  translated: 'bg-emerald-50 text-emerald-600',
  published: 'bg-indigo-50 text-indigo-600',
  failed: 'bg-red-50 text-red-600',
};

export default function LocalizePage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const router = useRouter();

  const [mode, setMode] = useState<'content' | 'text'>('content');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentId, setContentId] = useState('');
  const [text, setText] = useState('');
  const [langs, setLangs] = useState<string[]>(['en']);
  const [provider, setProvider] = useState('glm-4');
  const [autoPublish, setAutoPublish] = useState(false);
  const [selPlatforms, setSelPlatforms] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<LangResult[] | null>(null);

  useEffect(() => {
    contentApi.list({ limit: 50 })
      .then((res) => {
        const items = (res.data?.items || []) as ContentItem[];
        setContents(items);
        if (items[0]) setContentId(items[0].id);
        else setMode('text');
      })
      .catch(() => {});
  }, []);

  const toggle = (arr: string[], k: string, set: (v: string[]) => void) =>
    set(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  const langLabel = (k: string) => LANGS.find((l) => l.key === k)?.label || k;
  const platLabel = (k: string) => INTL_PLATFORMS.find((p) => p.key === k)?.label || k;

  const run = async () => {
    setError('');
    if (langs.length === 0) { setError(zh ? '请选择目标语言' : 'Select target languages'); return; }
    if (mode === 'content' && !contentId) { setError(zh ? '请选择内容' : 'Select content'); return; }
    if (mode === 'text' && !text.trim()) { setError(zh ? '请输入文本' : 'Enter text'); return; }
    if (autoPublish && selPlatforms.length === 0) { setError(zh ? '自动发布需选择平台' : 'Select platforms'); return; }
    setRunning(true);
    setResults(null);
    try {
      const res = await localizeApi.run({
        ...(mode === 'content' ? { contentId } : { text: text.trim() }),
        targetLangs: langs,
        provider,
        platforms: autoPublish ? selPlatforms : undefined,
        autoPublish,
      });
      setResults(res.data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '跨语言本地化' : 'Localize'}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '一键翻译为多语言并发布到国际平台' : 'Translate to multiple languages and publish internationally'}</p>
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        <div className="space-y-4">
          {/* Source */}
          <div className="bento-card-static">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setMode('content')} className={`pill text-xs cursor-pointer ${mode === 'content' ? 'pill-active' : ''}`}>{zh ? '选择内容' : 'From content'}</button>
              <button onClick={() => setMode('text')} className={`pill text-xs cursor-pointer ${mode === 'text' ? 'pill-active' : ''}`}>{zh ? '粘贴文本' : 'Paste text'}</button>
            </div>
            {mode === 'content' ? (
              contents.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">{zh ? '内容库为空,改用粘贴文本' : 'No content — paste text instead'}</p>
              ) : (
                <select value={contentId} onChange={(e) => setContentId(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  {contents.map((c) => <option key={c.id} value={c.id}>{`[${c.type}] ${(c.prompt || c.id).slice(0, 50)}`}</option>)}
                </select>
              )
            ) : (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={zh ? '粘贴要翻译的内容…' : 'Paste content to translate…'} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
            )}
          </div>

          {/* Target languages */}
          <div className="bento-card-static">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? '目标语言' : 'Target languages'}</label>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button key={l.key} onClick={() => toggle(langs, l.key, setLangs)} className={`pill text-xs cursor-pointer ${langs.includes(l.key) ? 'pill-active' : ''}`}>{l.label}</button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bento-card-static">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? 'AI 服务' : 'AI provider'}</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-4 py-2.5 mb-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">{zh ? '翻译后发布到国际平台' : 'Publish to international platforms'}</span>
            </label>
            {autoPublish && (
              <div className="flex flex-wrap gap-2">
                {INTL_PLATFORMS.map((p) => (
                  <button key={p.key} onClick={() => toggle(selPlatforms, p.key, setSelPlatforms)} className={`pill text-xs cursor-pointer ${selPlatforms.includes(p.key) ? 'pill-active' : ''}`}>{p.label}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={run} disabled={running} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {running ? (zh ? '翻译中…' : 'Translating…') : (zh ? `翻译为 ${langs.length} 种语言` : `Translate to ${langs.length}`)}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bento-card-static mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{zh ? '本地化结果' : 'Results'}</h2>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.lang} className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${statusColor[r.status]}`}>
                      {r.status === 'failed' ? (zh ? '失败' : 'Failed') : r.status === 'published' ? (zh ? '已发布' : 'Published') : (zh ? '已翻译' : 'Translated')}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text)]">{langLabel(r.lang)}</span>
                  </div>
                  {r.status === 'failed' ? <span className="text-xs text-red-600">{r.error}</span> : r.publishedTo ? <span className="text-xs text-[var(--color-text-muted)]">{r.publishedTo.map(platLabel).join(' / ')}</span> : null}
                </div>
              ))}
            </div>
            <button onClick={() => router.push(`/${locale}/content`)} className="mt-4 text-sm text-[var(--color-primary)] hover:underline cursor-pointer">{zh ? '到内容库查看 →' : 'View in library →'}</button>
          </div>
        )}
      </main>
    </div>
  );
}
