import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  isOrderStatus,
  isPaymentStatus,
} from '@/lib/orders';

/**
 * Colour is applied by state, not by rank, and never carries meaning alone —
 * the Persian label is always rendered beside it.
 */
const ORDER_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-flora-100 text-flora-700',
  PROCESSING: 'bg-sky-50 text-sky-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-flora-100 text-flora-700',
  CANCELED: 'bg-red-50 text-red-700',
};

const PAYMENT_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-flora-100 text-flora-700',
  FAILED: 'bg-red-50 text-red-700',
  CANCELED: 'bg-dust-100 text-soil-700',
  REFUNDED: 'bg-dust-100 text-soil-700',
};

export default function StatusBadge({
  kind,
  value,
}: {
  kind: 'order' | 'payment';
  value: string;
}) {
  const label =
    kind === 'order'
      ? isOrderStatus(value)
        ? ORDER_STATUS_LABELS[value]
        : value
      : isPaymentStatus(value)
        ? PAYMENT_STATUS_LABELS[value]
        : value;

  const tone =
    (kind === 'order' ? ORDER_TONE[value] : PAYMENT_TONE[value]) ??
    'bg-dust-100 text-soil-700';

  return (
    <span className={'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + tone}>
      {label}
    </span>
  );
}
