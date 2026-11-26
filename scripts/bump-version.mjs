// Cache-busting for GitHub Pages (max-age=600): stamp every browser-side relative import and the
// index.html links with ?v=<n>, so a deploy never mixes a new app.js with a stale cached module.
// Usage: node scripts/bump-version.mjs 5
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const v = process.argv[2];
if (!/^\d+$/.test(v ?? '')) { console.error('usage: node scripts/bump-version.mjs <number>'); process.exit(1); }

const IMPORT = /^(import [^\n]*? from '\.{1,2}\/[^'?]+\.js)(?:\?v=\d+)?';/gm;
for (const f of ['src/app.js', 'src/views/harvest.js', 'src/views/archive-io.js']) {
  const p = join(root, f);
  const out = readFileSync(p, 'utf8').replace(IMPORT, `$1?v=${v}';`);
  writeFileSync(p, out);
  console.log(f, (out.match(/\?v=\d+'/g) ?? []).length, 'imports');
}
const html = join(root, 'index.html');
const page = readFileSync(html, 'utf8').replace(/(\.\/src\/[\w-]+\.(?:css|js))(?:\?v=\d+)?"/g, `$1?v=${v}"`);
writeFileSync(html, page);
console.log('index.html', (page.match(/\?v=\d+"/g) ?? []).length, 'links');
