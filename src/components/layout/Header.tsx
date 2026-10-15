import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/components/layout/LogoutButton';

export default async function Header() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-soil-900/10 bg-dust-50/90 backdrop-blur supports-[backdrop-filter]:bg-dust-50/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-lg font-black text-soil-900">
            پات شاپ
          </Link>
          <nav aria-label="منوی اصلی" className="hidden items-center gap-4 text-sm font-medium text-soil-700 md:flex">
            <Link href="/products" className="transition hover:text-flora-700">محصولات</Link>
            <Link href="/cart" className="transition hover:text-flora-700">سبد خرید</Link>
            {user ? (
              <Link href={isAdmin ? '/admin' : '/dashboard'} className="transition hover:text-flora-700">
                {isAdmin ? 'داشبورد مدیریت' : 'داشبورد'}
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className="rounded-full bg-flora-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-flora-700"
              >
                {user.fullName ? `حساب من` : 'پروفایل'}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full border border-soil-900/15 bg-white px-4 py-2 text-xs font-bold text-soil-900 transition hover:border-flora-700 hover:text-flora-700"
              >
                ثبت‌نام
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-flora-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-flora-700"
              >
                ورود
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
