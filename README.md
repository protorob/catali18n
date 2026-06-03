# Catali18n

A lightweight, internationalized (i18n) B2B product catalog built with **Astro 6** and **PocketBase**. Instead of a traditional checkout, it drives a **request-a-quotation** flow — customers browse localized products and submit an inquiry form that is stored in PocketBase.

---

## Tech Stack

- **Frontend:** [Astro 6](https://astro.build/) — SSR mode via `@astrojs/node` standalone adapter
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) — Vite plugin integration, CSS variable-based theming
- **Backend / DB:** [PocketBase](https://pocketbase.io/) — single-file Go database with built-in REST API

---

## Features

- Multi-language localization via `[locale]/` routing — languages driven by PocketBase `languages` collection
- Navbar language switcher dropdown showing all active languages with full names; category pages pass localized slugs per language to avoid broken redirects when slugs differ across locales
- Single dark / light theme toggle with no flash of unstyled content (theme applied inline before first paint)
- Glassmorphism sticky navbar with responsive mobile drawer
- Full-width page banners sitewide: homepage hero (custom gradient + CTA), category pages (cat_banner photo + readable overlay), and static pages (standard gradient banner from page frontmatter)
- Product detail page with Swiper image carousel (hover arrows, drag/swipe, thumbnail strip) and a custom lightbox (keyboard nav, drag/swipe, close on overlay click)
- Slide-in sidecart drawer with live item counter
- Quotation cart page with contact form submitted to PocketBase
- Localized Markdown static pages (About, Terms, Contact, Catalog Download)
- Graceful offline/dev fallback — all data-fetching pages render rich mock data when PocketBase is unreachable
- CLI scripts for catalog content management: interactive manual entry, interactive DeepL-assisted translation, and fully automated batch translation

---

## Getting Started

### 1. Download and launch PocketBase

The `pocketbase` binary is excluded from git. Download it for your OS from [pocketbase.io/docs](https://pocketbase.io/docs/) and place it in the project root, then start it:

```bash
./pocketbase serve
```

The admin UI will be available at `http://127.0.0.1:8090/_/`.

### 2. Import the collection schema

The database schema is version-controlled as `pb_schema.json` in the project root.

1. Open the admin UI and create your initial admin account.
2. Go to **Settings → Sync → Import collections**.
3. Click **Load from JSON file**, select `pb_schema.json`, and confirm.

Collections loaded: `languages`, `categories`, `categories_i18n`, `products`, `products_i18n`, `quotations`.

### 3. Add locales

In the admin UI, open the `languages` collection and add:

| code | name     | is_default |
|------|----------|------------|
| `it` | Italiano | `true`     |
| `en` | English  | `false`    |

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:4321` and auto-redirects to `/it`.

### Environment variables

Create a `.env.local` for configuration (already gitignored):

```
# PocketBase
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Required only for the translation script
PB_ADMIN_EMAIL=your@admin.email
PB_ADMIN_PASSWORD=yourpassword
DEEPL_API_KEY=your-deepl-key
```

---

## Project Structure

```
scripts/
├── categories-i18n.mjs   # Interactive CLI — manually enter category translations
├── translate-categories.mjs # Interactive CLI — DeepL-assisted category translation with review step
└── translate.mjs         # Batch CLI — auto-translates all catalog content via DeepL
src/
├── content/
│   └── pages/
│       ├── en/          # Markdown static pages in English
│       └── it/          # Markdown static pages in Italian
├── layouts/
│   └── Layout.astro     # Shared shell: navbar, sidecart drawer, footer, theme scripts
│                        #   Props: pageTitle/pageDescription (generic banner), localePaths (switcher overrides)
│                        #   Slots: hero (full-bleed, before main), default (inside max-w-7xl container)
├── lib/
│   ├── pocketbase.ts    # PocketBase client singleton
│   └── translations.ts  # UI string dictionary (it / en)
├── pages/
│   ├── index.astro               # Root redirect → /it
│   └── [locale]/
│       ├── index.astro           # Homepage: hero + categories + featured products
│       ├── [slug].astro          # Generic Markdown pages (about, contact, terms…)
│       ├── cart.astro            # Quotation cart + contact form
│       ├── category/[slug].astro # Category product listing
│       └── product/[slug].astro  # Product detail + add-to-quote CTA
└── styles/
    └── global.css       # Tailwind import + CSS variable theme tokens
content.config.ts         # Astro Content Collections config (pages glob loader)
pb_schema.json            # PocketBase collection schemas (version-controlled)
astro.config.mjs          # Astro + Vite configuration
```

---

## PocketBase Schema Overview

| Collection        | Purpose                                                        |
|-------------------|----------------------------------------------------------------|
| `languages`       | Supported locales (`code`, `name`, `is_default`)               |
| `categories`      | Base category record (`int_ref` label, banner image)           |
| `categories_i18n` | Localized category name, slug, description                     |
| `products`        | Base product record (`product_sku`, `product_ean`, `category`) |
| `products_i18n`   | Localized product name, slug, description                      |
| `quotations`      | Submitted quote requests (contact details + items JSON)        |

### Static pages

`about`, `contact`, `terms`, and `catalog-download` are Markdown files under `src/content/pages/<locale>/<slug>.md`. Translations are written by hand — one file per locale per page. To add a new language, create a new folder (e.g. `src/content/pages/de/`) and translate each `.md` file manually. There is no script for this. Missing locale/slug combinations redirect to the localized homepage.

---

## Known Gotcha — PocketBase Binary vs npm Package

The `pocketbase` server binary in the project root shares its name with the `pocketbase` npm package. When Vite's dependency optimizer scans source files and finds `import('pocketbase')`, it can resolve to the binary instead of the npm package and crash with an `Unexpected "\x7f"` (ELF magic byte) error — taking down the entire dev server and corrupting responses for all other modules.

Three mitigations are applied together in `astro.config.mjs` and `cart.astro`:

```js
// astro.config.mjs
vite: {
  optimizeDeps: {
    exclude: ['pocketbase'],           // don't pre-bundle the npm package
    include: ['swiper', 'swiper/modules'], // pre-bundle Swiper at startup to prevent
                                       // a lazy re-scan that triggers the collision
  },
  resolve: { alias: { pocketbase: path.resolve('./node_modules/pocketbase') } },
}
```

```js
// cart.astro — the dynamic import that triggers the scanner
const PocketBase = (await import(/* @vite-ignore */ 'pocketbase')).default;
```

`/* @vite-ignore */` tells Vite's static scanner to skip this import entirely, preventing the binary lookup at scan time. If the error reappears after clearing Vite cache (`.astro/`), verify all three mitigations are present.

---

## Scripts

| Command                                      | Description                                                    |
|----------------------------------------------|----------------------------------------------------------------|
| `npm run dev`                                | Start Astro dev server                                         |
| `npm run build`                              | Production build to `dist/`                                    |
| `npm run preview`                            | Preview the production build                                   |
| `npm run translations:categories`            | Interactive CLI — manually enter category translations         |
| `npm run translate:categories`               | Interactive CLI — DeepL suggests, you review each field        |
| `npm run translate:categories -- --force`    | Re-translate categories that already have a record             |
| `npm run translate`                          | Batch-translate all missing catalog content via DeepL          |
| `npm run translate -- --force`               | Re-translate and overwrite all existing translations           |
| `npm run translate -- --lang en`             | Batch-translate to a single target language only               |
| `npm run translate -- --dry-run`             | Preview what would be translated without writing               |

### Content management workflow

The typical workflow for adding or updating catalog translations:

1. **Create the default-language records first** using `translations:categories` (manual entry for the source language).
2. **Translate to other languages** using either:
   - `translate:categories` — interactive, DeepL proposes each field and you press Enter to accept or type a correction. Best when quality matters or content is non-standard.
   - `translate` — fully automated batch translation. Best for large volumes once you trust the output.

### `scripts/categories-i18n.mjs` — manual entry

Connects to PocketBase, lets you select any language (including the default), and walks you through each category prompting for `name`, `description`, and `slug`. Categories are ordered alphabetically by their `int_ref` label.

- Existing values are shown in brackets — press Enter to keep them
- Slug is auto-generated from the name; press Enter to accept or type a custom one
- Skips a category if no name is entered and none exists yet
- Requires `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` in `.env.local`

### `scripts/translate-categories.mjs` — assisted translation

Same flow as manual entry but DeepL proposes the translation for each field before you confirm.

- Select a non-default target language from the list
- For each category: shows `source` value and `proposed` translation; press Enter to accept or type a replacement
- Slug is derived from the accepted name
- Skips already-translated records by default; use `--force` to re-translate
- Requires `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, and `DEEPL_API_KEY` in `.env.local`

### `scripts/translate.mjs` — batch translation

Fully automated. Reads all `categories_i18n` and `products_i18n` records in the default language and creates or updates matching records for every other language without any prompts.

- Text fields (`name`, `prod_name`) are translated as plain text
- Rich fields (`description`, `prod_description`) are translated with `tagHandling: 'html'` to preserve markup
- `slug` is auto-generated from the translated `name` via slugify — never sent to DeepL
- Requires `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, and `DEEPL_API_KEY` in `.env.local`
- The DeepL free tier is supported automatically (key suffix `:fx` routes to the free endpoint)
