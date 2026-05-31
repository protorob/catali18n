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

Supported locales are driven by the `languages` PocketBase collection — not hardcoded. `it` is the default (`is_default: true`). Add new locales in PocketBase and run the translation script; the navbar switcher picks them up automatically.

### Translation system

UI strings are in `src/lib/translations.ts` — a plain typed object with `it` and `en` keys. Import `getTranslations(locale)` and use the returned `t` object in templates. Do not hardcode locale-specific strings directly in `.astro` files; add them to `translations.ts` instead.

Known technical debt: several places in `Layout.astro` and `cart.astro` still use inline ternaries (`locale === 'it' ? '...' : '...'`) that bypass this system.

### Data layer

`src/lib/pocketbase.ts` exports a single `pb` client instance pointing to `PUBLIC_POCKETBASE_URL` (defaults to `http://127.0.0.1:8090`).

Every page that fetches data wraps the PocketBase calls in a `try/catch` and falls back to a hardcoded mock data array. The mock data uses the same shape as real PocketBase records (including `expand` relations) so the template code is shared.

PocketBase collection → schema mapping:

```
languages          code, name, is_default
categories         int_ref (internal label, unique), cat_banner (image file)
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

### Language switcher

`Layout.astro` fetches the full `languages` list from PocketBase in the frontmatter and builds a dropdown. Each entry shows `code – name` (e.g. `en – English`). The trigger button shows only the current locale code plus a globe icon. Falls back to `[{code:'it',...},{code:'en',...}]` if PocketBase is unreachable. URL switching uses a generic segment-replace: `/<currentLocale>/...` → `/<targetLocale>/...`.

### Static Markdown pages

`src/content/pages/[locale]/[slug].md` — frontmatter requires `title`, optional `description`. The glob loader in `content.config.ts` maps them to the `pages` collection. Route: `/[locale]/[slug]` (e.g., `/en/about`).

Translations are **fully manual** — one Markdown file per locale per page. Current pages: `about`, `contact`, `terms`, `catalog-download`. To add a new language, create a new folder (e.g. `src/content/pages/de/`) and write translated `.md` files by hand. There is no script for this. If a locale/slug combination is missing, `[slug].astro` redirects to the localized homepage.

---

## Content management scripts

There are three CLI scripts for managing `categories_i18n` records. All read credentials from `.env.local` and authenticate via `pb.collection('_superusers').authWithPassword()`.

Categories are identified by their `int_ref` field (a short internal label like `ELEC`), which is used for display only. Scripts sort categories alphabetically by `int_ref`.

### `scripts/categories-i18n.mjs` (`npm run translations:categories`)

Interactive manual entry. Selects any language (including the default), then steps through each category prompting for `name`, `description`, and `slug`. Existing values pre-fill the prompts. Creates or updates records in `categories_i18n`.

**Env vars required:** `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`

### `scripts/translate-categories.mjs` (`npm run translate:categories`)

Interactive DeepL-assisted translation. Targets only non-default languages. For each category it calls DeepL, shows the proposed translation field by field, and lets the user press Enter to accept or type a correction. Skips already-translated records unless `--force` is passed.

**Env vars required:** `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, `DEEPL_API_KEY`

**CLI flags:** `--force` (re-translate records that already exist).

### `scripts/translate.mjs` (`npm run translate`)

Fully automated batch translation. Reads all `categories_i18n` and `products_i18n` source records (default language) and creates or updates records for every other language without prompts.

**Env vars required:** `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, `DEEPL_API_KEY`

**Field handling:**
- `name`, `prod_title` → plain text translation
- `description`, `prod_description` → `{ tagHandling: 'html' }` to preserve markup
- `slug` → generated via `slugify(translatedName)`, never sent to DeepL

**DeepL language code mapping:** PocketBase uses `en`/`it`/`de` etc.; DeepL target codes differ (`EN-US`, `IT`, `DE`). The `DEEPL_TARGET_MAP` object in each script handles this. Extend it when adding new languages.

**CLI flags:** `--force` (overwrite existing), `--dry-run` (no writes), `--lang <code>` (single target).

**Free tier:** keys ending in `:fx` are auto-routed to `api-free.deepl.com` by the `deepl-node` SDK.

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
