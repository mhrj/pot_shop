import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { parseFeatures } from '@/lib/product-features';
import ProductForm from '@/components/admin/ProductForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      tiers: { orderBy: { minQuantity: 'asc' } },
      tags: { select: { tagId: true } },
    },
  });
  if (!product) notFound();

  // Every label any product already uses, so the form can offer them as
  // autocomplete suggestions — including this product's own, which is harmless
  // and keeps the list complete when editing the only product that has one.
  const allProducts = await prisma.product.findMany({ select: { features: true } });
  const labelSet = new Set<string>();
  for (const p of allProducts) {
    for (const f of parseFeatures(p.features)) labelSet.add(f.label);
  }
  const knownLabels = Array.from(labelSet).sort((a, b) => a.localeCompare(b, 'fa'));

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">ویرایش محصول</h1>
      <p className="mt-2 text-sm text-soil-700/70">{product.name}</p>
      <div className="mt-6">
        <ProductForm
          knownLabels={knownLabels}
          initial={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            shortDesc: product.shortDesc ?? '',
            description: product.description,
            material: product.material,
            color: product.color ?? '',
            diameterCm: product.diameterCm,
            heightCm: product.heightCm,
            weightGrams: product.weightGrams,
            stock: product.stock,
            unitsPerCarton: product.unitsPerCarton,
            basePriceToman: product.basePriceToman,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            // The column is untyped JSON, so it is normalised on the way in as
            // well as on the way out — a malformed row must not break the form.
            features: parseFeatures(product.features),
            images: product.images.length ? product.images.map((i) => i.url) : [''],
            tagIds: product.tags.map((entry) => entry.tagId),
            tiers: product.tiers.map((t) => ({
              minQuantity: t.minQuantity,
              unitPriceToman: t.unitPriceToman,
              label: t.label ?? '',
            })),
          }}
        />
      </div>
    </div>
  );
}
