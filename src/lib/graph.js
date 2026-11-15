// Minimal SVG graphing used by problems. Returns an SVG string.

let uid = 0;

const COLORS = { blue: '#1f5fa8', red: '#c0392b', green: '#2e7d32', gray: '#555555' };

function niceLabel(v) {
  return String(Math.round(v * 1000) / 1000).replace('-', '−');
}

/*
 opts:
   x: [min, max], y: [min, max]
   xstep, ystep: grid spacing (default 1)
   xlabelEvery, ylabelEvery: label every nth grid line (default 2)
   curves: [{ f, from, to, color }]
   paths: [{ pts: [[x, y], ...], color }]
   points: [{ x, y, open, label, color, dx, dy }]
   vlines: [x], hlines: [y] (dashed)
   xname, yname: axis names
   xTick, yTick: functions that format tick labels
   w, h: pixel size
*/
export function plot(opts) {
  const id = `g${++uid}`;
  const [x0, x1] = opts.x;
  const [y0, y1] = opts.y;
  const W = opts.w || 340;
  const H = opts.h || 340;
  const pad = { l: opts.padL || 34, r: 16, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const sx = (x) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y) => pad.t + ((y1 - y) / (y1 - y0)) * ih;
  const xstep = opts.xstep || 1;
  const ystep = opts.ystep || 1;
  const xEvery = opts.xlabelEvery || 2;
  const yEvery = opts.ylabelEvery || 2;
  const xTick = opts.xTick || niceLabel;
  const yTick = opts.yTick || niceLabel;
  const out = [];
  out.push(
    `<svg class="graph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${opts.alt || 'Graph for this problem'}">`,
  );
  out.push(`<defs><clipPath id="${id}"><rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}"/></clipPath></defs>`);
  out.push(`<rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="#ffffff" stroke="#bbbbbb" stroke-width="1"/>`);

  // axis positions (pinned to the edge when zero is out of view)
  const axisX = Math.min(Math.max(0, x0), x1);
  const axisY = Math.min(Math.max(0, y0), y1);

  const eps = 1e-9;
  let k = 0;
  for (let x = Math.ceil(x0 / xstep - eps) * xstep; x <= x1 + eps; x += xstep, k++) {
    const idx = Math.round(x / xstep);
    out.push(`<line x1="${sx(x)}" y1="${pad.t}" x2="${sx(x)}" y2="${pad.t + ih}" stroke="#dddddd" stroke-width="1"/>`);
    if (idx % xEvery === 0 && Math.abs(x - axisX) > eps) {
      out.push(
        `<text x="${sx(x)}" y="${Math.min(sy(axisY) + 14, H - 4)}" font-size="11" text-anchor="middle" fill="#333333">${xTick(x)}</text>`,
      );
    }
  }
  for (let y = Math.ceil(y0 / ystep - eps) * ystep; y <= y1 + eps; y += ystep) {
    const idx = Math.round(y / ystep);
    out.push(`<line x1="${pad.l}" y1="${sy(y)}" x2="${pad.l + iw}" y2="${sy(y)}" stroke="#dddddd" stroke-width="1"/>`);
    if (idx % yEvery === 0 && (Math.abs(y - axisY) > eps || opts.labelYOrigin) && Math.abs(y - y1) > eps) {
      out.push(
        `<text x="${Math.max(sx(axisX) - 8, pad.l - 4)}" y="${sy(y) + 4}" font-size="11" text-anchor="end" fill="#333333">${yTick(y)}</text>`,
      );
    }
  }
  // axes
  out.push(`<line x1="${pad.l}" y1="${sy(axisY)}" x2="${pad.l + iw}" y2="${sy(axisY)}" stroke="#222222" stroke-width="1.5"/>`);
  out.push(`<line x1="${sx(axisX)}" y1="${pad.t}" x2="${sx(axisX)}" y2="${pad.t + ih}" stroke="#222222" stroke-width="1.5"/>`);
  out.push(
    `<text x="${pad.l + iw - 4}" y="${sy(axisY) - 6}" font-size="12" font-style="italic" text-anchor="end" fill="#222222">${opts.xname ?? 'x'}</text>`,
  );
  out.push(
    `<text x="${sx(axisX) + 7}" y="${pad.t + 12}" font-size="12" font-style="italic" fill="#222222">${opts.yname ?? 'y'}</text>`,
  );

  out.push(`<g clip-path="url(#${id})">`);
  for (const v of opts.vlines || []) {
    out.push(
      `<line x1="${sx(v)}" y1="${pad.t}" x2="${sx(v)}" y2="${pad.t + ih}" stroke="${COLORS.red}" stroke-width="1.5" stroke-dasharray="6 4"/>`,
    );
  }
  for (const v of opts.hlines || []) {
    out.push(
      `<line x1="${pad.l}" y1="${sy(v)}" x2="${pad.l + iw}" y2="${sy(v)}" stroke="${COLORS.red}" stroke-width="1.5" stroke-dasharray="6 4"/>`,
    );
  }
  const span = y1 - y0;
  for (const c of opts.curves || []) {
    const from = Math.max(c.from ?? x0, x0);
    const to = Math.min(c.to ?? x1, x1);
    const N = 600;
    let d = '';
    let pen = false;
    let prevY = null;
    for (let i = 0; i <= N; i++) {
      const x = from + ((to - from) * i) / N;
      const y = c.f(x);
      const visible = Number.isFinite(y) && y > y0 - span && y < y1 + span;
      // break the path at jumps such as vertical asymptotes
      const jump = prevY !== null && visible && Math.abs(y - prevY) > span * 0.9 && Math.sign(y - (y0 + y1) / 2) !== Math.sign(prevY - (y0 + y1) / 2);
      if (!visible || jump) {
        pen = false;
        prevY = visible ? y : null;
        if (!visible) continue;
      }
      d += `${pen ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`;
      pen = true;
      prevY = y;
    }
    out.push(`<path d="${d}" fill="none" stroke="${COLORS[c.color] || c.color || COLORS.blue}" stroke-width="2.2" stroke-linejoin="round"/>`);
  }
  for (const p of opts.paths || []) {
    const d = p.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join('');
    out.push(`<path d="${d}" fill="none" stroke="${COLORS[p.color] || p.color || COLORS.blue}" stroke-width="2.2" stroke-linejoin="round"/>`);
  }
  out.push('</g>');
  for (const p of opts.points || []) {
    const col = COLORS[p.color] || p.color || COLORS.blue;
    out.push(
      `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r || 4}" fill="${p.open ? '#ffffff' : col}" stroke="${col}" stroke-width="2"/>`,
    );
    if (p.label) {
      out.push(
        `<text x="${sx(p.x) + (p.dx ?? 8)}" y="${sy(p.y) + (p.dy ?? -8)}" font-size="13" font-weight="bold" fill="#222222">${p.label}</text>`,
      );
    }
  }
  out.push('</svg>');
  return `<div class="figure">${out.join('')}</div>`;
}
