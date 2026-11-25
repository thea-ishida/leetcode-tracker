// Daily Tectonic: a practice tracker drawn as a Suprematist building.
// Rule: on any day, only the first problem's shape can lock into the building.
// Shapes crammed into the same day can't lock to each other, so they hover,
// fall, and leave a gap where they would have been.

(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const hoverEl = document.getElementById('hover');
  const buttons = {
    practice: document.getElementById('practice'),
    cram: document.getElementById('cram'),
    replay: document.getElementById('replay'),
    reset: document.getElementById('reset'),
  };
  const statEls = {
    days: document.getElementById('s-days'),
    problems: document.getElementById('s-problems'),
    held: document.getElementById('s-held'),
    fell: document.getElementById('s-fell'),
  };

  const COLORS = { ink: '#141414', red: '#c8281e', paper: '#f1ece1', gap: '#8a8478' };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = reduceMotion ? 0.15 : 1;
  const T_TRAVEL = 900 * SPEED;
  const T_HOVER = 1300 * SPEED;

  let content = { standIn: false, cramSize: 6, history: [], text: {} };
  let W = 0, H = 0, geo = null;
  let pieces = [];
  let days = [];
  let timers = [];

  // ---------- content ----------
  function applyText() {
    const t = content.text || {};
    if (t.title) {
      document.getElementById('title').textContent = t.title;
      document.title = t.title;
    }
    document.getElementById('subtitle').textContent = t.subtitle || '';
    const banner = document.getElementById('banner');
    if (content.standIn && t.standInBanner) {
      banner.textContent = t.standInBanner;
      banner.hidden = false;
    }
    buttons.cram.textContent = 'Cram ' + content.cramSize + ' problems';
  }

  function sanitizeHistory(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(d => d && typeof d.date === 'string' && Number.isFinite(d.count) && d.count > 0)
      .map(d => ({ date: d.date, count: Math.min(Math.floor(d.count), 30) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---------- geometry ----------
  // Slots run left to right in rows that climb and lean, like a slanted
  // horizontal building. Every slot holds the same shape.
  function layout(n) {
    let w = Math.max(34, Math.min(90, W / 11));
    for (let tries = 0; tries < 30; tries++) {
      const h = w * 0.24;
      const stepX = w * 0.82;
      const rowShift = w * 0.38;
      const stepY = h * 2.3;
      const rise = h * 0.28;
      const margin = w * 0.7;
      const perRow = Math.max(3, Math.floor((W - 2 * margin - rowShift * 3) / stepX));
      const rows = Math.ceil(n / perRow);
      const height = rows * stepY + perRow * rise + h * 4;
      if (height < H * 0.9 || w <= 14) {
        return { w, h, stepX, rowShift, stepY, rise, margin, perRow };
      }
      w *= 0.88;
    }
    return null;
  }

  function slotPose(k) {
    const g = geo;
    const row = Math.floor(k / g.perRow);
    const col = k % g.perRow;
    const x = g.margin + col * g.stepX + (row % 4) * g.rowShift + g.w / 2;
    const y = H - g.h * 3 - row * g.stepY - col * g.rise;
    const a = -0.17 + (((k * 37) % 7) - 3) * 0.025; // canted, never square
    return { x, y, a };
  }

  function relayout() {
    const used = pieces.length;
    geo = layout(Math.max(used + 12, 36));
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    relayout();
  }

  // ---------- model ----------
  function seeded(n) {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  }

  function addDay(date, count, startAt) {
    const day = { date, count, held: 0, fell: 0 };
    days.push(day);
    for (let i = 0; i < count; i++) {
      const k = pieces.length;
      pieces.push({
        k,
        day,
        index: i,
        kind: i === 0 ? 'lock' : 'fall',
        t0: startAt + i * 110 * SPEED,
        fromY: H * (0.05 + 0.5 * seeded(k + 1)),
        fromA: (seeded(k + 7) - 0.5) * 2.4,
        jitter: seeded(k + 3),
        counted: false,
      });
    }
    if (needsRelayout()) relayout();
  }

  function needsRelayout() {
    if (!geo) return true;
    const last = slotPose(pieces.length + 2);
    return last.y < geo.h * 2;
  }

  function nextDate() {
    if (!days.length) return new Date().toISOString().slice(0, 10);
    const d = new Date(days[days.length - 1].date + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    pieces = [];
    days = [];
    relayout();
    updateStats();
    hoverEl.textContent = '';
  }

  function replay() {
    clearAll();
    const hist = sanitizeHistory(content.history);
    let t = 0;
    hist.forEach(d => {
      timers.push(setTimeout(() => addDay(d.date, d.count, performance.now()), t));
      t += 380 * SPEED + (d.count > 1 ? 160 * SPEED : 0);
    });
  }

  function updateStats() {
    const held = pieces.filter(p => p.kind === 'lock').length;
    const fell = pieces.filter(p => p.kind === 'fall').length;
    statEls.days.textContent = days.length;
    statEls.problems.textContent = pieces.length;
    statEls.held.textContent = held;
    statEls.fell.textContent = fell;
  }

  // ---------- drawing ----------
  const ease = t => 1 - Math.pow(1 - t, 3);

  function drawBar(x, y, a, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = color;
    ctx.fillRect(-geo.w / 2, -geo.h / 2, geo.w, geo.h);
    ctx.restore();
  }

  function drawGap(x, y, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = COLORS.gap;
    ctx.strokeRect(-geo.w / 2, -geo.h / 2, geo.w, geo.h);
    ctx.restore();
  }

  function drawBackdrop() {
    // A fixed Suprematist ground: a red disc and one long black diagonal.
    ctx.save();
    ctx.fillStyle = COLORS.red;
    ctx.globalAlpha = 0.9;
    const r = Math.min(W, H) * 0.06;
    ctx.beginPath();
    ctx.arc(W - r * 2, r * 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.92);
    ctx.lineTo(W, H * 0.28);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    drawBackdrop();
    if (!geo) { requestAnimationFrame(frame); return; }

    let statsDirty = false;
    for (const p of pieces) {
      const t = now - p.t0;
      if (t < 0) continue;
      const slot = slotPose(p.k);
      const startX = W + geo.w;

      if (p.kind === 'lock') {
        const u = Math.min(1, t / T_TRAVEL);
        const e = ease(u);
        const x = startX + (slot.x - startX) * e;
        const y = p.fromY + (slot.y - p.fromY) * e;
        const a = p.fromA + (slot.a - p.fromA) * e;
        drawBar(x, y, a, COLORS.ink, 1);
        if (u === 1 && !p.counted) { p.counted = true; p.day.held++; statsDirty = true; }
      } else {
        // Arrives near its slot but never settles, hovers, then falls slowly.
        const off = { x: (p.jitter - 0.5) * geo.w * 0.5, y: -geo.h * (1.2 + p.jitter), a: (p.jitter - 0.5) * 0.9 };
        const hx = slot.x + off.x, hy = slot.y + off.y, ha = slot.a + off.a;
        if (t < T_TRAVEL) {
          const e = ease(t / T_TRAVEL);
          drawBar(startX + (hx - startX) * e, p.fromY + (hy - p.fromY) * e, p.fromA + (ha - p.fromA) * e, COLORS.red, 1);
        } else if (t < T_TRAVEL + T_HOVER) {
          const s = (t - T_TRAVEL) / 1000;
          const wob = Math.sin(s * 9 + p.jitter * 6) * 0.06;
          drawBar(hx + Math.sin(s * 5) * 2, hy + Math.cos(s * 7) * 2, ha + wob, COLORS.red, 1);
        } else {
          drawGap(slot.x, slot.y, slot.a);
          const s = (t - T_TRAVEL - T_HOVER) / 1000 / SPEED;
          const y = hy + 160 * s * s;
          if (y < H + geo.w) {
            drawBar(hx + s * 30 * (p.jitter - 0.5), y, ha + s * (1.5 + p.jitter), COLORS.red, Math.max(0.25, 1 - s * 0.35));
          }
          if (!p.counted) { p.counted = true; p.day.fell++; statsDirty = true; }
        }
      }
    }
    if (statsDirty) updateStats();
    requestAnimationFrame(frame);
  }

  // ---------- hover readout ----------
  function onPointer(ev) {
    if (!geo) return;
    const r = canvas.getBoundingClientRect();
    const mx = ev.clientX - r.left, my = ev.clientY - r.top;
    let found = null;
    for (const p of pieces) {
      if (p.kind !== 'lock' || !p.counted) continue;
      const s = slotPose(p.k);
      const dx = mx - s.x, dy = my - s.y;
      const lx = dx * Math.cos(-s.a) - dy * Math.sin(-s.a);
      const ly = dx * Math.sin(-s.a) + dy * Math.cos(-s.a);
      if (Math.abs(lx) <= geo.w / 2 && Math.abs(ly) <= geo.h / 2 + 4) { found = p; break; }
    }
    if (found) {
      const d = found.day;
      hoverEl.textContent = d.date + ': ' + d.count + (d.count === 1 ? ' problem, held' : ' problems, 1 held, ' + (d.count - 1) + ' fell');
    } else {
      hoverEl.textContent = '';
    }
  }

  // ---------- wiring ----------
  buttons.practice.addEventListener('click', () => addDay(nextDate(), 1, performance.now()));
  buttons.cram.addEventListener('click', () => addDay(nextDate(), content.cramSize, performance.now()));
  buttons.replay.addEventListener('click', replay);
  buttons.reset.addEventListener('click', clearAll);
  canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('pointerleave', () => { hoverEl.textContent = ''; });
  new ResizeObserver(resize).observe(canvas);

  resize();
  requestAnimationFrame(frame);

  fetch('content.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      content = Object.assign(content, data);
      const n = parseInt(content.cramSize, 10);
      content.cramSize = Number.isFinite(n) && n > 1 ? Math.min(n, 30) : 6;
      applyText();
      if (!sanitizeHistory(content.history).length) buttons.replay.disabled = true;
      replay();
    })
    .catch(() => {
      applyText();
      buttons.replay.disabled = true;
      const banner = document.getElementById('banner');
      banner.textContent = 'Could not load content.json. Open this page through GitHub Pages or a local server.';
      banner.hidden = false;
    });
})();
