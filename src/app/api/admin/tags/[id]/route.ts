import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Params) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return NextResponse.json({ message: 'برچسب یافت نشد' }, { status: 404 });
  }

  const slug = slugify(name);
  const conflict = await prisma.tag.findFirst({
    where: { OR: [{ name }, { slug }], NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ message: 'این نام برچسب قبلاً استفاده شده است' }, { status: 409 });
  }

  const updated = await prisma.tag.update({ where: { id }, data: { name, slug } });
  return NextResponse.json({ ok: true, tag: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!tag) {
    return NextResponse.json({ message: 'برچسب یافت نشد' }, { status: 404 });
  }

  if (tag._count.products > 0) {
    return NextResponse.json(
      { message: 'برچسب دارای محصول مرتبط است و حذف آن ممکن نیست؛ ابتدا وابستگی‌ها را حذف کنید.' },
      { status: 409 },
    );
  }

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
