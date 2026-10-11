/**
 * Magnet: a horseshoe magnet lying on a plate, poles toward six cubes scattered across it. Hover a
 * cube and it is pulled to the end of a row running out from between the poles, squared up; free
 * cubes lean toward the magnet, the nearer the more, and faint field lines between the poles grow
 * brighter with every lead. When the pointer leaves, every cube drifts back out.
 *
 * Hit areas stay at the cubes' RESTING footprints, so nothing flickers. Motion is critically damped
 * springs, plus a separation step each frame, so cubes never touch each other or the magnet.
 */
const { Cam, fit, proj, unproj, spring, stepS, disposer, mk, pointer, register } = HL;

const PLATE = { hx: 66, hy: 42, r: 10, h: 5 }, Z0 = PLATE.h;
// The magnet: a flat U, outer bend radius RO, inner RI, so both bends are concentric circles.
const RO = 21, RI = 11, XB = -37, XE = -11, T = 9, RC = 2.5, POLE = 8;
// Cubes: identical, rotated only about the vertical. Slots fill in order, out along the row.
const H = 4.5, CR = 1.4, PITCH = 12, GAP = 1.2, SLOT = (k) => [XE + 8.5 + k * PITCH, 0];
const HOME = [[-50, 33, 22], [-20, 36, -28], [38, 26, 38], [-26, -34, -34], [16, -27, 14], [52, -34, -16]];
const DRIFT = { k: 30, c: 2 * Math.sqrt(30) }, LEAN = 7, Q = Math.PI / 2;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pull = value;

  const C = Cam(45, 0.5, 1.85);
  fit(C, [[-PLATE.hx, -PLATE.hy, 0], [PLATE.hx, PLATE.hy, 0], [-PLATE.hx, PLATE.hy, 0], [PLATE.hx, -PLATE.hy, 0], [0, 0, Z0 + 2 * H]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0];
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
  // the way to the viewer, from the camera itself: its horizontal part decides which walls show
  const jx = [EX, EY, [0, 0, 1]].map((e) => J(e)[0]), jy = [EX, EY, [0, 0, 1]].map((e) => J(e)[1]);
  let w = [jx[1] * jy[2] - jx[2] * jy[1], jx[2] * jy[0] - jx[0] * jy[2], jx[0] * jy[1] - jx[1] * jy[0]];
  if (w[2] < 0) w = w.map((x) => -x);

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics project exactly.
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${f2(P(...at3(c, e1, e2, r, f0)))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${f2(P(...p0.map((x, j) => x + k * t0[j])))} ${f2(P(...p3.map((x, j) => x - k * t3[j])))} ${f2(P(...p3))}`;
    }
    return d;
  }

  // A closed outline in the ground plane as arcs {c, r, f0, f1} and lines {a, b}, region on the left.
  // A wall shows where its outward normal faces the viewer; arcs are split exactly where they turn away.
  const HW = Math.atan2(w[1], w[0]), face = (n) => n[0] * w[0] + n[1] * w[1] > 1e-9;
  const ptOf = (s, u) => s.a ? s.a.map((x, i) => x + u * (s.b[i] - x)) : [s.c[0] + s.r * Math.cos(s.f0 + u * (s.f1 - s.f0)), s.c[1] + s.r * Math.sin(s.f0 + u * (s.f1 - s.f0))];
  const nOf = (s) => { if (s.a) return [s.b[1] - s.a[1], s.a[0] - s.b[0]]; const f = (s.f0 + s.f1) / 2, g = Math.sign(s.f1 - s.f0); return [g * Math.cos(f), g * Math.sin(f)]; };
  const split = (segs) => segs.flatMap((s) => {
    if (s.a) return [s];
    const cuts = [];
    for (let k = -3; k <= 3; k++) for (const f of [HW + Q + 2 * Math.PI * k, HW - Q + 2 * Math.PI * k]) if ((f - s.f0) * (f - s.f1) < -1e-9) cuts.push(f);
    const fs = [s.f0, ...cuts.sort((a, b) => (a - b) * Math.sign(s.f1 - s.f0)), s.f1];
    return fs.slice(1).map((f, i) => ({ c: s.c, r: s.r, f0: fs[i], f1: f }));
  });
  const emit = (s, z, move, rev) => s.a ? `${move ? "M" : "L"}${f2(P(...(rev ? s.b : s.a), z))}L${f2(P(...(rev ? s.a : s.b), z))}`
    : arc([...s.c, z], EX, EY, s.r, rev ? s.f1 : s.f0, rev ? s.f0 : s.f1, move);
  /** A solid from its outline, z0 to z1: each run of visible wall (filled; its foot and turning edges stroked), then the top. */
  function solid(parent, segs, z0, z1) {
    let parts = split(segs);
    const first = parts.findIndex((s, i) => face(nOf(s)) && !face(nOf(parts[(i + parts.length - 1) % parts.length])));
    if (first > 0) parts = [...parts.slice(first), ...parts.slice(0, first)];
    for (let i = 0; i < parts.length; ) {
      if (!face(nOf(parts[i]))) { i++; continue; }
      const run = [];
      while (i < parts.length && face(nOf(parts[i]))) run.push(parts[i++]);
      const a = ptOf(run[0], 0), b = ptOf(run[run.length - 1], 1), foot = run.slice().reverse().map((s) => emit(s, z0, false, true)).join("");
      mk("path", { d: `${run.map((s, n) => emit(s, z1, !n, false)).join("")}L${f2(P(...b, z0))}${foot}Z`, class: "fo" }, parent);
      mk("path", { d: `M${f2(P(...b, z1))}L${f2(P(...b, z0))}${foot}L${f2(P(...a, z1))}`, class: "nf sil" }, parent);
    }
    return mk("path", { d: parts.map((s, n) => emit(s, z1, !n, false)).join("") + "Z", class: "sil" }, parent);
  }
  /** A rounded rectangle (half sizes hx, hy, corner r) turned by yaw about (cx, cy): four corner arcs joined by lines. */
  function rect(cx, cy, hx, hy, r, yaw = 0) {
    const c = Math.cos(yaw), s = Math.sin(yaw), qx = hx - r, qy = hy - r;
    const arcs = [[qx, -qy], [qx, qy], [-qx, qy], [-qx, -qy]].map(([u, v], i) => ({ c: [cx + u * c - v * s, cy + u * s + v * c], r, f0: yaw - Q + i * Q, f1: yaw + i * Q }));
    return arcs.flatMap((sg, i) => [sg, { a: ptOf(sg, 1), b: ptOf(arcs[(i + 1) % 4], 0) }]);
  }

  const g = mk("g", {}, svg);
  solid(g, rect(0, 0, PLATE.hx, PLATE.hy, PLATE.r), 0, Z0);
  // field lines between the poles, on the plate: faint at rest, brighter with every lead pulled in
  const RM = (RO + RI) / 2;
  const field = [11, 22, 34].map((rx) => mk("path", { d: arc([XE, 0, Z0], [rx / RM, 0, 0], EY, RM, -Q, Q, true), class: "nf dash lo" }, g));
  // the magnet: outer bend, arm, rounded pole end, inner side, inner bend, and back round the other arm
  const U = [{ c: [XB, 0], r: RO, f0: Q, f1: 3 * Q }, { a: [XB, -RO], b: [XE - RC, -RO] }, { c: [XE - RC, -RO + RC], r: RC, f0: -Q, f1: 0 },
    { a: [XE, -RO + RC], b: [XE, -RI - RC] }, { c: [XE - RC, -RI - RC], r: RC, f0: 0, f1: Q }, { a: [XE - RC, -RI], b: [XB, -RI] },
    { c: [XB, 0], r: RI, f0: 3 * Q, f1: Q }, { a: [XB, RI], b: [XE - RC, RI] }, { c: [XE - RC, RI + RC], r: RC, f0: -Q, f1: 0 },
    { a: [XE, RI + RC], b: [XE, RO - RC] }, { c: [XE - RC, RO - RC], r: RC, f0: 0, f1: Q }, { a: [XE - RC, RO], b: [XB, RO] }];
  // cubes beyond the magnet's far arm paint before it; the rest after it
  const behind = mk("g", {}, g);
  solid(g, U, Z0, Z0 + T);
  // the pole pieces: the last POLE of each arm, bright at rest, where the leads go
  const poles = [-1, 1].map((sg) => mk("path", { d: rect(XE - POLE / 2, (sg * (RO + RI)) / 2, POLE / 2, (RO - RI) / 2, RC).map((s, n) => emit(s, Z0 + T, !n, false)).join("") + "Z", class: "sil hi" }, g));

  // the cubes, re-sorted back to front as they move
  const layer = mk("g", {}, g);
  const cubes = HOME.map(([x, y, a], i) => ({ i, home: [x, y, (a * Math.PI) / 180], grp: mk("g", {}, behind), last: "", on: false,
    x: spring(x, DRIFT), y: spring(y, DRIFT), a: spring((a * Math.PI) / 180, DRIFT) }));
  let order = "", lit = -1, count = 0;
  function drawCube(c) {
    const key = [c.x.x, c.y.x, c.a.x].map((v) => v.toFixed(3)).join();
    if (key === c.last) return;
    c.last = key; c.grp.replaceChildren();
    c.top = solid(c.grp, rect(c.x.x, c.y.x, H, H, CR, c.a.x), Z0, Z0 + 2 * H);
    c.top.classList.toggle("hi", c.i === lit);
  }
  // Separation: along the line between two cubes each reaches its square's support; keep them apart by
  // both plus GAP. Keep every cube clear of the magnet's footprint, and on the plate.
  const reach = (c, t) => H * (Math.abs(Math.cos(t - c.a.x)) + Math.abs(Math.sin(t - c.a.x)));
  function separate() {
    for (let it = 0; it < 3; it++) {
      cubes.forEach((p, i) => cubes.slice(i + 1).forEach((q) => {
        const dx = q.x.x - p.x.x, dy = q.y.x - p.y.x, d = Math.hypot(dx, dy) || 1e-6, t = Math.atan2(dy, dx), need = reach(p, t) + reach(q, t) + GAP;
        if (d < need) { const m = (need - d) / 2; p.x.x -= (dx / d) * m; p.y.x -= (dy / d) * m; q.x.x += (dx / d) * m; q.y.x += (dy / d) * m; }
      }));
      cubes.forEach((c) => {
        const m = H * Math.SQRT2 + GAP;
        if (c.x.x < XE + m && c.x.x > XB - RO - m && Math.abs(c.y.x) < RO + m) {
          const ox = XE + m - c.x.x, oy = RO + m - Math.abs(c.y.x);
          if (ox < oy) c.x.x += ox; else c.y.x += Math.sign(c.y.x || 1) * oy;
        }
        c.x.x = Math.max(-PLATE.hx + m, Math.min(PLATE.hx - m, c.x.x)); c.y.x = Math.max(-PLATE.hy + m, Math.min(PLATE.hy - m, c.y.x));
      });
    }
  }

  const B = register(stage, (dt) => {
    let moving = false;
    cubes.forEach((c) => { for (const s of [c.x, c.y, c.a]) moving = stepS(s, dt) || moving; });
    separate();
    cubes.forEach(drawCube);
    // far side of the magnet (short of its pole ends, beyond its far arm): behind it; then back to front
    const far = (c) => c.y.x < 0 && c.x.x < XE + H * Math.SQRT2;
    const sorted = cubes.slice().sort((p, q) => p.x.x + p.y.x - (q.x.x + q.y.x)), key = sorted.map((c) => c.i + (far(c) ? "b" : "f")).join();
    if (key !== order) { order = key; sorted.forEach((c) => (far(c) ? behind : layer).append(c.grp)); }
    return moving;
  });
  bag.add(B.unregister);

  /** Aims cube c's springs: its slot (firm), a lean toward the poles falling off with distance (gentle), or home (soft). */
  function aim(c, mode) {
    const [hx, hy, ha] = c.home, d = Math.hypot(hx - XE, hy), lean = (LEAN * Math.exp(-d / 45)) / d;
    const [x, y, a] = mode === "in" ? [...SLOT(c.slot), 0] : mode === "lean" ? [hx + (XE - hx) * lean, hy - hy * lean, ha] : [hx, hy, ha];
    const k = mode === "in" ? pull : mode === "lean" ? pull * 0.3 : DRIFT.k;
    for (const [s, t] of [[c.x, x], [c.y, y], [c.a, a]]) { s.t = t; s.k = k; s.c = 2 * Math.sqrt(k); }
  }
  function light(i) {
    lit = i;
    cubes.forEach((c) => c.top?.classList.toggle("hi", c.i === i));
    poles.forEach((p) => p.classList.toggle("hi", i < 0));
    field.forEach((f, j) => { f.classList.toggle("lo", count <= 2 * j); f.classList.toggle("sil", count > 2 * j + 1); });
  }
  // hit test: the pointer on the plane of the cubes' tops, against their RESTING footprints
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, Z0 + 2 * H);
    return cubes.findIndex((c) => { const [x, y, a] = c.home, u = (wx - x) * Math.cos(a) + (wy - y) * Math.sin(a), v = -(wx - x) * Math.sin(a) + (wy - y) * Math.cos(a);
      return !c.on && Math.abs(u) < H + 2 && Math.abs(v) < H + 2; });
  }

  bag.add(pointer(stage, {
    move: (p) => {
      const i = hit(p);
      if (i >= 0) { Object.assign(cubes[i], { on: true, slot: count++ }); light(i); read.textContent = `lead ${count}`; }
      cubes.forEach((c) => aim(c, c.on ? "in" : "lean")); B.wake();
    },
    leave: () => { count = 0; cubes.forEach((c) => { c.on = false; aim(c, "home"); }); light(-1); read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set: (v) => { pull = v; }, destroy: bag.dispose };
}

hairline({
  name: "magnet",
  means: "A horseshoe magnet and six cubes: hover a cube and it snaps into a row before the poles; let go and they drift back out.",
  rules: [1, 4, 5, 8],
  range: [70, 140, 240],
  mount,
});
