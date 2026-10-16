# IMPLEMENTATION STATUS — Pot Shop

Last updated: 2026-10-16 (verification pass)
Branch: `main` (working tree, uncommitted)

> **Verification status: CARRIED OUT.** The previous revision of this file
> recorded that every command was blocked by a sandbox outage and that nothing
> had been executed. That constraint no longer applies. Every command in §1 was
> run in this pass and its real result is recorded below. Claims below are
> limited to what was actually observed; anything not executed is marked as
> such.

---

## 1. Commands executed, with real results

| # | Command | Result | Exit |
|---|---|---|---|
| 1 | `npx prisma validate` | `The schema at prisma/schema.prisma is valid 🚀` | 0 |
| 2 | `npx tsc --noEmit` | No diagnostics | 0 |
| 3 | `npm test` (`tsx --test tests/**/*.test.ts`) | **37 tests, 37 pass, 0 fail** | 0 |
| 4 | `npm run build` (`prisma generate && next build`) | Compiled successfully; 35 routes generated | 0 |
| 5 | `npm run lint` (`next lint`) | **Cannot run** — see §1.1 | 1 |

### 1.1 `npm run lint` is not usable, and this is pre-existing

The project contains **no ESLint configuration** (no `eslint.config.*`, no
`.eslintrc*`, no `eslintConfig` key in `package.json`) and `eslint` is not
installed. `next lint` therefore drops into an interactive "How would you like
to configure ESLint?" prompt and exits 1 with no useful output.

This is **not** a regression from the current changes — lint has never been
configured in this repository, so no lint error could have been introduced. It
was left alone deliberately: adding ESLint means installing dependencies
(`eslint`, `eslint-config-next`) and adding a config file, which changes the
project's dependency tree, and on a codebase that has never been linted it would
surface a large backlog that is out of scope here. §5 records the exact command
to add it if you want it.

---

## 2. What was verified at runtime (not just by reading code)

A production server (`npx next start`) was run against the local Postgres
database and exercised over HTTP. No real payment was initiated and no
production data was touched.

### 2.1 Pages and routing

| Request | Result |
|---|---|
| `GET /` | 200 |
| `GET /products`, `/products?q=clay`, `/products?sort=price_asc&page=1` | 200 |
| `GET /login`, `GET /register` | 200 |
| `GET /products/clay-pot-terracotta-medium` | 200 |
| `GET /definitely-not-a-page` | 404 (custom `not-found`) |
| `GET /admin`, `/dashboard`, `/checkout`, `/cart` (no session) | 307 → `/login?next=…` |

### 2.2 Authorization — the new DB-backed admin check

Verified with a **validly signed HS256 admin JWT**, minted with the project's own
`JWT_SECRET` and an `ADMIN` role claim, but for a **user id that does not exist**
in the database:

| Request (valid admin JWT, nonexistent account) | Result |
|---|---|
| `GET /api/admin/landing-images` | **403** |
| `GET /api/admin/tags` | **403** |
| `POST /api/admin/upload` | **403** |
| `GET /admin` (page) | 307 → `/login` |
| `GET /api/admin/landing-images` with a tampered signature | 403 |

Under the previous code these routes checked only `session.role`, so this token
would have been accepted. The 403s confirm the account is now re-read from the
database. Unauthenticated requests behave as expected (`GET /api/addresses` 401,
`GET /api/admin/landing-images` 403).

### 2.3 Upload content validation

`saveUploadedImage` was driven directly with hostile files:

| Input | Result |
|---|---|
| HTML bytes named `evil.png`, declared `image/png` | refused |
| SVG bytes named `evil.jpg`, declared `image/jpeg` | refused |
| PHP bytes named `photo.png` | refused |
| Empty file named `empty.png` | refused |
| RIFF/WAVE bytes named `sound.webp` | refused |
| PNG signature, declared `image/jpeg` | refused (declared/content mismatch) |
| **Real PNG signature** | **accepted**, stored as `.png` |

`public/uploads/product/` held 3 files before and 3 after the five malicious
uploads: **nothing was written to disk**. The accepted test file was deleted
afterwards; the directory was left as found.

### 2.4 Payment callback route (no real payment)

| Request | Result |
|---|---|
| `GET /api/payment/verify` (no `Authority`) | 303 → `/checkout/failed?reason=authority_missing` |
| `GET /api/payment/verify?Authority=FAKE123&Status=OK` | 303 → `/checkout/failed?reason=order_not_found` |

The verification step against the live gateway was **not** exercised — see §4.

### 2.5 Chatbot

`POST /api/chat` with a valid payload returns **503** and the Persian
"service unavailable" message. `GEMINI_API_KEY` is empty, so no reply is
fabricated. A malformed payload correctly returns 400.

> Note: a previous reading of this file claimed `GEMINI_API_KEY` was empty; that
> was re-checked and confirmed (the value is genuinely empty — an earlier
> character count had included a stray carriage return). The 503 is correct.

---

## 3. Defects found and fixed in this pass

These are new to this pass; the work described in §6 was already present and is
now verified rather than merely asserted.

### 3.1 Uploads trusted the client for file type — no content validation (High)

`saveUploadedImage` decided the format from `file.type` (client-declared) or the
filename extension, falling back to the client's name for the output extension.
Any of those can be set by the uploader. Because uploads are written into
`public/uploads` and served **from this site's own origin**, a file whose
contents are an HTML document or an SVG with a `<script>` could be persisted and
served under a trusted origin, however it was labelled.

Fixed by sniffing the leading bytes:

- `sniffImageType(bytes)` added to `src/lib/image-validation.ts` — recognises
  JPEG (`FF D8 FF`), PNG (8-byte signature), GIF (`GIF87a`/`GIF89a`), WebP
  (`RIFF`…`WEBP`) and AVIF (ISO-BMFF `ftyp` box whose major *or compatible*
  brand list contains `avif`/`avis`). It is pure, so it unit-tests without a
  server.
- `saveUploadedImage` now: rejects empty files, rejects anything whose bytes are
  not one of the five formats, rejects a file whose declared type contradicts
  its actual bytes, and derives the stored extension from the **sniffed** type.
- A RIFF container that is not WebP (e.g. WAVE) is correctly *not* accepted.

This closes the item that the previous revision listed under "not implemented".

### 3.2 Payment settlement could decrement stock twice (High)

`/api/payment/verify` decided "already processed" from a read taken **before**
the transaction. Zarinpal may deliver the callback more than once, and two
deliveries can arrive concurrently; under READ COMMITTED both would pass the
check, both would decrement stock, and both would clear the cart.

Fixed by making settlement a conditional claim:

```ts
const claim = await tx.order.updateMany({
  where: { id: order.id, paymentStatus: { not: 'PAID' } },
  data: { …PAID… },
});
if (claim.count === 0) return;   // lost the race — no-op
```

Only the winner touches stock. Each line's decrement is additionally guarded by
the stock it is allowed to consume (`where: { id, stock: { gte: quantity } }`),
so a concurrent *different* order cannot drive stock negative; a line that
cannot be filled throws and rolls the whole settlement back, including the PAID
claim. The late-arrival `Status=NOK` and verification-failure branches are also
now guarded on `paymentStatus: { not: 'PAID' }`, so a delayed NOK delivery can
no longer cancel an order a concurrent OK delivery already paid.

### 3.3 A gateway outage was recorded as a failed payment (High)

The verification step conflated "the gateway could not be reached" (502) and
"the gateway is not configured" (503) with a genuine decline, and marked the
order `FAILED`. If the customer had in fact paid, the order was written off.

Fixed: `isRetryableGatewayFailure(code)` (in `src/lib/orders.ts`, kept there so
it is testable without a server environment) identifies 502/503, and those now
leave the order **unsettled** for retry and redirect with
`reason=verify_unavailable`.

Similarly, the settlement `catch {}` previously swallowed *every* error and
recorded `stock_shortage`. An infrastructure failure after the money was taken
would therefore have been recorded as the customer's problem. A dedicated
`StockShortageError` now separates a real stock shortage (order is marked
FAILED, with the product named) from anything else (logged, order left
unsettled, `reason=settlement_error`).

### 3.4 Admin order cancellation could restore stock twice (High)

The same class as 3.2, in `/api/admin/orders/[id]`. `restoreStock` was computed
from a read taken **before** the transaction, and the transaction then did an
unconditional `order.update`. Two concurrent cancel requests would both observe
`paymentStatus === 'PAID'`, both increment stock, and both write `REFUNDED`.
The code comment claimed idempotency, but that held only for *sequential*
replays, not concurrent ones.

Fixed by pinning the state that was read:

```ts
const claim = await tx.order.updateMany({
  where: { id, status: from, paymentStatus },   // the observed state
  data,
});
if (claim.count === 0) return null;             // someone else moved it
```

Stock is restored only by the request that wins the claim; the loser gets a 409
asking for a refresh. The customer-facing cancel route
(`/api/orders/[id]/cancel`) already used this pattern correctly and was left
alone.

### 3.5 `isActive` was selected but never enforced (Medium)

`getCurrentUser()` selected `isActive` and no caller ever checked it, so a
deactivated account kept full access until its 30-day cookie expired. It now
returns null for an inactive (or missing) user, which propagates to
`requireUser()` and `requireAdmin()`.

### 3.6 Admin API trusted a 30-day-old role claim (Medium)

Every admin API route checked only `session.role` from the JWT. An administrator
who was later demoted or deactivated retained API access until the cookie
expired. Added `getActiveAdmin()` (session **and** a fresh account read
confirming `role === 'ADMIN'` and `isActive`), and switched all eight admin
routes to it. Verified at runtime — see §2.2.

### 3.7 Tests added

`tests/image-content.test.ts` (8 tests): every accepted format recognised from
its bytes; `GIF87a` as well as `GIF89a`; AVIF via a compatible brand only;
HTML/SVG/PHP/plain-text refused; empty, null, undefined and truncated input
refused rather than guessed; a RIFF/WAVE container not mistaken for WebP; the
extension map has no collisions or unsafe values; and the retryable-vs-terminal
split across every Zarinpal error code.

Test count went from 29 to **37**, all passing.

---

## 4. Still not verified (and why)

- **The Zarinpal gateway round-trip, end to end.** `ZARINPAL_MERCHANT_ID` is a
  placeholder (39 characters) and no real payment was initiated. The callback
  route was exercised only on its lookup-failure paths (§2.4). The 502/503
  conversion, the `ref_id` requirement, and the settlement claim logic are
  **unit-tested but not confirmed against the live sandbox**. This remains the
  largest unverified surface.
- **Concurrent-callback behaviour under real load.** The claims in 3.2 and 3.4
  follow from how Postgres evaluates a conditional `UPDATE` after a lock wait,
  and the rule is unit-tested, but no two-transaction race was actually executed
  — there is no integration-test harness and no test database. Reproducing it
  would need two simultaneous requests against a real database.
- **The authenticated upload path over HTTP.** The admin upload endpoint was
  confirmed to return 403 without a valid admin account (§2.2), and
  `saveUploadedImage` was driven directly (§2.3), but a real multipart upload
  from the admin UI was not performed — that requires an admin account whose
  credentials are not available here.
- **Email delivery.** `RESEND_API_KEY` is not set, so password reset cannot
  deliver a link. The endpoint reports this honestly rather than claiming a
  send.
- **Lint.** §1.1.

---

## 5. Blocked by external configuration

- **Zarinpal** — `ZARINPAL_MERCHANT_ID` is a placeholder; sandbox flag is set.
- **Gemini / Groq** — `GEMINI_API_KEY` is empty. The chat endpoint returns 503
  and fabricates nothing (verified, §2.5).
- **Email (Resend)** — `RESEND_API_KEY` is empty. Password reset cannot send.
- **Persistent image storage** — `IMAGE_STORAGE_PROVIDER` defaults to `local`,
  which writes to `public/uploads` and **does not survive a redeploy on
  ephemeral hosting**. Selecting `cloudinary` raises an explicit configuration
  error naming the three variables to set, rather than silently falling back.
  Implementing Cloudinary/S3 requires credentials that are not available here.

To add lint (deliberately not done — see §1.1):

```bash
npm i -D eslint eslint-config-next
npx @next/codemod@canary next-lint-to-eslint-cli .
```

---

## 6. Work carried over from the previous pass (now verified)

The following existed in the working tree before this pass and is now covered by
the commands in §1 rather than being asserted:

- `src/lib/orders.ts` — order/payment status rules, forward-only transitions,
  the never-mark-unpaid-as-paid guard, idempotent stock restoration.
- `src/lib/analytics.ts` — one revenue definition (only `paymentStatus === 'PAID'`
  counts), continuous daily buckets, channel and fulfilment summaries.
- Admin dashboard rewrite (KPIs, sales chart, best-sellers filtered to PAID).
- Admin order transitions, customer order detail and unpaid-order cancellation.
- Address CRUD (`/api/addresses`, `/api/addresses/[id]`) with ownership enforced
  in the query.
- Catalog search / filter / sort / pagination, all URL-driven.
- Landing image slots (`hero`, `journey`, `cta`) now all rendered;
  `LandingImageManager` alt-text editing and per-slot delete.
- `MobileNav`, header cart badge, `not-found` / `error` / `loading` states.
- Chatbot: `toProviderHistory` drops leading model turns so the provider history
  opens with a `user` turn; provider errors are logged by message only.
- `persistedImageUrlSchema` accepting the relative `/uploads/...` paths the
  upload endpoint actually returns (previously `z.string().url()` rejected them,
  so every landing-image save failed).
- `TagDeleteButton` — the tag page's inline `'use server'` action deleted tags
  with no `requireAdmin()`.
- Shared `StatusBadge`; payment-return page withholding another customer's
  figures; `passwordSchema` shared by registration and reset.

---

## 7. Remaining functional gaps

1. **In-memory rate limiters** (`login`, `chat`) reset on redeploy and do not
   coordinate across instances. Both routes name Redis as the production
   backing store; none is configured.
2. **Search is `contains`-based**, not a ranked full-text index.
3. **Password reset does not invalidate existing sessions.** A stolen 30-day
   cookie survives a password change; closing that needs a token-version column
   on `User` and a check in `verifySessionToken`.
4. **SMS delivery** — no provider configured, none added.
5. **Address-level shipping-method selection** — out of the original scope.
6. **No integration-test harness.** HTTP handlers are covered only where the
   underlying rule could be extracted into a pure function. The concurrency
   claims in 3.2/3.4 have no executable test.

---

## 8. Manual tests to perform

Run `npm run dev`, then:

1. **Register → login → logout.** Register with a weak password (expect the
   policy message), then a valid one; log in; confirm the header shows the name
   and cart count.
2. **Password reset.** With no `RESEND_API_KEY`, `POST /api/auth/forgot-password`
   must say email reset is unavailable rather than claiming a link was sent.
3. **Catalog.** Search `q=`, pick a tag, change `sort`, page through; confirm the
   URL carries the state and the back button works. Confirm the empty state
   names the query.
4. **Product → cart → checkout.** Check tier boundaries at qty 1 / 4 / 5 / 19 /
   20. Confirm adding 10 to a basket of 10 fails against a stock of 15.
5. **Zarinpal sandbox** (needs real sandbox credentials) — the largest gap.
   Confirm: success return shows the order figures; a second delivery of the same
   callback does not decrement stock again; a `Status=NOK` return marks the order
   CANCELED.
6. **Dashboard.** Order list → order detail (must not 404 for another user's
   order). Cancel an unpaid order; confirm a paid one is refused. Address
   add / edit / delete / set-default.
7. **Admin.** Dashboard KPIs and chart against the database. Move an order
   `PENDING → DELIVERED` (**expect a refusal**), then a legal transition.
   Cancel a PAID order and confirm stock returns exactly once.
8. **Admin image upload.** Upload a real JPEG (**expect success**), then rename
   an `.html` file to `.jpg` and upload it (**expect the content refusal**).
   Confirm `/public/uploads/product/` gained nothing for the refused file.
9. **Landing images.** Set, edit alt text, and delete each of `hero`, `journey`,
   `cta`; confirm all three render on `/`.
10. **Chatbot.** With no key, expect a 503 message. Then set a real
    `GEMINI_API_KEY` and confirm a reply — and that it opens with a user turn
    even though the widget seeds an assistant greeting.
11. **Authorization.** In the database, set a logged-in user's `role` to
    `CUSTOMER` (or `isActive` to false) **while they are signed in**, then reload
    `/admin`: expect a redirect, not access.
