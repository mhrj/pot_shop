import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';

/** Route-level fallback while the catalog's server queries resolve. */
export default function Loading() {
  return (
    <Container className="py-12">
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">در حال بارگذاری…</span>

        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-soil-900/10 bg-white p-4">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="mt-4 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
