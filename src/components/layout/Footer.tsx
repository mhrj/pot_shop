import Link from 'next/link';
import { getContentMap } from '@/lib/content';
import { toFa } from '@/lib/format';

export default async function Footer() {
  const content = await getContentMap();

  const contact = [
    { label: 'نشانی', value: toFa(content.address.body) },
    { label: 'تلفن', value: toFa(content.phone.body), ltr: true },
    { label: 'ایمیل', value: content.email.body.trim(), ltr: true },
    { label: 'ساعات کاری', value: toFa(content.hours.body) },
  ].filter((row) => row.value.length > 0);

  return (
    <footer className="border-t border-soil-900/10 bg-white/80 dark:border-dust-100/10 dark:bg-flora-950/90 dark:supports-[backdrop-filter]:bg-flora-950/75 backdrop-blur print:hidden no-print">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-black text-soil-900 dark:text-dust-50">پات استور</p>
            <p className="mt-3 text-sm leading-7 text-soil-700/80 dark:text-dust-200/80">
              {content.footer_text.body}
            </p>
          </div>

          {contact.length > 0 && (
            <div>
              <p className="text-xs font-bold text-soil-900 dark:text-dust-50">راه‌های ارتباطی</p>
              <dl className="mt-4 space-y-3 text-sm">
                {contact.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-2">
                    <dt className="text-soil-700/60 dark:text-dust-300/60">{row.label}:</dt>
                    <dd
                      className="font-bold text-soil-700/90 dark:text-dust-100/90"
                      dir={row.ltr ? 'ltr' : undefined}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-soil-900 dark:text-dust-50">دسترسی سریع</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/products" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-100">
                  محصولات
                </Link>
              </li>
              <li>
                <Link href="/articles" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-100">
                  دانشنامه و مقالات
                </Link>
              </li>
              <li>
                <Link href="/about" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-100">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/cart" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-100">
                  سبد خرید
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-soil-900/10 dark:border-dust-100/10 pt-6 text-center text-xs text-soil-700/60 dark:text-dust-300/60">
          © ۱۴۰۵ پات استور — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
