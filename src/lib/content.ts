import { prisma } from '@/lib/prisma';

export const DEFAULT_CONTENT = {
  home_hero_title: 'به فضاهای خالی، جان بدهیم.',
  home_hero_subtitle:
    'گلدان‌های سفالی، سرامیکی و بتنی دست‌ساز — برای خانه، اداره و پروژه‌های بزرگ. از یک عدد تا سفارش عمده، همه در یک سبد.',
  about_title: 'هر گلدان، یک شروع تازه',
  about_body:
    'خاک خشک را تصور کن؛ بی‌رنگ، بی‌جان. حالا همان خاک را در گلدانی درست، با گیاهی مناسب — و همه چیز تغییر می‌کند.',
  footer_text: 'پات شاپ؛ گلدان و فلاورباکس برای فضاهای زنده و آرام.',
} as const;

export async function getContentMap() {
  const records = await prisma.staticContent.findMany({
    where: { isPublished: true },
    select: { key: true, title: true, body: true },
  });

  const map = new Map(records.map((item) => [item.key, item]));
  return Object.fromEntries(
    Object.entries(DEFAULT_CONTENT).map(([key, fallback]) => {
      const record = map.get(key);
      return [key, record ? { title: record.title, body: record.body } : { title: key, body: fallback }];
    }),
  ) as Record<keyof typeof DEFAULT_CONTENT, { title: string; body: string }>;
}
