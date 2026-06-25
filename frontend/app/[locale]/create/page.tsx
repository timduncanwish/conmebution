/**
 * Create Page — Bento Split Layout
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');

  // 来自 Ideas 灵感收件箱的「一键转生成」:预填提示词
  useEffect(() => {
    const presetPrompt = searchParams.get('prompt');
    if (presetPrompt) setPrompt(presetPrompt);
  }, [searchParams]);
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

  // 视频异步任务轮询:单一 video 或 all 内嵌的 video,processing 时每 5s 查一次
  useEffect(() => {
    if (!result) return;
    // 找出当前需要轮询的视频数据 + 它在 result 里的位置
    let videoData: any = null;
    let mode: 'single' | 'all' | null = null;
    if (result.type === 'video') { videoData = result.data; mode = 'single'; }
    else if (result.type === 'all' && result.data?.video?.status === 'success') { videoData = result.data.video.data; mode = 'all'; }
    if (!mode || !videoData || videoData.status !== 'processing' || !videoData.taskId) return;

    const taskId = videoData.taskId;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await api.getVideoStatus(taskId);
        if (cancelled) return;
        if (res.status === 'success' && res.videoUrl) {
          clearInterval(interval);
          const finalData = { status: 'success', videoUrl: res.videoUrl, thumbnailUrl: res.thumbnailUrl };
          if (mode === 'single') {
            setResult({ type: 'video', data: finalData });
          } else {
            setResult({ ...result, data: { ...result.data, video: { status: 'success', data: finalData } } });
          }
          try {
            await api.content.create({ prompt, type: 'video', generatedContent: { videoUrl: res.videoUrl, thumbnailUrl: res.thumbnailUrl }, aiProvider: 'cogvideox-flash', cost: 0 });
          } catch { /* 持久化失败不阻断预览 */ }
        } else if (res.status === 'failed' || res.success === false) {
          clearInterval(interval);
          const errData = { status: 'failed', error: res.error || t('videoFailed') };
          if (mode === 'single') {
            setResult({ type: 'video', data: errData });
          } else {
            setResult({ ...result, data: { ...result.data, video: { status: 'success', data: errData } } });
          }
        }
      } catch { /* 瞬时网络错误忽略,下个 tick 重试 */ }
    }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.type, result?.data?.video?.status, result?.data?.taskId, result?.data?.status]);

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
    // 生成成功后持久化到内容库,使其可在内容库/发布/排期/本地化中使用
    const persist = async (type: string, generatedContent: unknown, aiProvider?: string, cost?: number) => {
      try {
        await api.content.create({ prompt, type, generatedContent, aiProvider: aiProvider || 'glm-4', cost: cost ? Math.round(cost) : 0 });
      } catch { /* 持久化失败不阻断预览 */ }
    };

    // 各类型独立运行,便于 'all' 并行
    const runText = async () => {
      const res = await api.generateTextSync(prompt, 'glm-4');
      if (res.success) {
        await persist('text', { content: res.data.content }, res.data.provider, res.data.cost);
        return { status: 'success' as const, data: res.data };
      }
      return { status: 'error' as const, error: res.error?.message || t('generating') };
    };
    const runImage = async () => {
      const res = await api.generateImage(prompt, { n: 1 });
      if (res.success) {
        // /api/generate/image 直接返回顶层 {images, cost},无 data 包裹
        await persist('image', { images: res.images }, 'cogview-3-flash', res.cost);
        return { status: 'success' as const, data: { images: res.images } };
      }
      return { status: 'error' as const, error: res.error?.message || t('generating') };
    };
    const runVideo = async () => {
      const res = await api.generateVideo(prompt, { duration: 15 });
      if (!res.success) return { status: 'error' as const, error: res.error?.message || t('videoFailed') };
      // /api/generate/video 直接返回顶层 {status, videoUrl, taskId},无 data 包裹
      const vid = { status: res.status, videoUrl: res.videoUrl, thumbnailUrl: res.thumbnailUrl, taskId: res.taskId };
      if (vid.status === 'success' && vid.videoUrl) {
        await persist('video', { videoUrl: vid.videoUrl, thumbnailUrl: vid.thumbnailUrl }, 'cogvideox-flash', 0);
      }
      return { status: 'success' as const, data: vid };
    };

    try {
      if (contentType === 'text') {
        const r = await runText();
        if (r.status === 'success') setResult({ type: 'text', data: r.data });
        else setError(r.error);
      } else if (contentType === 'image') {
        const r = await runImage();
        if (r.status === 'success') setResult({ type: 'image', data: r.data });
        else setError(r.error);
      } else if (contentType === 'video') {
        const r = await runVideo();
        if (r.status === 'success') setResult({ type: 'video', data: r.data });
        else setError(r.error);
      } else if (contentType === 'all') {
        // 并行跑三种,失败的分支不影响其它;每个独立入库
        const [text, image, video] = await Promise.allSettled([runText(), runImage(), runVideo()]);
        setResult({
          type: 'all',
          data: {
            text: text.status === 'fulfilled' ? text.value : { status: 'error', error: String(text.reason?.message || text.reason) },
            image: image.status === 'fulfilled' ? image.value : { status: 'error', error: String(image.reason?.message || image.reason) },
            video: video.status === 'fulfilled' ? video.value : { status: 'error', error: String(video.reason?.message || video.reason) },
          },
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setIsGenerating(false); }
  };

  const handleEstimateCost = async () => {
    if (!prompt.trim() || prompt.length < 10) return;
    try {
      const res = await api.estimateCost(prompt, 'glm-4');
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
                  <div>
                    {result.data.status === 'success' && result.data.videoUrl && (
                      <video src={result.data.videoUrl} poster={result.data.thumbnailUrl} controls className="w-full rounded-xl mb-3 bg-black" />
                    )}
                    {result.data.status === 'processing' && (
                      <div className="text-center py-8 text-[var(--color-text-muted)]">
                        <svg className="animate-spin h-8 w-8 mx-auto mb-3 opacity-60" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        <p className="text-sm">{t('generatingVideo')}</p>
                        <p className="text-xs mt-1 opacity-70">{t('videoAsyncNote')}</p>
                      </div>
                    )}
                    {result.data.status === 'failed' && (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600">{result.data.error || t('videoFailed')}</p>
                      </div>
                    )}
                  </div>
                )}
                {result.type === 'all' && (
                  <div className="space-y-4">
                    {/* 文案 */}
                    <section>
                      <h3 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{t('types.text')}</h3>
                      {result.data.text?.status === 'success' ? (
                        <>
                          <div className="px-4 py-3 bg-[var(--color-bg)] rounded-xl">
                            <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">{result.data.text.data.content}</p>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{result.data.text.data.provider} · ${result.data.text.data.cost.toFixed(4)}</p>
                        </>
                      ) : (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600">{result.data.text?.error}</p></div>
                      )}
                    </section>
                    {/* 图片 */}
                    <section>
                      <h3 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{t('types.image')}</h3>
                      {result.data.image?.status === 'success' && result.data.image.data.images?.length ? (
                        result.data.image.data.images.map((img: any, idx: number) => (
                          <img key={idx} src={img.url} alt={`Generated ${idx + 1}`} className="w-full rounded-xl" />
                        ))
                      ) : (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600">{result.data.image?.error}</p></div>
                      )}
                    </section>
                    {/* 视频 */}
                    <section>
                      <h3 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{t('types.video')}</h3>
                      {result.data.video?.status === 'success' ? (
                        <>
                          {result.data.video.data.status === 'success' && result.data.video.data.videoUrl && (
                            <video src={result.data.video.data.videoUrl} poster={result.data.video.data.thumbnailUrl} controls className="w-full rounded-xl bg-black" />
                          )}
                          {result.data.video.data.status === 'processing' && (
                            <div className="text-center py-6 text-[var(--color-text-muted)]">
                              <svg className="animate-spin h-6 w-6 mx-auto mb-2 opacity-60" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              <p className="text-xs">{t('generatingVideo')}</p>
                              <p className="text-xs mt-1 opacity-70">{t('videoAsyncNote')}</p>
                            </div>
                          )}
                          {result.data.video.data.status === 'failed' && (
                            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600">{result.data.video.data.error || t('videoFailed')}</p></div>
                          )}
                        </>
                      ) : (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600">{result.data.video?.error}</p></div>
                      )}
                    </section>
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
