/**
 * Templates Page — 模板管理 (F10)
 * 真实后端 CRUD:保存常用提示词模板,一键复用到创作页
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { templateApi } from '../../lib/api';

interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  promptTemplate: string;
  aiProvider: string;
  style: string | null;
  platforms: string | null;
}

const typeColors: Record<string, string> = {
  text: 'bg-blue-50 text-blue-600',
  image: 'bg-pink-50 text-pink-600',
  video: 'bg-amber-50 text-amber-600',
  all: 'bg-indigo-50 text-indigo-600',
};

export default function TemplatesPage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video'>('all');
  const [showModal, setShowModal] = useState(false);

  // 新建表单
  const [name, setName] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [type, setType] = useState<'all' | 'text' | 'image' | 'video'>('all');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await templateApi.list();
      setTemplates((res.data || []) as Template[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim() || !promptTemplate.trim()) return;
    setSaving(true);
    try {
      await templateApi.create({ name: name.trim(), promptTemplate: promptTemplate.trim(), type });
      setName('');
      setPromptTemplate('');
      setType('all');
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleUse = (tpl: Template) => {
    router.push(`/${locale}/create?prompt=${encodeURIComponent(tpl.promptTemplate)}`);
  };

  const handleDelete = async (tpl: Template) => {
    if (!confirm(zh ? '删除这个模板?' : 'Delete this template?')) return;
    await templateApi.delete(tpl.id);
    await load();
  };

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.type === filter || t.type === 'all');
  const filterPills: { key: typeof filter; label: string }[] = [
    { key: 'all', label: zh ? '全部' : 'All' },
    { key: 'text', label: zh ? '文案' : 'Text' },
    { key: 'image', label: zh ? '图片' : 'Image' },
    { key: 'video', label: zh ? '视频' : 'Video' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '模板库' : 'Templates'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '保存常用提示词,一键复用' : 'Save and reuse your prompt templates'}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {zh ? '创建模板' : 'Create'}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filterPills.map((c) => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={`pill flex-shrink-0 cursor-pointer ${filter === c.key ? 'pill-active' : ''}`}>{c.label}</button>
          ))}
        </div>

        {error && <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}

        {loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-sm">{zh ? '加载中…' : 'Loading…'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bento-card-static flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-30"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            <p className="text-sm">{zh ? '还没有模板,点「创建模板」开始' : 'No templates yet — click "Create"'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tpl) => (
              <div key={tpl.id} className="bento-card flex flex-col">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[var(--color-text)]">{tpl.name}</h3>
                    {tpl.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{tpl.description}</p>}
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-lg flex-shrink-0 ${typeColors[tpl.type] || typeColors.all}`}>{tpl.type}</span>
                </div>
                <div className="flex-1 px-3 py-2 bg-[var(--color-bg)] rounded-lg mb-3">
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{tpl.promptTemplate}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUse(tpl)} className="flex-1 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{zh ? '使用' : 'Use'}</button>
                  <button onClick={() => handleDelete(tpl)} title={zh ? '删除' : 'Delete'} className="py-2 px-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bento-card-static max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">{zh ? '创建新模板' : 'New Template'}</h2>
              <div className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={zh ? '模板名称' : 'Template name'} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <textarea value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} placeholder={zh ? '提示词模板(用 {变量} 表示可替换部分)' : 'Prompt template (use {variable} for placeholders)'} rows={4} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
                <div className="flex gap-2">
                  {(['all', 'text', 'image', 'video'] as const).map((tp) => (
                    <button key={tp} onClick={() => setType(tp)} className={`pill text-xs cursor-pointer ${type === tp ? 'pill-active' : ''}`}>{tp}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '取消' : 'Cancel'}</button>
                <button onClick={handleCreate} disabled={!name.trim() || !promptTemplate.trim() || saving} className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '创建' : 'Create')}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
