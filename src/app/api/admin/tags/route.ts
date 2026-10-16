import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'tag';

const schema = z.object({
  name: z.string().trim().min(2).max(40),
});

async function ensureAdmin() {
  // Re-reads the account so a demoted or deactivated admin loses API access
  // immediately rather than when their 30-day session cookie expires.
  return getActiveAdmin();
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({
    ok: true,
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      productCount: tag._count.products,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name);

  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name }, { slug }] },
  });

  if (existing) {
    return NextResponse.json({ message: 'این برچسب قبلاً ثبت شده است' }, { status: 409 });
  }

  const tag = await prisma.tag.create({ data: { name, slug } });
  return NextResponse.json({ ok: true, tag });
}
