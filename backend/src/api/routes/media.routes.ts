/**
 * Image and Video Generation API Routes
 * REST endpoints for media generation
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { ZhipuImageGenerator, ZhipuVideoGenerator } from '../../services/ai/zhipu-media.service';
import { saveFile, getFileUrl } from '../../services/storage';
import config from '../../config';
import logger from '../../utils/logger';

/**
 * 把外部媒体 URL 下载到本地存储,返回 /uploads/... 本地 URL。
 * 用于 AI 生成结果(Zhipu 签名 URL 几小时就过期,内容库/发布页会 404)。
 * 下载失败时回退原 URL,不阻断生成。
 */
async function localizeMedia(
  externalUrl: string,
  userId: string | undefined,
  kind: 'image' | 'video',
): Promise<string> {
  try {
    const resp = await axios.get(externalUrl, {
      responseType: 'arraybuffer',
      timeout: kind === 'video' ? 120000 : 30000,
      maxContentLength: 200 * 1024 * 1024,
    });
    const buffer = Buffer.from(resp.data);
    const mimeType = (resp.headers['content-type'] || '').split(';')[0].trim();
    const ext = mimeType.includes('png') ? '.png'
      : mimeType.includes('webp') ? '.webp'
      : mimeType.includes('mp4') ? '.mp4'
      : mimeType.includes('webm') ? '.webm'
      : kind === 'image' ? '.jpg' : '.mp4';
    const filename = `ai-${kind}-${Date.now()}${ext}`;
    const owner = userId || 'ai-generated';
    const relativePath = saveFile(owner, buffer, filename, mimeType);
    return getFileUrl(relativePath);
  } catch (error: any) {
    logger.error('Failed to localize AI media, falling back to external URL', {
      kind, error: error.message, url: externalUrl.slice(0, 80),
    });
    return externalUrl;
  }
}

const router = Router();

/**
 * POST /api/generate/image
 * Generate images using DALL-E 3
 */
router.post('/image', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'vivid', quality = 'standard', size = '1024x1024', n = 1 } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Prompt must be at least 10 characters',
        },
      });
    }

    logger.info('Image generation request received', {
      promptLength: prompt.length,
      style,
      quality,
      size,
    });

    // 用 GLM key 调智谱 CogView(免费档 cogview-3-flash)
    if (!config.ai.glm.apiKey) {
      return res.status(500).json({
        success: false,
        error: {
          type: 'CONFIGURATION_ERROR',
          message: 'GLM API key not configured (set GLM_API_KEY for real image generation)',
        },
      });
    }

    const imageGenerator = new ZhipuImageGenerator(config.ai.glm.apiKey);
    const result = await imageGenerator.generateImages({
      prompt,
      style,
      quality,
      size,
      n,
    });

    if (result.success && result.images?.length) {
      // Zhipu 返回的签名 URL 几小时就过期,内容库/发布页里的图会变 404。
      // 下载到本地 /uploads/ 持久化。
      result.images = await Promise.all(
        result.images.map(async (img) => ({
          ...img,
          url: await localizeMedia(img.url, req.userId, 'image'),
        })),
      );
      logger.info('Image generation completed', {
        count: result.images.length,
        cost: result.cost,
      });
    }

    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    logger.error('Image generation failed', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: {
        type: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate images',
      },
    });
  }
});

/**
 * POST /api/generate/video
 * Generate video using Seedance 2.0
 */
router.post('/video', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      duration = 15,
      resolution = '1080p',
      style = 'product',
      ratio = '16:9'
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Prompt must be at least 10 characters',
        },
      });
    }

    logger.info('Video generation request received', {
      promptLength: prompt.length,
      duration,
      resolution,
      style,
    });

    // 用 GLM key 调智谱 CogVideoX(免费档 cogvideox-flash,异步)
    if (!config.ai.glm.apiKey) {
      return res.status(500).json({
        success: false,
        error: { type: 'CONFIGURATION_ERROR', message: 'GLM API key not configured (set GLM_API_KEY for real video generation)' },
      });
    }

    const videoGenerator = new ZhipuVideoGenerator(config.ai.glm.apiKey);
    const result = await videoGenerator.generateVideoBlocking({ prompt, duration, resolution, style, ratio });

    // 同步路径下成功完成 → 下载到本地,避免签名 URL 过期
    if (result.success && result.status === 'success' && result.videoUrl) {
      result.videoUrl = await localizeMedia(result.videoUrl, req.userId, 'video');
    }

    logger.info('Video generation result', { status: result.status, taskId: result.taskId, videoUrl: result.videoUrl });

    // processing/success 都算成功受理;前端可用 taskId 继续轮询 /video/status/:taskId
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    logger.error('Video generation failed', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: {
        type: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate video',
      },
    });
  }
});

/**
 * GET /api/generate/video/status/:taskId
 * 轮询异步视频任务结果
 */
router.get('/video/status/:taskId', async (req: Request, res: Response) => {
  try {
    if (!config.ai.glm.apiKey) {
      return res.status(500).json({ success: false, error: { type: 'CONFIGURATION_ERROR', message: 'GLM API key not configured' } });
    }
    const videoGenerator = new ZhipuVideoGenerator(config.ai.glm.apiKey);
    const result = await videoGenerator.poll(String(req.params.taskId));

    // 轮询拿到最终结果时也下载到本地
    if (result.success && result.status === 'success' && result.videoUrl) {
      result.videoUrl = await localizeMedia(result.videoUrl, req.userId, 'video');
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { type: 'GENERATION_ERROR', message: error.message || 'Failed to poll video status' } });
  }
});

/**
 * POST /api/generate/video/from-image
 * Generate video from image using Seedance 2.0
 */
router.post('/video/from-image', async (req: Request, res: Response) => {
  try {
    const { image, prompt, duration = 15 } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Image and prompt are required',
        },
      });
    }

    logger.info('Video from image generation request received', {
      promptLength: prompt.length,
      duration,
    });

    // Note: This is a placeholder implementation
    // In production, you would process the actual image file
    const result = {
      success: false,
      error: 'Video from image generation not yet implemented',
    };

    res.status(501).json(result);
  } catch (error: any) {
    logger.error('Video from image generation failed', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: {
        type: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate video from image',
      },
    });
  }
});

export default router;
