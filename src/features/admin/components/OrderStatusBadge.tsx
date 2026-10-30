import StatusBadge from '@/features/checkout/components/StatusBadge';

export default function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge kind="order" value={status} />;
}
