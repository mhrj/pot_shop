import { requireAdmin } from '@/lib/auth';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">افزودن محصول</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        فیلدهای ستاره‌دار الزامی است.
      </p>
      <div className="mt-6">
        <ProductForm
          initial={{
            slug: '',
            name: '',
            shortDesc: '',
            description: '',
            material: 'سفال',
            color: '',
            diameterCm: 20,
            heightCm: 18,
            weightGrams: 1000,
            drainageHole: true,
            frostProof: false,
            stock: 0,
            unitsPerCarton: 6,
            basePriceToman: 150000,
            isActive: true,
            isFeatured: false,
            images: [''],
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
