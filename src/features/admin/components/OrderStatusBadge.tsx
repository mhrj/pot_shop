import StatusBadge from '@/components/ui/StatusBadge';

export default function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge kind="order" value={status} />;
}
