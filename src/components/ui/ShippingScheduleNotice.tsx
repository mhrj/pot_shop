type Props = {
  compact?: boolean;
  className?: string;
};

export default function ShippingScheduleNotice({
  compact = false,
  className = '',
}: Props) {
  return (
    <div
      role="note"
      dir="rtl"
      className={`rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 transition ${
        compact ? 'p-3 text-xs' : 'p-4 text-sm'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
          <svg
            className={compact ? 'size-4' : 'size-5'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75"
            />
          </svg>
        </div>
        <div className="space-y-1 leading-relaxed">
          <div className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
            <span>📦</span>
            <span>برنامه ارسال سفارشات:</span>
          </div>
          <p className="text-amber-800/90 dark:text-amber-200/90 leading-6">
            سفارش‌های شما تنها در روزهای <strong>یکشنبه</strong> و <strong>چهارشنبه</strong> ارسال می‌شوند. سفارش‌هایی که تا ساعت <strong>۱۰ صبح</strong> این روزها ثبت شوند، در همان روز تحویل پست داده می‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
}
