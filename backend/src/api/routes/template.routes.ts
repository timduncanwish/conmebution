/**
 * Template CRUD API Routes
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/templates
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const templates = await prisma.contentTemplate.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    throw error;
  }
});

/**
 * POST /api/templates
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, type, promptTemplate, aiProvider, style, platforms } = req.body;

    const template = await prisma.contentTemplate.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        type: type || 'all',
        promptTemplate,
        aiProvider: aiProvider || 'glm-4',
        style: style || null,
        platforms: platforms ? JSON.stringify(platforms) : null,
      },
    });

    logger.info('Template created', { templateId: template.id, userId: req.userId });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    throw error;
  }
});

/**
 * PUT /api/templates/:id
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.contentTemplate.findFirst({
      where: { id: String(req.params.id), userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Template not found', retryable: false },
      });
      return;
    }

    const { name, description, type, promptTemplate, aiProvider, style, platforms } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (promptTemplate !== undefined) data.promptTemplate = promptTemplate;
    if (aiProvider !== undefined) data.aiProvider = aiProvider;
    if (style !== undefined) data.style = style;
    if (platforms !== undefined) data.platforms = JSON.stringify(platforms);

    const updated = await prisma.contentTemplate.update({
      where: { id: String(req.params.id) },
      data,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/templates/:id
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.contentTemplate.findFirst({
      where: { id: String(req.params.id), userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Template not found', retryable: false },
      });
      return;
    }

    await prisma.contentTemplate.delete({ where: { id: String(req.params.id) } });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    throw error;
  }
});

export default router;
