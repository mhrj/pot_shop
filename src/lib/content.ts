import { prisma } from '@/lib/prisma';

export const DEFAULT_CONTENT = {
  home_hero_title: 'به فضاهای خالی، جان بدهیم.',
  home_hero_subtitle:
    'گلدان‌های سفالی، سرامیکی و بتنی دست‌ساز — برای خانه، اداره و پروژه‌های بزرگ. از یک عدد تا سفارش عمده، همه در یک سبد.',
  promo_title: 'سفارش عمده، بدون دردسر',
  promo_subtitle:
    'برای کافه‌ها، هتل‌ها، اداره‌ها و فروشگاه‌های گیاه. تخفیف پله‌ای خودکار روی همان صفحه محصول اعمال می‌شود — بدون نیاز به تماس یا مذاکره.',
  about_title: 'درباره پات شاپ',
  about_body:
    'کار ما با خاک شروع می‌شود. سفال را روی چرخ می‌آوریم، سرامیک را لعاب می‌زنیم و بتن را در قالب می‌ریزیم — هر کدام با دست، و هیچ‌کدام دقیقاً مثل دیگری از کار درنمی‌آید. همین تفاوت‌های کوچک است که یک گلدان را از یک محصول کارخانه‌ای جدا می‌کند.\n\nسال‌هاست گلدان می‌سازیم و در این سال‌ها یک چیز را یاد گرفته‌ایم: گلدان خوب آن است که گیاه در آن راحت باشد. به همین دلیل روی زهکشی، حجم خاک و نفس‌کش بودن جنس وسواس داریم. اگر گلدانی برای گیاه شما مناسب نباشد، ترجیح می‌دهیم همان را بگوییم تا اینکه بفروشیم.\n\nاز یک عدد برای طاقچه خانه تا سفارش چند صد عددی برای یک پروژه، همه را خودمان بسته‌بندی و ارسال می‌کنیم. اگر درباره انتخاب گلدان مناسب سؤالی داشتید، تماس بگیرید؛ پاسخ دادن به همین سؤال‌ها بخش موردعلاقه ماست.',
  footer_text: 'پات شاپ؛ گلدان و فلاورباکس برای فضاهای زنده و آرام.',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
  phone: '۰۲۱-۹۱۰۰۰۰۰۰',
  email: 'info@potshop.ir',
  hours: 'شنبه تا پنجشنبه، ۹ صبح تا ۶ عصر',
} as const;

/**
 * The editable copy for the whole site, keyed by block.
 *
 * `RootLayout` calls this on every single route, so it must never be the reason
 * a page fails. A content lookup that throws — a dropped connection, a database
 * that is briefly unreachable, a table that has not been pushed yet — used to
 * take the entire site down with a 500, including pages that render no content
 * block at all. Falling back to the built-in copy below keeps the shop up with
 * slightly staler text, which is always the better trade.
 */
export async function getContentMap() {
  let records: { key: string; title: string; body: string }[] = [];

  try {
    records = await prisma.staticContent.findMany({
      where: { isPublished: true },
      select: { key: true, title: true, body: true },
    });
  } catch (error) {
    console.error(
      '[content] database lookup failed, serving built-in copy:',
      error instanceof Error ? error.message : error,
    );
  }

  const map = new Map(records.map((item) => [item.key, item]));
  return Object.fromEntries(
    Object.entries(DEFAULT_CONTENT).map(([key, fallback]) => {
      const record = map.get(key);
      return [key, record ? { title: record.title, body: record.body } : { title: key, body: fallback }];
    }),
  ) as Record<keyof typeof DEFAULT_CONTENT, { title: string; body: string }>;
}
