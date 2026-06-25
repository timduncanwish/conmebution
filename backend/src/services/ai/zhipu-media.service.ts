/**
 * Zhipu (智谱) Media Generation — CogView 图片 / CogVideoX 视频
 * 用 GLM key 调用智谱标准端点(图片/视频在 /api/paas/v4,不在编码端点)。
 * 免费档:cogview-3-flash / cogvideox-flash。
 */

import axios from 'axios';
import logger from '../../utils/logger';
import type { ImageGenerationOptions, ImageGenerationResult } from './image-generation';
import type { VideoGenerationOptions, VideoGenerationResult } from './video-generation';

const STD_BASE = process.env.GLM_MEDIA_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';

/** CogView 图片生成(同步) */
export class ZhipuImageGenerator {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = process.env.GLM_IMAGE_MODEL || 'cogview-3-flash';
  }

  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      logger.info('Zhipu CogView image generation', { model: this.model, prompt: options.prompt.slice(0, 50) });
      const body: Record<string, unknown> = { model: this.model, prompt: options.prompt };
      if (options.size) body.size = options.size;

      const resp = await axios.post(`${STD_BASE}/images/generations`, body, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        timeout: 60000,
      });

      const images = (resp.data?.data || []).map((d: { url: string }) => ({ url: d.url }));
      if (images.length === 0) {
        return { success: false, error: 'No image returned' };
      }
      return { success: true, images, cost: 0 };
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = e.response?.data?.error?.message || e.message || 'Image generation failed';
      logger.error('Zhipu CogView failed', { error: msg });
      return { success: false, error: msg };
    }
  }
}

export interface VideoGenerationResultEx extends VideoGenerationResult {
  status?: 'processing' | 'success' | 'failed';
  taskId?: string;
}

/** CogVideoX 视频生成(异步:提交 → 轮询) */
export class ZhipuVideoGenerator {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = process.env.GLM_VIDEO_MODEL || 'cogvideox-flash';
  }

  private headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` };
  }

  /** 提交视频任务,返回 taskId */
  async submit(options: VideoGenerationOptions): Promise<string> {
    const resp = await axios.post(
      `${STD_BASE}/videos/generations`,
      { model: this.model, prompt: options.prompt },
      { headers: this.headers(), timeout: 30000 },
    );
    return resp.data?.id;
  }

  /** 查询任务结果 */
  async poll(taskId: string): Promise<VideoGenerationResultEx> {
    const resp = await axios.get(`${STD_BASE}/async-result/${taskId}`, { headers: this.headers(), timeout: 30000 });
    const data = resp.data || {};
    const status = String(data.task_status || '').toUpperCase();
    if (status === 'SUCCESS') {
      const v = (data.video_result || [])[0] || {};
      return { success: true, status: 'success', taskId, videoUrl: v.url, thumbnailUrl: v.cover_image_url };
    }
    if (status === 'FAIL') {
      return { success: false, status: 'failed', taskId, error: 'Video generation failed' };
    }
    return { success: true, status: 'processing', taskId };
  }

  /** 提交并阻塞轮询直到完成或超时 */
  async generateVideoBlocking(options: VideoGenerationOptions, maxWaitMs = 90000): Promise<VideoGenerationResultEx> {
    try {
      const taskId = await this.submit(options);
      if (!taskId) return { success: false, error: 'No task id returned' };

      const deadline = Date.now() + maxWaitMs;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 5000));
        const res = await this.poll(taskId);
        if (res.status === 'success' || res.status === 'failed') return res;
      }
      // 超时未完成:返回 taskId 供前端继续轮询
      return { success: true, status: 'processing', taskId, error: 'Still processing, poll status later' };
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = e.response?.data?.error?.message || e.message || 'Video generation failed';
      logger.error('Zhipu CogVideoX failed', { error: msg });
      return { success: false, error: msg };
    }
  }
}
