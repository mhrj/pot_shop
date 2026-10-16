'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-2xl font-black text-soil-900">خطایی رخ داد</h1>
      <p className="mt-3 text-sm leading-7 text-soil-700/75">
        صفحه به‌درستی بارگذاری نشد. می‌توانید دوباره تلاش کنید؛ اگر مشکل ادامه
        داشت کمی بعد سر بزنید.
      </p>

      {/* The digest is the only handle on the server-side log entry, and it
          carries no message or stack from the error itself. */}
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-soil-700/50" dir="ltr">
          {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-flora-900 px-6 py-3 text-sm font-black text-white transition hover:bg-flora-700"
        >
          تلاش دوباره
        </button>
        <a
          href="/"
          className="rounded-full border border-soil-900/15 px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-100"
        >
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  );
}
