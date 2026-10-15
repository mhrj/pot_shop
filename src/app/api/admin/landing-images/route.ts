import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const schema = z.object({
  key: z.enum(['hero', 'journey', 'cta']),
  url: z.string().url('آدرس تصویر باید معتبر باشد'),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const items = await prisma.landingImage.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
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
    update: { url: parsed.data.url },
    create: { key: parsed.data.key, url: parsed.data.url, alt: parsed.data.key },
  });

  return NextResponse.json({ ok: true, item });
}
