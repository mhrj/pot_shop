'use client';

import { useState } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  ref?: React.Ref<HTMLInputElement>;
};

export default function PasswordInput({ className, error, ref, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative" dir="ltr">
      <input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        dir="ltr"
        className={
          `w-full rounded-xl border py-3 pe-4 ps-11 text-sm outline-none transition dark:bg-flora-950 dark:text-dust-50 dark:placeholder:text-dust-400 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/80 dark:focus:ring-red-500/30'
              : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 focus:dark:border-flora-500'
          } ` + (className ?? '')
        }
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute top-1/2 start-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-soil-700/60 dark:text-dust-400 transition hover:bg-dust-100 dark:hover:bg-flora-900 hover:text-soil-900 dark:hover:text-dust-50 cursor-pointer"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
