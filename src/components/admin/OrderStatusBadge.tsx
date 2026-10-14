const MAP: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'در انتظار پرداخت', cls: 'bg-amber-50 text-amber-700' },
  PAID: { text: 'پرداخت‌شده', cls: 'bg-flora-100 text-flora-700' },
  PROCESSING: { text: 'در حال آماده‌سازی', cls: 'bg-sky-50 text-sky-700' },
  SHIPPED: { text: 'ارسال‌شده', cls: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { text: 'تحویل‌شده', cls: 'bg-flora-100 text-flora-700' },
  CANCELED: { text: 'لغو‌شده', cls: 'bg-red-50 text-red-700' },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const st = MAP[status] ?? MAP.PENDING;
  return (
    <span className={'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + st.cls}>
      {st.text}
    </span>
  );
}
