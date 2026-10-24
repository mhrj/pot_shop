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
    { name: 'گلدان و دکور', slug: 'pots-decor' },
    { name: 'خاک و بستر کشت', slug: 'soil-growth' },
    { name: 'لوازم نگهداری', slug: 'tools-care' },
    { name: 'انتخاب محصول', slug: 'product-guide' },
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
  // Global Colors
  // -------------------------------------------------------------
  const globalColors = [
    { name: 'سفید مات', hexCode: '#FFFFFF' },
    { name: 'مشکی مات', hexCode: '#1F1F1F' },
    { name: 'تراکوتا', hexCode: '#C86A4B' },
    { name: 'طوسی روشن', hexCode: '#D3D3D3' },
    { name: 'طوسی تیره', hexCode: '#808080' },
    { name: 'خاکی / کرم', hexCode: '#E8D8C8' },
    { name: 'سبز صدری', hexCode: '#7A8B7B' },
    { name: 'قهوه‌ای سوخته', hexCode: '#4A3525' },
  ];

  for (const c of globalColors) {
    await prisma.globalColor.upsert({
      where: { name: c.name },
      update: { hexCode: c.hexCode },
      create: c,
    });
    console.log('[seed] global color:', c.name);
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
      bundleItems: [
        {
          title: 'گلدان سفالی تراکوتا ۲۰cm',
          description: 'گلدان با دهانه ۲۰ و ارتفاع ۱۸ سانتی‌متر',
          material: 'سفال',
          diameterCm: 20,
          heightCm: 18,
          weightGrams: 800,
          price: 90000,
          colorOptions: ['#C86A4B', '#8D5B4C', '#E0A899'],
        },
        {
          title: 'گلدان سفالی تراکوتا ۱۵cm',
          description: 'گلدان با دهانه ۱۵ و ارتفاع ۱۴ سانتی‌متر',
          material: 'سفال',
          diameterCm: 15,
          heightCm: 14,
          weightGrams: 600,
          price: 75000,
          colorOptions: ['#C86A4B', '#4A3525', '#F5EBE6'],
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
      colorOptions: ['#FFFFFF', '#1A1A1A', '#2E7D32', '#D32F2F', '#0288D1', '#F57C00', '#7B1FA2', '#FBC02D'],
      diameterCm: 24,
      heightCm: 22,
      weightGrams: 1900,
      stock: 80,
      unitsPerCarton: 4,
      bundleSize: 1,
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
      colorOptions: ['#808080', '#D3D3D3', '#333333'],
      diameterCm: 30,
      heightCm: 28,
      weightGrams: 4500,
      stock: 45,
      unitsPerCarton: 2,
      bundleSize: 1,
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
        bundleItems: p.bundleItems ?? undefined,
        colorOptions: p.colorOptions ?? undefined,
        allowBatchDiscount: true,
      },
      create: {
        ...p,
        categoryId,
        bundleSize: p.bundleSize ?? 1,
        bundleItems: p.bundleItems ?? undefined,
        colorOptions: p.colorOptions ?? undefined,
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
    { key: 'home_hero_title', title: 'عنوان اصلی صفحه نخست', body: 'به فضاهای خالی، جان بدهیم.' },
    {
      key: 'home_hero_subtitle',
      title: 'زیرعنوان صفحه نخست',
      body: 'از گلدان‌های سفالی و سرامیکی دست‌ساز تا خاک و ابزار نگهداری گیاهان؛ پات استور با همکاری بهترین کارگاه‌های ایران، هر آنچه برای سبز نگه‌داشتن فضای شما لازم است را فراهم می‌کند.',
    },
    {
      key: 'promo_title',
      title: 'عنوان بخش همکاری عمده',
      body: 'تأمین عمده برای گلخانه‌ها، کافه‌ها و پروژه‌ها',
    },
    {
      key: 'promo_subtitle',
      title: 'زیرعنوان بخش همکاری عمده',
      body: 'اگر قصد تجهیز یک پروژه بزرگ یا تأمین محصولات برای کسب‌وکار خود را دارید، پات استور با شبکه گسترده تأمین‌کنندگان خود، بهترین کیفیت و قیمت را بدون واسطه در اختیار شما قرار می‌دهد.',
    },
    { key: 'about_title', title: 'عنوان صفحه درباره ما', body: 'درباره پات استور' },
    {
      key: 'about_body',
      title: 'متن صفحه درباره ما',
      body: 'پات استور یک تولیدکننده نیست؛ ما یک نمایشگاه کیوریت‌شده از بهترین گلدان‌ها، خاک و ابزارهای گیاهان هستیم. ما با بهترین کارگاه‌های سفال، سرامیک و بتن در سراسر ایران شریک شده‌ایم تا محصولات باکیفیت را مستقیماً به دست شما برسانیم.\n\nما معتقدیم یک گلدان خوب، پایه‌ی یک گیاه سالم است. به همین دلیل روی کیفیت مواد، اصولی بودن زهکشی و تنوع محصولات وسواس داریم. از یک عدد برای طاقچه خانه تا سفارش‌های عمده برای پروژه‌های بزرگ، تیم ما بهترین انتخاب‌ها را برای شما بسته‌بندی و ارسال می‌کند.\n\nهدف ما این است که فرآیند خرید و نگهداری از گیاهان را برای شما ساده، لذت‌بخش و قابل اعتماد کنیم.',
    },
    { key: 'footer_text', title: 'متن فوتر', body: 'پات استور؛ تأمین‌کننده گلدان، خاک و ملزومات گیاهان برای فضاهای زنده و آرام.' },
    { key: 'address', title: 'نشانی', body: 'تهران، خیابان ولیعصر، پلاک ۱۰۰' },
    { key: 'phone', title: 'تلفن', body: '۰۲۱-۹۱۰۰۰۰۰۰' },
    { key: 'email', title: 'ایمیل', body: 'info@potstore.ir' },
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
