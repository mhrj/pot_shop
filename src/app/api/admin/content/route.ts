import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { DEFAULT_CONTENT } from '@/lib/content';

export const runtime = 'nodejs';

const schema = z.object({
  key: z.string().trim().min(1).max(100),
  body: z.string().trim().max(10000),
});

export async function POST(req: Request) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const { key, body } = parsed.data;

  // Make sure the key is a recognized content key
  if (!(key in DEFAULT_CONTENT)) {
    return NextResponse.json({ message: 'شناسه محتوا نامعتبر است' }, { status: 400 });
  }

  const existing = await prisma.staticContent.findUnique({
    where: { key },
    select: { title: true },
  });

  const record = await prisma.staticContent.upsert({
    where: { key },
    update: {
      body,
      isPublished: true,
      updatedAt: new Date(),
    },
    create: {
      key,
      title: existing?.title ?? key,
      body,
      isPublished: true,
    },
  });

  // Revalidate public layouts and pages so updates appear immediately
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/about');

  return NextResponse.json({ ok: true, record });
}
