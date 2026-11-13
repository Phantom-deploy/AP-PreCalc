// Turns problem text into HTML. Math is written between dollar signs:
// $...$ for inline math and $$...$$ for display math. Use \$ for a literal dollar sign.

import katex from '../../vendor/katex/katex.mjs';

const DOLLAR = '\u0001';

export function tex(src, display = false) {
  return katex.renderToString(src, { displayMode: display, throwOnError: true, strict: false, output: 'html' });
}

function renderInline(text) {
  // text has no display math in it
  const parts = text.split('$');
  if (parts.length % 2 === 0) throw new Error(`Unbalanced math delimiters in: ${text}`);
  return parts.map((p, i) => (i % 2 ? tex(p) : p)).join('');
}

export function renderText(source) {
  const src = String(source).replace(/\\\$/g, DOLLAR);
  const blocks = src.split('$$');
  if (blocks.length % 2 === 0) throw new Error(`Unbalanced display math in: ${source}`);
  const html = blocks.map((b, i) => (i % 2 ? `<div class="math-block">${tex(b, true)}</div>` : renderInline(b))).join('');
  return html.split(DOLLAR).join('$');
}

// Splits on blank lines into paragraphs, leaving block elements (tables, figures) alone.
export function renderProblemText(source) {
  return String(source)
    .split(/\n\n+/)
    .map((chunk) => {
      const html = renderText(chunk);
      return /^\s*<div/.test(chunk) || /^\s*\$\$/.test(chunk) ? html : `<p>${html}</p>`;
    })
    .join('');
}
