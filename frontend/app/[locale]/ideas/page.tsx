/**
 * Ideas Page — 灵感收件箱 (F7, 借鉴 Buffer Create/Ideas)
 * 捕捉选题 → 一键转生成
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { ideaApi, type Idea } from '../../lib/api';

const statusMeta: Record<string, { zh: string; en: string; color: string }> = {
  pending: { zh: '待处理', en: 'Pending', color: 'bg-amber-50 text-amber-600' },
  generated: { zh: '已生成', en: 'Generated', color: 'bg-emerald-50 text-emerald-600' },
  archived: { zh: '已归档', en: 'Archived', color: 'bg-gray-100 text-gray-500' },
};

export default function IdeasPage() {
  const locale = useParams().locale as string;
  const router = useRouter();
  const zh = locale === 'zh';

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'generated' | 'archived'>('all');
  const [showModal, setShowModal] = useState(false);

  // 新建表单
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ideaApi.list(filter === 'all' ? undefined : { status: filter });
      setIdeas(res.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagsInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      await ideaApi.create({ title: title.trim(), note: note.trim() || undefined, tags });
      setTitle('');
      setNote('');
      setTagsInput('');
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // 一键转生成:标记为已生成 → 跳到创作页并预填提示词
  const handleConvert = async (idea: Idea) => {
    const promptText = idea.note ? `${idea.title}\n${idea.note}` : idea.title;
    try {
      await ideaApi.update(idea.id, { status: 'generated' });
    } catch {
      // 标记失败不阻断跳转
    }
    router.push(`/${locale}/create?prompt=${encodeURIComponent(promptText)}&ideaId=${idea.id}`);
  };

  const handleArchiveToggle = async (idea: Idea) => {
    const next = idea.status === 'archived' ? 'pending' : 'archived';
    await ideaApi.update(idea.id, { status: next });
    await load();
  };

  const handleDelete = async (idea: Idea) => {
    if (!confirm(zh ? '确定删除这条灵感?' : 'Delete this idea?')) return;
    await ideaApi.delete(idea.id);
    await load();
  };

  const filterPills: { key: typeof filter; label: string }[] = [
    { key: 'all', label: zh ? '全部' : 'All' },
    { key: 'pending', label: zh ? '待处理' : 'Pending' },
    { key: 'generated', label: zh ? '已生成' : 'Generated' },
    { key: 'archived', label: zh ? '已归档' : 'Archived' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '灵感收件箱' : 'Ideas'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              {zh ? '随手捕捉选题,一键转为 AI 创作' : 'Capture ideas, turn them into content in one click'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {zh ? '记录灵感' : 'New Idea'}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filterPills.map((p) => (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`pill flex-shrink-0 cursor-pointer ${filter === p.key ? 'pill-active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-sm">{zh ? '加载中…' : 'Loading…'}</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="bento-card-static flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-30">
              <path d="M9 18h6M10 22h4M15 2a7 7 0 00-4 12.7V17h2v-1h-2 6v1h-2v-2.3A7 7 0 0015 2z" />
            </svg>
            <p className="text-sm">{zh ? '还没有灵感,点击「记录灵感」开始' : 'No ideas yet — click "New Idea" to start'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => {
              const meta = statusMeta[idea.status] || statusMeta.pending;
              return (
                <div key={idea.id} className="bento-card flex flex-col">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-text)] flex-1">{idea.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg flex-shrink-0 ${meta.color}`}>
                      {zh ? meta.zh : meta.en}
                    </span>
                  </div>
                  {idea.note && <p className="text-xs text-[var(--color-text-secondary)] mb-3 line-clamp-3">{idea.note}</p>}
                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="pill text-[10px] py-0.5 px-1.5">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleConvert(idea)}
                      className="flex-1 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
                    >
                      {zh ? '转生成' : 'Generate'}
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(idea)}
                      title={idea.status === 'archived' ? (zh ? '恢复' : 'Restore') : (zh ? '归档' : 'Archive')}
                      className="py-2 px-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
                    >
                      {idea.status === 'archived' ? (zh ? '恢复' : 'Restore') : (zh ? '归档' : 'Archive')}
                    </button>
                    <button
                      onClick={() => handleDelete(idea)}
                      title={zh ? '删除' : 'Delete'}
                      className="py-2 px-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bento-card-static max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">{zh ? '记录灵感' : 'New Idea'}</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={zh ? '灵感标题(必填)' : 'Idea title (required)'}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={zh ? '备注/细节(可选)' : 'Note / details (optional)'}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={zh ? '标签,逗号分隔(可选)' : 'Tags, comma-separated (optional)'}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '取消' : 'Cancel'}</button>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || saving}
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
