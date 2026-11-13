// Course calendar transcribed from "STUDENT AP Precalc I Winter 2026-2027.pdf".
// Every weekday of the term is listed. Weekends are never instructional days.
//
// Fields:
//   lesson: lesson id taught that day
//   label:  what happens that day when it is not (only) a lesson
//   units:  units covered by a review or assessment day
//   kind:   'lesson' | 'review' | 'assessment' | 'other' | 'off'
//   events: extra items such as CYU quizzes
//   off:    reason there is no school for students

export const COURSE = {
  name: 'AP Precalculus I',
  term: 'Winter 2026-2027',
  start: '2026-11-09',
  end: '2027-02-26',
};

export const UNITS = [
  { id: 1, title: 'Functions and Rates of Change' },
  { id: 2, title: 'Polynomial and Rational Functions' },
  { id: 3, title: 'Transformations of Functions and Modeling' },
  { id: 4, title: 'Sequences and Exponential Functions' },
  { id: 5, title: 'Composition, Inverses, and Logarithmic Functions' },
];

// hook: one friendly sentence shown with the daily preview problem.
export const LESSONS = [
  { id: '1.1', title: 'Functions and Function Notation', textbook: '2.1 & 2.3', hook: 'A function is a machine: one input in, exactly one output out. Try running the machine.' },
  { id: '1.2', title: 'Interpreting Graphs of Functions', textbook: '2.3', hook: 'Every graph tells a story. See what you can read off this one.' },
  { id: '1.3', title: 'Concavity', textbook: null, hook: 'Today is about how graphs bend. Is this one shaped like a cup or a frown?' },
  { id: '1.4', title: 'Rate of Change', textbook: '2.4', hook: 'Speed is just change in distance over change in time. Same idea, new name.' },
  { id: '1.5', title: 'Change in Linear Functions', textbook: '2.5', hook: 'Linear functions change by the same amount every step. Spot the pattern.' },
  { id: '1.6', title: 'Change in Quadratic Functions', textbook: null, hook: 'When the changes themselves change steadily, you have found a quadratic.' },
  { id: '2.1', title: 'Polynomial Functions and Rates of Change', textbook: '3.2', hook: 'Polynomials are built from powers of x. Start by reading one carefully.' },
  { id: '2.2', title: 'Zeros of Polynomial Functions & Even and Odd', textbook: '2.6, 3.4, 3.5', hook: 'Zeros are where a graph touches the x-axis. Factored form hands them to you.' },
  { id: '2.3', title: 'Polynomial and Rational Functions and End Behavior', textbook: '3.2 & 3.6', hook: 'Zoom way out. Where is the graph heading at the far left and far right?' },
  { id: '2.4', title: 'Graphs of Rational Functions', textbook: '3.6', hook: 'Dividing by zero is not allowed, and that is exactly what makes these graphs interesting.' },
  { id: '2.5', title: 'Graphs of Rational Functions - Day 2', textbook: '3.6', hook: 'More rational function detective work. Start with one quick clue.' },
  { id: '2.6', title: 'Equivalent Representations of Rational Functions', textbook: '3.3 & 3.6', hook: 'Same function, different outfit. Rewriting can reveal new information.' },
  { id: '3.1', title: 'A Library of Parent Functions', textbook: null, hook: 'Meet the family of basic functions you will use all year.' },
  { id: '3.2', title: 'Transformations of Functions', textbook: '2.6', hook: 'Slide it, flip it, stretch it. Where does one point end up?' },
  { id: '3.3', title: 'Piecewise Functions', textbook: '2.1 & 2.2', hook: 'Some functions follow different rules in different places. Pick the right rule.' },
  { id: '3.4', title: 'Selecting a Function Model', textbook: null, hook: 'Which kind of function fits the pattern? Look at how the outputs change.' },
  { id: '3.5', title: 'Constructing a Function Model', textbook: null, hook: 'Time to build your own function from a few facts.' },
  { id: '4.1', title: 'Change in Arithmetic Sequences', textbook: '11.2', hook: 'Add the same number over and over and you get an arithmetic sequence.' },
  { id: '4.2', title: 'Change in Geometric Sequences', textbook: '11.3', hook: 'Multiply by the same number over and over. Things grow fast.' },
  { id: '4.3', title: 'Change in Linear and Exponential Functions', textbook: null, hook: 'Adding versus multiplying: can you tell which pattern is which?' },
  { id: '4.4', title: 'Exponential Functions', textbook: '4.1', hook: 'Repeated multiplication is the heart of exponential functions. Plug in and see.' },
  { id: '4.5', title: 'The Natural Exponential Function', textbook: '4.2', hook: 'Meet e, a number near 2.718 that shows up whenever growth is continuous.' },
  { id: '4.6', title: 'Graphing and Manipulating Exponential Functions', textbook: '4.1 & 4.2', hook: 'Exponent rules let you rewrite exponential functions in disguise.' },
  { id: '4.7', title: 'Constructing Exponential Models', textbook: null, hook: 'A starting amount and a growth factor are all you need to build a model.' },
  { id: '4.8', title: 'Using Regression Models', textbook: null, hook: 'How far off was the prediction? That gap has a name: the residual.' },
  { id: '5.1', title: 'Composition of Functions', textbook: '2.7', hook: 'Feed the output of one function into another. Work from the inside out.' },
  { id: '5.2', title: 'Inverse Functions in Multiple Representations & One to One Functions', textbook: '2.8', hook: 'An inverse function runs the machine backward. Swap inputs and outputs.' },
  { id: '5.3', title: 'Inverses of Exponential Functions', textbook: '4.3', hook: 'A logarithm answers one question: what exponent do I need?' },
  { id: '5.4', title: 'Graphs of Logarithmic Functions', textbook: '4.3', hook: 'Log graphs are exponential graphs with x and y swapped.' },
  { id: '5.5', title: 'Logarithm Properties', textbook: '4.4', hook: 'Logs turn multiplying into adding. Try a quick one.' },
  { id: '5.6', title: 'Solving Exponential and Logarithmic Equations', textbook: '4.5', hook: 'If the bases match, the exponents must match too.' },
  { id: '5.7', title: 'Solving Exponential and Logarithmic Equations - Day 2', textbook: '4.5', hook: 'Undo a logarithm by rewriting it as a power.' },
  { id: '5.8', title: 'Modeling with Logarithmic Functions', textbook: null, hook: 'Earthquakes, sound, and acidity are all measured with logarithms.' },
  { id: '5.9', title: 'Semi Log Plots', textbook: null, hook: 'On a semi-log plot, each step up the axis multiplies by 10.' },
].map((l) => ({ ...l, unit: Number(l.id.split('.')[0]) }));

const L = (date, lesson, events) => ({ date, kind: 'lesson', lesson, events: events || [] });
const R = (date, label, units, events) => ({ date, kind: 'review', label, units, events: events || [] });
const A = (date, label, units) => ({ date, kind: 'assessment', label, units, events: [] });
const OFF = (date, off) => ({ date, kind: 'off', off, events: [] });

export const DAYS = [
  // Week 1
  { date: '2026-11-09', kind: 'other', label: 'Welcome to AP Precalc!', events: ['Minimum Day'] },
  L('2026-11-10', '1.1'),
  OFF('2026-11-11', "Veterans Day: Holiday, No School"),
  L('2026-11-12', '1.2'),
  L('2026-11-13', '1.3'),
  // Week 2
  OFF('2026-11-16', 'Pro Grow Day: No School for Students'),
  L('2026-11-17', '1.4', ['CYU Quiz #1']),
  L('2026-11-18', '1.5'),
  L('2026-11-19', '1.6', ['Unity Day']),
  A('2026-11-20', 'Formative Assessment #1 (Unit 1)', [1]),
  // District recess
  OFF('2026-11-23', 'District Recess: No School'),
  OFF('2026-11-24', 'District Recess: No School'),
  OFF('2026-11-25', 'District Recess: No School'),
  OFF('2026-11-26', 'Thanksgiving Day: No School'),
  OFF('2026-11-27', 'District Recess: No School'),
  // Week 3
  R('2026-11-30', 'Unit 1 Review', [1]),
  L('2026-12-01', '2.1', ['Begin Unit 2', 'CYU Quiz #2']),
  L('2026-12-02', '2.2'),
  A('2026-12-03', 'Test 1 (Unit 1)', [1]),
  L('2026-12-04', '2.3'),
  // Week 4
  L('2026-12-07', '2.4'),
  L('2026-12-08', '2.5', ['CYU Quiz #3']),
  L('2026-12-09', '2.6'),
  L('2026-12-10', '3.1', ['Begin Unit 3']),
  A('2026-12-11', 'Formative Assessment #2 (Unit 2)', [2]),
  // Week 5
  L('2026-12-14', '3.2'),
  L('2026-12-15', '3.3', ['CYU Quiz #4']),
  L('2026-12-16', '3.4'),
  L('2026-12-17', '3.5'),
  R('2026-12-18', 'Unit 3 Review: Transformation of Functions and Modeling', [3], ['Minimum Day']),
  // District recess
  OFF('2026-12-21', 'District Recess: No School'),
  OFF('2026-12-22', 'District Recess: No School'),
  OFF('2026-12-23', 'District Recess: No School'),
  OFF('2026-12-24', 'District Recess: No School'),
  OFF('2026-12-25', 'Christmas Day: No School'),
  OFF('2026-12-28', 'District Recess: No School'),
  OFF('2026-12-29', 'District Recess: No School'),
  OFF('2026-12-30', 'District Recess: No School'),
  OFF('2026-12-31', 'District Recess: No School'),
  OFF('2027-01-01', "New Year's Day: No School"),
  // Week 6
  R('2027-01-04', 'Test 2 Review', [1, 2, 3]),
  A('2027-01-05', 'Formative Assessment #3 (Units 2 & 3)', [2, 3]),
  R('2027-01-06', 'Test 2 Review: Strategic Review Based On Formative #3', [1, 2, 3], ['CYU Quiz #5']),
  A('2027-01-07', 'Test 2 (Units 1-3)', [1, 2, 3]),
  L('2027-01-08', '4.1', ['Begin Unit 4', '6-Week Grades']),
  // Week 7
  L('2027-01-11', '4.2'),
  L('2027-01-12', '4.3'),
  L('2027-01-13', '4.4'),
  L('2027-01-14', '4.5'),
  L('2027-01-15', '4.6'),
  // Week 8
  OFF('2027-01-18', 'MLK Day: Holiday, No School'),
  L('2027-01-19', '4.7', ['CYU Quiz #6']),
  L('2027-01-20', '4.8'),
  A('2027-01-21', 'Formative Assessment #4 (Unit 4 A)', [4]),
  R('2027-01-22', 'Strategic Review Based on Formative #4', [4]),
  // Week 9
  OFF('2027-01-25', 'Pro Grow Day: No School for Students'),
  L('2027-01-26', '5.1', ['Begin Unit 5', 'CYU Quiz #7']),
  L('2027-01-27', '5.2'),
  A('2027-01-28', 'Test 3 (Units 1-4)', [1, 2, 3, 4]),
  L('2027-01-29', '5.3'),
  // Week 10
  L('2027-02-01', '5.4', ['Safety Week']),
  L('2027-02-02', '5.5', ['CYU Quiz #8']),
  L('2027-02-03', '5.6'),
  L('2027-02-04', '5.7'),
  A('2027-02-05', 'Formative Assessment #5 (Unit 5)', [5]),
  // Week 11
  L('2027-02-08', '5.8'),
  L('2027-02-09', '5.9'),
  R('2027-02-10', 'Unit 5 Review', [5]),
  A('2027-02-11', 'Trimester II Final Exam Part I: Free Response (Units 1-5)', [1, 2, 3, 4, 5]),
  R('2027-02-12', 'Unit 1 Review', [1]),
  // Presidents week
  OFF('2027-02-15', "President's Week: No School"),
  OFF('2027-02-16', "President's Week: No School"),
  OFF('2027-02-17', "President's Week: No School"),
  OFF('2027-02-18', "President's Week: No School"),
  OFF('2027-02-19', "President's Week: No School"),
  // Week 12
  R('2027-02-22', 'Unit 2 Review', [2]),
  R('2027-02-23', 'Unit 3 Review', [3]),
  A('2027-02-24', 'Trimester II Final Exam Part II: Multiple Choice (Period 1)', [1, 2, 3, 4, 5]),
  A('2027-02-25', 'Trimester II Final Exam Part II: Multiple Choice (Periods 2 & 3)', [1, 2, 3, 4, 5]),
  A('2027-02-26', 'Trimester II Final Exam Part II: Multiple Choice (Periods 4 & 5)', [1, 2, 3, 4, 5]),
];

const byDate = new Map(DAYS.map((d) => [d.date, d]));
const lessonById = new Map(LESSONS.map((l) => [l.id, l]));

// Attach the teaching date to each lesson.
for (const d of DAYS) {
  if (d.lesson) lessonById.get(d.lesson).date = d.date;
}

export function getLesson(id) {
  return lessonById.get(id);
}

export function lessonsOfUnit(unitId) {
  return LESSONS.filter((l) => l.unit === unitId);
}

// ---------- date helpers (all dates are local YYYY-MM-DD strings) ----------

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso, opts = {}) {
  const d = fromISO(iso);
  const wd = WEEKDAYS[d.getDay()];
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (opts.short) return base;
  return `${opts.weekdayShort ? wd.slice(0, 3) : wd}, ${base}`;
}

// Information about any calendar date.
export function dayInfo(iso) {
  const listed = byDate.get(iso);
  if (listed) return listed;
  const dow = fromISO(iso).getDay();
  if (dow === 0 || dow === 6) return { date: iso, kind: 'off', off: 'Weekend', events: [] };
  if (iso < COURSE.start) return { date: iso, kind: 'off', off: 'Before the term begins', events: [] };
  return { date: iso, kind: 'off', off: 'After the term ends', events: [] };
}

// A day counts as instructional when students are in class.
export function isInstructional(iso) {
  return dayInfo(iso).kind !== 'off';
}

// Lesson days in order, as [{ date, lesson }].
export const LESSON_DAYS = DAYS.filter((d) => d.lesson).map((d) => ({ date: d.date, lesson: d.lesson }));

// The lessons taught strictly before the given date, most recent first.
export function lessonsBefore(iso) {
  return LESSON_DAYS.filter((d) => d.date < iso).reverse();
}

// The first lesson taught strictly after the given date, or null.
export function nextLessonAfter(iso) {
  return LESSON_DAYS.find((d) => d.date > iso) || null;
}
