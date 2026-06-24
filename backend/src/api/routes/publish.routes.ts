/**
 * Publish API Routes (F4 单平台发布 / F6 多平台批量发布)
 * 同步发布:逐平台写 DistributionRecord,接入运营闭环(analytics/inbox 可见)。
 * Mock 模式下模拟成功;真实模式可在此对接平台适配器。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../utils/logger';

const router = Router();

/**
 * POST /api/publish
 * body: { contentId, platforms: [...] }
 * 逐平台发布并写入分发记录,返回每个平台的结果。
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { contentId, platforms } = req.body;

  if (!contentId || !Array.isArray(platforms) || platforms.length === 0) {
    res.status(400).json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'contentId and non-empty platforms are required', retryable: false },
    });
    return;
  }

  // 内容归属校验
  const content = await prisma.contentHistory.findFirst({
    where: { id: String(contentId), userId: req.userId },
  });
  if (!content) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Content not found', retryable: false } });
    return;
  }

  const results: { platform: string; status: string; url?: string; error?: string }[] = [];
  for (const platform of platforms) {
    const p = String(platform);
    try {
      // Mock 发布(真实模式:调用对应平台适配器的 publish())
      const record = await prisma.distributionRecord.create({
        data: {
          contentId: content.id,
          userId: req.userId!,
          platform: p,
          status: 'success',
          platformPostId: `mock_${Date.now()}_${p}`,
          platformUrl: `https://mock.${p}.example/post/${content.id}`,
          publishedAt: new Date(),
        },
      });
      results.push({ platform: p, status: 'success', url: record.platformUrl ?? undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.distributionRecord.create({
        data: { contentId: content.id, userId: req.userId!, platform: p, status: 'failed', errorMessage: message },
      });
      results.push({ platform: p, status: 'failed', error: message });
    }
  }

  // 内容状态推进为已发布
  await prisma.contentHistory.update({ where: { id: content.id }, data: { status: 'published' } });

  const succeeded = results.filter((r) => r.status === 'success').length;
  logger.info('Content published', { contentId: content.id, userId: req.userId, succeeded, total: results.length });

  res.json({ success: true, data: { contentId: content.id, succeeded, total: results.length, results } });
});

/**
 * GET /api/publish/history?contentId=
 * 列出分发记录(可按内容过滤)。
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  const { contentId } = req.query;
  const where: { userId?: string; contentId?: string } = { userId: req.userId };
  if (contentId) where.contentId = String(contentId);

  const records = await prisma.distributionRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ success: true, data: records });
});

export default router;
