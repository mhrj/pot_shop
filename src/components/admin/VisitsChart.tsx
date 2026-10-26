import { toFa } from '@/lib/format';

export type DailyVisitsPoint = {
  key: string;
  label: string;
  viewsCount: number;
  uniqueVisitors: number;
};

/**
 * Visual bar chart showing daily page views and unique visitors for the last 7 days.
 * Pure CSS bars and tooltips — runs as a fast Server Component.
 */
export default function VisitsChart({
  points,
}: {
  points: DailyVisitsPoint[];
}) {
  const total = points.reduce((sum, p) => sum + p.viewsCount, 0);
  const peak = points.reduce(
    (best, p) => (p.viewsCount > best.viewsCount ? p : best),
    points[0],
  );
  const max = Math.max(...points.map((p) => p.viewsCount), 1);

  return (
    <figure className="rounded-2xl border border-soil-900/10 bg-white p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-soil-900">
            بازدیدهای ۷ روز گذشته
          </h2>
          <p className="mt-1.5 text-sm text-soil-700/70">
            مجموع بازدیدهای این بازه:{' '}
            <b className="text-soil-900">{toFa(total)} بازدید</b>
          </p>
        </div>
        {peak && peak.viewsCount > 0 && (
          <p className="text-xs text-soil-700/60">
            بیشترین روز: {peak.label} · {toFa(peak.viewsCount)} بازدید
          </p>
        )}
      </figcaption>

      {total === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-soil-900/15 px-5 py-10 text-center text-sm text-soil-700/70">
          در ۷ روز گذشته هنوز بازدیدی ثبت نشده است.
        </p>
      ) : (
        <>
          <div className="mt-6 flex h-40 items-end gap-2 border-b border-soil-900/10 pb-1">
            {points.map((p) => {
              const heightPct = Math.max(3, (p.viewsCount / max) * 100);
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
                    <span className="block text-flora-100/90 font-medium">
                      {toFa(p.viewsCount)} بازدید کل
                    </span>
                    <span className="block text-dust-200/80">
                      {toFa(p.uniqueVisitors)} کاربر یکتا
                    </span>
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t bg-dust-400 transition hover:bg-dust-500 group-hover:bg-flora-700"
                  />
                </div>
              );
            })}
          </div>

          <div aria-hidden className="mt-2 flex gap-2">
            {points.map((p) => (
              <span
                key={p.key}
                className="flex-1 text-center text-[10px] font-medium text-soil-700/60 truncate"
              >
                {p.label}
              </span>
            ))}
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-bold text-flora-700 hover:text-flora-900">
              نمایش جدول آمار ۷ روز
            </summary>
            <table className="mt-3 w-full text-xs">
              <thead className="text-soil-700/60 border-b border-soil-900/10">
                <tr>
                  <th scope="col" className="py-2 text-start font-medium">تاریخ</th>
                  <th scope="col" className="py-2 text-start font-medium">بازدید کل</th>
                  <th scope="col" className="py-2 text-start font-medium">کاربر یکتا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {points.map((p) => (
                  <tr key={p.key} className="hover:bg-dust-50/60">
                    <td className="py-2 font-medium text-soil-900">{p.label}</td>
                    <td className="py-2 text-soil-800">{toFa(p.viewsCount)}</td>
                    <td className="py-2 text-flora-800 font-bold">{toFa(p.uniqueVisitors)}</td>
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
