import { twMerge } from 'tailwind-merge';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={twMerge(
        'animate-pulse rounded-xl bg-gradient-to-r from-dust-100 via-dust-50 to-dust-100 dark:from-flora-900 dark:via-flora-700 dark:to-flora-900 bg-[length:200%_100%]',
        className,
      )}
    />
  );
}
