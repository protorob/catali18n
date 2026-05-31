import * as deepl from 'deepl-node';
import PocketBase from 'pocketbase';
import { parseArgs } from 'node:util';

// 1. Parse CLI arguments
const { values } = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    lang: { type: 'string' },
  },
});

const force = values.force;
const dryRun = values['dry-run'];
const targetLangCode = values.lang;

// 2. DeepL target mapping configuration
const DEEPL_TARGET_MAP = {
  en: 'EN-US',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  pt: 'PT-PT',
  nl: 'NL',
  pl: 'PL',
  it: 'IT',
  ja: 'JA',
  zh: 'ZH-HANS',
};

function toDeeplTarget(code) {
  return DEEPL_TARGET_MAP[code.toLowerCase()] ?? code.toUpperCase();
}

function toDeeplSource(code) {
  return code.split('-')[0].toUpperCase();
}

// 3. Slug generation helper
// For plain-text fields: decode all entities including &amp;
function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// For HTML fields: only decode numeric and quote entities; leave &amp; &lt; &gt; as-is
function decodeHtmlEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  const pbUrl = process.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;
  const deeplApiKey = process.env.DEEPL_API_KEY;

  if (!email || !password) {
    console.error('Error: PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be configured in .env.local');
    process.exit(1);
  }

  if (!deeplApiKey || deeplApiKey === 'your-deepl-key') {
    console.error('Error: DEEPL_API_KEY must be configured in .env.local');
    process.exit(1);
  }

  console.log(`Connecting to PocketBase at: ${pbUrl}`);
  const pb = new PocketBase(pbUrl);

  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('✓ Successfully authenticated with PocketBase.');
  } catch (err) {
    console.error('Error: PocketBase authentication failed. Check credentials in .env.local', err.message);
    process.exit(1);
  }

  let translator;
  try {
    translator = new deepl.Translator(deeplApiKey);
    console.log('✓ Successfully initialized DeepL translator.');
  } catch (err) {
    console.error('Error: DeepL client initialization failed. Check your API key.', err.message);
    process.exit(1);
  }

  // 4. Fetch languages
  let languages = [];
  try {
    languages = await pb.collection('languages').getFullList();
  } catch (err) {
    console.error('Error: Failed to fetch languages collection from PocketBase.', err.message);
    process.exit(1);
  }

  const defaultLang = languages.find((l) => l.is_default);
  if (!defaultLang) {
    console.error('Error: No default language found in PocketBase.');
    process.exit(1);
  }

  let targetLanguages = languages.filter((l) => !l.is_default);
  if (targetLangCode) {
    targetLanguages = targetLanguages.filter(
      (l) => l.code.toLowerCase() === targetLangCode.toLowerCase()
    );
    if (targetLanguages.length === 0) {
      console.error(`Error: Selected target language code "${targetLangCode}" not found or is default.`);
      process.exit(1);
    }
  }

  console.log(
    `Languages Configuration:\n  Source = ${defaultLang.code}\n  Targets = [${targetLanguages
      .map((l) => l.code)
      .join(', ')}]`
  );

  // 5. Fetch all source category entries
  let sourceCategories = [];
  try {
    sourceCategories = await pb.collection('categories_i18n').getFullList({
      filter: `language="${defaultLang.id}"`,
      expand: 'record',
    });
  } catch (err) {
    console.error('Error: Failed to fetch categories_i18n collection.', err.message);
    process.exit(1);
  }
  console.log(`Fetched ${sourceCategories.length} source categories (locale: ${defaultLang.code}).`);

  // 6. Fetch all source product entries
  let sourceProducts = [];
  try {
    sourceProducts = await pb.collection('products_i18n').getFullList({
      filter: `language="${defaultLang.id}"`,
      expand: 'record',
    });
  } catch (err) {
    console.error('Error: Failed to fetch products_i18n collection.', err.message);
    process.exit(1);
  }
  console.log(`Fetched ${sourceProducts.length} source products (locale: ${defaultLang.code}).`);

  // -------------------------------------------------------------
  // Translate Categories
  // -------------------------------------------------------------
  console.log('\n--- Translating Categories ---');
  for (const targetLang of targetLanguages) {
    const categoriesToWrite = [];
    const generatedSlugs = new Set();

    for (const src of sourceCategories) {
      let existing = null;
      try {
        existing = await pb
          .collection('categories_i18n')
          .getFirstListItem(`record="${src.expand.record.id}" && language="${targetLang.id}"`);
      } catch {
        existing = null;
      }

      if (existing && !force) {
        console.log(`Skipping category "${src.name}" for target ${targetLang.code} (already exists).`);
        continue;
      }
      categoriesToWrite.push({ src, existing });
    }

    if (categoriesToWrite.length > 0) {
      const names = categoriesToWrite.map((c) => c.src.name);
      const descriptions = categoriesToWrite.map((c) => c.src.description);

      console.log(`Translating ${categoriesToWrite.length} categories to ${targetLang.code}...`);

      let translatedNames = [];
      let translatedDescriptions = [];

      try {
        if (dryRun) {
          translatedNames = names.map((n) => `[DRY-RUN] ${n}`);
          translatedDescriptions = descriptions.map((d) => `[DRY-RUN] ${d}`);
        } else {
          const namesResult = await translator.translateText(
            names,
            toDeeplSource(defaultLang.code),
            toDeeplTarget(targetLang.code)
          );
          translatedNames = namesResult.map((r) => decodeEntities(r.text));

          const descResult = await translator.translateText(
            descriptions,
            toDeeplSource(defaultLang.code),
            toDeeplTarget(targetLang.code),
            { tagHandling: 'html' }
          );
          translatedDescriptions = descResult.map((r) => decodeHtmlEntities(r.text));
        }
      } catch (err) {
        console.error(`Error: Translation failed for categories in target ${targetLang.code}`, err.message);
        continue;
      }

      for (let i = 0; i < categoriesToWrite.length; i++) {
        const { src, existing } = categoriesToWrite[i];
        const translatedName = translatedNames[i];
        const translatedDesc = translatedDescriptions[i];
        const generatedSlug = slugify(translatedName);

        if (generatedSlugs.has(generatedSlug)) {
          console.warn(
            `[WARNING] Duplicate slug detected: "${generatedSlug}" for category in target language ${targetLang.code}`
          );
        }
        generatedSlugs.add(generatedSlug);

        if (dryRun) {
          console.log(
            `[DRY-RUN] Would ${
              existing ? 'update' : 'create'
            } category "${src.name}" -> "${translatedName}" (${targetLang.code}) slug: ${generatedSlug}`
          );
        } else {
          const payload = {
            record: src.expand.record.id,
            language: targetLang.id,
            name: translatedName,
            description: translatedDesc,
            slug: generatedSlug,
          };

          try {
            if (existing) {
              await pb.collection('categories_i18n').update(existing.id, payload);
              console.log(`✓ Updated category "${src.name}" → "${translatedName}" [${targetLang.code}]`);
            } else {
              await pb.collection('categories_i18n').create(payload);
              console.log(`✓ Created category "${src.name}" → "${translatedName}" [${targetLang.code}]`);
            }
          } catch (err) {
            console.error(`Error: Failed to write category "${src.name}" [${targetLang.code}]`, err.message);
          }
        }
      }
    } else {
      console.log(`No categories require translation for target ${targetLang.code}.`);
    }
  }

  // -------------------------------------------------------------
  // Translate Products
  // -------------------------------------------------------------
  console.log('\n--- Translating Products ---');
  for (const targetLang of targetLanguages) {
    const productsToWrite = [];
    const generatedSlugs = new Set();

    for (const src of sourceProducts) {
      let existing = null;
      try {
        existing = await pb
          .collection('products_i18n')
          .getFirstListItem(`record="${src.expand.record.id}" && language="${targetLang.id}"`);
      } catch {
        existing = null;
      }

      if (existing && !force) {
        console.log(`Skipping product "${src.name}" for target ${targetLang.code} (already exists).`);
        continue;
      }
      productsToWrite.push({ src, existing });
    }

    if (productsToWrite.length > 0) {
      const names = productsToWrite.map((p) => p.src.name);
      const titles = productsToWrite.map((p) => p.src.prod_title);
      const descriptions = productsToWrite.map((p) => p.src.prod_description);

      console.log(`Translating ${productsToWrite.length} products to ${targetLang.code}...`);

      let translatedNames = [];
      let translatedTitles = [];
      let translatedDescriptions = [];

      try {
        if (dryRun) {
          translatedNames = names.map((n) => `[DRY-RUN] ${n}`);
          translatedTitles = titles.map((t) => `[DRY-RUN] ${t}`);
          translatedDescriptions = descriptions.map((d) => `[DRY-RUN] ${d}`);
        } else {
          const namesResult = await translator.translateText(
            names,
            toDeeplSource(defaultLang.code),
            toDeeplTarget(targetLang.code)
          );
          translatedNames = namesResult.map((r) => decodeEntities(r.text));

          const titlesResult = await translator.translateText(
            titles,
            toDeeplSource(defaultLang.code),
            toDeeplTarget(targetLang.code)
          );
          translatedTitles = titlesResult.map((r) => decodeEntities(r.text));

          const descResult = await translator.translateText(
            descriptions,
            toDeeplSource(defaultLang.code),
            toDeeplTarget(targetLang.code),
            { tagHandling: 'html' }
          );
          translatedDescriptions = descResult.map((r) => decodeHtmlEntities(r.text));
        }
      } catch (err) {
        console.error(`Error: Translation failed for products in target ${targetLang.code}`, err.message);
        continue;
      }

      for (let i = 0; i < productsToWrite.length; i++) {
        const { src, existing } = productsToWrite[i];
        const translatedName = translatedNames[i];
        const translatedTitle = translatedTitles[i];
        const translatedDesc = translatedDescriptions[i];
        const generatedSlug = slugify(translatedName);

        if (generatedSlugs.has(generatedSlug)) {
          console.warn(
            `[WARNING] Duplicate slug detected: "${generatedSlug}" for product in target language ${targetLang.code}`
          );
        }
        generatedSlugs.add(generatedSlug);

        if (dryRun) {
          console.log(
            `[DRY-RUN] Would ${
              existing ? 'update' : 'create'
            } product "${src.name}" -> "${translatedName}" (${targetLang.code}) slug: ${generatedSlug}`
          );
        } else {
          const payload = {
            record: src.expand.record.id,
            language: targetLang.id,
            name: translatedName,
            prod_title: translatedTitle,
            prod_description: translatedDesc,
            slug: generatedSlug,
          };

          try {
            if (existing) {
              await pb.collection('products_i18n').update(existing.id, payload);
              console.log(`✓ Updated product "${src.name}" → "${translatedName}" [${targetLang.code}]`);
            } else {
              await pb.collection('products_i18n').create(payload);
              console.log(`✓ Created product "${src.name}" → "${translatedName}" [${targetLang.code}]`);
            }
          } catch (err) {
            console.error(`Error: Failed to write product "${src.name}" [${targetLang.code}]`, err.message);
          }
        }
      }
    } else {
      console.log(`No products require translation for target ${targetLang.code}.`);
    }
  }

  console.log('\n✓ Translation process complete.');
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err.message);
  process.exit(1);
});
