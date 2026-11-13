// Registry of every problem type, grouped by lesson.

import unit1 from './unit1.js';
import unit2 from './unit2.js';
import unit3 from './unit3.js';
import unit4 from './unit4.js';
import unit5 from './unit5.js';
import { makeRng } from '../lib/rng.js';

export const LEVELS = ['Easy', 'Medium', 'Hard'];

export const TYPES = [...unit1, ...unit2, ...unit3, ...unit4, ...unit5];

const byId = new Map(TYPES.map((t) => [t.id, t]));

export function getType(id) {
  return byId.get(id);
}

export function typesOfLesson(lessonId) {
  return TYPES.filter((t) => t.lesson === lessonId);
}

// Builds one problem. The same type, level, and seed always give the same problem.
export function generate(typeId, level, seed) {
  const type = byId.get(typeId);
  if (!type) throw new Error(`Unknown problem type ${typeId}`);
  const rng = makeRng(seed);
  const problem = type.gen(rng, level);
  return { ...problem, typeId, level, seed, title: type.title, lesson: type.lesson };
}
