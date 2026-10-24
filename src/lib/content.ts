import { prisma } from '@/lib/prisma';

export const DEFAULT_CONTENT = {
  home_hero_title: 'به فضاهای خالی، جان بدهیم.',
  home_hero_subtitle:
    'از گلدان‌های سفالی و سرامیکی دست‌ساز تا خاک و ابزار نگهداری گیاهان؛ پات استور با همکاری بهترین کارگاه‌های ایران، هر آنچه برای سبز نگه‌داشتن فضای شما لازم است را فراهم می‌کند.',
  promo_title: 'تأمین عمده برای گلخانه‌ها، کافه‌ها و پروژه‌ها',
  promo_subtitle:
    'اگر قصد تجهیز یک پروژه بزرگ یا تأمین محصولات برای کسب‌وکار خود را دارید، پات استور با شبکه گسترده تأمین‌کنندگان خود، بهترین کیفیت و قیمت را بدون واسطه در اختیار شما قرار می‌دهد.',
  about_title: 'درباره پات استور',
  about_body:
    'هر آنچه برای دنیای گیاهان نیاز دارید\n\nپات استور فروشگاهی برای علاقه‌مندان به گیاهان و دکوراسیون سبز است؛ از کسانی که می‌خواهند گوشه‌ای از خانه را با یک گلدان زیباتر کنند تا افرادی که با عشق از مجموعه‌ای از گیاهان نگهداری می‌کنند.\n\nدر پات استور می‌توانید انواع گلدان‌های سفالی، سرامیکی و دکوراتیو، خاک‌های متنوع و بسترهای کشت، به‌همراه لوازم موردنیاز برای کاشت و نگهداری گیاهان را پیدا کنید.\n\nمی‌دانیم که انتخاب گلدان فقط به ظاهر آن محدود نمی‌شود و خاک مناسب هم برای هر گیاه یکسان نیست. به همین دلیل، تلاش می‌کنیم گزینه‌های متنوعی در اختیار شما قرار دهیم تا بتوانید با توجه به نوع گیاه، فضای موردنظر و نیاز خود، انتخاب آگاهانه‌تری داشته باشید.\n\nپات استور؛ از انتخاب گلدان تا آماده‌کردن بستر رشد، همراه شما در مسیر نگهداری از گیاهان.',
  footer_text: 'پات استور؛ تأمین‌کننده گلدان، خاک و ملزومات گیاهان برای فضاهای زنده و آرام.',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
  phone: '۰۲۱-۹۱۰۰۰۰۰۰',
  email: 'info@potstore.ir',
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
