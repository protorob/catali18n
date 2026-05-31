import * as deepl from 'deepl-node';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import PocketBase from 'pocketbase';

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
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const { values: args } = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
  },
});

const rl = createInterface({ input: process.stdin, output: process.stdout });

// Prompts with a proposed value: Enter accepts it, any other input overrides it.
async function promptAcceptOrEdit(label, proposed) {
  console.log(`  ${label}`);
  console.log(`    proposed : ${proposed}`);
  const input = await rl.question(`    accept? [Enter] or type replacement: `);
  return input.trim() || proposed;
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

  console.log(`\nConnecting to PocketBase at ${pbUrl}…`);
  const pb = new PocketBase(pbUrl);
  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('✓ Authenticated.');
  } catch (err) {
    console.error('Authentication failed:', err.message);
    process.exit(1);
  }

  let translator;
  try {
    translator = new deepl.Translator(deeplApiKey);
    console.log('✓ DeepL ready.\n');
  } catch (err) {
    console.error('DeepL init failed:', err.message);
    process.exit(1);
  }

  // Fetch languages
  const languages = await pb.collection('languages').getFullList({ sort: 'name' });
  const defaultLang = languages.find((l) => l.is_default);
  if (!defaultLang) {
    console.error('Error: No default language found in PocketBase.');
    process.exit(1);
  }

  const targetLanguages = languages.filter((l) => !l.is_default);
  if (targetLanguages.length === 0) {
    console.error('Error: No target languages found. Add a non-default language in PocketBase first.');
    process.exit(1);
  }

  // Language selection
  let selectedLang;
  if (targetLanguages.length === 1) {
    selectedLang = targetLanguages[0];
    console.log(`Target language: ${selectedLang.code} – ${selectedLang.name}\n`);
  } else {
    console.log('Select a target language:');
    targetLanguages.forEach((l, i) => console.log(`  ${i + 1}. ${l.code} – ${l.name}`));
    while (true) {
      const raw = await rl.question('> ');
      const n = parseInt(raw.trim(), 10);
      if (n >= 1 && n <= targetLanguages.length) {
        selectedLang = targetLanguages[n - 1];
        break;
      }
      console.log(`Please enter a number between 1 and ${targetLanguages.length}.`);
    }
    console.log(`\nTarget language: ${selectedLang.code} – ${selectedLang.name}\n`);
  }

  // Fetch source (default lang) categories
  const sourceRecords = await pb.collection('categories_i18n').getFullList({
    filter: `language="${defaultLang.id}"`,
    expand: 'record',
  });

  if (sourceRecords.length === 0) {
    console.log(`No source categories found for default language (${defaultLang.code}). Run categories-i18n first.`);
    rl.close();
    return;
  }

  // Sort alphabetically by int_ref
  sourceRecords.sort((a, b) =>
    String(a.expand?.record?.int_ref ?? '').localeCompare(String(b.expand?.record?.int_ref ?? ''))
  );

  // Fetch existing target records indexed by category id
  const existingTargetRecords = await pb.collection('categories_i18n').getFullList({
    filter: `language="${selectedLang.id}"`,
  });
  const existingByCategory = new Map(existingTargetRecords.map((r) => [r.record, r]));

  // Filter out already-translated unless --force
  const toProcess = args.force
    ? sourceRecords
    : sourceRecords.filter((src) => !existingByCategory.has(src.expand?.record?.id));

  const skippedCount = sourceRecords.length - toProcess.length;
  if (skippedCount > 0 && !args.force) {
    console.log(`Skipping ${skippedCount} already-translated categories (use --force to re-translate).\n`);
  }

  if (toProcess.length === 0) {
    console.log('Nothing to translate.');
    rl.close();
    return;
  }

  console.log(`Translating ${toProcess.length} categories from ${defaultLang.code} → ${selectedLang.code}…\n`);

  let saved = 0;
  let errored = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const src = toProcess[i];
    const catRecord = src.expand?.record;
    const ref = catRecord?.int_ref ? `${catRecord.int_ref} – ` : '';

    console.log('─'.repeat(52));
    console.log(`Category ${i + 1}/${toProcess.length}: ${ref}${src.name}`);
    console.log('─'.repeat(52));

    // Translate name and description together in one DeepL call each
    let proposedName, proposedDescription;
    try {
      const [nameResult] = await translator.translateText(
        [src.name],
        toDeeplSource(defaultLang.code),
        toDeeplTarget(selectedLang.code)
      );
      proposedName = decodeEntities(nameResult.text);

      if (src.description) {
        const [descResult] = await translator.translateText(
          [src.description],
          toDeeplSource(defaultLang.code),
          toDeeplTarget(selectedLang.code),
          { tagHandling: 'html' }
        );
        proposedDescription = decodeHtmlEntities(descResult.text);
      } else {
        proposedDescription = '';
      }
    } catch (err) {
      console.error(`  ✗ DeepL error: ${err.message}\n`);
      errored++;
      continue;
    }

    // Review name
    console.log(`  source   : ${src.name}`);
    const name = await promptAcceptOrEdit('name', proposedName);

    // Review description (only if there is one)
    let description = '';
    if (src.description) {
      console.log(`  source   : ${src.description}`);
      description = await promptAcceptOrEdit('description', proposedDescription);
    }

    // Slug derived from accepted name
    const autoSlug = slugify(name);
    const slugInput = await rl.question(`  slug     : [Enter to accept: ${autoSlug}] or type custom: `);
    const slug = slugInput.trim() ? slugify(slugInput.trim()) : autoSlug;

    const payload = {
      name,
      slug,
      description,
      record: catRecord.id,
      language: selectedLang.id,
    };

    try {
      const existing = existingByCategory.get(catRecord.id);
      if (existing) {
        await pb.collection('categories_i18n').update(existing.id, payload);
      } else {
        await pb.collection('categories_i18n').create(payload);
      }
      console.log('  ✓ Saved.\n');
      saved++;
    } catch (err) {
      console.error(`  ✗ Save error: ${err.message}\n`);
      errored++;
    }
  }

  console.log('─'.repeat(52));
  console.log(`✓ Done. ${saved} saved, ${errored} errored, ${skippedCount} skipped.`);

  rl.close();
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  rl.close();
  process.exit(1);
});
