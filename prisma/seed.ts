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
  // Categories
  // -------------------------------------------------------------
  const categories = [
    { name: 'سفال', slug: 'clay' },
    { name: 'سرامیک', slug: 'ceramic' },
    { name: 'بتن', slug: 'concrete' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });
    categoryMap.set(cat.name, createdCat.id);
    console.log('[seed] category:', createdCat.name);
  }

  // -------------------------------------------------------------
  // Products
  // -------------------------------------------------------------
  const products = [
    {
      slug: 'clay-pot-terracotta-medium',
      name: 'گلدان سفالی تراکوتا متوسط',
      shortDesc: 'گلدان سفالی دست‌ساز با زهکشی عالی، مناسب گیاهان آپارتمانی',
      description:
        'این گلدان سفالی به‌صورت دست‌ساز در کارگاه ما تولید می‌شود. سفال به دلیل خاصیت نفس‌کشی، رطوبت اضافی خاک را تنظیم می‌کند و از پوسیدگی ریشه جلوگیری می‌کند.\n\nمناسب برای: سانسوریا، پتوس، فیکوس، زاموفیلیا.',
      material: 'سفال',
      color: 'تراکوتا',
      diameterCm: 20,
      heightCm: 18,
      weightGrams: 1400,
      stock: 120,
      unitsPerCarton: 6,
      bundleSize: 2,
      bundleLabel: 'ست ۲ عددی سفالی',
      bundleItems: [
        {
          title: 'گلدان سفالی تراکوتا ۲۰cm',
          material: 'سفال',
          diameterCm: 20,
          heightCm: 18,
          weightGrams: 800,
        },
        {
          title: 'گلدان سفالی تراکوتا ۱۵cm',
          material: 'سفال',
          diameterCm: 15,
          heightCm: 14,
          weightGrams: 600,
        },
      ],
      basePriceToman: 150000,
      isFeatured: true,
      features: [{ label: 'سوراخ زهکشی دارد', enabled: true }],
    },
    {
      slug: 'ceramic-glazed-white-large',
      name: 'گلدان سرامیکی لعاب‌دار سفید',
      shortDesc: 'سرامیک لعاب‌دار براق، نگه‌دارنده رطوبت، مناسب گیاهان رطوبت‌دوست',
      description:
        'سرامیک لعاب‌دار سطح براق و مقاوم دارد و رطوبت را بیشتر در خاک نگه می‌دارد. مناسب گیاهان رطوبت‌دوست مثل سرخس و کالاتیا.',
      material: 'سرامیک',
      color: 'سفید',
      diameterCm: 24,
      heightCm: 22,
      weightGrams: 1900,
      stock: 80,
      unitsPerCarton: 4,
      bundleSize: 1,
      bundleLabel: null,
      bundleItems: null,
      basePriceToman: 220000,
      isFeatured: true,
      features: [{ label: 'سوراخ زهکشی دارد', enabled: true }],
    },
    {
      slug: 'concrete-pot-minimalist',
      name: 'گلدان بتنی مینیمال',
      shortDesc: 'گلدان بتنی مقاوم، مناسب فضای باز و پروژه‌های بزرگ',
      description:
        'گلدان بتنی با تراکم بالا، مقاوم به سرما و مناسب فضای باز. برای بالکن، تراس و پروژه‌های محوطه‌سازی.',
      material: 'بتن',
      color: 'خاکستری',
      diameterCm: 30,
      heightCm: 28,
      weightGrams: 4500,
      stock: 45,
      unitsPerCarton: 2,
      bundleSize: 1,
      bundleLabel: null,
      bundleItems: null,
      basePriceToman: 380000,
      isFeatured: true,
      features: [
        { label: 'سوراخ زهکشی دارد', enabled: true },
        { label: 'مقاوم به سرما', enabled: true },
      ],
    },
  ];

  for (const p of products) {
    const categoryId = categoryMap.get(p.material);
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        categoryId,
        bundleSize: p.bundleSize ?? 1,
        bundleLabel: p.bundleLabel ?? null,
        bundleItems: p.bundleItems ?? undefined,
        allowBatchDiscount: true,
      },
      create: {
        ...p,
        categoryId,
        bundleSize: p.bundleSize ?? 1,
        bundleLabel: p.bundleLabel ?? null,
        bundleItems: p.bundleItems ?? undefined,
        allowBatchDiscount: true,
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

  // -------------------------------------------------------------
  // Editable site copy (about page + contact details)
  //
  // `update: {}` on purpose, matching the upserts above. Seeding must never
  // overwrite copy an admin has already edited through /admin/content — it only
  // fills in keys that do not exist yet.
  // -------------------------------------------------------------
  const CONTENT = [
    { key: 'about_title', title: 'عنوان صفحه درباره ما', body: 'درباره پات شاپ' },
    {
      key: 'about_body',
      title: 'متن صفحه درباره ما',
      body: 'کار ما با خاک شروع می‌شود. سفال را روی چرخ می‌آوریم، سرامیک را لعاب می‌زنیم و بتن را در قالب می‌ریزیم — هر کدام با دست، و هیچ‌کدام دقیقاً مثل دیگری از کار درنمی‌آید. همین تفاوت‌های کوچک است که یک گلدان را از یک محصول کارخانه‌ای جدا می‌کند.\n\nسال‌هاست گلدان می‌سازیم و در این سال‌ها یک چیز را یاد گرفته‌ایم: گلدان خوب آن است که گیاه در آن راحت باشد. به همین دلیل روی زهکشی، حجم خاک و نفس‌کش بودن جنس وسواس داریم. اگر گلدانی برای گیاه شما مناسب نباشد، ترجیح می‌دهیم همان را بگوییم تا اینکه بفروشیم.\n\nاز یک عدد برای طاقچه خانه تا سفارش چند صد عددی برای یک پروژه، همه را خودمان بسته‌بندی و ارسال می‌کنیم. اگر درباره انتخاب گلدان مناسب سؤالی داشتید، تماس بگیرید؛ پاسخ دادن به همین سؤال‌ها بخش موردعلاقه ماست.',
    },
    { key: 'address', title: 'نشانی', body: 'تهران، خیابان ولیعصر، پلاک ۱۰۰' },
    { key: 'phone', title: 'تلفن', body: '۰۲۱-۹۱۰۰۰۰۰۰' },
    { key: 'email', title: 'ایمیل', body: 'info@potshop.ir' },
    { key: 'hours', title: 'ساعات کاری', body: 'شنبه تا پنجشنبه، ۹ صبح تا ۶ عصر' },
  ];

  for (const block of CONTENT) {
    await prisma.staticContent.upsert({
      where: { key: block.key },
      update: {},
      create: { key: block.key, title: block.title, body: block.body, isPublished: true },
    });
    console.log('[seed] content:', block.key);
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
