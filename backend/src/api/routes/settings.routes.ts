/**
 * Settings API Routes (F11 — AI 配置 + 成本追踪)
 * API 密钥按用户加密存储,绝不回传明文;本月成本来自真实 ContentHistory。
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import { encrypt } from '../../utils/crypto';
import config from '../../config';
import logger from '../../utils/logger';

const router = Router();

const VALID_PROVIDERS = ['glm-4', 'gpt-4', 'gemini-pro', 'doubao'];

function maskKey(plainLen: number): string {
  // 仅用于提示「已配置」,不暴露任何明文片段
  return plainLen > 0 ? '••••••••' : '';
}

/**
 * 计算当前自然月的 AI 成本(单位与 ContentHistory.cost 一致)。
 */
async function monthlyCost(userId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = await prisma.contentHistory.findMany({
    where: { userId, createdAt: { gte: start } },
    select: { cost: true },
  });
  return rows.reduce((s, r) => s + (r.cost ?? 0), 0);
}

/**
 * GET /api/settings
 * 返回 provider 配置(只给 hasKey/masked,不给明文)、预算、本月成本。
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [configs, setting, cost] = await Promise.all([
    prisma.aiProviderConfig.findMany({ where: { userId }, orderBy: { priority: 'asc' } }),
    prisma.userSetting.findUnique({ where: { userId } }),
    monthlyCost(userId),
  ]);

  const byProvider = new Map(configs.map((c) => [c.provider, c]));
  const providers = VALID_PROVIDERS.map((provider) => {
    const c = byProvider.get(provider);
    return {
      provider,
      hasKey: !!c?.apiKey,
      keyMasked: c?.apiKey ? maskKey(1) : '',
      priority: c?.priority ?? VALID_PROVIDERS.indexOf(provider) + 1,
      enabled: c?.enabled ?? true,
    };
  });

  res.json({
    success: true,
    data: {
      providers,
      monthlyBudget: setting?.monthlyBudget ?? 500,
      autoSelectCheapest: setting?.autoSelectCheapest ?? true,
      costThisMonth: cost,
    },
  });
});

/**
 * PUT /api/settings/providers/:provider
 * body: { apiKey?, priority?, enabled? } — apiKey 加密存储;不传则保留原值。
 */
router.put('/providers/:provider', authenticateToken, async (req: Request, res: Response) => {
  const provider = String(req.params.provider);
  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: `Unknown provider: ${provider}`, retryable: false } });
    return;
  }

  const { apiKey, priority, enabled } = req.body;
  const update: { apiKey?: string; priority?: number; enabled?: boolean } = {};
  if (typeof apiKey === 'string' && apiKey.trim()) {
    update.apiKey = encrypt(apiKey.trim(), config.credentialEncryptionKey);
  }
  if (priority !== undefined) update.priority = Number(priority);
  if (enabled !== undefined) update.enabled = Boolean(enabled);

  const existing = await prisma.aiProviderConfig.findUnique({
    where: { userId_provider: { userId: req.userId!, provider } },
  });

  if (!existing && !update.apiKey) {
    res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'apiKey required for first-time setup', retryable: false } });
    return;
  }

  const saved = await prisma.aiProviderConfig.upsert({
    where: { userId_provider: { userId: req.userId!, provider } },
    update,
    create: {
      userId: req.userId!,
      provider,
      apiKey: update.apiKey ?? '',
      priority: update.priority ?? VALID_PROVIDERS.indexOf(provider) + 1,
      enabled: update.enabled ?? true,
    },
  });

  logger.info('AI provider config saved', { userId: req.userId, provider });
  // 不回传明文 key
  res.json({ success: true, data: { provider: saved.provider, hasKey: !!saved.apiKey, priority: saved.priority, enabled: saved.enabled } });
});

/**
 * POST /api/settings/providers/:provider/test
 * Mock:已配置 key 即视为连接成功(真实模式应调用 provider 健康检查)。
 */
router.post('/providers/:provider/test', authenticateToken, async (req: Request, res: Response) => {
  const provider = String(req.params.provider);
  const cfg = await prisma.aiProviderConfig.findUnique({
    where: { userId_provider: { userId: req.userId!, provider } },
  });
  const connected = !!cfg?.apiKey && cfg.enabled;
  res.json({ success: true, data: { provider, connected } });
});

/**
 * PUT /api/settings — 预算与自动选择
 */
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  const { monthlyBudget, autoSelectCheapest } = req.body;
  const update: { monthlyBudget?: number; autoSelectCheapest?: boolean } = {};
  if (monthlyBudget !== undefined) update.monthlyBudget = Math.max(0, Number(monthlyBudget));
  if (autoSelectCheapest !== undefined) update.autoSelectCheapest = Boolean(autoSelectCheapest);

  const setting = await prisma.userSetting.upsert({
    where: { userId: req.userId! },
    update,
    create: {
      userId: req.userId!,
      monthlyBudget: update.monthlyBudget ?? 500,
      autoSelectCheapest: update.autoSelectCheapest ?? true,
    },
  });

  res.json({ success: true, data: { monthlyBudget: setting.monthlyBudget, autoSelectCheapest: setting.autoSelectCheapest } });
});

export default router;
