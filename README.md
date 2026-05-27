# Catali18n 🌐📦

A lightweight, high-performance internationalized (i18n) product catalog built using **Astro (v5)** and **PocketBase**.

This project provides a responsive localized frontend powered by Astro and styled with Tailwind CSS v4, backed by a relational localization schema in PocketBase for managing products, categories, and translation records.

---

## 🚀 Tech Stack

*   **Frontend**: [Astro](https://astro.build/) (SSR mode with Node adapter)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Vite plugin integration)
*   **Database & Backend**: [PocketBase](https://pocketbase.io/) (Go-based single-file database)

---

## 🛠️ Getting Started (Recreating the App after Cloning)

Follow these steps to set up the backend database schema and the frontend dev server after cloning the repository.

### 1. Download & Launch PocketBase
If the `pocketbase` binary is not in your cloned repository, download it from [pocketbase.io](https://pocketbase.io/docs/) for your operating system.

Start the database server locally:
```bash
./pocketbase serve
```
*The local database dashboard will be running at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)*

### 2. Import the Collection Schema
Because the local database (`pb_data/`) is ignored by Git, you need to import the collections structure:
1.  Open the Admin UI at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/) and create your initial admin account.
2.  Navigate to **Settings** (gear icon) &rarr; **Sync** &rarr; **Import collections**.
3.  Click **Load from JSON file** and select the [collections.json](collections.json) file located at the root of this project.
4.  Review the collections list and click **Import** to load the entire schema (`languages`, `categories`, `categories_i18n`, `products`, `products_i18n`).

### 3. Add Locales in PocketBase
In the Admin UI, go to the `languages` collection and add records for your locales:
*   **Italian**: `code`: `it`, `name`: `Italiano`, `is_default`: `true`
*   **English**: `code`: `en`, `name`: `English`, `is_default`: `false`

### 4. Install & Launch the Astro Frontend
Install node dependencies and launch the dev server:
```bash
npm install
npm run dev
```
*Your frontend will be running at [http://localhost:4321](http://localhost:4321) (which automatically redirects to `/it` or `/en`).*

---

## 📂 Project Structure

*   `collections.json` — Database collection schemas (importable via Admin panel).
*   `src/content.config.ts` — Astro Content Collections config (new Astro 5 content layer glob loader).
*   `src/content/pages/` — Localized Markdown pages (`about.md`, `terms.md`, `contact.md`, etc.).
*   `src/layouts/Layout.astro` — Layout with responsive mobile menubar, light/dark theme footer switcher, and slide-in sidecart drawer.
*   `src/pages/[locale]/` — Dynamic routes for localized homepages, static markdown content, categories, and products.
