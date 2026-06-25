/**
 * Localize API Routes (F16 — 跨语言本地化)
 * 把内容翻译为目标语言并可发布到国际平台。翻译走现有 AI 服务(Mock 可用)。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import { aiServiceManager } from '../../services/ai';
import { AIProvider } from '../../types/ai.types';
import logger from '../../utils/logger';

const router = Router();

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
};

interface LangResult {
  lang: string;
  status: 'translated' | 'published' | 'failed';
  contentId?: string;
  publishedTo?: string[];
  error?: string;
}

function resolveProvider(p?: string): AIProvider {
  const values = Object.values(AIProvider) as string[];
  return p && values.includes(p) ? (p as AIProvider) : AIProvider.GLM_4;
}

function extractText(generatedContent: string): string {
  try {
    const parsed = JSON.parse(generatedContent);
    if (typeof parsed?.content === 'string') return parsed.content;
  } catch {
    /* fallthrough */
  }
  return generatedContent;
}

/**
 * POST /api/localize
 * body: { contentId?, text?, targetLangs: [...], provider?, autoPublish?, platforms? }
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { contentId, text, targetLangs, provider, autoPublish, platforms } = req.body;

  if (!Array.isArray(targetLangs) || targetLangs.length === 0) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'targetLangs must be a non-empty array', retryable: false } });
    return;
  }
  const invalid = targetLangs.filter((l: string) => !LANG_NAMES[l]);
  if (invalid.length) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: `Unsupported languages: ${invalid.join(', ')}`, retryable: false } });
    return;
  }

  // 确定源文本与源内容
  let sourceText = '';
  let sourceContentId: string | null = null;
  if (contentId) {
    const content = await prisma.contentHistory.findFirst({ where: { id: String(contentId), userId: req.userId } });
    if (!content) {
      res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Content not found', retryable: false } });
      return;
    }
    sourceText = extractText(content.generatedContent);
    sourceContentId = content.id;
  } else if (typeof text === 'string' && text.trim()) {
    sourceText = text.trim();
  } else {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'Provide contentId or text', retryable: false } });
    return;
  }

  const aiProvider = resolveProvider(provider);
  const targetPlatforms: string[] = Array.isArray(platforms) ? platforms : [];
  const doPublish = !!autoPublish && targetPlatforms.length > 0;

  const results: LangResult[] = [];
  for (const lang of targetLangs as string[]) {
    const prompt = `Translate the following social media post into ${LANG_NAMES[lang]}. Keep it natural, concise and platform-appropriate. Output only the translation:\n\n${sourceText}`;
    try {
      const gen = await aiServiceManager.generateText({ prompt, provider: aiProvider });
      const content = await prisma.contentHistory.create({
        data: {
          userId: req.userId!,
          prompt,
          type: 'text',
          generatedContent: JSON.stringify({ content: gen.content, language: lang, sourceContentId }),
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
        lang,
        status: doPublish ? 'published' : 'translated',
        contentId: content.id,
        ...(doPublish ? { publishedTo: targetPlatforms } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Localize item failed', { lang, error: message });
      results.push({ lang, status: 'failed', error: message });
    }
  }

  const translated = results.filter((r) => r.status !== 'failed').length;
  const published = results.filter((r) => r.status === 'published').length;
  logger.info('Localize completed', { userId: req.userId, langs: targetLangs.length, translated, published });

  res.json({ success: true, data: { sourceContentId, translated, published, results } });
});

export default router;
