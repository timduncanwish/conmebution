/**
 * Inbox Page — 互动收件箱 (F12, 借鉴 Buffer Community)
 * 统一拉取/回复各平台评论
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { inboxApi, type Engagement } from '../../lib/api';

const PLATFORMS = [
  { key: 'bilibili', zh: 'B站', en: 'Bilibili' },
  { key: 'douyin', zh: '抖音', en: 'Douyin' },
  { key: 'xiaohongshu', zh: '小红书', en: 'Xiaohongshu' },
  { key: 'wechat-mp', zh: '公众号', en: 'WeChat MP' },
  { key: 'wechat-channel', zh: '视频号', en: 'WeChat Ch.' },
  { key: 'youtube', zh: 'YouTube', en: 'YouTube' },
  { key: 'twitter', zh: 'Twitter', en: 'Twitter' },
  { key: 'medium', zh: 'Medium', en: 'Medium' },
];

const platformColor: Record<string, string> = {
  bilibili: 'bg-sky-50 text-sky-600',
  douyin: 'bg-gray-900 text-white',
  xiaohongshu: 'bg-red-50 text-red-600',
  'wechat-mp': 'bg-green-50 text-green-600',
  'wechat-channel': 'bg-green-50 text-green-600',
  youtube: 'bg-red-50 text-red-600',
  twitter: 'bg-sky-50 text-sky-500',
  medium: 'bg-gray-100 text-gray-700',
};

export default function InboxPage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const pLabel = (k: string) => {
    const p = PLATFORMS.find((x) => x.key === k);
    return p ? (zh ? p.zh : p.en) : k;
  };

  const [items, setItems] = useState<Engagement[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [platform, setPlatform] = useState<string>('all');

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inboxApi.list({
        status: status === 'all' ? undefined : status,
        platform: platform === 'all' ? undefined : platform,
      });
      setItems(res.data || []);
      setUnread(res.meta?.unreadCount ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [status, platform]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await inboxApi.sync();
      await load();
      if (res.data.created === 0) {
        setError(zh ? '没有新互动(请确保已有内容发布成功)' : 'No new interactions (need published content first)');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await inboxApi.reply(id, replyText.trim());
      setReplyingId(null);
      setReplyText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(zh ? '删除这条互动?' : 'Delete this interaction?')) return;
    await inboxApi.delete(id);
    await load();
  };

  const statusPills: { key: typeof status; label: string }[] = [
    { key: 'all', label: zh ? '全部' : 'All' },
    { key: 'unread', label: `${zh ? '未读' : 'Unread'}${unread ? ` (${unread})` : ''}` },
    { key: 'replied', label: zh ? '已回复' : 'Replied' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '互动收件箱' : 'Inbox'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '统一回复各平台评论与私信' : 'Reply to comments across all channels'}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 transition-colors cursor-pointer"
          >
            {syncing ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
            )}
            {zh ? '拉取互动' : 'Fetch'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusPills.map((p) => (
            <button key={p.key} onClick={() => setStatus(p.key)} className={`pill cursor-pointer ${status === p.key ? 'pill-active' : ''}`}>{p.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setPlatform('all')} className={`pill flex-shrink-0 text-xs cursor-pointer ${platform === 'all' ? 'pill-active' : ''}`}>{zh ? '所有平台' : 'All channels'}</button>
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => setPlatform(p.key)} className={`pill flex-shrink-0 text-xs cursor-pointer ${platform === p.key ? 'pill-active' : ''}`}>{pLabel(p.key)}</button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-sm text-amber-700">{error}</p></div>
        )}

        {loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-sm">{zh ? '加载中…' : 'Loading…'}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bento-card-static flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-30">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-sm">{zh ? '暂无互动,点「拉取互动」从已发布内容获取评论' : 'No interactions — click "Fetch" to pull comments from published content'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className={`bento-card-static ${it.status === 'unread' ? 'border-l-4 border-l-[var(--color-primary)]' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${platformColor[it.platform] || 'bg-gray-100 text-gray-600'}`}>{pLabel(it.platform)}</span>
                    <span className="text-sm font-semibold text-[var(--color-text)]">{it.authorName}</span>
                    {it.status === 'unread' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{zh ? '未读' : 'Unread'}</span>}
                  </div>
                  <button onClick={() => handleDelete(it.id)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer" title={zh ? '删除' : 'Delete'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  </button>
                </div>

                <p className="text-sm text-[var(--color-text)] mb-3">{it.content}</p>

                {it.status === 'replied' && it.reply && (
                  <div className="px-3 py-2 bg-[var(--color-bg)] rounded-xl border-l-2 border-l-emerald-400">
                    <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{zh ? '我的回复' : 'Your reply'}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{it.reply}</p>
                  </div>
                )}

                {it.status === 'unread' && (
                  replyingId === it.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitReply(it.id); }}
                        placeholder={zh ? '输入回复…' : 'Type a reply…'}
                        className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <button onClick={() => submitReply(it.id)} disabled={!replyText.trim()} className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 transition-colors">{zh ? '发送' : 'Send'}</button>
                      <button onClick={() => { setReplyingId(null); setReplyText(''); }} className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '取消' : 'Cancel'}</button>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingId(it.id); setReplyText(''); }} className="pill text-xs cursor-pointer">{zh ? '回复' : 'Reply'}</button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
