import { createInterface } from 'node:readline/promises';
import PocketBase from 'pocketbase';

function slugify(text) {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

async function main() {
  const pbUrl = process.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be configured in .env.local');
    process.exit(1);
  }

  let rl;

  try {
    console.log('Connecting to PocketBase…');
    const pb = new PocketBase(pbUrl);
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('✓ Authenticated.\n');

    rl = createInterface({ input: process.stdin, output: process.stdout });

    // Fetch languages
    const languages = await pb.collection('languages').getFullList();
    const defaultLang = languages.find((l) => l.is_default);
    if (!defaultLang) {
      console.error('Error: No default language found in PocketBase.');
      rl.close();
      process.exit(1);
    }

    if (languages.length === 0) {
      console.error('Error: No languages found in PocketBase.');
      rl.close();
      process.exit(1);
    }

    let selectedLang;
    if (languages.length === 1) {
      selectedLang = languages[0];
    } else {
      console.log('Select a language:');
      for (let i = 0; i < languages.length; i++) {
        const marker = languages[i].is_default ? ' (default)' : '';
        console.log(`  ${i + 1}. ${languages[i].code} – ${languages[i].name}${marker}`);
      }
      while (true) {
        const input = await rl.question('> ');
        const choice = parseInt(input.trim(), 10);
        if (!isNaN(choice) && choice >= 1 && choice <= languages.length) {
          selectedLang = languages[choice - 1];
          break;
        }
        console.log(`Invalid choice. Please select a number between 1 and ${languages.length}.`);
      }
      console.log(); // print empty line
    }

    console.log(`Target language: ${selectedLang.code} – ${selectedLang.name}`);

    // Fetch categories sorted by int_ref
    const categories = await pb.collection('categories').getFullList();
    categories.sort((a, b) =>
      String(a.int_ref ?? '').localeCompare(String(b.int_ref ?? ''))
    );
    console.log(`Found ${categories.length} categories. Starting…\n`);

    const defaultI18ns = await pb.collection('categories_i18n').getFullList({
      filter: `language = "${defaultLang.id}"`
    });
    const defaultI18nMap = new Map();
    for (const item of defaultI18ns) {
      defaultI18nMap.set(item.record, item);
    }

    // If editing the default language itself, reuse the same map; otherwise fetch separately
    let targetI18nMap;
    if (selectedLang.id === defaultLang.id) {
      targetI18nMap = defaultI18nMap;
    } else {
      const targetI18ns = await pb.collection('categories_i18n').getFullList({
        filter: `language = "${selectedLang.id}"`
      });
      targetI18nMap = new Map();
      for (const item of targetI18ns) {
        targetI18nMap.set(item.record, item);
      }
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const defaultI18n = defaultI18nMap.get(category.id);
      const displayLabel = defaultI18n ? defaultI18n.name : category.id;

      const ref = category.int_ref ? `#${category.int_ref} – ` : '';
      console.log('──────────────────────────────────────');
      console.log(`Category ${i + 1}/${categories.length}: ${ref}${displayLabel}`);
      console.log('──────────────────────────────────────');

      const existingRecord = targetI18nMap.get(category.id);

      // 1. Name prompt
      let namePrompt = '  name         ';
      if (existingRecord && existingRecord.name) {
        namePrompt += `[${existingRecord.name}]: `;
      } else {
        namePrompt += ': ';
      }
      const inputName = await rl.question(namePrompt);
      let name = inputName.trim();
      if (!name) {
        if (existingRecord && existingRecord.name) {
          name = existingRecord.name;
        } else {
          console.log('\n⚠ Skipped (no name provided).\n');
          skippedCount++;
          continue;
        }
      }

      // 2. Description prompt
      let descPrompt = '  description  ';
      if (existingRecord && existingRecord.description) {
        descPrompt += `[${existingRecord.description}]: `;
      } else {
        descPrompt += '(empty): ';
      }
      const inputDesc = await rl.question(descPrompt);
      let description = inputDesc.trim();
      if (inputDesc === '') {
        if (existingRecord && existingRecord.description !== undefined) {
          description = existingRecord.description;
        } else {
          description = '';
        }
      }

      // 3. Slug prompt
      const autoSlug = slugify(name);
      const slugPrompt = `  slug         (auto from name, press Enter to accept: ${autoSlug}): `;
      const inputSlug = await rl.question(slugPrompt);
      let slug = inputSlug.trim();
      if (!slug) {
        slug = autoSlug;
      } else {
        slug = slugify(slug);
      }

      // Save payload
      const data = {
        name,
        slug,
        description,
        record: category.id,
        language: selectedLang.id
      };

      try {
        if (existingRecord) {
          await pb.collection('categories_i18n').update(existingRecord.id, data);
        } else {
          await pb.collection('categories_i18n').create(data);
        }
        console.log('\n✓ Saved.\n');
        savedCount++;
      } catch (err) {
        console.error(`\n✗ Error saving category: ${err.message}\n`);
        skippedCount++;
      }
    }

    console.log(`✓ Done. ${savedCount} saved, ${skippedCount} skipped.`);
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  } finally {
    if (rl) rl.close();
  }
}

main();
