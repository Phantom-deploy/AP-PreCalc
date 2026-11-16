// SVG graphs in the DeltaMath style: light gray grid, black axes with arrowheads,
// serif tick labels beside the axes, italic axis letters. Returns an SVG string.

let uid = 0;

const COLORS = { blue: '#1f5fa8', red: '#c0392b', green: '#2e7d32', gray: '#555555' };
const LABEL_FONT = "Georgia, 'Times New Roman', serif";

function niceLabel(v) {
  return String(Math.round(v * 1000) / 1000);
}

function arrow(tx, ty, dir) {
  // filled arrowhead with a concave back, pointing in direction dir (r, l, u, d)
  const L = 12;
  const Wd = 5;
  const back = 8;
  const pts = {
    r: [[tx, ty], [tx - L, ty - Wd], [tx - back, ty], [tx - L, ty + Wd]],
    l: [[tx, ty], [tx + L, ty - Wd], [tx + back, ty], [tx + L, ty + Wd]],
    u: [[tx, ty], [tx - Wd, ty + L], [tx, ty + back], [tx + Wd, ty + L]],
    d: [[tx, ty], [tx - Wd, ty - L], [tx, ty - back], [tx + Wd, ty - L]],
  }[dir];
  return `<path d="M${pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L')}Z" fill="#000000"/>`;
}

// arrowhead at (tx, ty) pointing along the screen direction (dx, dy)
function arrowAlong(tx, ty, dx, dy, color) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const L = 12;
  const Wd = 5;
  const back = 8;
  const p = (a, b) => `${(tx - ux * a - uy * b).toFixed(1)} ${(ty - uy * a + ux * b).toFixed(1)}`;
  return `<path d="M${tx.toFixed(1)} ${ty.toFixed(1)}L${p(L, Wd)}L${p(back, 0)}L${p(L, -Wd)}Z" fill="${color}"/>`;
}

/*
 opts:
   x: [min, max], y: [min, max]
   xstep, ystep: grid spacing (default 1)
   xlabelEvery, ylabelEvery: label every nth grid line (default 1 for small ranges)
   curves: [{ f, from, to, color }]
   paths: [{ pts: [[x, y], ...], color }]
   points: [{ x, y, open, label, color, dx, dy, r }]
   vlines: [x], hlines: [y] (dashed asymptotes)
   xname, yname: axis names
   xTick, yTick: functions that format tick labels
   w, h: pixel size of the grid area plus margins
   padL: extra room on the left for long y labels
   labelYOrigin: also label the y value where the x axis sits
*/
export function plot(opts) {
  const id = `g${++uid}`;
  const [x0, x1] = opts.x;
  const [y0, y1] = opts.y;
  const xname = opts.xname ?? 'x';
  const yname = opts.yname ?? 'y';
  const W = opts.w || 480;
  const H = opts.h || 480;
  const ext = 20; // how far the axes run past the grid
  const pad = {
    l: Math.max(opts.padL || 0, 36),
    r: ext + 12 + Math.max(10, xname.length * 8),
    t: ext + 26,
    b: 36,
  };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const sx = (x) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y) => pad.t + ((y1 - y) / (y1 - y0)) * ih;
  const xstep = opts.xstep || 1;
  const ystep = opts.ystep || 1;
  const xEvery = opts.xlabelEvery || ((x1 - x0) / xstep <= 20 ? 1 : 2);
  const yEvery = opts.ylabelEvery || ((y1 - y0) / ystep <= 20 ? 1 : 2);
  const xTick = opts.xTick || niceLabel;
  const yTick = opts.yTick || niceLabel;
  const out = [];
  out.push(
    `<svg class="graph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${opts.alt || 'Graph for this problem'}">`,
  );
  out.push(`<defs><clipPath id="${id}"><rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}"/></clipPath></defs>`);
  out.push(`<rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="#ffffff" stroke="#e6e6e6" stroke-width="1"/>`);

  // axes sit at zero, or along the edge when zero is out of view
  const axisX = Math.min(Math.max(0, x0), x1);
  const axisY = Math.min(Math.max(0, y0), y1);
  const ax = sx(axisX);
  const ay = sy(axisY);
  const eps = 1e-9;

  const labels = [];
  for (let x = Math.ceil(x0 / xstep - eps) * xstep; x <= x1 + eps; x += xstep) {
    const idx = Math.round(x / xstep);
    out.push(`<line x1="${sx(x)}" y1="${pad.t}" x2="${sx(x)}" y2="${pad.t + ih}" stroke="#e6e6e6" stroke-width="1"/>`);
    if (idx % xEvery === 0 && Math.abs(x - axisX) > eps) {
      const ly = opts.xLabelsBottom ? pad.t + ih + 17 : ay + 17;
      labels.push(`<text x="${sx(x)}" y="${ly}" font-size="13" text-anchor="middle" fill="#222222">${xTick(x)}</text>`);
    }
  }
  for (let y = Math.ceil(y0 / ystep - eps) * ystep; y <= y1 + eps; y += ystep) {
    const idx = Math.round(y / ystep);
    out.push(`<line x1="${pad.l}" y1="${sy(y)}" x2="${pad.l + iw}" y2="${sy(y)}" stroke="#e6e6e6" stroke-width="1"/>`);
    if (idx % yEvery === 0 && (Math.abs(y - axisY) > eps || opts.labelYOrigin)) {
      labels.push(`<text x="${ax - 9}" y="${sy(y) + 5}" font-size="13" text-anchor="end" fill="#222222">${yTick(y)}</text>`);
    }
  }

  // asymptotes and curves, clipped to the grid
  out.push(`<g clip-path="url(#${id})">`);
  for (const v of opts.vlines || []) {
    out.push(`<line x1="${sx(v)}" y1="${pad.t}" x2="${sx(v)}" y2="${pad.t + ih}" stroke="#d3a60c" stroke-width="2" stroke-dasharray="6 6"/>`);
  }
  for (const v of opts.hlines || []) {
    out.push(`<line x1="${pad.l}" y1="${sy(v)}" x2="${pad.l + iw}" y2="${sy(v)}" stroke="#d3a60c" stroke-width="2" stroke-dasharray="6 6"/>`);
  }
  out.push('</g>');

  // axes with arrowheads at both ends
  const left = pad.l - ext;
  const right = pad.l + iw + ext;
  const top = pad.t - ext;
  const bottom = pad.t + ih + ext;
  // an axis that starts at the edge of the window (no negative values) gets no arrow on that end
  const leftOpen = x0 < 0;
  const downOpen = y0 < 0;
  const xa = leftOpen ? left + 6 : pad.l;
  const yb = downOpen ? bottom - 6 : pad.t + ih;
  out.push(`<line x1="${xa}" y1="${ay}" x2="${right - 6}" y2="${ay}" stroke="#000000" stroke-width="2"/>`);
  out.push(`<line x1="${ax}" y1="${top + 6}" x2="${ax}" y2="${yb}" stroke="#000000" stroke-width="2"/>`);
  out.push(arrow(right, ay, 'r'), arrow(ax, top, 'u'));
  if (leftOpen) out.push(arrow(left, ay, 'l'));
  if (downOpen) out.push(arrow(ax, bottom, 'd'));
  out.push(
    `<text x="${right + 5}" y="${ay + 5}" font-size="15" font-style="italic" font-family="${LABEL_FONT}" fill="#000000">${xname}</text>`,
    `<text x="${ax}" y="${top - 7}" font-size="15" font-style="italic" font-family="${LABEL_FONT}" text-anchor="middle" fill="#000000">${yname}</text>`,
  );

  const curveArrows = [];
  out.push(`<g clip-path="url(#${id})">`);
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
    const color = COLORS[c.color] || c.color || '#000000';
    out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round"/>`);
    // arrowheads where the curve leaves the window, like DeltaMath
    if (!c.noArrows) {
      const inside = (y) => Number.isFinite(y) && y >= y0 && y <= y1;
      const pt = (x) => [sx(x), sy(c.f(x))];
      const xs = Array.from({ length: N + 1 }, (_, i) => from + ((to - from) * i) / N);
      for (let i = 1; i <= N; i++) {
        const a = inside(c.f(xs[i - 1]));
        const b = inside(c.f(xs[i]));
        if (a && !b && i >= 2) {
          const [px, py] = pt(xs[i - 2]);
          const [qx, qy] = pt(xs[i - 1]);
          curveArrows.push(arrowAlong(qx, Math.min(Math.max(qy, pad.t), pad.t + ih), qx - px, qy - py, color));
        }
        if (!a && b && i + 1 <= N) {
          const [px, py] = pt(xs[i + 1]);
          const [qx, qy] = pt(xs[i]);
          curveArrows.push(arrowAlong(qx, Math.min(Math.max(qy, pad.t), pad.t + ih), qx - px, qy - py, color));
        }
      }
      const ys = c.f(from);
      if (inside(ys) && from <= x0 + 1e-9) {
        const [px, py] = pt(from + (to - from) / N);
        const [qx, qy] = pt(from);
        curveArrows.push(arrowAlong(qx, qy, qx - px, qy - py, color));
      }
      const ye = c.f(to);
      if (inside(ye) && to >= x1 - 1e-9) {
        const [px, py] = pt(to - (to - from) / N);
        const [qx, qy] = pt(to);
        curveArrows.push(arrowAlong(qx, qy, qx - px, qy - py, color));
      }
    }
  }
  for (const p of opts.paths || []) {
    const d = p.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join('');
    out.push(`<path d="${d}" fill="none" stroke="${COLORS[p.color] || p.color || COLORS.blue}" stroke-width="2.4" stroke-linejoin="round"/>`);
  }
  out.push('</g>');
  out.push(curveArrows.join(''));
  for (const p of opts.points || []) {
    const custom = COLORS[p.color] || p.color;
    const fill = p.open ? '#ffffff' : custom || '#5481b5';
    out.push(`<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r || 5}" fill="${fill}" stroke="${custom && !p.open ? custom : '#222222'}" stroke-width="${p.open ? 2 : 1}"/>`);
    if (p.label) {
      out.push(`<text x="${sx(p.x) + (p.dx ?? 9)}" y="${sy(p.y) + (p.dy ?? -9)}" font-size="15" font-weight="bold" font-family="${LABEL_FONT}" fill="#222222">${p.label}</text>`);
    }
  }
  // tick labels last, with a white halo so curves and points never hide them
  out.push(`<g font-family="${LABEL_FONT}" stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${labels.join('')}</g>`);
  out.push('</svg>');
  return `<div class="figure">${out.join('')}</div>`;
}
