/**
 * Content CRUD API Routes
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import {
  createContentSchema,
  updateContentSchema,
  contentIdParamsSchema,
  contentListQuerySchema,
} from '../validators/content.validator';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/content
 * List current user's content with pagination
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = contentListQuerySchema.parse(req.query);

    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contentHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { distributionRecords: true },
      }),
      prisma.contentHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    throw error;
  }
});

/**
 * POST /api/content
 * Save generated content to history
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = createContentSchema.parse(req.body);

    const content = await prisma.contentHistory.create({
      data: {
        userId: req.userId!,
        prompt: data.prompt,
        type: data.type,
        generatedContent: JSON.stringify(data.generatedContent),
        aiProvider: data.aiProvider,
        cost: data.cost ?? null,
        status: data.status,
        templateId: data.templateId ?? null,
      },
    });

    logger.info('Content created', { contentId: content.id, userId: req.userId });

    res.status(201).json({ success: true, data: content });
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/content/:id
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = contentIdParamsSchema.parse(req.params);

    const content = await prisma.contentHistory.findFirst({
      where: { id, userId: req.userId },
      include: { distributionRecords: true },
    });

    if (!content) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Content not found', retryable: false },
      });
      return;
    }

    res.json({ success: true, data: content });
  } catch (error) {
    throw error;
  }
});

/**
 * PUT /api/content/:id
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = contentIdParamsSchema.parse(req.params);
    const data = updateContentSchema.parse(req.body);

    const existing = await prisma.contentHistory.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Content not found', retryable: false },
      });
      return;
    }

    const updateData: any = {};
    if (data.generatedContent !== undefined) updateData.generatedContent = JSON.stringify(data.generatedContent);
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.contentHistory.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/content/:id
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = contentIdParamsSchema.parse(req.params);

    const existing = await prisma.contentHistory.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Content not found', retryable: false },
      });
      return;
    }

    await prisma.contentHistory.delete({ where: { id } });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    throw error;
  }
});

export default router;
