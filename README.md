# Catali18n

A lightweight, internationalized (i18n) B2B product catalog built with **Astro 6** and **PocketBase**. Instead of a traditional checkout, it drives a **request-a-quotation** flow — customers browse localized products and submit an inquiry form that is stored in PocketBase.

---

## Tech Stack

- **Frontend:** [Astro 6](https://astro.build/) — SSR mode via `@astrojs/node` standalone adapter
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) — Vite plugin integration, CSS variable-based theming
- **Backend / DB:** [PocketBase](https://pocketbase.io/) — single-file Go database with built-in REST API

---

## Features

- IT / EN localization via `[locale]/` routing and a static `translations.ts` dictionary
- Dark / light theme toggle with no flash of unstyled content (theme applied inline before first paint)
- Glassmorphism sticky navbar with responsive mobile drawer
- Slide-in sidecart drawer with live item counter
- Quotation cart page with contact form submitted to PocketBase
- Localized Markdown static pages (About, Terms, Contact, Catalog Download)
- Graceful offline/dev fallback — all data-fetching pages render rich mock data when PocketBase is unreachable

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

Create a `.env.local` to override the PocketBase URL (optional):

```
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

---

## Project Structure

```
src/
├── content/
│   └── pages/
│       ├── en/          # Markdown static pages in English
│       └── it/          # Markdown static pages in Italian
├── layouts/
│   └── Layout.astro     # Shared shell: navbar, sidecart drawer, footer, theme scripts
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
| `categories`      | Base category record (banner image, etc.)                      |
| `categories_i18n` | Localized category name, slug, description                     |
| `products`        | Base product record (`product_sku`, `product_ean`, `category`) |
| `products_i18n`   | Localized product name, slug, description                      |
| `quotations`      | Submitted quote requests (contact details + items JSON)        |

---

## Known Gotcha — PocketBase Binary vs npm Package

The `pocketbase` server binary in the project root shares its name with the `pocketbase` npm package. Vite's dependency optimizer will attempt to process the binary as JavaScript and crash with an `Unexpected "\x7f"` (ELF magic byte) error.

This is already handled in `astro.config.mjs` via:

```js
vite: {
  optimizeDeps: { exclude: ['pocketbase'] },
  resolve: { alias: { pocketbase: path.resolve('./node_modules/pocketbase') } },
}
```

If the error reappears after clearing Vite cache (`.astro/`), verify these two keys are present.

---

## Scripts

| Command           | Description                  |
|-------------------|------------------------------|
| `npm run dev`     | Start Astro dev server       |
| `npm run build`   | Production build to `dist/`  |
| `npm run preview` | Preview the production build |
