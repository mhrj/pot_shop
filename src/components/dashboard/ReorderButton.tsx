'use client';

import { useState } from 'react';

export default function ReorderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop click event from bubbling up to the order card's Link
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const form = e.currentTarget.closest('form');
    if (form) {
      form.submit();
      return;
    }

    // Fallback dynamic form submission if not rendered inside a form
    const dynamicForm = document.createElement('form');
    dynamicForm.method = 'POST';
    dynamicForm.action = '/api/cart/reorder';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'orderId';
    input.value = orderId;

    dynamicForm.appendChild(input);
    document.body.appendChild(dynamicForm);
    dynamicForm.submit();
  };

  return (
    <form
      action="/api/cart/reorder"
      method="post"
      onSubmit={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="inline"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-flora-900 px-4 py-2 text-[11px] font-bold text-white hover:bg-flora-700 dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? 'در حال افزودن…' : 'سفارش مجدد'}
      </button>
    </form>
  );
}
