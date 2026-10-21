import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
    .slice(0, 60) || 'category';

const schema = z.object({
  name: z.string().trim().min(2).max(40),
  slug: z.string().trim().min(2).max(60).optional(),
});

async function ensureAdmin() {
  return getActiveAdmin();
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({
    ok: true,
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
      productCount: cat._count.products,
      _count: cat._count,
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
  const slug = parsed.data.slug?.trim() || slugify(name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });

  if (existing) {
    return NextResponse.json({ message: 'این دسته‌بندی قبلاً ثبت شده است' }, { status: 409 });
  }

  const category = await prisma.category.create({ data: { name, slug, isActive: true } });
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  return NextResponse.json({ ok: true, category });
}
