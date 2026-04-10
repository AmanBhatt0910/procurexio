// src/config/uploads.js
//
// File upload constraints used by the bid attachments API route.
// Override via environment variables for per-environment tuning.

/** Maximum allowed file size in bytes (default: 10 MB). */
export const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

/**
 * MIME types accepted for bid attachments.
 * Extend this list to support additional document formats.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
];
