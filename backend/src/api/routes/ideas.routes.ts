/**
 * Ideas CRUD API Routes (F7 — 灵感收件箱)
 * 借鉴 Buffer 的 Create/Ideas:捕捉选题 → 一键转生成
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../utils/logger';

const router = Router();

const VALID_STATUS = ['pending', 'generated', 'archived'];

/**
 * GET /api/ideas?status=pending&tag=美妆
 * 支持按状态与标签筛选
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { status, tag } = req.query;

  const where: { userId?: string; status?: string } = { userId: req.userId };
  if (status && VALID_STATUS.includes(String(status))) {
    where.status = String(status);
  }

  let ideas = await prisma.idea.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  // 标签为 JSON 字符串,在内存里按标签过滤
  if (tag) {
    const t = String(tag);
    ideas = ideas.filter((idea) => {
      try {
        const tags: string[] = idea.tags ? JSON.parse(idea.tags) : [];
        return tags.includes(t);
      } catch {
        return false;
      }
    });
  }

  // 反序列化 tags 方便前端使用
  const data = ideas.map((idea) => ({
    ...idea,
    tags: idea.tags ? safeParseTags(idea.tags) : [],
  }));

  res.json({ success: true, data });
});

/**
 * POST /api/ideas
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { title, note, tags, status } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400).json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Title is required', retryable: false },
    });
    return;
  }

  const idea = await prisma.idea.create({
    data: {
      userId: req.userId!,
      title: String(title).trim(),
      note: note ? String(note) : null,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : null,
      status: status && VALID_STATUS.includes(status) ? status : 'pending',
    },
  });

  logger.info('Idea created', { ideaId: idea.id, userId: req.userId });

  res.status(201).json({ success: true, data: { ...idea, tags: safeParseTags(idea.tags) } });
});

/**
 * PUT /api/ideas/:id
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const existing = await prisma.idea.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      error: { type: 'NOT_FOUND', message: 'Idea not found', retryable: false },
    });
    return;
  }

  const { title, note, tags, status } = req.body;
  const data: { title?: string; note?: string | null; tags?: string | null; status?: string } = {};
  if (title !== undefined) data.title = String(title).trim();
  if (note !== undefined) data.note = note ? String(note) : null;
  if (tags !== undefined) data.tags = Array.isArray(tags) ? JSON.stringify(tags) : null;
  if (status !== undefined) {
    if (!VALID_STATUS.includes(status)) {
      res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: `Invalid status: ${status}`, retryable: false },
      });
      return;
    }
    data.status = status;
  }

  const updated = await prisma.idea.update({
    where: { id: String(req.params.id) },
    data,
  });

  res.json({ success: true, data: { ...updated, tags: safeParseTags(updated.tags) } });
});

/**
 * DELETE /api/ideas/:id
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const existing = await prisma.idea.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      error: { type: 'NOT_FOUND', message: 'Idea not found', retryable: false },
    });
    return;
  }

  await prisma.idea.delete({ where: { id: String(req.params.id) } });

  res.json({ success: true, data: { deleted: true } });
});

function safeParseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default router;
