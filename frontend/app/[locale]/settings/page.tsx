/**
 * Settings Page — 系统设置 (F11)
 * AI 密钥按用户加密存储于后端;本月真实成本 vs 预算
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import { settingsApi, type ProviderConfig } from '../../lib/api';

const PROVIDER_NAMES: Record<string, string> = {
  'glm-4': 'GLM-4.7 (智谱AI)',
  'gpt-4': 'OpenAI GPT-4',
  'gemini-pro': 'Google Gemini Pro',
  doubao: '豆包 Doubao (字节)',
};

type ProviderRow = ProviderConfig & { newKey: string; status: 'idle' | 'testing' | 'connected' | 'failed' };

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useParams().locale as string;
  const zh = locale === 'zh';

  const [activeTab, setActiveTab] = useState<'ai' | 'platforms' | 'account'>('ai');
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [autoSelect, setAutoSelect] = useState(true);
  const [costThisMonth, setCostThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await settingsApi.get();
      const d = res.data;
      setRows(d.providers.map((p) => ({ ...p, newKey: '', status: p.hasKey ? 'connected' : 'idle' })));
      setMonthlyBudget(d.monthlyBudget);
      setAutoSelect(d.autoSelectCheapest);
      setCostThisMonth(d.costThisMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setRow = (provider: string, patch: Partial<ProviderRow>) =>
    setRows((prev) => prev.map((r) => (r.provider === provider ? { ...r, ...patch } : r)));

  const testConnection = async (row: ProviderRow) => {
    setRow(row.provider, { status: 'testing' });
    try {
      // 若输入了新 key,先保存再测试
      if (row.newKey.trim()) {
        await settingsApi.saveProvider(row.provider, { apiKey: row.newKey.trim() });
        setRow(row.provider, { hasKey: true, newKey: '' });
      }
      const res = await settingsApi.testProvider(row.provider);
      setRow(row.provider, { status: res.data.connected ? 'connected' : 'failed' });
    } catch {
      setRow(row.provider, { status: 'failed' });
    }
  };

  const saveAll = async () => {
    setError('');
    try {
      // 保存所有输入了新 key 的 provider
      await Promise.all(
        rows.filter((r) => r.newKey.trim()).map((r) => settingsApi.saveProvider(r.provider, { apiKey: r.newKey.trim() })),
      );
      await settingsApi.save({ monthlyBudget, autoSelectCheapest: autoSelect });
      setSaveMessage(t('ai.saved'));
      setTimeout(() => setSaveMessage(''), 3000);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const statusDot = (status: string) => (
    <span className={`status-dot ${status === 'connected' ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
  );
  const statusLabel = (status: string) => {
    if (status === 'connected') return t('ai.connectionSuccess');
    if (status === 'testing') return t('ai.testing');
    if (status === 'failed') return t('ai.connectionFailed');
    return zh ? '未配置' : 'Not set';
  };

  const tabs = [
    { key: 'ai' as const, label: t('tabs.ai'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M16 14H8a6 6 0 00-6 6v2h20v-2a6 6 0 00-6-6z"/></svg> },
    { key: 'platforms' as const, label: t('tabs.platforms'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg> },
    { key: 'account' as const, label: t('tabs.account'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  const budgetPct = monthlyBudget > 0 ? Math.min(100, Math.round((costThisMonth / monthlyBudget) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">{t('title')}</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${activeTab === tab.key ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)]'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {saveMessage && <div className="bento-card-static border-l-4 border-l-emerald-500 mb-4"><p className="text-sm text-emerald-700">{saveMessage}</p></div>}
        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        {activeTab === 'ai' && (
          loading ? (
            <div className="text-center py-16 text-[var(--color-text-muted)]"><p className="text-sm">{zh ? '加载中…' : 'Loading…'}</p></div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.provider} className="bento-card-static">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[var(--color-text)]">{PROVIDER_NAMES[row.provider] || row.provider}</h2>
                      <span className="text-xs text-[var(--color-text-muted)]">{t('ai.priority')} {row.priority}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {statusDot(row.status)}
                      <span className="text-[var(--color-text-secondary)]">{statusLabel(row.status)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={row.newKey}
                      onChange={(e) => setRow(row.provider, { newKey: e.target.value })}
                      placeholder={row.hasKey ? (zh ? '已配置(输入以更换)' : 'Configured (type to replace)') : 'sk-xxxxxxxxxxxxx'}
                      className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                    />
                    <button onClick={() => testConnection(row)} disabled={row.status === 'testing' || (!row.hasKey && !row.newKey.trim())} className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer">
                      {row.status === 'testing' ? t('ai.testing') : t('ai.testConnection')}
                    </button>
                  </div>
                </div>
              ))}

              {/* Cost Control — 真实本月成本 */}
              <div className="bento-card-static">
                <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{t('ai.costControl')}</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="text-sm text-[var(--color-text-secondary)]">{zh ? '本月已用' : 'Spent this month'}</label>
                      <span className="text-sm num-accent text-[var(--color-text)]">
                        <span className="font-semibold">${costThisMonth}</span> / ${monthlyBudget}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--color-bg)] overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">{t('ai.monthlyBudget')}</label>
                    <input type="range" min="10" max="1000" step="10" value={monthlyBudget} onChange={(e) => setMonthlyBudget(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                      <span>$10</span><span className="font-semibold num-accent text-[var(--color-text)]">${monthlyBudget}</span><span>$1,000</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={autoSelect} onChange={(e) => setAutoSelect(e.target.checked)} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text)]">{t('ai.autoSelectCheapest')}</span>
                  </label>
                </div>
              </div>
              <button onClick={saveAll} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{t('ai.saveAll')}</button>
            </div>
          )
        )}

        {activeTab === 'platforms' && (
          <div className="bento-card-static text-center py-12">
            <p className="text-[var(--color-text-muted)]">{t('platforms.noBound')}</p>
            <button className="mt-4 pill pill-active cursor-pointer">+ {t('platforms.addPlatform')}</button>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="bento-card-static space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('account.personalInfo')}</h2>
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">{t('account.username')}</label>
                <input type="text" placeholder={t('account.usernamePlaceholder')} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">{t('account.email')}</label>
                <input type="email" placeholder={t('account.emailPlaceholder')} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{t('account.save')}</button>
          </div>
        )}
      </main>
    </div>
  );
}
