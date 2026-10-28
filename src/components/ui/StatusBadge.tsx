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
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PAID: 'bg-flora-100 text-flora-700 dark:bg-flora-900/50 dark:text-flora-300',
  PROCESSING: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  SHIPPED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  DELIVERED: 'bg-flora-100 text-flora-700 dark:bg-flora-900/50 dark:text-flora-300',
  CANCELED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFUNDED: 'bg-dust-100 text-soil-700 dark:bg-flora-900 dark:text-dust-300',
};

const PAYMENT_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PAID: 'bg-flora-100 text-flora-700 dark:bg-flora-900/50 dark:text-flora-300',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  CANCELED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFUNDED: 'bg-dust-100 text-soil-700 dark:bg-flora-900 dark:text-dust-300',
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
    'bg-dust-100 text-soil-700 dark:bg-flora-900 dark:text-dust-300';

  return (
    <span className={'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + tone}>
      {label}
    </span>
  );
}
