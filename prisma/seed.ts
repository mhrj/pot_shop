import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Baseline tier multipliers relative to each product's basePriceToman.
// 1.00 = retail, 0.85 = -15% batch, 0.70 = -30% wholesale.
const TIER_DEFS = [
  { minQuantity: 1, multiplier: 1.0, label: 'خرده' },
  { minQuantity: 5, multiplier: 0.85, label: 'بسته‌ای' },
  { minQuantity: 20, multiplier: 0.7, label: 'عمده' },
];

async function main() {
  // -------------------------------------------------------------
  // Users
  // -------------------------------------------------------------
  const adminHash = await bcrypt.hash('admin1234', 12);
  const customerHash = await bcrypt.hash('user1234', 12);

  const admin = await prisma.user.upsert({
    where: { phone: '09120000000' },
    update: {},
    create: {
      phone: '09120000000',
      fullName: 'مدیر سیستم',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('[seed] admin:', admin.phone);

  const customer = await prisma.user.upsert({
    where: { phone: '09121111111' },
    update: {},
    create: {
      phone: '09121111111',
      fullName: 'مشتری نمونه',
      passwordHash: customerHash,
      role: 'CUSTOMER',
    },
  });
  console.log('[seed] customer:', customer.phone);

  // -------------------------------------------------------------
  // Sample address for the demo customer (used by checkout flow)
  // -------------------------------------------------------------
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'HOME',
        fullName: 'مشتری نمونه',
        phone: '09121111111',
        province: 'تهران',
        city: 'تهران',
        postalCode: '1234567890',
        line1: 'خیابان ولیعصر، پلاک ۱۰۰',
        isDefault: true,
      },
    });
    console.log('[seed] sample address created');
  }

  // -------------------------------------------------------------
  // Products
  // -------------------------------------------------------------
  const products = [
    {
      slug: 'clay-pot-terracotta-medium',
      name: 'گلدان سففالی تراکوتا متوسط',
      shortDesc: 'گلدان سففالی دست‌ساز با زهکشی عالی، مناسب گیاهان آپارتمانی',
      description:
        'این گلدان سففالی به‌صورت دست‌ساز در کارگاه ما تولید می‌شود. سففال به دلیل خاصیت نففس‌کشی، رطوبت اضاففی خاک را تنظیم می‌کند و از پوسیدگی ریشه جلوگیری می‌کند.\n\nمناسب برای: سانسوریا، پتوس، ففیکوس، زاموففیلیا.',
      material: 'سففال',
      color: 'تراکوتا',
      diameterCm: 20,
      heightCm: 18,
      weightGrams: 1400,
      stock: 120,
      unitsPerCarton: 6,
      basePriceToman: 150000,
      isFeatured: true,
    },
    {
      slug: 'ceramic-glazed-white-large',
      name: 'گلدان سرامیکی لعاب‌دار سففید',
      shortDesc: 'سرامیک لعاب‌دار براق، نگه‌دارنده رطوبت، مناسب گیاهان رطوبت‌دوست',
      description:
        'سرامیک لعاب‌دار سطح براق و مقاوم دارد و رطوبت را بیشتر در خاک نگه می‌دارد. مناسب گیاهان رطوبت‌دوست مثل سرخس و کالاتیا.',
      material: 'سرامیک',
      color: 'سففید',
      diameterCm: 24,
      heightCm: 22,
      weightGrams: 1900,
      stock: 80,
      unitsPerCarton: 4,
      basePriceToman: 220000,
      isFeatured: true,
    },
    {
      slug: 'concrete-pot-minimalist',
      name: 'گلدان بتنی مینیمال',
      shortDesc: 'گلدان بتنی مقاوم، مناسب ففضای باز و پروژه‌های بزرگ',
      description:
        'گلدان بتنی با تراکم بالا، مقاوم به سرما و مناسب ففضای باز. برای بالکن، تراس و پروژه‌های محوطه‌سازی.',
      material: 'بتن',
      color: 'خاکستری',
      diameterCm: 30,
      heightCm: 28,
      weightGrams: 4500,
      stock: 45,
      unitsPerCarton: 2,
      basePriceToman: 380000,
      frostProof: true,
      isFeatured: true,
    },
  ];

  for (const p of products) {
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        images: {
          create: [
            {
              url: `https://placehold.co/800x800/E8D5C4/3E2723?text=${encodeURIComponent(p.name)}`,
              alt: p.name,
              sortOrder: 0,
            },
          ],
        },
        tiers: {
          create: TIER_DEFS.map((t) => ({
            minQuantity: t.minQuantity,
            unitPriceToman: Math.round((p.basePriceToman * t.multiplier) / 1000) * 1000,
            label: t.label,
          })),
        },
      },
    });
    console.log('[seed] product:', created.name);
  }

  console.log('\n[seed] done.');
  console.log('  admin    -> 09120000000 / admin1234');
  console.log('  customer -> 09121111111 / user1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
