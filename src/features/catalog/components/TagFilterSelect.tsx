'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  tags: { name: string; slug: string }[];
  tagSlug: string;
};

export default function TagFilterSelect({ tags, tagSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTag = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nextTag) {
      params.set('tag', nextTag);
    } else {
      params.delete('tag');
    }
    // Changing the filter resets pagination to page 1
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  return (
    <select
      name="tag"
      value={tagSlug}
      onChange={handleChange}
      className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500 focus:dark:border-flora-500 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
    >
      <option value="">همه</option>
      {tags.map((t) => (
        <option key={t.slug} value={t.slug}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
