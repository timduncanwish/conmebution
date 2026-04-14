/**
 * File Upload API Routes
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/auth.middleware';
import { saveFile, getFileUrl } from '../../services/storage';

const router = Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

/**
 * POST /api/upload
 * Upload a single file
 */
router.post('/', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'No file provided', retryable: false },
      });
      return;
    }

    const userId = req.userId!;

    // saveFile validates MIME type and extension
    let relativePath: string;
    try {
      relativePath = saveFile(userId, file.buffer, file.originalname, file.mimetype);
    } catch (validationError: any) {
      res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: validationError.message, retryable: false },
      });
      return;
    }
    const url = getFileUrl(relativePath);

    res.status(201).json({
      success: true,
      data: {
        url,
        filename: relativePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    throw error;
  }
});

export default router;
