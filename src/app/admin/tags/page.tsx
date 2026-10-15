import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function createTag(formData: FormData) {
  'use server';

  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const slug = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'tag';

  await prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

export default async function AdminTagsPage() {
  await requireAdmin();

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">برچسب‌ها</h1>
      <p className="mt-2 text-sm text-soil-700/70">مدیریت دسته‌بندی‌های محصولات</p>

      <form action={createTag} className="mt-6 rounded-2xl border border-soil-900/10 bg-white p-5">
        <label className="block">
          <span className="text-xs font-bold text-soil-900">نام برچسب</span>
          <input
            name="name"
            required
            className="mt-2 w-full rounded-xl border border-soil-900/15 px-3 py-2.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            placeholder="مثلاً: گیاهان آپارتمانی"
          />
        </label>
        <button type="submit" className="mt-4 rounded-xl bg-flora-900 px-5 py-2.5 text-xs font-black text-white">
          افزودن برچسب
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between gap-3 rounded-2xl border border-soil-900/10 bg-white p-4">
            <div>
              <p className="font-bold text-soil-900">{tag.name}</p>
              <p className="mt-1 text-xs text-soil-700/60">{tag._count.products} محصول مرتبط</p>
            </div>
            <form action={async () => { 'use server'; await prisma.tag.delete({ where: { id: tag.id } }).catch(() => undefined); }}>
              <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                حذف
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
