/**
 * File Storage Service
 * Local file storage with user-scoped directories
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

/**
 * Allowed MIME types for file upload
 */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
]);

/**
 * Dangerous file extensions that are never allowed
 */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.jsp', '.asp', '.aspx',
  '.html', '.htm', '.js', '.vbs', '.ps1', '.dll', '.so', '.dylib',
]);

/**
 * Validate file type for upload safety
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Check if file extension is blocked
 */
function isBlockedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return BLOCKED_EXTENSIONS.has(ext);
}

/**
 * Ensure upload directory exists for a user
 */
function ensureUserDir(userId: string): string {
  const userDir = path.join(UPLOAD_BASE, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

/**
 * Save a file and return its relative path
 */
export function saveFile(userId: string, buffer: Buffer, originalName: string, mimeType?: string): string {
  // Validate file extension
  if (isBlockedExtension(originalName)) {
    throw new Error(`File type not allowed: ${path.extname(originalName)}`);
  }

  // Validate MIME type if provided
  if (mimeType && !isAllowedMimeType(mimeType)) {
    throw new Error(`MIME type not allowed: ${mimeType}`);
  }

  // Sanitize userId to prevent directory traversal
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeUserId) {
    throw new Error('Invalid user ID');
  }

  const userDir = ensureUserDir(safeUserId);
  const ext = path.extname(originalName) || '.bin';
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(userDir, filename);

  fs.writeFileSync(filePath, buffer);

  const relativePath = `${safeUserId}/${filename}`;
  logger.info('File saved', { userId, filename: relativePath, size: buffer.length });

  return relativePath;
}

/**
 * Get absolute file path from relative path
 * Validates against path traversal attacks
 */
export function getFilePath(relativePath: string): string {
  const resolved = path.resolve(UPLOAD_BASE, relativePath);
  // Ensure the resolved path is within UPLOAD_BASE
  if (!resolved.startsWith(path.resolve(UPLOAD_BASE) + path.sep) && resolved !== path.resolve(UPLOAD_BASE)) {
    throw new Error('Invalid file path: path traversal detected');
  }
  return resolved;
}

/**
 * Check if a file exists
 */
export function fileExists(relativePath: string): boolean {
  return fs.existsSync(getFilePath(relativePath));
}

/**
 * Delete a file
 */
export function deleteFile(relativePath: string): boolean {
  const filePath = getFilePath(relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info('File deleted', { path: relativePath });
    return true;
  }
  return false;
}

/**
 * Get file URL for serving.
 * 返回绝对 URL — 前端(:3000)与后端(:4000)不同源,相对 /uploads 会请求到前端导致 404。
 * 生产环境用 PUBLIC_BASE_URL 指向后端公网地址。
 */
export function getFileUrl(relativePath: string): string {
  const base = (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
  return `${base}/uploads/${relativePath}`;
}
