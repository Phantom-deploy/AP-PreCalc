// Runs every generator many times at every level and checks the results.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, generate } from '../src/problems/index.js';
import { LESSONS } from '../src/data/calendar.js';
import { checkPart, checkProblem, answerTex } from '../src/lib/check.js';
import { renderProblemText, renderText, tex } from '../src/lib/render.js';

const RUNS = Number(process.env.RUNS || 150);

test('every lesson has at least three problem types', () => {
  for (const lesson of LESSONS) {
    const n = TYPES.filter((t) => t.lesson === lesson.id).length;
    assert.ok(n >= 3, `lesson ${lesson.id} has ${n} types`);
  }
});

test('type ids are unique and belong to real lessons', () => {
  const ids = new Set();
  for (const t of TYPES) {
    assert.ok(!ids.has(t.id), `duplicate id ${t.id}`);
    ids.add(t.id);
    assert.ok(LESSONS.some((l) => l.id === t.lesson), `bad lesson on ${t.id}`);
    assert.ok(t.title && !t.title.includes('—'));
  }
});

for (const type of TYPES) {
  test(`${type.lesson} ${type.id}`, () => {
    for (let level = 0; level < 3; level++) {
      const prompts = new Set();
      for (let i = 0; i < RUNS; i++) {
        const seed = 1000 * level + i * 7919 + 13;
        const where = `${type.id} level ${level} seed ${seed}`;
        let p;
        try {
          p = generate(type.id, level, seed);
        } catch (err) {
          assert.fail(`${where}: generator threw ${err.stack}`);
        }
        // deterministic
        const strip = (t) => t.replace(/g\d+/g, 'g');
        assert.ok(strip(generate(type.id, level, seed).prompt) === strip(p.prompt), `${where}: not deterministic`);
        prompts.add(p.prompt.replace(/g\d+/g, 'g'));
        const all = [p.prompt, p.hint, ...p.parts.flatMap((x) => [x.label || '', x.suffix || '', ...(x.choices || [])])].join(' ');
        assert.ok(!/[—–]/.test(all), `${where}: contains a dash character`);
        const bad = all.match(/.{0,40}(NaN|undefined|Infinity|\[object).{0,40}/);
        assert.ok(!bad, `${where}: bad text: ${bad && bad[0]}`);
        assert.ok(!/\d\.\d{7,}/.test(all.replace(/<svg.*?<\/svg>/gs, '')), `${where}: long decimal in text`);
        assert.ok(p.hint && p.hint.length > 20 && p.hint.length < 260, `${where}: hint length ${p.hint && p.hint.length}`);
        try {
          renderProblemText(p.prompt);
          renderText(p.hint);
        } catch (err) {
          assert.fail(`${where}: render failed: ${err.message}\n${p.prompt}`);
        }
        assert.ok(p.parts.length >= 1, where);
        const inputs = [];
        for (const part of p.parts) {
          if (part.label) renderText(part.label);
          if (part.type === 'choice') {
            assert.ok(part.choices.length >= 2, `${where}: too few choices`);
            assert.equal(new Set(part.choices).size, part.choices.length, `${where}: duplicate choices ${JSON.stringify(part.choices)}`);
            assert.ok(part.correct >= 0 && part.correct < part.choices.length, `${where}: bad correct index`);
            part.choices.forEach((c) => renderText(c));
            inputs.push(String(part.correct));
            assert.equal(checkPart(part, String((part.correct + 1) % part.choices.length)).ok, false);
          } else {
            assert.ok(part.ans !== undefined && part.ans !== '', `${where}: missing ans`);
            const r = checkPart(part, part.ans);
            assert.ok(r.ok, `${where}: canonical answer "${part.ans}" rejected (${r.msg || 'wrong'}) value=${JSON.stringify(part.value ?? part.values)}`);
            const t = answerTex(part);
            try {
              tex(t);
            } catch (err) {
              assert.fail(`${where}: answer tex failed: ${t}`);
            }
            inputs.push(part.ans);
            if (part.type === 'number') {
              assert.ok(Number.isFinite(part.value), `${where}: non-finite value`);
              const off = part.value + Math.max(1, Math.abs(part.value)) * 0.37;
              assert.equal(checkPart(part, String(off)).ok, false, `${where}: wrong number accepted`);
            }
            if (part.type === 'expr') {
              assert.equal(checkPart(part, `${part.ans}+1`).ok, false, `${where}: wrong expr accepted`);
            }
          }
        }
        assert.equal(checkProblem(p, inputs).status, 'correct', where);
      }
      assert.ok(prompts.size >= Math.min(4, RUNS / 4), `${type.id} level ${level}: only ${prompts.size} distinct problems in ${RUNS} runs`);
    }
  });
}
