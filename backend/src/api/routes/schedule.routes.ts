/**
 * Schedule API Routes (F8 — 内容日历 + 发布队列)
 * - /slots: 每渠道的发布时间槽 (PostingSchedule)
 * - /posts: 排期内容 (ScheduledPost),支持手动指定时间或自动入队下一空闲槽
 */

import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import logger from '../../utils/logger';

const router = Router();

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// ============ 时间槽 (PostingSchedule) ============

/**
 * GET /api/schedule/slots — 当前用户所有渠道的时间槽
 */
router.get('/slots', authenticateToken, async (req: Request, res: Response) => {
  const schedules = await prisma.postingSchedule.findMany({
    where: { userId: req.userId },
    orderBy: { platform: 'asc' },
  });
  res.json({
    success: true,
    data: schedules.map((s) => ({ ...s, timeSlots: parseJsonArray(s.timeSlots) })),
  });
});

/**
 * PUT /api/schedule/slots/:platform — 设置某渠道时间槽 (upsert)
 * body: { timeSlots: ["12:00","19:00"], timezone?, enabled? }
 */
router.put('/slots/:platform', authenticateToken, async (req: Request, res: Response) => {
  const platform = String(req.params.platform);
  const { timeSlots, timezone, enabled } = req.body;

  if (!Array.isArray(timeSlots) || timeSlots.some((t) => !TIME_RE.test(String(t)))) {
    res.status(400).json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'timeSlots must be an array of HH:MM strings', retryable: false },
    });
    return;
  }

  // 排序去重
  const slots = Array.from(new Set(timeSlots.map(String))).sort();

  const schedule = await prisma.postingSchedule.upsert({
    where: { userId_platform: { userId: req.userId!, platform } },
    update: {
      timeSlots: JSON.stringify(slots),
      ...(timezone !== undefined ? { timezone: String(timezone) } : {}),
      ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
    },
    create: {
      userId: req.userId!,
      platform,
      timeSlots: JSON.stringify(slots),
      timezone: timezone ? String(timezone) : 'Asia/Shanghai',
      enabled: enabled !== undefined ? Boolean(enabled) : true,
    },
  });

  res.json({ success: true, data: { ...schedule, timeSlots: parseJsonArray(schedule.timeSlots) } });
});

/**
 * DELETE /api/schedule/slots/:platform
 */
router.delete('/slots/:platform', authenticateToken, async (req: Request, res: Response) => {
  const platform = String(req.params.platform);
  const existing = await prisma.postingSchedule.findUnique({
    where: { userId_platform: { userId: req.userId!, platform } },
  });
  if (!existing) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Schedule not found', retryable: false } });
    return;
  }
  await prisma.postingSchedule.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { deleted: true } });
});

// ============ 排期内容 (ScheduledPost) ============

/**
 * GET /api/schedule/posts?from=ISO&to=ISO&status=pending
 */
router.get('/posts', authenticateToken, async (req: Request, res: Response) => {
  const { from, to, status } = req.query;
  const where: {
    userId?: string;
    status?: string;
    scheduledTime?: { gte?: Date; lte?: Date };
  } = { userId: req.userId };

  if (status) where.status = String(status);
  if (from || to) {
    where.scheduledTime = {};
    if (from) where.scheduledTime.gte = new Date(String(from));
    if (to) where.scheduledTime.lte = new Date(String(to));
  }

  const posts = await prisma.scheduledPost.findMany({
    where,
    orderBy: { scheduledTime: 'asc' },
  });

  res.json({
    success: true,
    data: posts.map((p) => ({ ...p, platforms: parseJsonArray(p.platforms) })),
  });
});

/**
 * 求某绝对时刻在指定时区的 UTC 偏移(毫秒)。
 */
function offsetMsForZone(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const m: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== 'literal') m[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second);
  return asUTC - instant.getTime();
}

/**
 * 把"某时区里的墙上时间 y-mo-d h:mi"转换为绝对 UTC Date(两次迭代处理 DST 边界)。
 */
function zonedWallTimeToUtc(year: number, month0: number, day: number, hour: number, minute: number, timeZone: string): Date {
  let utc = Date.UTC(year, month0, day, hour, minute, 0);
  for (let i = 0; i < 2; i++) {
    const offset = offsetMsForZone(new Date(utc), timeZone);
    const corrected = Date.UTC(year, month0, day, hour, minute, 0) - offset;
    if (corrected === utc) break;
    utc = corrected;
  }
  return new Date(utc);
}

/**
 * 计算某渠道在 now 之后、尚未被 pending 排期占用的下一个时间槽。
 * 时间槽 HH:MM 按 schedule.timezone(默认 Asia/Shanghai)解释,而非服务器本地时区。
 */
async function computeNextSlot(userId: string, platform: string): Promise<Date | null> {
  const schedule = await prisma.postingSchedule.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!schedule || !schedule.enabled) return null;
  const slots = parseJsonArray(schedule.timeSlots);
  if (slots.length === 0) return null;

  const tz = schedule.timezone || 'Asia/Shanghai';

  // 已被该用户 pending 排期占用的时间点(毫秒集合)
  const taken = await prisma.scheduledPost.findMany({
    where: { userId, status: 'pending', platforms: { contains: `"${platform}"` } },
    select: { scheduledTime: true },
  });
  const takenSet = new Set(taken.map((t) => t.scheduledTime.getTime()));

  const now = new Date();
  // 起点:now 在目标时区里的年月日
  const baseParts: Record<string, number> = {};
  for (const p of new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)) {
    if (p.type !== 'literal') baseParts[p.type] = Number(p.value);
  }

  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    for (const slot of slots) {
      const [h, m] = slot.split(':').map(Number);
      // 用目标时区里的 (baseDay + dayOffset) 这一天的 HH:MM
      const d = zonedWallTimeToUtc(baseParts.year, baseParts.month - 1, baseParts.day + dayOffset, h, m, tz);
      if (d.getTime() > now.getTime() && !takenSet.has(d.getTime())) {
        return d;
      }
    }
  }
  return null;
}

/**
 * POST /api/schedule/posts — 创建排期
 * body: { contentId, platforms: [...], scheduledTime?: ISO, autoQueue?: bool }
 * 若 autoQueue 或未给 scheduledTime,则自动分配到第一个有队列的渠道的下一个空闲槽。
 */
router.post('/posts', authenticateToken, async (req: Request, res: Response) => {
  const { contentId, platforms, scheduledTime, autoQueue, timezone } = req.body;

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

  let when: Date | null = null;
  let postingScheduleId: string | null = null;

  if (!autoQueue && scheduledTime) {
    when = new Date(String(scheduledTime));
    if (isNaN(when.getTime())) {
      res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'Invalid scheduledTime', retryable: false } });
      return;
    }
  } else {
    // 自动入队:取第一个有可用槽的渠道
    for (const platform of platforms) {
      const slot = await computeNextSlot(req.userId!, String(platform));
      if (slot) {
        when = slot;
        const sched = await prisma.postingSchedule.findUnique({
          where: { userId_platform: { userId: req.userId!, platform: String(platform) } },
        });
        postingScheduleId = sched?.id ?? null;
        break;
      }
    }
    if (!when) {
      res.status(400).json({
        success: false,
        error: { type: 'NO_SLOT_AVAILABLE', message: 'No queue time slot configured for the given platforms', retryable: false },
      });
      return;
    }
  }

  const post = await prisma.scheduledPost.create({
    data: {
      userId: req.userId!,
      contentId: String(contentId),
      postingScheduleId,
      platforms: JSON.stringify(platforms),
      scheduledTime: when,
      timezone: timezone ? String(timezone) : 'Asia/Shanghai',
      status: 'pending',
    },
  });

  logger.info('Scheduled post created', { postId: post.id, scheduledTime: when, autoQueue: !!autoQueue });
  res.status(201).json({ success: true, data: { ...post, platforms: parseJsonArray(post.platforms) } });
});

/**
 * PUT /api/schedule/posts/:id — 改期 / 改平台 / 取消
 * body: { scheduledTime?, platforms?, status? }
 */
router.put('/posts/:id', authenticateToken, async (req: Request, res: Response) => {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Scheduled post not found', retryable: false } });
    return;
  }

  const { scheduledTime, platforms, status } = req.body;
  const data: { scheduledTime?: Date; platforms?: string; status?: string } = {};

  if (scheduledTime !== undefined) {
    const d = new Date(String(scheduledTime));
    if (isNaN(d.getTime())) {
      res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'Invalid scheduledTime', retryable: false } });
      return;
    }
    data.scheduledTime = d;
  }
  if (platforms !== undefined) {
    if (!Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: 'platforms must be a non-empty array', retryable: false } });
      return;
    }
    data.platforms = JSON.stringify(platforms);
  }
  if (status !== undefined) {
    if (!['pending', 'sent', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, error: { type: 'VALIDATION_ERROR', message: `Invalid status: ${status}`, retryable: false } });
      return;
    }
    data.status = status;
  }

  const updated = await prisma.scheduledPost.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: { ...updated, platforms: parseJsonArray(updated.platforms) } });
});

/**
 * DELETE /api/schedule/posts/:id
 */
router.delete('/posts/:id', authenticateToken, async (req: Request, res: Response) => {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ success: false, error: { type: 'NOT_FOUND', message: 'Scheduled post not found', retryable: false } });
    return;
  }
  await prisma.scheduledPost.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { deleted: true } });
});

export default router;
