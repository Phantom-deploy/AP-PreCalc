// Lint and build for the static site: node scripts/check.mjs [--build]
// 1. syntax-checks every JavaScript module
// 2. fails on gradients in CSS or HTML, and on em or en dashes in site text
// 3. confirms every relative import and every file referenced by index.html exists
// 4. with --build, copies the deployable site into dist/
import { readFileSync, readdirSync, statSync, existsSync, rmSync, cpSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const problems = [];
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const js = walk(join(root, 'src')).filter((f) => f.endsWith('.js'));
for (const f of js) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (err) {
    problems.push(`syntax error in ${f}: ${err.stderr}`);
  }
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/from '(\.[^']+)'/g)) {
    if (!existsSync(join(dirname(f), m[1]))) problems.push(`${f}: missing import ${m[1]}`);
  }
  // dashes are allowed only inside regular expressions that normalize student input
  text.split('\n').forEach((line, i) => {
    if (/[–—]/.test(line) && !/replace\(\/\[/.test(line)) problems.push(`${f}:${i + 1}: dash character in site text`);
  });
}
for (const f of [join(root, 'index.html'), join(root, 'css/style.css')]) {
  const text = readFileSync(f, 'utf8');
  if (/gradient/i.test(text)) problems.push(`${f}: contains a gradient`);
  if (/[–—]/.test(text)) problems.push(`${f}: contains a dash character`);
}
const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
  if (!existsSync(join(root, m[1]))) problems.push(`index.html references missing file ${m[1]}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`lint ok: ${js.length} modules, no gradients, no dash characters, all references resolve`);

if (process.argv.includes('--build')) {
  const dist = join(root, 'dist');
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist);
  for (const item of ['index.html', 'css', 'src', 'vendor']) cpSync(join(root, item), join(dist, item), { recursive: true });
  console.log(`build ok: site written to ${dist}`);
}
