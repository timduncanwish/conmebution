/**
 * Settings Page — Bento Sidebar Tabs
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<'ai' | 'platforms' | 'account'>('ai');
  const [aiServices, setAiServices] = useState<{ provider: string; apiKey: string; status: 'connected' | 'disconnected' | 'testing'; priority: number }[]>([
    { provider: 'glm-4', apiKey: '', status: 'disconnected', priority: 1 },
    { provider: 'gpt-4', apiKey: '', status: 'disconnected', priority: 2 },
    { provider: 'gemini-pro', apiKey: '', status: 'disconnected', priority: 3 },
  ]);
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [autoSelect, setAutoSelect] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const savedKeys = localStorage.getItem('ai_service_keys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setAiServices(prev => prev.map(s => ({ ...s, apiKey: keys[s.provider] || '', status: keys[s.provider] ? 'connected' as const : 'disconnected' as const })));
    }
    const budget = localStorage.getItem('monthly_budget');
    if (budget) setMonthlyBudget(JSON.parse(budget));
    const auto = localStorage.getItem('auto_select_cheapest');
    if (auto) setAutoSelect(JSON.parse(auto));
  }, []);

  const testConnection = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) { alert(t('ai.inputApiKey')); return; }
    setAiServices(prev => prev.map(s => s.provider === provider ? { ...s, status: 'testing' as const } : s));
    try {
      const res = await api.generateTextSync('test', provider as any);
      const newStatus = res.success ? 'connected' as const : 'disconnected' as const;
      setAiServices(prev => prev.map(s => s.provider === provider ? { ...s, status: newStatus } : s));
    } catch {
      setAiServices(prev => prev.map(s => s.provider === provider ? { ...s, status: 'disconnected' as const } : s));
    }
  };

  const saveConfig = () => {
    const keysToSave: any = {};
    aiServices.forEach(s => { if (s.apiKey.trim()) keysToSave[s.provider] = s.apiKey; });
    localStorage.setItem('ai_service_keys', JSON.stringify(keysToSave));
    localStorage.setItem('monthly_budget', JSON.stringify(monthlyBudget));
    localStorage.setItem('auto_select_cheapest', JSON.stringify(autoSelect));
    setSaveMessage(t('ai.saved'));
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const statusDot = (status: string) => (
    <span className={`status-dot ${status === 'connected' ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
  );

  const statusLabel = (status: string) => {
    if (status === 'connected') return t('ai.connectionSuccess');
    if (status === 'testing') return t('ai.testing');
    return t('ai.connectionFailed');
  };

  const tabs = [
    { key: 'ai' as const, label: t('tabs.ai'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M16 14H8a6 6 0 00-6 6v2h20v-2a6 6 0 00-6-6z"/></svg> },
    { key: 'platforms' as const, label: t('tabs.platforms'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg> },
    { key: 'account' as const, label: t('tabs.account'), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">{t('title')}</h1>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${activeTab === tab.key ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)]'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {saveMessage && (
          <div className="bento-card-static border-l-4 border-l-emerald-500 mb-4"><p className="text-sm text-emerald-700">{saveMessage}</p></div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {aiServices.map(service => (
              <div key={service.provider} className="bento-card-static">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--color-text)]">{t(`ai.providerNames.${service.provider}`)}</h2>
                    <span className="text-xs text-[var(--color-text-muted)]">{t('ai.priority')} {service.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {statusDot(service.status)}
                    <span className="text-[var(--color-text-secondary)]">{statusLabel(service.status)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <input type="password" value={service.apiKey} onChange={e => setAiServices(prev => prev.map(s => s.provider === service.provider ? { ...s, apiKey: e.target.value } : s))} placeholder="sk-xxxxxxxxxxxxx" className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow" />
                  <button onClick={() => testConnection(service.provider, service.apiKey)} disabled={service.status === 'testing' || !service.apiKey} className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    {service.status === 'testing' ? t('ai.testing') : t('ai.testConnection')}
                  </button>
                </div>
              </div>
            ))}

            {/* Cost Control */}
            <div className="bento-card-static">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{t('ai.costControl')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">{t('ai.monthlyBudget')}</label>
                  <input type="range" min="10" max="1000" step="10" value={monthlyBudget} onChange={e => setMonthlyBudget(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>$10</span><span className="font-semibold num-accent text-[var(--color-text)]">${monthlyBudget}</span><span>$1,000</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={autoSelect} onChange={e => setAutoSelect(e.target.checked)} className="w-4 h-4 rounded accent-[var(--color-primary)]" />
                  <span className="text-sm text-[var(--color-text)]">{t('ai.autoSelectCheapest')}</span>
                </label>
              </div>
            </div>
            <button onClick={saveConfig} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{t('ai.saveAll')}</button>
          </div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div className="bento-card-static text-center py-12">
            <p className="text-[var(--color-text-muted)]">{t('platforms.noBound')}</p>
            <button className="mt-4 pill pill-active cursor-pointer">+ {t('platforms.addPlatform')}</button>
          </div>
        )}

        {/* Account Tab */}
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
