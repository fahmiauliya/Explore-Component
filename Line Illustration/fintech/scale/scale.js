/**
 * Scale: currency exchange as a balance. A beam on a post runs straight across the view, so level reads as
 * level; it carries two pans, each hung level on three strings. The left pan holds one large weight, so at
 * rest the beam tips down on the left. Three smaller weights (three currencies, each its own mass) wait in a
 * row along the plate's right-facing edge. Hover one and it lifts onto the right pan and the beam swings by
 * the masses: rate 1 still leans left, rate 2 nearly level, rate 3 exactly level.
 *
 * Hit areas are the small weights' RESTING spots on the plate, so the hover never drops while a weight is
 * up on the pan. Weights and beam follow critically damped springs; the beam answers the mass that lands.
 */
const { Cam, fit, proj, rad, spring, stepS, disposer, mk, pointer, register } = HL;

const Z0 = 5, CALM = { k: 60, c: 15.5 }, Q = Math.PI / 2, PLATE = { hx: 52, hy: 52, r: 12 };
// The beam runs square to the view, so a level beam is horizontal with both pans at one height. Each pan hangs
// on three strings: two at the front, 72° either side, wide enough that no weight on a pan ever touches one
// on screen, and one at the back, turned 20° off centre so it passes behind the weight beside its knob.
const L = 38, PIV = Z0 + 56, HS = 36, BR = 2, HUB = 3.4, POST = 2.2, PAN = { r: 16, rb: 14.5, d: 5 }, FOOT = { r: 10, h: 3 };
const BIG = { R: 8, H: 12, k: 3.4 }, CLR = 5, MAXTILT = 14;
// The three currencies, screen left to right, along the plate's right-facing edge, the last a pan clear of the
// right pan's footprint. m is each one's mass as a share of the large weight's: the beam's tilt is the rest
// tilt times what is left unbalanced, so only rate 3 levels it.
const SMALL = [{ at: [36, 37], R: 5, H: 7, k: 2.2, m: 0.4 }, { at: [36, 17.5], R: 6, H: 8.5, k: 2.6, m: 0.7 }, { at: [36, -2], R: 7, H: 10, k: 3, m: 1 }];
const sm = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rest = value;

  const C = Cam(45, 0.5, 1.95);
  const U3 = [Math.SQRT1_2, -Math.SQRT1_2, 0], V3 = [Math.SQRT1_2, Math.SQRT1_2, 0]; // screen right, and toward the viewer
  const dirOf = (deg) => { const t = (deg * Math.PI) / 180; return [Math.cos(t) * U3[0], Math.cos(t) * U3[1], Math.sin(t)]; }; // left end to right end
  const dm = dirOf(MAXTILT);
  fit(C, [[-PLATE.hx, -PLATE.hy, 0], [PLATE.hx, PLATE.hy, 0], [-PLATE.hx, PLATE.hy, 0], [PLATE.hx, -PLATE.hy, 0],
    [L * dm[0], L * dm[1], PIV + L * dm[2] + BR], [-L * dm[0], -L * dm[1], PIV - L * dm[2] - HS - PAN.d]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // the way to the viewer, from the camera itself; a sphere's outline is a circle square to it
  let w = x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]));
  w = unit(w[2] < 0 ? w.map((x) => -x) : w);
  const e1w = unit(x3(w, EZ)), e2w = x3(w, e1w);

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics (≤ 90°) project exactly.
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
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
  const ring = (c, e1, e2, r) => arc(c, e1, e2, r, 0, 4 * Q, true) + "Z";
  /** The outline of the solid between parallel circles (c0, r0) and (c1, r1) on axes e1 e2: an arc of each
   * and the two tangents, which touch both at one angle since the ellipses are homothetic. */
  function hull2(c0, r0, c1, r1, e1, e2) {
    const u = J(e1), v = J(e2), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), D = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(D, v), B = -cross(D, u), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 2 * Math.PI;
    return arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  // The plate: a rounded block; its screen extremes sit mid-corner, at FR and FR + π, and FR → FR + π is its near half.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  function rrect(hx, hy, r, z, f0, f1, move) {
    const cs = [[hx - r, -hy + r], [hx - r, hy - r], [-hx + r, hy - r], [-hx + r, -hy + r]];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A round solid standing on its foot: the silhouette, filled, and the near arc of its top as the one dim crease. */
  const drum = (c, r0, r1, h) => [hull2(c, r0, add(c, EZ, h), r1, EX, EY), arc(add(c, EZ, h), EX, EY, r1, FR, FR + 2 * Q, true)];
  /** A weight at c: a drum and a ball for its knob, one group; returns its parts so a draw can move them. */
  function weight(parent, spec) {
    const grp = mk("g", {}, parent);
    return { grp, body: mk("path", { class: "sil" }, grp), cr: mk("path", { class: "nf lo" }, grp), knob: mk("path", { class: "sil" }, grp), ...spec };
  }
  function drawWeight(wt, c) {
    const [sil, cr] = drum(c, wt.R, wt.R, wt.H);
    wt.body.setAttribute("d", sil); wt.cr.setAttribute("d", cr);
    wt.knob.setAttribute("d", ring(add(c, EZ, wt.H + wt.k * 0.7), e1w, e2w, wt.k));
  }

  const g = mk("g", {}, svg);
  mk("path", { d: rrect(PLATE.hx, PLATE.hy, PLATE.r, Z0, FR + Math.PI, FR + 2 * Math.PI, true) + rrect(PLATE.hx, PLATE.hy, PLATE.r, 0, FR, FR + Math.PI, false) + "Z", class: "sil" }, g);
  mk("path", { d: rrect(PLATE.hx - 1.6, PLATE.hy - 1.6, PLATE.r - 1.6, Z0, FR, FR + Math.PI, true), class: "nf lo" }, g);
  // back to front: the right pan, the stand, the left pan (all on the beam's plane), then the beam and its hub
  // over all six strings' ends; the small weights stand in front. A pan is its dish, its back string, what it
  // holds, and its two front strings, so the strings behind a weight hide behind it and the others pass clear.
  const pan = (spec) => { const p = { sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g), back: mk("path", { class: "nf" }, g) };
    if (spec) p.wt = weight(g, spec); p.front = mk("path", { class: "nf" }, g); return p; };
  const right = pan();
  mk("path", { d: drum([0, 0, Z0], FOOT.r, FOOT.r, FOOT.h)[0], class: "sil" }, g);
  mk("path", { d: hull2([0, 0, Z0 + FOOT.h], POST, [0, 0, PIV], POST, EX, EY), class: "sil" }, g);
  const left = pan(BIG), big = left.wt;
  const beam = mk("path", { class: "sil" }, g);
  mk("path", { d: ring([0, 0, PIV], e1w, e2w, HUB), class: "sil" }, g);
  const ws = SMALL.map((s) => ({ ...weight(g, s), sp: spring(0, CALM), key: "" }));

  /** The beam at deg degrees (right end up): its two ends, and the centre of each pan's rim. */
  const ends = (deg) => { const d = dirOf(deg), c = [0, 0, PIV]; return [add(c, d, -L), add(c, d, L)]; };
  const rimOf = (e) => add(e, EZ, -HS);
  function drawScale(deg) {
    const [el, er] = ends(deg), d = unit(add(er, el, -1)), dp = unit(add(d, w, -dot3(d, w))), n = unit(x3(w, dp));
    // the beam: a capsule square to the view, so its outline is two half circles and two straight sides
    beam.setAttribute("d", arc(er, n, dp, BR, 0, 2 * Q, true) + arc(el, n, dp, BR, 2 * Q, 4 * Q, false) + "Z");
    // the pans only translate: each stays level under its beam end, on three straight strings
    const str = (e, rim, a) => `M${f2(P(...e))}L${f2(P(...add(add(rim, U3, PAN.r * Math.sin(a)), V3, PAN.r * Math.cos(a))))}`;
    [[left, el], [right, er]].forEach(([p, e]) => {
      const rim = rimOf(e), [sil, cr] = drum(add(rim, EZ, -PAN.d), PAN.rb, PAN.r, PAN.d);
      p.sil.setAttribute("d", sil); p.cr.setAttribute("d", cr);
      p.back.setAttribute("d", str(e, rim, rad(200))); p.front.setAttribute("d", str(e, rim, rad(-72)) + str(e, rim, rad(72)));
    });
    drawWeight(big, rimOf(el));
  }
  /** Where a small weight is at s (0 on the plate, 1 on the right pan): it rises first, then glides over and settles. */
  function placeOf(wt, s, deg) {
    const pc = rimOf(ends(deg)[1]), a = sm(s / 0.5), b = sm((s - 0.4) / 0.6);
    return [wt.at[0] + (pc[0] - wt.at[0]) * b, wt.at[1] + (pc[1] - wt.at[1]) * b, Z0 + (pc[2] + CLR - Z0) * a - CLR * b];
  }

  const tilt = spring(rest, CALM);
  let drawn = NaN, order = "";
  const B = register(stage, (dt) => {
    let moving = false;
    ws.forEach((wt) => { moving = stepS(wt.sp, dt) || moving; });
    // the beam answers the mass that has landed on the right pan: tilt ∝ what is left unbalanced
    tilt.t = rest * (1 - Math.min(1, ws.reduce((m, wt) => m + wt.m * sm((wt.sp.x - 0.7) / 0.3), 0)));
    moving = stepS(tilt, dt) || moving;
    if (tilt.x !== drawn) { drawn = tilt.x; drawScale(tilt.x); }
    ws.forEach((wt) => {
      const key = wt.sp.x > 1e-4 ? `${wt.sp.x},${tilt.x}` : "rest";
      wt.pos = wt.sp.x > 1e-4 ? placeOf(wt, wt.sp.x, tilt.x) : [...wt.at, Z0];
      if (key !== wt.key) { wt.key = key; drawWeight(wt, wt.pos); }
    });
    // the small weights re-sort by depth as they travel, so the nearer one always covers the farther
    const ord = ws.slice().sort((a, b) => a.pos[0] + a.pos[1] - (b.pos[0] + b.pos[1]));
    const k = ord.map((wt) => wt.at[1]).join();
    if (k !== order) { order = k; ord.forEach((wt) => g.append(wt.grp)); }
    return moving;
  });
  bag.add(B.unregister);

  // hit test: nearest RESTING weight (its centre at mid-height on the plate), within HIT viewBox units
  const HIT = 24, spots = ws.map((wt) => P(wt.at[0], wt.at[1], Z0 + wt.H / 2));
  function hit([x, y]) {
    let best = -1, bd = HIT;
    spots.forEach((p, k) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = k; } });
    return best;
  }
  let act = -2;
  function choose(k) {
    if (k === act) return;
    act = k;
    ws.forEach((wt, i) => { wt.sp.t = i === k ? 1 : 0; [wt.body, wt.knob].forEach((el) => el.classList.toggle("hi", i === k)); });
    [big.body, big.knob].forEach((el) => el.classList.toggle("hi", k < 0)); // at rest the heavy weight is the bright mark
    read.textContent = k < 0 ? "rest" : `rate ${k + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { rest = Math.max(0, Math.min(MAXTILT, v)); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "scale",
  means: "A balance scale: hover a weight and it moves onto the pan until both sides are equal.",
  rules: [1, 5, 6, 8],
  range: [6, 10, 14],
  mount,
});
