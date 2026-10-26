import { formatToman, toFa } from '@/lib/format';
import { buildDailySales, type ReportingOrder } from '@/lib/analytics';

/**
 * Daily verified revenue for a trailing window.
 *
 * One series, so no legend — the caption names it. Bars are a single hue from
 * the shop's flora ramp, anchored to the baseline with 4px rounded ends, and
 * the hover layer is pure CSS so this stays a Server Component.
 */
export default function SalesChart({
  orders,
  days = 14,
}: {
  orders: ReportingOrder[];
  days?: number;
}) {
  const points = buildDailySales(orders, days);
  const total = points.reduce((sum, p) => sum + p.revenueToman, 0);
  const peak = points.reduce(
    (best, p) => (p.revenueToman > best.revenueToman ? p : best),
    points[0],
  );
  const max = Math.max(...points.map((p) => p.revenueToman), 1);

  return (
    <figure className="rounded-2xl border border-soil-900/10 bg-white p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-soil-900">
            فروش {toFa(days)} روز گذشته
          </h2>
          <p className="mt-1.5 text-sm text-soil-700/70">
            درآمد تأییدشده:{' '}
            <b className="text-soil-900">{formatToman(total)}</b>
          </p>
        </div>
        {peak && peak.revenueToman > 0 && (
          <p className="text-xs text-soil-700/60">
            بیشترین روز: {peak.label} · {formatToman(peak.revenueToman)}
          </p>
        )}
      </figcaption>

      {total === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-soil-900/15 px-5 py-10 text-center text-sm text-soil-700/70">
          در این بازه فروش تأییدشده‌ای ثبت نشده است.
        </p>
      ) : (
        <>
          <div className="mt-6 flex h-44 items-end gap-1 border-b border-soil-900/10">
            {points.map((p) => {
              const heightPct = Math.max(2, (p.revenueToman / max) * 100);
              return (
                <div
                  key={p.key}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                >
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-soil-900 px-2.5 py-1.5 text-center text-[10px] leading-5 whitespace-nowrap text-white shadow-lg group-hover:block"
                  >
                    <span className="block font-bold">{p.label}</span>
                    <span className="block text-flora-100/90">
                      {formatToman(p.revenueToman)}
                    </span>
                    <span className="block text-dust-200/80">
                      {toFa(p.orderCount)} سفارش
                    </span>
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t bg-flora-700/80 transition group-hover:bg-flora-700"
                  />
                </div>
              );
            })}
          </div>

          <div aria-hidden className="mt-2 flex gap-1">
            {points.map((p, i) => (
              <span
                key={p.key}
                className="flex-1 text-center text-[9px] text-soil-700/50"
              >
                {i % 2 === 0 ? p.label : ''}
              </span>
            ))}
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-bold text-flora-700 hover:text-flora-900">
              نمایش جدول اعداد
            </summary>
            <table className="mt-3 w-full text-xs">
              <thead className="text-soil-700/60">
                <tr>
                  <th scope="col" className="py-2 text-start font-medium">روز</th>
                  <th scope="col" className="py-2 text-start font-medium">سفارش</th>
                  <th scope="col" className="py-2 text-start font-medium">درآمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {points.map((p) => (
                  <tr key={p.key}>
                    <td className="py-2 text-soil-900">{p.label}</td>
                    <td className="py-2 text-soil-700/80">{toFa(p.orderCount)}</td>
                    <td className="py-2 font-bold text-soil-900">
                      {formatToman(p.revenueToman)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  );
}
