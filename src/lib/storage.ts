import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getEnv } from '@/lib/env';
import { IMAGE_EXTENSION_BY_TYPE, sniffImageType } from '@/lib/image-validation';

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

/**
 * The type the client claimed, or '' when it declined to say. Kept only so a
 * claim that contradicts the real content can be rejected; it never decides how
 * the file is stored.
 */
function declaredMimeType(file: File) {
  const type = file.type && file.type !== 'application/octet-stream' ? file.type : '';
  return allowedMimeTypes.has(type) ? type : '';
}

export async function saveUploadedImage(file: File, kind: UploadKind = 'product') {
  if (!(file instanceof File)) {
    throw new Error('فایل نامعتبر است');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.byteLength === 0) {
    throw new Error('فایل ارسال‌شده خالی است');
  }

  if (bytes.byteLength > maxBytes) {
    throw new Error('حجم تصویر بیش از ۵ مگابایت است');
  }

  // Decide the format from the bytes themselves. The filename extension and the
  // client's Content-Type are both attacker-controlled and are not trusted.
  const detected = sniffImageType(bytes);
  if (!detected) {
    throw new Error(
      'محتوای فایل یک تصویر معتبر نیست. فقط JPG، PNG، WebP، AVIF یا GIF پذیرفته می‌شود.',
    );
  }

  const declared = declaredMimeType(file);
  if (declared && declared !== detected) {
    throw new Error('نوع اعلام‌شده فایل با محتوای واقعی آن مطابقت ندارد');
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
  const fileName = `${baseName}${IMAGE_EXTENSION_BY_TYPE[detected]}`;
  const finalPath = path.join(uploadDir, fileName);

  await writeFile(finalPath, Buffer.from(bytes));
  return {
    url: `/uploads/${kind}/${fileName}`,
    filename: fileName,
    kind,
  };
}
