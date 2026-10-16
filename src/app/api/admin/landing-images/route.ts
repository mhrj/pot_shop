import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { persistedImageUrlSchema } from '@/lib/image-validation';

export const runtime = 'nodejs';

const schema = z.object({
  key: z.enum(['hero', 'journey', 'cta']),
  // Accepts both an uploaded local path (/uploads/landing/...) and an absolute
  // http(s) URL, matching what /api/admin/upload actually returns.
  url: persistedImageUrlSchema,
  alt: z.string().trim().max(160).optional(),
});

const deleteSchema = z.object({ key: z.enum(['hero', 'journey', 'cta']) });

export async function GET() {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const items = await prisma.landingImage.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const item = await prisma.landingImage.upsert({
    where: { key: parsed.data.key },
    update: {
      url: parsed.data.url,
      ...(parsed.data.alt ? { alt: parsed.data.alt } : {}),
    },
    create: {
      key: parsed.data.key,
      url: parsed.data.url,
      alt: parsed.data.alt ?? parsed.data.key,
    },
  });

  return NextResponse.json({ ok: true, item });
}

/** Clears a slot so the section falls back to its built-in default art. */
export async function DELETE(req: Request) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'کلید تصویر نامعتبر است' }, { status: 400 });
  }

  await prisma.landingImage.deleteMany({ where: { key: parsed.data.key } });
  return NextResponse.json({ ok: true });
}
