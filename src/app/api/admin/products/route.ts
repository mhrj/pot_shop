import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { persistedImageUrlSchema } from '@/lib/image-validation';

export const runtime = 'nodejs';

const tierSchema = z.object({
  minQuantity: z.number().int().min(1),
  unitPriceToman: z.number().int().min(0),
  label: z.string().max(50).optional().default(''),
});

const tiersSchema = z
  .array(tierSchema)
  .min(1)
  .max(5)
  // The pricing engine falls back to the *lowest* tier when a quantity is below
  // every threshold, so a catalogue whose first tier starts at 5 would sell
  // single units at the 5-unit price — silently under the product's own base
  // price. A tier at 1 is what makes a single unit's price explicit.
  .refine((tiers) => tiers.some((t) => t.minQuantity === 1), {
    message: 'یکی از پله‌های قیمت باید از تعداد ۱ شروع شود',
  });

const schema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'اسلاگ فقط حروف کوچک، عدد و خط تیره'),
  name: z.string().min(2).max(150),
  shortDesc: z.string().max(300).optional().default(''),
  description: z.string().min(1).max(5000),
  categoryId: z.string().cuid().optional().nullable().or(z.literal('')),
  material: z.string().min(2).max(60),
  color: z.string().max(60).optional().default(''),
  diameterCm: z.number().min(0).max(500),
  heightCm: z.number().min(0).max(500),
  weightGrams: z.number().int().min(0).max(100000),
  stock: z.number().int().min(0).max(100000),
  unitsPerCarton: z.number().int().min(1).max(200),
  basePriceToman: z.number().int().min(1000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  allowBatchDiscount: z.boolean().optional().default(true),
  // Display-only extras the admin names themselves; the semantic flags above
  // are separate columns because pricing and catalogue queries read them.
  features: z
    .array(z.object({ label: z.string().min(1).max(80), enabled: z.boolean() }))
    .max(20)
    .default([]),
  images: z.array(persistedImageUrlSchema).max(10),
  tagIds: z.array(z.string().cuid()).max(20).optional().default([]),
  tiers: tiersSchema,
});

async function ensureAdmin() {
  // Re-reads the account so a demoted or deactivated admin loses API access
  // immediately rather than when their 30-day session cookie expires.
  return getActiveAdmin();
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
  const data = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ message: 'این اسلاگ قبلاً استفاده شده' }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      slug: data.slug,
      name: data.name,
      shortDesc: data.shortDesc || null,
      description: data.description,
      categoryId: data.categoryId ? data.categoryId : null,
      material: data.material,
      color: data.color || null,
      diameterCm: data.diameterCm,
      heightCm: data.heightCm,
      weightGrams: data.weightGrams,
      stock: data.stock,
      unitsPerCarton: data.unitsPerCarton,
      basePriceToman: data.basePriceToman,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      allowBatchDiscount: data.allowBatchDiscount,
      features: data.features,
      images: {
        create: data.images.map((url, i) => ({ url, sortOrder: i, alt: data.name })),
      },
      tiers: {
        create: data.tiers.map((t) => ({
          minQuantity: t.minQuantity,
          unitPriceToman: t.unitPriceToman,
          label: t.label || null,
        })),
      },
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  return NextResponse.json({ ok: true, product });
}
