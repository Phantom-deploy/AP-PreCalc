// Chooses the three daily problems for a date from the course calendar.
//
//   1. a problem from the most recent lesson taught before today ("yesterday's lesson")
//   2. a problem from the lesson taught before that one
//   3. an easy preview of today's lesson
//
// "Yesterday" means the previous instructional day with a lesson, so weekends, holidays,
// tests, and review days are skipped. The choices depend only on the date, so they stay
// the same all day and change automatically when the date changes.

import { dayInfo, lessonsBefore, nextLessonAfter, getLesson, formatDate, LESSONS, LESSON_DAYS } from '../data/calendar.js';
import { typesOfLesson } from '../problems/index.js';
import { hashString, makeRng } from './rng.js';

function pickType(lessonId, rng, avoid) {
  const types = typesOfLesson(lessonId).filter((t) => t.id !== avoid);
  return rng.pick(types).id;
}

export function dailyPlan(iso) {
  const info = dayInfo(iso);
  const before = lessonsBefore(iso);
  const seedOf = (slot) => hashString(`daily|${iso}|${slot}`);
  const slots = [];

  // ----- slot 1 and slot 2: the two most recent lessons -----
  const first = LESSON_DAYS[0];
  const recent = before[0] || null;
  const older = before[1] || null;

  const reviewSlot = (slot, entry, label) => {
    const rng = makeRng(seedOf(`${slot}|type`));
    const lesson = getLesson(entry.lesson);
    const avoid = slots.find((s) => s.lessonId === entry.lesson)?.typeId;
    return {
      role: slot,
      lessonId: lesson.id,
      typeId: pickType(lesson.id, rng, avoid),
      level: 1,
      seed: seedOf(slot),
      heading: label,
      detail: `Lesson ${lesson.id}: ${lesson.title} (taught ${formatDate(entry.date, { weekdayShort: true })})`,
    };
  };

  if (recent) {
    slots.push(reviewSlot('yesterday', recent, "From yesterday's lesson"));
  } else {
    slots.push({ ...reviewSlot('yesterday', first, 'Warm-up'), level: 0, detail: `The course has not had a lesson yet, so here is a warm-up from Lesson ${first.lesson}.` });
  }
  if (older) {
    slots.push(reviewSlot('before', older, 'From the lesson before that'));
  } else {
    const entry = recent || first;
    slots.push({
      ...reviewSlot('before', entry, recent ? `More from Lesson ${entry.lesson}` : 'Warm-up'),
      level: recent ? 1 : 0,
      detail: recent
        ? `Only one lesson has been taught so far, so this is a second problem from Lesson ${entry.lesson}.`
        : `The course has not had a lesson yet, so here is another warm-up from Lesson ${first.lesson}.`,
    });
  }

  // ----- slot 3: preview of today -----
  const previewSlot = (lessonId, heading, detail) => {
    const lesson = getLesson(lessonId);
    return {
      role: 'today',
      lessonId,
      typeId: typesOfLesson(lessonId)[0].id,
      level: 0,
      seed: seedOf('today'),
      heading,
      detail,
      hook: lesson.hook,
    };
  };

  if (info.lesson) {
    const lesson = getLesson(info.lesson);
    slots.push(previewSlot(lesson.id, "Sneak peek at today's lesson", `Lesson ${lesson.id}: ${lesson.title}`));
  } else if ((info.kind === 'review' || info.kind === 'assessment') && info.units) {
    const rng = makeRng(seedOf('today|review'));
    const taught = LESSONS.filter((l) => info.units.includes(l.unit) && l.date < iso);
    const pool = taught.length ? taught : LESSONS.filter((l) => info.units.includes(l.unit));
    const lesson = rng.pick(pool);
    slots.push({
      role: 'today',
      lessonId: lesson.id,
      typeId: pickType(lesson.id, rng),
      level: 0,
      seed: seedOf('today'),
      heading: 'Warm-up for today',
      detail: `Today is ${info.label}. Here is a quick review from Lesson ${lesson.id}: ${lesson.title}.`,
      hook: 'A quick confidence builder before today.',
    });
  } else {
    const next = nextLessonAfter(iso);
    if (next) {
      const lesson = getLesson(next.lesson);
      slots.push(previewSlot(lesson.id, 'Sneak peek at the next lesson', `Coming up ${formatDate(next.date)}: Lesson ${lesson.id}: ${lesson.title}`));
    } else {
      const rng = makeRng(seedOf('today|final'));
      const lesson = rng.pick(LESSONS);
      slots.push({
        role: 'today',
        lessonId: lesson.id,
        typeId: pickType(lesson.id, rng),
        level: 0,
        seed: seedOf('today'),
        heading: 'Course review',
        detail: `All lessons have been taught. Here is a review problem from Lesson ${lesson.id}: ${lesson.title}.`,
        hook: 'Keep your skills sharp for the final.',
      });
    }
  }
  return { date: iso, info, slots };
}

// A short description of the day for page headers.
export function describeDay(iso) {
  const info = dayInfo(iso);
  if (info.lesson) {
    const lesson = getLesson(info.lesson);
    return `Lesson ${lesson.id}: ${lesson.title}`;
  }
  if (info.kind === 'off') return info.off;
  return info.label;
}
