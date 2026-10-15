import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const BLOCKS = [
  { key: 'home_hero_title', title: 'عنوان اصلی صفحه اصلی', placeholder: 'به فضاهای خالی، جان بدهیم.' },
  { key: 'home_hero_subtitle', title: 'متن معرفی اصلی', placeholder: 'متن کوتاه درباره فروشگاه و ارزش پیشنهادی.' },
  { key: 'about_title', title: 'عنوان بخش معرفی', placeholder: 'هر گلدان، یک شروع تازه' },
  { key: 'about_body', title: 'متن بخش معرفی', placeholder: 'توضیح کوتاه و خوانا برای مشتریان.' },
  { key: 'footer_text', title: 'متن فوتر', placeholder: 'پات شاپ؛ گلدان و فلاورباکس برای فضاهای زنده و آرام.' },
] as const;

async function saveBlock(formData: FormData) {
  'use server';

  await requireAdmin();
  const key = String(formData.get('key') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  if (!key || !body) return;

  const existing = await prisma.staticContent.findUnique({ where: { key }, select: { title: true } });

  await prisma.staticContent.upsert({
    where: { key },
    update: { title: existing?.title ?? key, body, isPublished: true },
    create: { key, title: key, body, isPublished: true },
  });
}

export default async function AdminContentPage() {
  await requireAdmin();

  const existing = await prisma.staticContent.findMany({
    orderBy: { key: 'asc' },
    select: { key: true, title: true, body: true, isPublished: true },
  });
  const map = new Map(existing.map((item) => [item.key, item]));

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">محتوای فروشگاه</h1>
      <p className="mt-2 text-sm text-soil-700/70">متن‌های کسب‌وکار قابل ویرایش هستند؛ برچسب‌ها و فیلدهای فنی به‌صورت ثابت باقی می‌مانند.</p>

      <div className="mt-6 space-y-5">
        {BLOCKS.map((block) => {
          const item = map.get(block.key) ?? { title: block.title, body: '', isPublished: true };
          return (
            <form key={block.key} action={saveBlock} className="rounded-2xl border border-soil-900/10 bg-white p-5">
              <input type="hidden" name="key" value={block.key} />
              <div className="mb-3">
                <span className="text-xs font-bold text-soil-900">{block.title}</span>
              </div>
              <label className="mt-4 block">
                <span className="text-xs font-bold text-soil-900">متن</span>
                <textarea
                  name="body"
                  defaultValue={item.body}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-soil-900/15 px-3 py-2.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                  placeholder={block.placeholder}
                />
              </label>
              <button type="submit" className="mt-4 rounded-xl bg-flora-900 px-5 py-2.5 text-xs font-black text-white">
                ذخیره تغییرات
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
