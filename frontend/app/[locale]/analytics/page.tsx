/**
 * Analytics Page — 可行动分析 (F13, 借鉴 Buffer Analyze)
 * 真实数据 · 最佳发布时间(反哺队列)· 内容建议 · 报告导出
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navigation from '../../components/Navigation';
import { analyticsApi, scheduleApi, type AnalyticsSummary } from '../../lib/api';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#0ea5e9', '#f43f5e', '#64748b'];

const PLATFORM_LABEL: Record<string, { zh: string; en: string }> = {
  bilibili: { zh: 'B站', en: 'Bilibili' },
  douyin: { zh: '抖音', en: 'Douyin' },
  xiaohongshu: { zh: '小红书', en: 'Xiaohongshu' },
  'wechat-mp': { zh: '公众号', en: 'WeChat MP' },
  'wechat-channel': { zh: '视频号', en: 'WeChat Ch.' },
  youtube: { zh: 'YouTube', en: 'YouTube' },
  twitter: { zh: 'Twitter', en: 'Twitter' },
  medium: { zh: 'Medium', en: 'Medium' },
};

export default function AnalyticsPage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const pLabel = (k: string) => PLATFORM_LABEL[k] ? (zh ? PLATFORM_LABEL[k].zh : PLATFORM_LABEL[k].en) : k;

  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [appliedInfo, setAppliedInfo] = useState<Record<string, { before: number; after: number }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsApi.summary();
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 拉取平台数据(Mock 刷新 浏览/点赞/转发)
  const syncMetrics = async () => {
    setSyncing(true);
    setError('');
    try {
      await analyticsApi.syncMetrics();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  // 最佳时间合并到 F8 发布队列(不覆盖用户已有时间)
  const applyToQueue = async (platform: string, slots: string[]) => {
    try {
      // 先拉现有时间槽,跟推荐时间合并去重,避免静默覆盖用户手动配置
      const existingRes = await scheduleApi.listSlots();
      const existing = (existingRes.data || []).find((s) => s.platform === platform);
      const merged = Array.from(new Set([...(existing?.timeSlots || []), ...slots])).sort();
      await scheduleApi.setSlots(platform, { timeSlots: merged });
      setApplied((m) => ({ ...m, [platform]: true }));
      setAppliedInfo((m) => ({ ...m, [platform]: { before: existing?.timeSlots?.length || 0, after: merged.length } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // 导出报告 (CSV, 客户端生成下载,无外部依赖)
  const exportReport = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push('Section,Key,Value');
    const o = data.overview;
    rows.push(`Overview,ContentGenerated,${o.contentGenerated}`);
    rows.push(`Overview,Published,${o.published}`);
    rows.push(`Overview,Engagements,${o.engagements}`);
    rows.push(`Overview,Replied,${o.replied}`);
    rows.push(`Overview,ReplyRate,${o.replyRate}%`);
    rows.push(`Overview,TotalViews,${o.totalViews}`);
    rows.push(`Overview,TotalLikes,${o.totalLikes}`);
    rows.push(`Overview,TotalShares,${o.totalShares}`);
    rows.push(`Overview,TotalCost,${o.totalCost}`);
    data.byPlatform.forEach((p) => rows.push(`Platform,${p.platform},published=${p.published};engagements=${p.engagements}`));
    data.bestTimes.forEach((b) => rows.push(`BestTime,${b.platform},${b.recommendedSlots.join('|')}`));
    data.topContent.forEach((c) => rows.push(`TopContent,"${c.prompt.replace(/"/g, "'")}",eng=${c.engagements};pub=${c.published}`));
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conmebution-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
  const metricCards = data ? [
    { title: zh ? '浏览' : 'Views', value: fmt(data.overview.totalViews) },
    { title: zh ? '点赞' : 'Likes', value: fmt(data.overview.totalLikes) },
    { title: zh ? '评论' : 'Comments', value: fmt(data.overview.engagements) },
    { title: zh ? '转发' : 'Shares', value: fmt(data.overview.totalShares) },
  ] : [];

  const pieData = (data?.byPlatform || []).map((p, i) => ({ name: pLabel(p.platform), value: p.published, color: COLORS[i % COLORS.length] }));
  const hasData = data && (data.overview.published > 0 || data.overview.engagements > 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '数据分析' : 'Analytics'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '基于真实发布与互动数据' : 'Based on real publish & engagement data'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={syncMetrics} disabled={syncing} className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors cursor-pointer">{syncing ? (zh ? '拉取中…' : 'Fetching…') : (zh ? '拉取数据' : 'Fetch metrics')}</button>
            <button onClick={exportReport} disabled={!hasData} className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 transition-colors cursor-pointer">{zh ? '导出报告' : 'Export'}</button>
          </div>
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        {loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-sm">{zh ? '加载中…' : 'Loading…'}</p>
          </div>
        ) : !hasData ? (
          <div className="bento-card-static flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-30"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            <p className="text-sm">{zh ? '暂无数据,先发布内容并在收件箱拉取互动' : 'No data yet — publish content and fetch interactions first'}</p>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {metricCards.map((m) => (
                <div key={m.title} className="bento-card-static">
                  <span className="text-xs text-[var(--color-text-muted)]">{m.title}</span>
                  <p className="text-2xl font-bold num-accent text-[var(--color-text)] mt-1">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bento-card-static">
                <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{zh ? '近 7 天趋势' : '7-Day Trend'}</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data!.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E1F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#A5A0D2" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#A5A0D2" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="published" name={zh ? '发布' : 'Published'} stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="engagements" name={zh ? '互动' : 'Engagements'} stroke="#ec4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bento-card-static">
                <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{zh ? '平台分布' : 'Platform Distribution'}</h2>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {pieData.map((p) => <span key={p.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name} ({p.value})</span>)}
                    </div>
                  </>
                ) : <p className="text-sm text-[var(--color-text-muted)] py-12 text-center">{zh ? '暂无发布数据' : 'No publish data'}</p>}
              </div>
            </div>

            {/* Best Times — actionable */}
            <div className="bento-card-static mb-6">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">{zh ? '最佳发布时间' : 'Best Time to Post'}</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">{zh ? '基于历史互动推荐,合并到发布队列(不覆盖你已有时间)' : 'Recommended from engagement history — merged into your queue (does not overwrite existing slots)'}</p>
              {data!.bestTimes.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">{zh ? '数据不足' : 'Not enough data'}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data!.bestTimes.map((b) => (
                    <div key={b.platform} className="flex items-center justify-between px-3 py-2.5 bg-[var(--color-bg)] rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{pLabel(b.platform)}</p>
                        <p className="text-xs num-accent text-[var(--color-primary)]">{b.recommendedSlots.join(' · ')}</p>
                      </div>
                      <button
                        onClick={() => applyToQueue(b.platform, b.recommendedSlots)}
                        disabled={applied[b.platform]}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:bg-emerald-500 disabled:cursor-default transition-colors cursor-pointer"
                        title={applied[b.platform] && appliedInfo[b.platform] ? (zh ? `原有 ${appliedInfo[b.platform].before} 个,合并后 ${appliedInfo[b.platform].after} 个` : `Was ${appliedInfo[b.platform].before}, now ${appliedInfo[b.platform].after}`) : ''}
                      >
                        {applied[b.platform]
                          ? (appliedInfo[b.platform]
                              ? (zh ? `已合并(${appliedInfo[b.platform].after})` : `Merged (${appliedInfo[b.platform].after})`)
                              : (zh ? '已应用' : 'Applied'))
                          : (zh ? '合并到队列' : 'Merge')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content suggestion — feeds back to Ideas */}
            {data!.suggestion && (
              <div className="bento-card-static mb-6 border-l-4 border-l-amber-400">
                <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">{zh ? '内容建议' : 'Content Insight'}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{data!.suggestion}</p>
              </div>
            )}

            {/* Top Content */}
            <div className="bento-card-static">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{zh ? '内容效果排行' : 'Top Content'}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[var(--color-border)]">
                    {[zh ? '内容' : 'Content', zh ? '类型' : 'Type', zh ? '浏览' : 'Views', zh ? '发布' : 'Published', zh ? '互动' : 'Engagements'].map((h) => <th key={h} className="pb-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{h}</th>)}
                  </tr></thead>
                  <tbody>{data!.topContent.map((c) => (
                    <tr key={c.contentId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                      <td className="py-3 text-sm font-medium text-[var(--color-text)]">{c.prompt || c.contentId.slice(0, 8)}</td>
                      <td className="py-3"><span className="pill text-xs">{c.type}</span></td>
                      <td className="py-3 text-sm num-accent text-[var(--color-text)]">{fmt(c.views)}</td>
                      <td className="py-3 text-sm num-accent text-[var(--color-text)]">{c.published}</td>
                      <td className="py-3 text-sm num-accent text-emerald-600">{c.engagements}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
