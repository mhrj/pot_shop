export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-bold text-red-600">{message}</p>;
}
