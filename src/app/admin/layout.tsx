import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'داشبورد' },
  { href: '/admin/products', label: 'محصولات' },
  { href: '/admin/tags', label: 'برچسب‌ها' },
  { href: '/admin/content', label: 'محتوای فروشگاه' },
  { href: '/admin/orders', label: 'سفارش‌ها' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="sticky top-6 rounded-2xl border border-soil-900/10 bg-white p-4">
            <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-soil-700/50">
              پنل مدیریت
            </p>
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-bold text-soil-900 transition hover:bg-dust-100"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
