/**
 * Batch API Routes (F15 — 批量 SKU 推广)
 * 批量导入产品 → 逐个 AI 生成文案 → 可选批量发布,接入运营闭环。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import { aiServiceManager } from '../../services/ai';
import { AIProvider } from '../../types/ai.types';
import logger from '../../utils/logger';

const router = Router();

const MAX_PRODUCTS = 50;
const DEFAULT_TEMPLATE = '为「{product}」写一段适合社交媒体的推广文案,卖点:{keywords}';

interface SkuProduct {
  name: string;
  keywords?: string;
}

interface SkuResult {
  product: string;
  status: 'generated' | 'published' | 'failed';
  contentId?: string;
  publishedTo?: string[];
  error?: string;
}

function resolveProvider(p?: string): AIProvider {
  const values = Object.values(AIProvider) as string[];
  return p && values.includes(p) ? (p as AIProvider) : AIProvider.GLM_4;
}

/**
 * POST /api/batch/skus
 * body: { products: [{name, keywords?}], promptTemplate?, provider?, platforms?, autoPublish? }
 */
router.post('/skus', authenticateToken, async (req: Request, res: Response) => {
  const { products, promptTemplate, provider, platforms, autoPublish } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'products must be a non-empty array', retryable: false } });
    return;
  }
  if (products.length > MAX_PRODUCTS) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: `Max ${MAX_PRODUCTS} products per batch`, retryable: false } });
    return;
  }

  const template = typeof promptTemplate === 'string' && promptTemplate.trim() ? promptTemplate : DEFAULT_TEMPLATE;
  const aiProvider = resolveProvider(provider);
  const targetPlatforms: string[] = Array.isArray(platforms) ? platforms : [];
  const doPublish = !!autoPublish && targetPlatforms.length > 0;

  const results: SkuResult[] = [];
  for (const raw of products as SkuProduct[]) {
    const name = String(raw?.name ?? '').trim();
    if (!name) {
      results.push({ product: '', status: 'failed', error: 'Empty product name' });
      continue;
    }
    const keywords = String(raw?.keywords ?? '').trim();
    const prompt = template.replace(/\{product\}/g, name).replace(/\{keywords\}/g, keywords || name);

    try {
      const gen = await aiServiceManager.generateText({ prompt, provider: aiProvider });

      const content = await prisma.contentHistory.create({
        data: {
          userId: req.userId!,
          prompt,
          type: 'text',
          generatedContent: JSON.stringify({ content: gen.content, product: name }),
          aiProvider: gen.provider ?? aiProvider,
          cost: Math.round(gen.cost ?? 0),
          status: doPublish ? 'published' : 'generated',
        },
      });

      if (doPublish) {
        for (const platform of targetPlatforms) {
          await prisma.distributionRecord.create({
            data: {
              contentId: content.id,
              userId: req.userId!,
              platform,
              status: 'success',
              platformPostId: `mock_${Date.now()}_${platform}`,
              platformUrl: `https://mock.${platform}.example/post/${content.id}`,
              publishedAt: new Date(),
            },
          });
        }
      }

      results.push({
        product: name,
        status: doPublish ? 'published' : 'generated',
        contentId: content.id,
        ...(doPublish ? { publishedTo: targetPlatforms } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Batch SKU item failed', { product: name, error: message });
      results.push({ product: name, status: 'failed', error: message });
    }
  }

  const generated = results.filter((r) => r.status !== 'failed').length;
  const published = results.filter((r) => r.status === 'published').length;
  logger.info('Batch SKU completed', { userId: req.userId, total: products.length, generated, published });

  res.json({ success: true, data: { total: products.length, generated, published, results } });
});

export default router;
