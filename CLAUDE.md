# CLAUDE.md — Project Context for AI Assistants

## What this project is

Catali18n is a B2B product catalog with IT/EN localization. It is **not** an e-commerce store — there are no prices. The "cart" is a quotation request: customers select products and quantities, fill in contact details, and the inquiry is saved in a PocketBase `quotations` collection.

---

## Running locally

```bash
# Terminal 1 — PocketBase backend
./pocketbase serve          # admin UI at http://127.0.0.1:8090/_/

# Terminal 2 — Astro frontend
npm run dev                 # http://localhost:4321 → auto-redirects to /it
```

The app works without PocketBase running — every page catches errors and renders hardcoded mock data so UI development can proceed offline.

---

## Architecture

### Routing

Astro i18n routing is configured in `astro.config.mjs` with `prefixDefaultLocale: true`. All pages live under `src/pages/[locale]/`. The root `src/pages/index.astro` does a server-side redirect to `/it`.

Supported locales: `it` (default), `en`.

### Translation system

UI strings are in `src/lib/translations.ts` — a plain typed object with `it` and `en` keys. Import `getTranslations(locale)` and use the returned `t` object in templates. Do not hardcode locale-specific strings directly in `.astro` files; add them to `translations.ts` instead.

Known technical debt: several places in `Layout.astro` and `cart.astro` still use inline ternaries (`locale === 'it' ? '...' : '...'`) that bypass this system.

### Data layer

`src/lib/pocketbase.ts` exports a single `pb` client instance pointing to `PUBLIC_POCKETBASE_URL` (defaults to `http://127.0.0.1:8090`).

Every page that fetches data wraps the PocketBase calls in a `try/catch` and falls back to a hardcoded mock data array. The mock data uses the same shape as real PocketBase records (including `expand` relations) so the template code is shared.

PocketBase collection → schema mapping:

```
languages          code, name, is_default
categories         cat_banner (image file)
categories_i18n    name, slug, description, record (→ categories), language (→ languages)
products           product_sku, product_ean, category (→ categories), extra_categories[]
products_i18n      name, slug, prod_title, prod_description, record (→ products), language (→ languages)
quotations         name, email, company, company_address, phone, notes, items (JSON)
```

The typical fetch pattern is:
1. Resolve the language ID from `locale` code via `languages` collection.
2. Query `*_i18n` with `language="{langId}"` and expand the base `record` relation.

### Cart

Cart state lives in `localStorage` as a JSON array: `[{ id, name, sku, quantity }]`.

A custom `cart-updated` window event is dispatched on every mutation. `Layout.astro` listens to it to sync the navbar counter badge and re-render the sidecart drawer. `product/[slug].astro` dispatches it on "Add to Quotation". The sidecart auto-opens on `cart-updated` unless the current URL ends with `/cart`.

On the `/[locale]/cart` page, the form submission does a **client-side dynamic import** of PocketBase (`await import('pocketbase')`) to post to the `quotations` collection. The `finally` block always clears the cart and shows the success state, so it degrades gracefully when PocketBase is not running.

### Static Markdown pages

`src/content/pages/[locale]/[slug].md` — frontmatter requires `title`, optional `description`. The glob loader in `content.config.ts` maps them to the `pages` collection. Route: `/[locale]/[slug]` (e.g., `/en/about`).

---

## Critical Vite gotcha

The `pocketbase` server binary in the project root has the same name as the `pocketbase` npm package. When Vite scans for the client-side dynamic `import('pocketbase')` in `cart.astro`, it can resolve to the binary instead of the npm package and crash with:

```
Unexpected "\x7f"   ← ELF magic byte
pocketbase:1:0
```

Fix already applied in `astro.config.mjs`:

```js
vite: {
  optimizeDeps: { exclude: ['pocketbase'] },
  resolve: { alias: { pocketbase: path.resolve('./node_modules/pocketbase') } },
}
```

If you ever clear the Vite cache (`.astro/`) and the error returns, check that both keys are still present.

---

## Known issues / TODOs

- Several strings in `Layout.astro` (sidecart title, empty state) and `cart.astro` (remove button label) are hardcoded IT/EN ternaries instead of using `t` from `translations.ts`.
- Product images are not implemented — product cards show an SVG placeholder. The `categories` collection has a `cat_banner` field wired up for category cards.
- The `quotations` PocketBase collection is used client-side but verify it is present in `pb_schema.json` before deploying.
- `t.product.viewProduct` and `t.product.noProductsInCategory` are referenced in `category/[slug].astro` but may be missing from `translations.ts` — check both locales.
