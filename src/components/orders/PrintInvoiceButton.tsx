'use client';

type Props = {
  className?: string;
};

export default function PrintInvoiceButton({ className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 rounded-xl border border-soil-900/15 bg-white px-4 py-2 text-xs font-bold text-soil-800 shadow-2xs transition hover:bg-dust-100 hover:text-flora-800 cursor-pointer print:hidden ${className}`}
      title="چاپ و دانلود فاکتور"
    >
      <svg className="size-4 shrink-0 text-soil-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      <span>پرینت فاکتور</span>
    </button>
  );
}
