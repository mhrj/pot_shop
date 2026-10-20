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
    .slice(0, 60) || 'category';

const schema = z.object({
  name: z.string().trim().min(2).max(40),
});

async function ensureAdmin() {
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
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ message: 'دسته‌بندی یافت نشد' }, { status: 404 });
  }

  const slug = slugify(name);
  const conflict = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }], NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ message: 'این نام دسته‌بندی قبلاً استفاده شده است' }, { status: 409 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name, slug },
  });

  return NextResponse.json({ ok: true, category: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ message: 'دسته‌بندی یافت نشد' }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      { message: 'این دسته‌بندی دارای محصول است و قابل حذف نیست.' },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
