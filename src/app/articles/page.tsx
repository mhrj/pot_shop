import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'مقالات و راهنمای نگهداری گیاهان و گلدان | پات استور',
  description:
    'مجموعه راهنماها، مقالات تخصصی و نکات کلیدی برای انتخاب بهترین گلدان، ترکیب خاک مناسب و مراقبت اصولی از گیاهان آپارتمانی.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: 'مقالات و راهنمای نگهداری گیاهان و گلدان | پات استور',
    description:
      'مجموعه راهنماها و نکات تخصصی برای انتخاب گلدان، خاک و مراقبت از گیاهان.',
    type: 'website',
  },
};

type Props = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function ArticlesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const currentTag = sp.tag ? sp.tag.trim() : '';

  // Fetch all published articles to collect unique tags
  const allPublished = await prisma.article.findMany({
    where: { isPublished: true },
    select: { tags: true },
  });

  const allTags = Array.from(
    new Set(allPublished.flatMap((a) => a.tags || []).filter(Boolean)),
  ).sort();

  // Fetch filtered articles
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(currentTag ? { tags: { has: currentTag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="py-12 md:py-16">
      <Container>
        {/* Page Header */}
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-flora-100 px-3.5 py-1 text-xs font-bold text-flora-900 border border-flora-300/40">
            دانشنامه و وبلاگ پات استور
          </span>
          <h1 className="mt-4 text-3xl font-black text-soil-900 sm:text-4xl lg:text-5xl">
            راهنمای انتخاب و نگهداری
          </h1>
          <p className="mt-4 text-base leading-8 text-soil-700/80 sm:text-lg">
            آموزش‌های تخصصی برای انتخاب گلدان استاندارد، ترکیب خاک ایده‌آل و روش‌های علمی مراقبت از گیاهان آپارتمانی.
          </p>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-soil-900/10 pb-6">
            <span className="text-xs font-bold text-soil-700/60 ml-2">دسته‌بندی موضوعی:</span>
            <Link
              href="/articles"
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                !currentTag
                  ? 'bg-soil-900 text-white shadow-sm'
                  : 'bg-dust-100 text-soil-700 hover:bg-dust-200'
              }`}
            >
              همه مقالات ({toFa(allPublished.length)})
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/articles?tag=${encodeURIComponent(t)}`}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  currentTag === t
                    ? 'bg-flora-800 text-white shadow-sm'
                    : 'bg-dust-100 text-soil-700 hover:bg-dust-200'
                }`}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-soil-900/15 bg-white p-12 text-center">
            <p className="text-base font-bold text-soil-900">
              {currentTag
                ? `مقاله‌ای با برچسب «${currentTag}» یافت نشد.`
                : 'در حال حاضر مقاله‌ای منتشر نشده است.'}
            </p>
            {currentTag && (
              <Link
                href="/articles"
                className="mt-4 inline-block text-xs font-bold text-flora-700 hover:underline"
              >
                ← مشاهده همه مقالات
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const formattedDate = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(article.createdAt);

              return (
                <article
                  key={article.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-soil-900/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-soil-900/5 hover:border-soil-900/20"
                >
                  {/* Cover Image */}
                  <Link
                    href={`/articles/${article.slug}`}
                    className="relative aspect-[16/10] w-full overflow-hidden bg-dust-100"
                  >
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-flora-100/50 to-dust-200/50 text-4xl">
                        🪴
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      {/* Meta info */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-soil-700/60 mb-3">
                        <span>{formattedDate}</span>
                        <span className="rounded-full bg-flora-50 px-2 py-0.5 text-flora-800">
                          راهنمای آموزشی
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-black text-soil-900 leading-snug group-hover:text-flora-800 transition">
                        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                      </h2>

                      {/* Excerpt */}
                      {article.excerpt && (
                        <p className="mt-3 line-clamp-3 text-xs leading-6 text-soil-700/80">
                          {article.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Bottom: Tags & Link */}
                    <div className="mt-6 pt-4 border-t border-soil-900/5">
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag}
                              href={`/articles?tag=${encodeURIComponent(tag)}`}
                              className="rounded-full bg-dust-100 px-2.5 py-0.5 text-[10px] font-bold text-soil-700 hover:bg-dust-200 transition"
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/articles/${article.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-flora-800 group-hover:text-flora-700 transition"
                      >
                        <span>مطالعه کامل مقاله</span>
                        <span className="transition-transform duration-300 group-hover:-translate-x-1">
                          ←
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </main>
  );
}
