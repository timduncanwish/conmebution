/**
 * Scheduler Service (F8 — 发布队列调度器)
 * 进程内定时轮询到期的 pending 排期,触发(Mock)发布。
 * 借鉴 Buffer Publish:到点自动把队列内容发出去。
 */

import prisma from '../../utils/prisma';
import logger from '../../utils/logger';

const INTERVAL_MS = 15_000; // 每 15 秒轮询一次
let timer: NodeJS.Timeout | null = null;

function parsePlatforms(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 处理所有到期(scheduledTime <= now)的 pending 排期。
 * 返回本轮成功发布的条数。
 */
export async function processDuePosts(): Promise<number> {
  const now = new Date();
  const due = await prisma.scheduledPost.findMany({
    where: { status: 'pending', scheduledTime: { lte: now } },
  });

  let published = 0;
  for (const post of due) {
    try {
      const platforms = parsePlatforms(post.platforms);
      // Mock 发布:为每个平台写一条分发记录
      for (const platform of platforms) {
        await prisma.distributionRecord.create({
          data: {
            contentId: post.contentId,
            userId: post.userId,
            platform,
            status: 'success',
            platformPostId: `mock_${Date.now()}_${platform}`,
            platformUrl: `https://mock.${platform}.example/post/${post.id}`,
            publishedAt: new Date(),
          },
        });
      }
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'sent' },
      });
      published += 1;
      logger.info('Scheduled post published (mock)', { postId: post.id, platforms });
    } catch (error) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'failed', error: error instanceof Error ? error.message : String(error) },
      });
      logger.error('Scheduled post failed', { postId: post.id, error: String(error) });
    }
  }
  return published;
}

export function startScheduler(): void {
  if (timer) return;
  timer = setInterval(() => {
    processDuePosts().catch((e) => logger.error('Scheduler tick error', { error: String(e) }));
  }, INTERVAL_MS);
  logger.info(`⏰ Scheduler started (polling every ${INTERVAL_MS / 1000}s)`);
  // 启动后短暂延迟跑一次,处理积压
  setTimeout(() => processDuePosts().catch(() => {}), 3000);
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
