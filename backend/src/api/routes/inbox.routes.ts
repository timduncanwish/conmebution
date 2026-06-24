/**
 * Inbox API Routes (F12 — 互动收件箱)
 * 借鉴 Buffer Community:统一拉取/回复各平台评论。
 * Mock 模式:从已成功发布的 DistributionRecord 合成示例评论。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../utils/logger';

const router = Router();

// Mock 评论作者与内容池
const MOCK_AUTHORS = ['小明', '阿杰', 'Luna', '数码控', 'Mira', '路人甲', 'TechFan', '柠檬'];
const MOCK_COMMENTS = [
  '太实用了,已收藏!',
  '请问这个在哪里买?',
  '博主讲得很清楚,期待下一期',
  'Great content, thanks for sharing!',
  '这个观点我不太认同,可以展开说说吗',
  '第一!支持博主',
  '画质好棒,用的什么设备?',
  'Could you make a tutorial on this?',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/**
 * GET /api/inbox?platform=&status=
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { platform, status } = req.query;
  const where: { userId?: string; platform?: string; status?: string } = { userId: req.userId };
  if (platform) where.platform = String(platform);
  if (status && ['unread', 'replied'].includes(String(status))) where.status = String(status);

  const items = await prisma.engagement.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  const unreadCount = await prisma.engagement.count({ where: { userId: req.userId, status: 'unread' } });

  res.json({ success: true, data: items, meta: { unreadCount } });
});

/**
 * POST /api/inbox/sync
 * 从当前用户成功发布的分发记录幂等生成 Mock 评论(每条记录 1-3 条)。
 * 返回本次新增条数。
 */
router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  const records = await prisma.distributionRecord.findMany({
    where: { userId: req.userId, status: 'success' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  let created = 0;
  for (const rec of records) {
    // 每条记录稳定生成 (id 末位决定数量,1-3 条),用 externalId 保证幂等
    const count = (rec.id.charCodeAt(rec.id.length - 1) % 3) + 1;
    for (let i = 0; i < count; i++) {
      const externalId = `${rec.id}_${i}`;
      const exists = await prisma.engagement.findUnique({
        where: { userId_externalId: { userId: req.userId!, externalId } },
      });
      if (exists) continue;

      const seed = rec.id.charCodeAt(rec.id.length - 1) + i;
      await prisma.engagement.create({
        data: {
          userId: req.userId!,
          distributionRecordId: rec.id,
          contentId: rec.contentId,
          platform: rec.platform,
          type: 'comment',
          externalId,
          authorName: pick(MOCK_AUTHORS, seed),
          content: pick(MOCK_COMMENTS, seed),
          status: 'unread',
        },
      });
      created += 1;
    }
  }

  logger.info('Inbox synced (mock)', { userId: req.userId, created });
  res.json({ success: true, data: { created } });
});

/**
 * PUT /api/inbox/:id/reply — body: { reply }
 * Mock:将回复写回本地,状态置 replied(真实环境会调用平台 replyComment)。
 */
router.put('/:id/reply', authenticateToken, async (req: Request, res: Response) => {
  const { reply } = req.body;
  if (!reply || !String(reply).trim()) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'Reply text is required', retryable: false } });
    return;
  }

  const existing = await prisma.engagement.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Engagement not found', retryable: false } });
    return;
  }

  const updated = await prisma.engagement.update({
    where: { id: existing.id },
    data: { reply: String(reply).trim(), status: 'replied', repliedAt: new Date() },
  });

  res.json({ success: true, data: updated });
});

/**
 * DELETE /api/inbox/:id
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const existing = await prisma.engagement.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Engagement not found', retryable: false } });
    return;
  }
  await prisma.engagement.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { deleted: true } });
});

export default router;
