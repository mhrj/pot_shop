'use client';

import { useState } from 'react';

export default function TestBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (process.env.NEXT_PUBLIC_SHOW_TEST_BANNER !== 'true' || dismissed) {
    return null;
  }

  return (
    <>
      <aside
        role="alert"
        aria-live="assertive"
        className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white shadow-lg print:hidden no-print"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 text-xs font-bold md:px-8 md:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base select-none shrink-0" aria-hidden="true">
              ⚠️
            </span>
            <p className="leading-5">
              توجه: این نسخه آزمایشی است. در حال حاضر امکان خرید واقعی وجود ندارد و سایت در حال دریافت مجوزهای لازم است.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer shrink-0"
            aria-label="بستن پیام آزمایشی"
            title="بستن"
          >
            <svg
              className="size-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </aside>
      {/* Spacer so the fixed top banner does not overlap the navigation header */}
      <div className="h-10 md:h-11 w-full shrink-0" aria-hidden="true" />
    </>
  );
}
