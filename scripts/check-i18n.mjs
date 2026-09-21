#!/usr/bin/env node
/**
 * Ensures every country/province in countries.ts has a Chinese label in places.zh.ts,
 * and every pack.ts entry has both en + zh.
 * Run: npm run i18n:check
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const { COUNTRIES, COUNTRY_IDS } = await import(
    pathToFileURL(join(root, 'src/game/countries.ts')).href
  );
  const { PLACE_ZH } = await import(pathToFileURL(join(root, 'src/i18n/places.zh.ts')).href);

  const missing = [];
  const seen = new Set();
  for (const c of COUNTRY_IDS) {
    for (const id of [c, ...COUNTRIES[c]]) {
      if (seen.has(id)) continue;
      seen.add(id);
      if (!PLACE_ZH[id]) missing.push(id);
    }
  }

  const packSrc = readFileSync(join(root, 'src/i18n/pack.ts'), 'utf8');
  const badPack = [];
  for (const m of packSrc.matchAll(/'([^']+)':\s*\{\s*en:\s*((?:`[^`]*`|'[^']*'|"[^"]*"))\s*,\s*zh:\s*((?:`[^`]*`|'[^']*'|"[^"]*"))/g)) {
    const [, key, en, zh] = m;
    if (!en || !zh) badPack.push(key);
  }

  if (missing.length) {
    console.error(`[i18n] Missing Chinese for ${missing.length} place(s):`);
    for (const id of missing) console.error(`  - ${id}`);
  }
  if (badPack.length) {
    console.error(`[i18n] Pack entries missing en/zh: ${badPack.join(', ')}`);
  }

  if (missing.length || badPack.length) {
    process.exit(1);
  }
  console.log(`[i18n] OK — ${seen.size} places, pack entries complete.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
