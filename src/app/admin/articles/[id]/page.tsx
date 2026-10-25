import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ArticleForm from '@/components/admin/ArticleForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-6 border-b border-soil-900/10 mb-6">
        <div>
          <h1 className="text-2xl font-black text-soil-900">ویرایش مقاله</h1>
          <p className="mt-1 text-xs text-soil-700/70">{article.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {article.isPublished && (
            <Link
              href={`/articles/${article.slug}`}
              target="_blank"
              className="rounded-xl border border-soil-900/15 bg-white px-4 py-2 text-xs font-bold text-flora-800 transition hover:bg-dust-100"
            >
              مشاهده عمومی ↗
            </Link>
          )}
          <Link
            href="/admin/articles"
            className="rounded-xl border border-soil-900/15 bg-white px-4 py-2 text-xs font-bold text-soil-800 transition hover:bg-dust-100"
          >
            بازگشت به مقالات
          </Link>
        </div>
      </div>

      <ArticleForm initialData={article} />
    </div>
  );
}
