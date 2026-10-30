import Link from 'next/link';
import { toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import ArticleCard from '@/features/articles/components/ArticleCard';

type ArticleItem = Parameters<typeof ArticleCard>[0]['article'];

type ArticlesListViewProps = {
  articles: ArticleItem[];
  allTags: string[];
  totalPublishedCount: number;
  currentTag: string;
};

export default function ArticlesListView({
  articles,
  allTags,
  totalPublishedCount,
  currentTag,
}: ArticlesListViewProps) {
  return (
    <main className="py-12 md:py-16 dark:bg-flora-950">
      <Container>
        {/* Page Header */}
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-flora-100 dark:bg-flora-900/60 px-3.5 py-1 text-xs font-bold text-flora-900 dark:text-flora-300 border border-flora-300/40 dark:border-flora-500/30">
            دانشنامه و وبلاگ پات استور
          </span>
          <h1 className="mt-4 text-3xl font-black text-soil-900 dark:text-dust-50 sm:text-4xl lg:text-5xl">
            راهنمای انتخاب و نگهداری
          </h1>
          <p className="mt-4 text-base leading-8 text-soil-700/80 dark:text-dust-200/80 sm:text-lg">
            آموزش‌های تخصصی برای انتخاب گلدان استاندارد، ترکیب خاک ایده‌آل و روش‌های علمی مراقبت از گیاهان آپارتمانی.
          </p>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-soil-900/10 dark:border-dust-50/10 pb-6">
            <span className="text-xs font-bold text-soil-700/60 dark:text-dust-200/60 me-2">دسته‌بندی موضوعی:</span>
            <Link
              href="/articles"
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                !currentTag
                  ? 'bg-soil-900 text-white dark:bg-flora-700 shadow-sm'
                  : 'bg-dust-100 dark:bg-flora-950 dark:text-dust-300 dark:hover:bg-flora-900 border border-transparent dark:border-dust-50/10 transition-colors hover:bg-dust-200'
              }`}
            >
              همه مقالات ({toFa(totalPublishedCount)})
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/articles?tag=${encodeURIComponent(t)}`}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  currentTag === t
                    ? 'bg-flora-700 text-white shadow-sm'
                    : 'bg-dust-100 dark:bg-flora-950 dark:text-dust-300 dark:hover:bg-flora-900 border border-transparent dark:border-dust-50/10 transition-colors hover:bg-dust-200'
                }`}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-soil-900/15 dark:border-dust-50/15 bg-white dark:bg-flora-900 p-12 text-center">
            <p className="text-base font-bold text-soil-900 dark:text-dust-50">
              {currentTag
                ? `مقاله‌ای با برچسب «${currentTag}» یافت نشد.`
                : 'در حال حاضر مقاله‌ای منتشر نشده است.'}
            </p>
            {currentTag && (
              <Link
                href="/articles"
                className="mt-4 inline-block text-xs font-bold text-flora-700 dark:text-flora-300 hover:underline"
              >
                ← مشاهده همه مقالات
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
