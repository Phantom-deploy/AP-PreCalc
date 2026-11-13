# AP Precalc Practice

A lightweight practice site for AP Precalculus I (Winter 2026-2027), with a flat, simple layout inspired by DeltaMath.

- **Units 1 to 5, 34 lessons, 125 problem types.** Every problem is generated on the fly, so practice is unlimited.
- **Easy, Medium, and Hard** settings on every problem type.
- **Answer checking** that accepts equivalent expressions, fractions, interval notation, lists, and ordered pairs.
- **One short hint** after each incorrect answer, plus Try Again, Next Problem, and Show Answer (after two misses).
- **Daily Problems:** 3 problems a day, chosen from the course calendar in `src/data/calendar.js`:
  1. one from the most recent lesson taught (yesterday's lesson),
  2. one from the lesson before that,
  3. an easy preview of today's lesson.

  Weekends, holidays, recess, test days, and review days are skipped when finding "yesterday." The set stays the same all day and changes on its own when the date changes.
- Progress and settings are saved in the browser (localStorage). No login.

## Run it

No build step and no dependencies. Serve the folder with any static server:

```bash
npm start
```

Then open http://localhost:8080. To preview another day's daily problems, add `?date=2026-12-04` before the `#` in the address.

## Test

```bash
npm test
```

The tests generate every problem type hundreds of times at each level. They check that every correct answer is accepted, wrong answers are rejected, the math renders, and no text contains dashes or invalid values. They also check the calendar and the daily problem selection.

## Layout

- `src/data/calendar.js`: course calendar, transcribed from `Material refrences/STUDENT AP Precalc I Winter 2026-2027 .pdf`
- `src/problems/unit1.js` to `unit5.js`: problem generators
- `src/lib/`: expression parser, answer checker, graphs, daily problem picker, storage
- `src/ui/`: pages (home, practice, daily, calendar)
- `vendor/katex/`: KaTeX for math rendering (MIT license)
