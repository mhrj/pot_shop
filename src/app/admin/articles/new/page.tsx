import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import ArticleForm from '@/components/admin/ArticleForm';

export default async function NewArticlePage() {
  await requireAdmin();

  return (
    <div>
      <div className="flex items-center justify-between pb-6 border-b border-soil-900/10 mb-6">
        <div>
          <h1 className="text-2xl font-black text-soil-900">نگارش مقاله جدید</h1>
          <p className="mt-1 text-xs text-soil-700/70">
            تولید محتوای مفید، راهنمای نگهداری و مقالات تخصصی فروشگاه
          </p>
        </div>
        <Link
          href="/admin/articles"
          className="rounded-xl border border-soil-900/15 bg-white px-4 py-2 text-xs font-bold text-soil-800 transition hover:bg-dust-100"
        >
          بازگشت به مقالات
        </Link>
      </div>

      <ArticleForm />
    </div>
  );
}
