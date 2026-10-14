import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const tierSchema = z.object({
  minQuantity: z.number().int().min(1),
  unitPriceToman: z.number().int().min(0),
  label: z.string().max(50).optional().default(''),
});

const schema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'اسلاگ فقط حروف کوچک، عدد و خط تیره'),
  name: z.string().min(2).max(150),
  shortDesc: z.string().max(300).optional().default(''),
  description: z.string().min(1).max(5000),
  material: z.string().min(2).max(60),
  color: z.string().max(60).optional().default(''),
  diameterCm: z.number().min(0).max(500),
  heightCm: z.number().min(0).max(500),
  weightGrams: z.number().int().min(0).max(100000),
  drainageHole: z.boolean(),
  frostProof: z.boolean(),
  stock: z.number().int().min(0).max(100000),
  unitsPerCarton: z.number().int().min(1).max(200),
  basePriceToman: z.number().int().min(1000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  images: z.array(z.string().url()).max(10),
  tiers: z.array(tierSchema).min(1).max(5),
});

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
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
      material: data.material,
      color: data.color || null,
      diameterCm: data.diameterCm,
      heightCm: data.heightCm,
      weightGrams: data.weightGrams,
      drainageHole: data.drainageHole,
      frostProof: data.frostProof,
      stock: data.stock,
      unitsPerCarton: data.unitsPerCarton,
      basePriceToman: data.basePriceToman,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
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
    },
  });

  return NextResponse.json({ ok: true, product });
}
