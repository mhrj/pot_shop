import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getEnv } from '@/lib/env';

export type UploadKind = 'product' | 'landing';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const maxBytes = 5 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload';
}

function inferMimeType(file: File) {
  const type = file.type && file.type !== 'application/octet-stream' ? file.type : '';
  if (allowedMimeTypes.has(type)) return type;

  const ext = path.extname(file.name || '').toLowerCase();
  const byExt: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
  };

  return byExt[ext] ?? type;
}

function getExtension(file: File, mimeType: string) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/avif') return '.avif';
  if (mimeType === 'image/gif') return '.gif';
  return path.extname(file.name || '').toLowerCase() || '.png';
}

export async function saveUploadedImage(file: File, kind: UploadKind = 'product') {
  if (!(file instanceof File)) {
    throw new Error('فایل نامعتبر است');
  }

  const mimeType = inferMimeType(file);
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error('فقط فایل‌های تصویری با فرمت JPG، PNG، WebP، AVIF یا GIF مجاز هستند');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error('حجم تصویر بیش از ۵ مگابایت است');
  }

  const provider = getEnv('IMAGE_STORAGE_PROVIDER', 'local').toLowerCase();
  if (provider === 'cloudinary') {
    throw new Error(
      'پشتیبانی Cloudinary هنوز پیکربندی نشده است. برای پشتیبانی تولیدی، متغیرهای CLOUDINARY_CLOUD_NAME، CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET را تنظیم کنید.',
    );
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', kind);
  await mkdir(uploadDir, { recursive: true });

  const baseName = `${Date.now()}-${slugify(file.name || 'image')}`;
  const fileName = `${baseName}${getExtension(file, mimeType)}`;
  const finalPath = path.join(uploadDir, fileName);

  await writeFile(finalPath, Buffer.from(bytes));
  return {
    url: `/uploads/${kind}/${fileName}`,
    filename: fileName,
    kind,
  };
}
