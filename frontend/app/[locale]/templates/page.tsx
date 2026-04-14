/**
 * Templates Page — Bento Card Grid
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';

interface Template { id: string; name: string; description: string; type: string; prompt: string; platforms: string[]; category: string; }

const typeColors: Record<string, string> = { text: 'bg-blue-50 text-blue-600', image: 'bg-pink-50 text-pink-600', video: 'bg-amber-50 text-amber-600', all: 'bg-indigo-50 text-indigo-600' };

export default function TemplatesPage() {
  const t = useTranslations('nav');
  const locale = useParams().locale as string;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const templates: Template[] = [
    { id: '1', name: 'Product Review', description: 'Generate product review content with pros/cons', type: 'all', prompt: 'Write a review for {product name} including features, experience, pros/cons, and recommendation', platforms: ['bilibili', 'xiaohongshu'], category: 'ecommerce' },
    { id: '2', name: 'Beauty Tutorial', description: 'Beauty tutorial video script template', type: 'video', prompt: 'Create a {makeup topic} tutorial video with step-by-step instructions', platforms: ['douyin', 'xiaohongshu'], category: 'beauty' },
    { id: '3', name: 'Food Sharing', description: 'Food recipe sharing template', type: 'all', prompt: 'Share the recipe for {dish name} with ingredients, steps, and tips', platforms: ['xiaohongshu', 'douyin'], category: 'food' },
    { id: '4', name: 'Tech News', description: 'Tech news reporting template', type: 'text', prompt: 'Report on the latest {tech topic} news, analyze its impact and significance', platforms: ['wechat-mp', 'bilibili'], category: 'tech' },
  ];

  const categories = [{ key: 'all', label: 'All' }, { key: 'ecommerce', label: 'E-Commerce' }, { key: 'beauty', label: 'Beauty' }, { key: 'food', label: 'Food' }, { key: 'tech', label: 'Tech' }];
  const filtered = selectedCategory === 'all' ? templates : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{locale === 'zh' ? '模板库' : 'Templates'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{locale === 'zh' ? '管理和使用内容模板' : 'Manage and use content templates'}</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {locale === 'zh' ? '创建模板' : 'Create'}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c.key} onClick={() => setSelectedCategory(c.key)} className={`pill flex-shrink-0 cursor-pointer ${selectedCategory === c.key ? 'pill-active' : ''}`}>{c.label}</button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(template => (
            <div key={template.id} className="bento-card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="text-base font-semibold text-[var(--color-text)]">{template.name}</h3><p className="text-xs text-[var(--color-text-muted)] mt-0.5">{template.description}</p></div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${typeColors[template.type]}`}>{template.type}</span>
              </div>
              <div className="flex gap-1 mb-3">{template.platforms.map(p => <span key={p} className="pill text-[10px] py-0.5 px-1.5">{p}</span>)}</div>
              <div className="flex-1 px-3 py-2 bg-[var(--color-bg)] rounded-lg mb-3">
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{template.prompt}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { window.location.href = `/${locale}/create?template=${template.id}`; }} className="flex-1 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">{locale === 'zh' ? '使用' : 'Use'}</button>
                <button className="py-2 px-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">{locale === 'zh' ? '编辑' : 'Edit'}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bento-card-static max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">{locale === 'zh' ? '创建新模板' : 'New Template'}</h2>
              <div className="space-y-3">
                <input type="text" placeholder={locale === 'zh' ? '模板名称' : 'Template name'} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                <textarea placeholder={locale === 'zh' ? '提示词模板（用 {变量} 表示可替换部分）' : 'Prompt template (use {variable} for placeholders)'} rows={4} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{locale === 'zh' ? '取消' : 'Cancel'}</button>
                <button className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors">{locale === 'zh' ? '创建' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
