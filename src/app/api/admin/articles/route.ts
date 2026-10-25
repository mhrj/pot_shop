import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { sanitizeArticleHtml } from '@/lib/sanitize';

export const runtime = 'nodejs';

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

export async function GET() {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ ok: true, articles });
}

export async function POST(req: Request) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
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

  let baseSlug = slugify(parsed.data.slug || title);
  let finalSlug = baseSlug;
  let counter = 1;

  while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const sanitizedContent = sanitizeArticleHtml(content);

  const cleanTags = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));

  const article = await prisma.article.create({
    data: {
      title,
      slug: finalSlug,
      excerpt: excerpt?.trim() || null,
      content: sanitizedContent,
      coverImage: coverImage?.trim() || null,
      tags: cleanTags,
      isPublished,
    },
  });

  revalidatePath('/articles');
  revalidatePath(`/articles/${article.slug}`);
  revalidatePath('/');

  return NextResponse.json({ ok: true, article });
}
