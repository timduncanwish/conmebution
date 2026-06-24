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
  const overview = {
    contentGenerated: contents.length,
    published: records.length,
    engagements: engagements.length,
    replied,
    replyRate: engagements.length ? Math.round((replied / engagements.length) * 100) : 0,
    totalCost,
  };

  // 每条分发记录的互动数
  const engByRecord = new Map<string, number>();
  for (const e of engagements) {
    if (e.distributionRecordId) {
      engByRecord.set(e.distributionRecordId, (engByRecord.get(e.distributionRecordId) ?? 0) + 1);
    }
  }

  // ---- byPlatform ----
  const platformMap = new Map<string, { platform: string; published: number; engagements: number }>();
  for (const r of records) {
    const p = platformMap.get(r.platform) ?? { platform: r.platform, published: 0, engagements: 0 };
    p.published += 1;
    p.engagements += engByRecord.get(r.id) ?? 0;
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
  for (const e of engagements) {
    if (e.contentId) engByContent.set(e.contentId, (engByContent.get(e.contentId) ?? 0) + 1);
  }
  for (const r of records) {
    pubByContent.set(r.contentId, (pubByContent.get(r.contentId) ?? 0) + 1);
  }
  const topContent = contents
    .map((c) => ({
      contentId: c.id,
      prompt: (c.prompt || '').slice(0, 40),
      type: c.type,
      published: pubByContent.get(c.id) ?? 0,
      engagements: engByContent.get(c.id) ?? 0,
    }))
    .filter((c) => c.published > 0 || c.engagements > 0)
    .sort((a, b) => b.engagements - a.engagements || b.published - a.published)
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

export default router;
