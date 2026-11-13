// Prints sample problems as plain text for review: node scripts/sample.mjs [lessonPrefix] [seed]
import { TYPES, generate } from '../src/problems/index.js';
const prefix = process.argv[2] || '';
const seed = Number(process.argv[3] || 5);
const clean = (s) => s.replace(/<svg.*?<\/svg>/gs, '[GRAPH]').replace(/<\/t[dh]>/g, ' |').replace(/<\/tr>/g, ' // ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/\\left|\\right|\\displaystyle/g, '');
for (const t of TYPES.filter((x) => x.lesson.startsWith(prefix))) {
  for (let lv = 0; lv < 3; lv++) {
    const p = generate(t.id, lv, seed + lv * 31);
    const ans = p.parts.map((x) => (x.type === 'choice' ? `{${x.choices.map((c, i) => (i === x.correct ? '*' : '') + clean(c)).join(' ; ')}}` : `${x.label ? clean(x.label) : ''} [${x.ans}]`)).join(' && ');
    console.log(`${t.lesson} ${t.id} L${lv}: ${clean(p.prompt).slice(0, 330)}\n   => ${ans.slice(0, 420)}`);
  }
}
