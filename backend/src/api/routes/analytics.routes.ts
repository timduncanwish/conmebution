/**
 * Analytics API Routes (F13 — 可行动分析)
 * 借鉴 Buffer Analyze:不只给图表,给答案。
 * 数据来源:真实的 DistributionRecord / Engagement / ContentHistory(本地表)。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 为一条分发记录生成「随时间增长」的 Mock 指标(确定性:由 id 种子 + 发布时长决定)。
 * 真实模式应改为调用平台数据 API。
 */
function mockMetrics(recordId: string, publishedAt: Date | null): { views: number; likes: number; shares: number } {
  const seed = recordId.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const hours = publishedAt ? Math.min(720, Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000)) : 0;
  const growth = 1 + hours; // 越久浏览越多
  const views = Math.round((50 + (seed % 200)) * growth);
  const likes = Math.round(views * (0.03 + (seed % 7) / 100));
  const shares = Math.round(likes * 0.2);
  return { views, likes, shares };
}

/**
 * POST /api/analytics/sync-metrics
 * 为当前用户成功发布的分发记录刷新 Mock 浏览/点赞/转发数据。
 */
export async function syncMetricsHandler(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const records = await prisma.distributionRecord.findMany({ where: { userId, status: 'success' } });
  let updated = 0;
  for (const r of records) {
    const m = mockMetrics(r.id, r.publishedAt);
    await prisma.distributionRecord.update({
      where: { id: r.id },
      data: { views: m.views, likes: m.likes, shares: m.shares, metricsSyncedAt: new Date() },
    });
    updated += 1;
  }
  res.json({ success: true, data: { updated } });
}

/**
 * GET /api/analytics/summary
 * 汇总当前用户的内容运营数据,并给出可行动建议。
 */
router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.userId!;

  const [contents, records, engagements] = await Promise.all([
    prisma.contentHistory.findMany({ where: { userId } }),
    prisma.distributionRecord.findMany({ where: { userId, status: 'success' } }),
    prisma.engagement.findMany({ where: { userId } }),
  ]);

  // ---- overview ----
  const replied = engagements.filter((e) => e.status === 'replied').length;
  const totalCost = contents.reduce((s, c) => s + (c.cost ?? 0), 0);
  const totalViews = records.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalLikes = records.reduce((s, r) => s + (r.likes ?? 0), 0);
  const totalShares = records.reduce((s, r) => s + (r.shares ?? 0), 0);
  const overview = {
    contentGenerated: contents.length,
    published: records.length,
    engagements: engagements.length,
    replied,
    replyRate: engagements.length ? Math.round((replied / engagements.length) * 100) : 0,
    totalCost,
    totalViews,
    totalLikes,
    totalShares,
  };

  // 每条分发记录的互动数
  const engByRecord = new Map<string, number>();
  for (const e of engagements) {
    if (e.distributionRecordId) {
      engByRecord.set(e.distributionRecordId, (engByRecord.get(e.distributionRecordId) ?? 0) + 1);
    }
  }

  // ---- byPlatform ----
  const platformMap = new Map<string, { platform: string; published: number; engagements: number; views: number; likes: number }>();
  for (const r of records) {
    const p = platformMap.get(r.platform) ?? { platform: r.platform, published: 0, engagements: 0, views: 0, likes: 0 };
    p.published += 1;
    p.engagements += engByRecord.get(r.id) ?? 0;
    p.views += r.views ?? 0;
    p.likes += r.likes ?? 0;
    platformMap.set(r.platform, p);
  }
  const byPlatform = Array.from(platformMap.values()).sort((a, b) => b.published - a.published);

  // ---- bestTimes:按 publishedAt 小时桶,用互动数加权,取每个平台 Top 时段 ----
  const bestTimes = Array.from(platformMap.keys()).map((platform) => {
    const hourWeight = new Map<number, number>();
    for (const r of records) {
      if (r.platform !== platform || !r.publishedAt) continue;
      const hour = new Date(r.publishedAt).getHours();
      const weight = 1 + (engByRecord.get(r.id) ?? 0); // 发布本身 +1,每条互动再加权
      hourWeight.set(hour, (hourWeight.get(hour) ?? 0) + weight);
    }
    const ranked = Array.from(hourWeight.entries()).sort((a, b) => b[1] - a[1]);
    const recommendedSlots = ranked.slice(0, 2).map(([h]) => `${String(h).padStart(2, '0')}:00`).sort();
    return {
      platform,
      recommendedSlots,
      basis: ranked.length ? `${ranked.length} 个活跃时段` : '数据不足',
    };
  }).filter((b) => b.recommendedSlots.length > 0);

  // ---- topContent:按互动数排序 ----
  const engByContent = new Map<string, number>();
  const pubByContent = new Map<string, number>();
  const viewsByContent = new Map<string, number>();
  for (const e of engagements) {
    if (e.contentId) engByContent.set(e.contentId, (engByContent.get(e.contentId) ?? 0) + 1);
  }
  for (const r of records) {
    pubByContent.set(r.contentId, (pubByContent.get(r.contentId) ?? 0) + 1);
    viewsByContent.set(r.contentId, (viewsByContent.get(r.contentId) ?? 0) + (r.views ?? 0));
  }
  const topContent = contents
    .map((c) => ({
      contentId: c.id,
      prompt: (c.prompt || '').slice(0, 40),
      type: c.type,
      published: pubByContent.get(c.id) ?? 0,
      engagements: engByContent.get(c.id) ?? 0,
      views: viewsByContent.get(c.id) ?? 0,
    }))
    .filter((c) => c.published > 0 || c.engagements > 0)
    .sort((a, b) => b.views - a.views || b.engagements - a.engagements)
    .slice(0, 5);

  // ---- trend:最近 7 天发布与互动 ----
  const trend: { date: string; label: string; published: number; engagements: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    trend.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      published: records.filter((r) => r.publishedAt && dayKey(new Date(r.publishedAt)) === key).length,
      engagements: engagements.filter((e) => dayKey(new Date(e.createdAt)) === key).length,
    });
  }

  // ---- 内容建议(反哺 Ideas):基于表现最好的内容类型 ----
  let suggestion = '';
  if (topContent.length > 0) {
    const top = topContent[0];
    const typeLabel: Record<string, string> = { text: '图文', image: '图片', video: '视频', all: '图文+视频' };
    suggestion = `表现最好的是「${top.prompt}」(${typeLabel[top.type] || top.type},${top.engagements} 互动)。建议多产出同类选题。`;
  }

  res.json({
    success: true,
    data: { overview, byPlatform, bestTimes, topContent, trend, suggestion },
  });
});

router.post('/sync-metrics', authenticateToken, syncMetricsHandler);

export default router;
