import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { sanitizeArticleHtml } from '@/lib/sanitize';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'article';

const articleSchema = z.object({
  title: z
    .string({ required_error: 'عنوان مقاله الزامی است' })
    .trim()
    .min(2, 'عنوان مقاله باید حداقل ۲ حرف باشد')
    .max(200, 'عنوان مقاله حداکثر ۲۰۰ کاراکتر است'),
  slug: z.string().trim().max(150).optional().default(''),
  excerpt: z.string().max(600).optional().nullable(),
  content: z.string({ required_error: 'محتوای مقاله الزامی است' }).min(1, 'محتوای مقاله الزامی است'),
  coverImage: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().trim().min(1)).max(30).optional().default([]),
  isPublished: z.boolean().default(false),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    return NextResponse.json({ message: 'مقاله یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'مقاله یافت نشد' }, { status: 404 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = articleSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است' },
      { status: 400 },
    );
  }

  const { title, excerpt, content, coverImage, tags, isPublished } = parsed.data;

  let targetSlug = slugify(parsed.data.slug || title);
  if (targetSlug !== existing.slug) {
    let baseSlug = targetSlug;
    let counter = 1;
    while (
      await prisma.article.findFirst({
        where: { slug: targetSlug, NOT: { id } },
      })
    ) {
      targetSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  const sanitizedContent = sanitizeArticleHtml(content);
  const cleanTags = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));

  const updated = await prisma.article.update({
    where: { id },
    data: {
      title,
      slug: targetSlug,
      excerpt: excerpt?.trim() || null,
      content: sanitizedContent,
      coverImage: coverImage?.trim() || null,
      tags: cleanTags,
      isPublished,
    },
  });

  revalidatePath('/articles');
  revalidatePath(`/articles/${existing.slug}`);
  if (existing.slug !== updated.slug) {
    revalidatePath(`/articles/${updated.slug}`);
  }
  revalidatePath('/');

  return NextResponse.json({ ok: true, article: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'مقاله یافت نشد' }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });

  revalidatePath('/articles');
  revalidatePath(`/articles/${existing.slug}`);
  revalidatePath('/');

  return NextResponse.json({ ok: true });
}
