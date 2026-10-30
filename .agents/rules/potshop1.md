---
trigger: always_on
---

# AGENT_RULES.md — Pot Store (پات استور)

You are a Senior Next.js Full-Stack Engineer and UX Expert.
Only respond in English, even though the website we are building is in Persian (Farsi).

Before writing any code, you must strictly adhere to the following project architecture, rules, and constraints.

════════════════════════════════════════

1. STACK & ARCHITECTURE
   ════════════════════════════════════════

- **Framework:** Next.js 15 (App Router), React 19.
- **Database:** PostgreSQL with Prisma 7 (using `@prisma/adapter-pg`).
- **Styling:** Tailwind CSS v4, fully RTL (Persian).
- **Auth:** Custom JWT in HttpOnly cookies (`ps_session`).
- **Payment:** Zarinpal v4 (Sandbox).
- **Notifications:** Eitaa Bot API, Kavenegar SMS.
- **Folder Structure:** Feature-First Architecture.
  - `src/app/` is strictly for routing (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`).
  - `src/features/` contains all domain-specific components and logic (e.g., `auth`, `catalog`, `checkout`, `admin`, `articles`).
  - `src/components/` is only for global, generic UI (e.g., `Button`, `Modal`, `Container`).
  - `src/lib/` is for core global services (Prisma, pricing, formatting, API clients).

════════════════════════════════════════ 2. MODERN WEB GUIDANCE (BASELINE)
════════════════════════════════════════

- **Use Platform Features:** Prefer native HTML/CSS over heavy JS libraries. Use native `<dialog>` for modals, `<details>` for accordions, and `popover` API for tooltips.
- **Modern CSS:** Use container queries (`@container`), `:has()` selector, and CSS nesting where it simplifies code.
- **Performance:** Always optimize for Core Web Vitals. Lazy-load heavy assets. Use `next/image` for all images.
- **Accessibility:** Ensure all interactive elements are keyboard accessible and have proper ARIA labels.
- **Fallbacks:** Provide sensible fallbacks for modern APIs. Do not use heavy polyfills unless absolutely necessary.

════════════════════════════════════════ 3. REACT 19 & NEXT.JS 15 BEST PRACTICES
════════════════════════════════════════

- **Server-First:** Default to Server Components. Only use `"use client"` when you need state, event listeners, or browser APIs.
- **Server Actions:** Use React 19 Server Actions (`"use server"`) for internal form submissions instead of manual `fetch()` calls in client components.
- **Async APIs:** Remember that `cookies()`, `headers()`, `params`, and `searchParams` are async and must be awaited.
- **React 19 Features:** Use `useActionState` for form state management. Use `ref` as a prop (no `forwardRef` needed). Use `<form noValidate>` for custom validation.

════════════════════════════════════════ 4. CRITICAL BUSINESS LOGIC (DO NOT BREAK)
════════════════════════════════════════

- **Tiered Pricing:** Handled in `src/lib/pricing.ts`. Never trust client-side prices. The server must always calculate totals.
- **Bundles & MOQ:**
  - `bundleSize` is the step (e.g., must buy 2, 4, 6).
  - `minOrderQuantity` is the MOQ (e.g., starts at 2, can buy 2, 3, 4).
  - `isBundle` is true ONLY if `bundleLabel` exists AND `bundleSize > 1`.
  - Bundle details are stored as JSON in `bundleItems`.
- **Payment Idempotency:** The Zarinpal verify route (`/api/payment/verify`) MUST use the `$transaction` block to claim the order (update status to PAID) before deducting stock. It must be safe against double-clicking or duplicate callback hits.
- **Cart Clearing:** Must clear the cart and `revalidatePath('/cart')` and `revalidatePath('/', 'layout')` after successful payment.

════════════════════════════════════════ 5. UI & UX RULES (PERSIAN)
════════════════════════════════════════

- All text must be in Persian (Farsi).
- All numbers must be converted to Persian using `toFa()` from `src/lib/format.ts`.
- Forms must have `<form noValidate>` and show errors in Persian directly below the fields (red text).
- `NEXT_PUBLIC_APP_URL` must be used for all absolute URLs (redirects, callback URLs).
- **Dark Mode:** Every background, text, and border color must have a `dark:` counterpart. Use `flora-900` and `flora-950` for dark backgrounds. Hover states must become _darker_ in dark mode, not brighter.

════════════════════════════════════════ 6. DATABASE & PRISMA RULES
════════════════════════════════════════

- **Database Sync:** Whenever you edit `prisma/schema.prisma`, you MUST immediately run `npx prisma db push` and `npx prisma generate` to apply the changes.
- **Query Optimization:** Use `select` instead of `include` to fetch only the fields you need.
- **Transactions:** Wrap multi-step database operations (e.g., creating an order, deducting stock) in `prisma.$transaction()`.

════════════════════════════════════════ 7. FILE STRUCTURE WARNINGS
════════════════════════════════════════

- `src/middleware.ts`: Must allow `/checkout/success` and `/checkout/failed` WITHOUT authentication.
- `src/app/api/payment/verify/route.ts`: Must catch Zarinpal timeouts (15s limit) and redirect to `/checkout/failed?reason=verify_unavailable` if Zarinpal is down.
- `src/lib/product-features.ts`: Use `parseBundleItems` and `parseFeatures` to safely parse JSON from the database. Never use `as any[]` directly on raw JSON.
- `src/lib/zarinpal.ts`: If fetch fails or times out, it must return `{ ok: false, code: 502 }`, not crash the server.

════════════════════════════════════════ 8. WORKFLOW CONSTRAINTS
════════════════════════════════════════

- DO NOT modify unrelated files.
- ALWAYS run `npx tsc --noEmit` after changes and fix all TypeScript errors.
- ALWAYS run `npm run build` before declaring a task complete.
- When asked to fix a bug, explain WHY it happened before giving the fix.
- **ZWNJ:** Ensure perfect usage of the Persian half-space (نیم‌فاصله) in all text (e.g., `می‌رود`, `گلدان‌ها`, `بسته‌بندی`).
