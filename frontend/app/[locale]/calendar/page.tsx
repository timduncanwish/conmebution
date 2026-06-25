/**
 * Calendar Page — 内容日历 + 发布队列 (F8, 借鉴 Buffer Publish)
 * 月视图 · 拖拽改期 · 队列时间槽 · 快速排期
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { scheduleApi, contentApi, type ScheduledPost, type PostingSchedule } from '../../lib/api';

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

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

interface ContentItem {
  id: string;
  prompt: string;
  type: string;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 把月历铺成 6 行 x 7 列(含上/下月补白)
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // 周日起头
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarPage() {
  const locale = useParams().locale as string;
  const zh = locale === 'zh';
  const platformLabel = (k: string) => {
    const p = PLATFORMS.find((x) => x.key === k);
    return p ? (zh ? p.zh : p.en) : k;
  };

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [slots, setSlots] = useState<PostingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const [showSchedule, setShowSchedule] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const grid = buildGrid(cursor.year, cursor.month);
  const rangeFrom = grid[0];
  const rangeTo = new Date(grid[41]);
  rangeTo.setHours(23, 59, 59, 999);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [postsRes, slotsRes] = await Promise.all([
        scheduleApi.listPosts({ from: rangeFrom.toISOString(), to: rangeTo.toISOString() }),
        scheduleApi.listSlots(),
      ]);
      setPosts(postsRes.data || []);
      setSlots(slotsRes.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  useEffect(() => {
    load();
  }, [load]);

  const postsByDay = (d: Date) => posts.filter((p) => ymd(new Date(p.scheduledTime)) === ymd(d));

  // 拖拽改期:保留原时分,改到目标日期
  const handleDrop = async (day: Date) => {
    if (!dragId) return;
    const post = posts.find((p) => p.id === dragId);
    setDragId(null);
    if (!post) return;
    if (post.status !== 'pending') {
      setError(zh ? '只能改期待发布的内容' : 'Only pending posts can be rescheduled');
      return;
    }
    const old = new Date(post.scheduledTime);
    if (ymd(old) === ymd(day)) return;
    const next = new Date(day);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    try {
      await scheduleApi.updatePost(post.id, { scheduledTime: next.toISOString() });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleCancel = async (post: ScheduledPost) => {
    if (!confirm(zh ? '删除这条排期?' : 'Delete this scheduled post?')) return;
    await scheduleApi.deletePost(post.id);
    await load();
  };

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(zh ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });
  const weekdays = zh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{zh ? '内容日历' : 'Calendar'}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">{zh ? '排期、队列与自动发布' : 'Schedule, queue & auto-publish'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQueue(true)} className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
              {zh ? '队列设置' : 'Queue'}
            </button>
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {zh ? '快速排期' : 'Schedule'}
            </button>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer" aria-label="prev">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="text-lg font-semibold text-[var(--color-text)] min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => shiftMonth(1)} className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer" aria-label="next">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })} className="ml-2 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
              {zh ? '今天' : 'Today'}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{zh ? '待发布' : 'Pending'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{zh ? '已发布' : 'Sent'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{zh ? '失败' : 'Failed'}</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>
        )}

        {/* Calendar grid */}
        <div className="bento-card-static p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
            {weekdays.map((w) => (
              <div key={w} className="py-2 text-center text-xs font-medium text-[var(--color-text-muted)]">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d, idx) => {
              const inMonth = d.getMonth() === cursor.month;
              const isToday = ymd(d) === ymd(today);
              const dayPosts = postsByDay(d);
              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(d)}
                  className={`min-h-[96px] border-b border-r border-[var(--color-border)] p-1.5 ${inMonth ? '' : 'bg-[var(--color-bg)]/50'} ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                >
                  <div className={`text-xs mb-1 ${isToday ? 'font-bold text-[var(--color-primary)]' : inMonth ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>
                    {isToday ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary)] text-white">{d.getDate()}</span> : d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.map((p) => {
                      const t = new Date(p.scheduledTime);
                      return (
                        <div
                          key={p.id}
                          draggable={p.status === 'pending'}
                          onDragStart={() => setDragId(p.id)}
                          onClick={() => handleCancel(p)}
                          title={`${p.platforms.map(platformLabel).join(', ')} · ${p.status}`}
                          className={`text-[10px] leading-tight px-1.5 py-1 rounded-md border truncate ${p.status === 'pending' ? 'cursor-grab' : 'cursor-pointer'} ${statusColor[p.status] || statusColor.pending}`}
                        >
                          {String(t.getHours()).padStart(2, '0')}:{String(t.getMinutes()).padStart(2, '0')} {p.platforms.map(platformLabel).join('/')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading && <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">{zh ? '加载中…' : 'Loading…'}</p>}

        {showSchedule && (
          <ScheduleModal
            zh={zh}
            onClose={() => setShowSchedule(false)}
            onDone={() => { setShowSchedule(false); load(); }}
            platformLabel={platformLabel}
          />
        )}
        {showQueue && (
          <QueueModal
            zh={zh}
            slots={slots}
            onClose={() => setShowQueue(false)}
            onDone={() => { setShowQueue(false); load(); }}
            platformLabel={platformLabel}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- 快速排期 Modal ---------- */
function ScheduleModal({ zh, onClose, onDone, platformLabel }: { zh: boolean; onClose: () => void; onDone: () => void; platformLabel: (k: string) => string }) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentId, setContentId] = useState('');
  const [selPlatforms, setSelPlatforms] = useState<string[]>([]);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [datetime, setDatetime] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    contentApi.list({ limit: 50 }).then((res) => {
      const items = (res.data?.items || []) as ContentItem[];
      setContents(items);
      if (items[0]) setContentId(items[0].id);
    }).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const togglePlatform = (k: string) => setSelPlatforms((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const submit = async () => {
    setErr('');
    if (!contentId) { setErr(zh ? '请选择内容' : 'Select content'); return; }
    if (selPlatforms.length === 0) { setErr(zh ? '请选择平台' : 'Select platforms'); return; }
    if (mode === 'manual' && !datetime) { setErr(zh ? '请选择时间' : 'Pick a time'); return; }
    setSaving(true);
    try {
      await scheduleApi.createPost({
        contentId,
        platforms: selPlatforms,
        ...(mode === 'auto' ? { autoQueue: true } : { scheduledTime: new Date(datetime).toISOString() }),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bento-card-static max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">{zh ? '快速排期' : 'Schedule a Post'}</h2>
        {err && <div className="px-3 py-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{zh ? '内容' : 'Content'}</label>
            {contents.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{zh ? '内容库为空,请先到创作页生成内容' : 'No content yet — create some first'}</p>
            ) : (
              <select value={contentId} onChange={(e) => setContentId(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {contents.map((c) => (
                  <option key={c.id} value={c.id}>{(c.prompt || c.id).slice(0, 50)}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{zh ? '平台' : 'Platforms'}</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.key} onClick={() => togglePlatform(p.key)} className={`pill text-xs cursor-pointer ${selPlatforms.includes(p.key) ? 'pill-active' : ''}`}>
                  {platformLabel(p.key)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{zh ? '时间' : 'Time'}</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('auto')} className={`pill text-xs cursor-pointer ${mode === 'auto' ? 'pill-active' : ''}`}>{zh ? '自动入队' : 'Auto-queue'}</button>
              <button onClick={() => setMode('manual')} className={`pill text-xs cursor-pointer ${mode === 'manual' ? 'pill-active' : ''}`}>{zh ? '指定时间' : 'Pick time'}</button>
            </div>
            {mode === 'auto' ? (
              <p className="text-xs text-[var(--color-text-muted)]">{zh ? '自动分配到所选平台队列的下一个空闲时间槽' : 'Assigns the next free queue slot for the selected platform'}</p>
            ) : (
              <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '取消' : 'Cancel'}</button>
          <button onClick={submit} disabled={saving || contents.length === 0} className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
            {saving ? (zh ? '排期中…' : 'Scheduling…') : (zh ? '加入排期' : 'Schedule')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 队列设置 Modal ---------- */
function QueueModal({ zh, slots, onClose, onDone, platformLabel }: { zh: boolean; slots: PostingSchedule[]; onClose: () => void; onDone: () => void; platformLabel: (k: string) => string }) {
  const [platform, setPlatform] = useState(PLATFORMS[0].key);
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // 切换平台时载入已有时间槽
  useEffect(() => {
    const existing = slots.find((s) => s.platform === platform);
    setTimes(existing ? existing.timeSlots : []);
  }, [platform, slots]);

  const addTime = () => {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) { setErr(zh ? '时间格式应为 HH:MM' : 'Use HH:MM'); return; }
    if (!times.includes(newTime)) setTimes((t) => [...t, newTime].sort());
    setErr('');
  };

  const save = async () => {
    // 用户在输入框里填了时间但没点「添加」时,保存也应纳入,避免静默丢失
    const pending = /^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime) && !times.includes(newTime) ? [newTime] : [];
    const finalTimes = Array.from(new Set([...times, ...pending])).sort();
    if (finalTimes.length === 0) {
      setErr(zh ? '请先添加至少一个时间槽' : 'Add at least one time slot');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await scheduleApi.setSlots(platform, { timeSlots: finalTimes });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bento-card-static max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">{zh ? '发布队列设置' : 'Posting Queue'}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{zh ? '为每个渠道设定固定发布时间,内容会自动排入下一个空闲槽' : 'Set fixed posting times per channel; content auto-fills the next free slot'}</p>
        {err && <div className="px-3 py-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{err}</div>}

        <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{zh ? '渠道' : 'Channel'}</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-2.5 mb-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
          {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{platformLabel(p.key)}</option>)}
        </select>

        <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{zh ? '时间槽' : 'Time slots'}</label>
        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
          {times.length === 0 && <span className="text-xs text-[var(--color-text-muted)]">{zh ? '暂无,添加一个' : 'None yet'}</span>}
          {times.map((t) => (
            <span key={t} className="pill text-xs flex items-center gap-1">
              {t}
              <button onClick={() => setTimes((arr) => arr.filter((x) => x !== t))} className="text-[var(--color-text-muted)] hover:text-red-500 cursor-pointer">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          <button onClick={addTime} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '添加' : 'Add'}</button>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm cursor-pointer hover:bg-[var(--color-bg)] transition-colors">{zh ? '取消' : 'Cancel'}</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 transition-colors">
            {saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
