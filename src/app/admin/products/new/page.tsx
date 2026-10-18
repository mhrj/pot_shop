import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseFeatures } from '@/lib/product-features';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();

  // Every label any product already uses, so the form can offer them as
  // autocomplete suggestions. Read here rather than in the client component:
  // this is a server component already, and the form has no other reason to
  // touch the database.
  const allProducts = await prisma.product.findMany({ select: { features: true } });
  const labelSet = new Set<string>();
  for (const p of allProducts) {
    for (const f of parseFeatures(p.features)) labelSet.add(f.label);
  }
  const knownLabels = Array.from(labelSet).sort((a, b) => a.localeCompare(b, 'fa'));

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">افزودن محصول</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        فیلدهای ستاره‌دار الزامی است.
      </p>
      <div className="mt-6">
        <ProductForm
          knownLabels={knownLabels}
          initial={{
            slug: '',
            name: '',
            shortDesc: '',
            description: '',
            categoryId: '',
            material: 'سفال',
            color: '',
            diameterCm: 20,
            heightCm: 18,
            weightGrams: 1000,
            stock: 0,
            unitsPerCarton: 1,
            bundleSize: 1,
            bundleLabel: null,
            bundleItems: null,
            basePriceToman: 150000,
            isActive: true,
            isFeatured: false,
            allowBatchDiscount: true,
            features: [],
            images: [''],
            tagIds: [],
            tiers: [
              { minQuantity: 1, unitPriceToman: 150000, label: 'خرده' },
              { minQuantity: 5, unitPriceToman: 127500, label: 'بسته‌ای' },
              { minQuantity: 20, unitPriceToman: 105000, label: 'عمده' },
            ],
          }}
        />
      </div>
    </div>
  );
}
