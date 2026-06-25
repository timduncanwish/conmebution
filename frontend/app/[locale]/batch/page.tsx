/**
 * Batch SKU Page — 批量 SKU 推广 (F15)
 * 批量导入产品 → AI 批量生成文案 → 可选批量发布
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { batchApi, type SkuResult } from '../../lib/api';

const PLATFORMS = [
  { key: 'bilibili', zh: 'B站', en: 'Bilibili' },
  { key: 'douyin', zh: '抖音', en: 'Douyin' },
  { key: 'xiaohongshu', zh: '小红书', en: 'Xiaohongshu' },
  { key: 'wechat-mp', zh: '公众号', en: 'WeChat MP' },
  { key: 'youtube', zh: 'YouTube', en: 'YouTube' },
  { key: 'twitter', zh: 'Twitter', en: 'Twitter' },
];

const PROVIDERS = ['glm-4', 'gpt-4', 'gemini-pro', 'doubao'];
const DEFAULT_TEMPLATE = '为「{product}」写一段适合社交媒体的推广文案,卖点:{keywords}';

const statusColor: Record<string, string> = {
  generated: 'bg-emerald-50 text-emerald-600',
  published: 'bg-indigo-50 text-indigo-600',
  failed: 'bg-red-50 text-red-600',
};

export default function BatchPage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const router = useRouter();
  const pLabel = (k: string) => { const p = PLATFORMS.find((x) => x.key === k); return p ? (zh ? p.zh : p.en) : k; };

  const [raw, setRaw] = useState('');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [provider, setProvider] = useState('glm-4');
  const [autoPublish, setAutoPublish] = useState(false);
  const [selPlatforms, setSelPlatforms] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SkuResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; generated: number; published: number } | null>(null);

  // 解析:每行 "产品名, 卖点"
  const parseProducts = () =>
    raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [name, ...rest] = line.split(/[,，]/);
      return { name: name.trim(), keywords: rest.join(',').trim() || undefined };
    }).filter((p) => p.name);

  const products = parseProducts();
  const togglePlatform = (k: string) => setSelPlatforms((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const run = async () => {
    if (products.length === 0) { setError(zh ? '请至少输入一个产品' : 'Enter at least one product'); return; }
    if (autoPublish && selPlatforms.length === 0) { setError(zh ? '自动发布需选择平台' : 'Select platforms for auto-publish'); return; }
    setRunning(true);
    setError('');
    setResults(null);
    setSummary(null);
    try {
      const res = await batchApi.skus({
        products,
        promptTemplate: template,
        provider,
        platforms: autoPublish ? selPlatforms : undefined,
        autoPublish,
      });
      setResults(res.data.results);
      setSummary({ total: res.data.total, generated: res.data.generated, published: res.data.published });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '批量 SKU 推广' : 'Batch SKU'}</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '批量导入产品,一次生成多条推广文案' : 'Import products, generate promo copy in bulk'}</p>
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: inputs */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bento-card-static">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? '产品列表(每行一个:产品名, 卖点)' : 'Products (one per line: name, keywords)'}</label>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={8}
                placeholder={zh ? 'iPhone 16 Pro, 钛金属机身\n保温杯, 24小时锁温\n瑜伽垫, 防滑加厚' : 'iPhone 16 Pro, titanium\nThermos, 24h heat\nYoga mat, non-slip'}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none font-mono text-sm"
              />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{zh ? `已识别 ${products.length} 个产品(上限 50)` : `${products.length} products parsed (max 50)`}</p>
            </div>

            <div className="bento-card-static">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? '提示词模板' : 'Prompt template'}</label>
              <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{zh ? '可用占位符:{product} {keywords}' : 'Placeholders: {product} {keywords}'}</p>
            </div>
          </div>

          {/* Right: options */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bento-card-static">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{zh ? 'AI 服务' : 'AI provider'}</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="bento-card-static">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
                <span className="text-sm font-medium text-[var(--color-text)]">{zh ? '生成后自动发布' : 'Auto-publish after generate'}</span>
              </label>
              {autoPublish && (
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.key} onClick={() => togglePlatform(p.key)} className={`pill text-xs cursor-pointer ${selPlatforms.includes(p.key) ? 'pill-active' : ''}`}>{pLabel(p.key)}</button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={run} disabled={running || products.length === 0} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer">
              {running ? (zh ? `生成中… (${products.length})` : `Generating… (${products.length})`) : (zh ? `批量生成 ${products.length} 条` : `Generate ${products.length}`)}
            </button>
          </div>
        </div>

        {/* Results */}
        {summary && (
          <div className="bento-card-static mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{zh ? '批量结果' : 'Results'}</h2>
              <div className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                <span>{zh ? '生成' : 'Generated'}: <b className="num-accent">{summary.generated}</b>/{summary.total}</span>
                {summary.published > 0 && <span>{zh ? '已发布' : 'Published'}: <b className="num-accent text-indigo-600">{summary.published}</b></span>}
              </div>
            </div>
            <div className="space-y-2">
              {results?.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg flex-shrink-0 ${statusColor[r.status]}`}>
                      {r.status === 'failed' ? (zh ? '失败' : 'Failed') : r.status === 'published' ? (zh ? '已发布' : 'Published') : (zh ? '已生成' : 'Generated')}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text)] truncate">{r.product || '—'}</span>
                  </div>
                  {r.status === 'failed' ? (
                    <span className="text-xs text-red-600 truncate max-w-[40%]">{r.error}</span>
                  ) : r.publishedTo ? (
                    <span className="text-xs text-[var(--color-text-muted)]">{r.publishedTo.map(pLabel).join(' / ')}</span>
                  ) : null}
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
