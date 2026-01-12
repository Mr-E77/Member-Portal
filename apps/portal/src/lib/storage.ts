import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import * as Sentry from '@sentry/nextjs';
import { randomBytes } from 'crypto';

if (!process.env.AWS_S3_BUCKET_NAME) {
  console.warn('AWS_S3_BUCKET_NAME not set, file uploads will fail');
}

if (!process.env.AWS_REGION) {
  console.warn('AWS_REGION not set, file uploads will fail');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'member-portal-uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadOptions {
  buffer: Buffer;
  mimeType: string;
  folder?: string;
  filename?: string;
}

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
}

/**
 * Process and resize image for multiple sizes
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Original (max 2048px)
    const original = await image
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();

    // Medium (800px)
    const medium = await sharp(buffer)
      .resize(800, 800, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    // Thumbnail (200px)
    const thumbnail = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    return { original, medium, thumbnail };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'image-processing' },
    });
    throw new Error('Failed to process image');
  }
}

/**
 * Generate unique filename
 */
function generateFilename(originalName?: string): string {
  const timestamp = Date.now();
  const randomStr = randomBytes(8).toString('hex');
  const ext = originalName?.split('.').pop() || 'webp';
  return `${timestamp}-${randomStr}.${ext}`;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  options: UploadOptions
): Promise<{ key: string; url: string }> {
  try {
    const { buffer, mimeType, folder = 'uploads', filename } = options;

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }

    const key = `${folder}/${filename || generateFilename()}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    Sentry.addBreadcrumb({
      category: 'storage',
      message: `File uploaded to S3: ${key}`,
      level: 'info',
    });

    return { key, url };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'storage-upload' },
      extra: { folder: options.folder },
    });
    throw error;
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    Sentry.addBreadcrumb({
      category: 'storage',
      message: `File deleted from S3: ${key}`,
      level: 'info',
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'storage-delete' },
      extra: { key },
    });
    throw error;
  }
}

/**
 * Get signed URL for private file access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'storage-signed-url' },
      extra: { key },
    });
    throw error;
  }
}

/**
 * Upload avatar with multiple sizes
 */
export async function uploadAvatar(
  buffer: Buffer,
  userId: string
): Promise<{ original: string; medium: string; thumbnail: string }> {
  try {
    const processed = await processImage(buffer);

    const [originalResult, mediumResult, thumbnailResult] = await Promise.all([
      uploadToS3({
        buffer: processed.original,
        mimeType: 'image/webp',
        folder: `avatars/${userId}`,
        filename: 'original.webp',
      }),
      uploadToS3({
        buffer: processed.medium,
        mimeType: 'image/webp',
        folder: `avatars/${userId}`,
        filename: 'medium.webp',
      }),
      uploadToS3({
        buffer: processed.thumbnail,
        mimeType: 'image/webp',
        folder: `avatars/${userId}`,
        filename: 'thumbnail.webp',
      }),
    ]);

    return {
      original: originalResult.url,
      medium: mediumResult.url,
      thumbnail: thumbnailResult.url,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'avatar-upload' },
      extra: { userId },
    });
    throw error;
  }
}

/**
 * Delete all avatar sizes for a user
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    await Promise.all([
      deleteFromS3(`avatars/${userId}/original.webp`),
      deleteFromS3(`avatars/${userId}/medium.webp`),
      deleteFromS3(`avatars/${userId}/thumbnail.webp`),
    ]);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'avatar-delete' },
      extra: { userId },
    });
    throw error;
  }
}
