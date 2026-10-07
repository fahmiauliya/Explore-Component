/**
 * Megaphone: a megaphone on a plinth sending four sound rings out of its mouth. The ring under the
 * pointer moves out and takes the bright edge; its neighbours are carried with it, less the farther
 * they are. Where the pointer is along the rings is read against their resting centres and followed
 * by a spring, so the set moves as one and never flickers. The slider is how far the ring travels.
 */
const {
  Cam, clamp, fit, hull, proj,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const ZC = 38, BACK = -34, MOUTH = 12, R0 = 6, RM = 19, LIP = 2.2;
const N = 4, RW = 2.4;
// The falloff, in rings: wider outwards, so the rings ahead make room and no gap closes past a third.
const REACH_OUT = 1.15, REACH_IN = 0.9;
// Critically damped (c = 2√k): a soft, calm settle with no overshoot.
const CALM = { k: 60, c: 15.5 };
// The axis points to the right on screen, turned 25° toward the viewer, so the rings read as arcs.
const TURN = (-20 * Math.PI) / 180, CT = Math.cos(TURN), ST = Math.sin(TURN);
// Rest: wider and farther apart the farther out; at the farthest push no gap closes past a third.
const RX = [24, 40, 57, 75], RR = [21, 25.5, 30.5, 36];
const PLINTH = { x0: -36, y0: -16, x1: 14, y1: 26, h: 7 };
const GRIP = { a: -10, w: 4.5 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let push = value;

  /** The world point at `a` along the axis, `u` across it on the ground, `v` up from the axis. */
  const W = (a, u, v) => [a * CT - u * ST, a * ST + u * CT, ZC + v];
  const C = Cam(45, 0.5, 2.15);
  const far = RX[N - 1] + 12, Rn = RR[N - 1];
  fit(C, [
    [PLINTH.x0, PLINTH.y0, 0], [PLINTH.x1, PLINTH.y1, 0], [PLINTH.x0, PLINTH.y1, 0], [PLINTH.x1, PLINTH.y0, 0], W(BACK, 0, R0),
    W(far, Rn, 0), W(far, -Rn, 0), W(far, 0, Rn), W(far, 0, -Rn), W(RX[0], 0, RR[0]),
  ], 200, 166);
  const P = proj(C);
  // a circle across the axis as screen points: only for the hit box
  const circle = (a, r, n = 48) => Array.from({ length: n }, (_, k) => P(...W(a, r * Math.cos((k / n) * 2 * Math.PI), r * Math.sin((k / n) * 2 * Math.PI))));

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics project exactly.
  const O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`;
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
  /** A circular arc in the world (centre c, unit axes e1 e2) from f0 to f1, in ≤ 90° cubics; `M` starts a path, else a line joins it. */
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / (Math.PI / 2) - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${f2(P(...at3(c, e1, e2, r, f0)))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${f2(P(...p0.map((x, j) => x + k * t0[j])))} ${f2(P(...p3.map((x, j) => x - k * t3[j])))} ${f2(P(...p3))}`;
    }
    return d;
  }

  // circles across the axis: u along the ground, v straight up
  const EU = [-ST, CT, 0], EV = [0, 0, 1], U = J(EU), V = J(EV);
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1], K = cross(U, V);
  const ring = (a, r, f0, f1, move) => arc(W(a, 0, 0), EU, EV, r, f0, f1, move);
  const R2 = (f) => [Math.cos(f) * U[0] + Math.sin(f) * V[0], Math.cos(f) * U[1] + Math.sin(f) * V[1]];
  // The outline of a cone between two parallel circles: an arc of each and two tangents, touching both
  // at one angle f (homothetic ellipses): A cos f + B sin f = −Δr·K. Also returns the near rim's arc.
  function solidOf(a0, r0, a1, r1) {
    const C0 = P(...W(a0, 0, 0)), C1 = P(...W(a1, 0, 0)), D = [C1[0] - C0[0], C1[1] - C0[1]];
    const A = cross(D, V), B = -cross(D, U), base = Math.atan2(B, A), w = Math.acos(clamp((-(r1 - r0) * K) / Math.hypot(A, B), -1, 1));
    // the arc of circle 1 on the outline is the one whose midpoint's support beats circle 0's
    const on1 = (f) => {
      const t = [-Math.sin(f) * U[0] + Math.cos(f) * V[0], -Math.sin(f) * U[1] + Math.cos(f) * V[1]];
      let n = [t[1], -t[0]];
      if (dot(n, R2(f)) < 0) n = [-n[0], -n[1]];
      const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, U), dot(n, V));
      return h(C1, r1) >= h(C0, r0);
    };
    const s = on1(base) ? base - w : base + w, e = on1(base) ? base + w : base - w + 2 * Math.PI;
    return [ring(a1, r1, s, e, true) + ring(a0, r0, e, s + 2 * Math.PI, false) + "Z", [e, s + 2 * Math.PI]];
  }

  // rounded rectangles on the ground, corners as true arcs; the screen's extremes sit mid-corner
  const FR = Math.atan2(J([0, 1, 0])[0], J([1, 0, 0])[0]), EX = [1, 0, 0], EY = [0, 1, 0];
  function rrect(x0, y0, x1, y1, r, z, f0, f1, move) {
    const cs = [[x1 - r, y0 + r], [x1 - r, y1 - r], [x0 + r, y1 - r], [x0 + r, y0 + r]];
    let d = "", f = f0, first = move; // corner i spans [−90° + 90°i, 90°i]
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Math.PI / 2) / (Math.PI / 2) + 1e-9), stop = Math.min(f1, -Math.PI / 2 + (Math.PI / 2) * (i + 1));
      d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first);
      first = false; f = stop;
    }
    return d;
  }
  /** A rounded block from z0 to z1: its silhouette (back of the top, front of the foot) and one crease, inset b on the top. */
  function block(parent, x0, y0, x1, y1, r, b, z0, z1) {
    mk("path", { d: rrect(x0, y0, x1, y1, r, z1, FR + Math.PI, FR + 2 * Math.PI, true) + rrect(x0, y0, x1, y1, r, z0, FR, FR + Math.PI, false) + "Z", class: "sil" }, parent);
    mk("path", { d: rrect(x0 + b, y0 + b, x1 - b, y1 - b, r - b, z1, FR, FR + Math.PI, true), class: "nf lo" }, parent);
  }

  // Rings and the lip are rolled, round-section bands: the outline is the centre ellipse offset in
  // screen, so both edges stay evenly spaced all the way round and never narrow into a double line.
  // Each offset is one cubic per 45° with exact end tangents (Hermite).
  const TUBE = (RW / 2) * Math.hypot(...J([Math.SQRT1_2, -Math.SQRT1_2, 0]));
  function offset(c, r, d, f0, f1) {
    const pt = (f) => { const e = R2(f), t = [-Math.sin(f) * U[0] + Math.cos(f) * V[0], -Math.sin(f) * U[1] + Math.cos(f) * V[1]];
      const l = Math.hypot(...t), n = dot([t[1], -t[0]], e) > 0 ? [t[1] / l, -t[0] / l] : [-t[1] / l, t[0] / l];
      return [c[0] + r * e[0] + d * n[0], c[1] + r * e[1] + d * n[1]]; };
    const dp = (f) => { const a = pt(f - 1e-4), b = pt(f + 1e-4); return [(b[0] - a[0]) / 2e-4, (b[1] - a[1]) / 2e-4]; };
    let out = `M${f2(pt(f0))}`;
    for (let k = 0, h = (f1 - f0) / 8; k < 8; k++) {
      const a = f0 + k * h, b = a + h, pa = pt(a), pb = pt(b), ta = dp(a), tb = dp(b);
      out += `C${f2([pa[0] + (h / 3) * ta[0], pa[1] + (h / 3) * ta[1]])} ${f2([pb[0] - (h / 3) * tb[0], pb[1] - (h / 3) * tb[1]])} ${f2(pb)}`;
    }
    return out + "Z";
  }
  const g = mk("g", {}, svg);

  // back to front: the plinth, the grip standing on it, the mouthpiece, then the bell
  block(g, PLINTH.x0, PLINTH.y0, PLINTH.x1, PLINTH.y1, 8, 1.6, 0, PLINTH.h);
  const [gx, gy] = W(GRIP.a, 0, 0);
  block(g, gx - GRIP.w, gy - GRIP.w, gx + GRIP.w, gy + GRIP.w, 3, 1, PLINTH.h, ZC - 6);
  mk("path", { d: solidOf(BACK, 4.5, BACK + 10, 5.5)[0], class: "sil" }, g);
  const [bell, [m0, m1]] = solidOf(BACK + 10, R0, MOUTH, RM);
  mk("path", { d: bell, class: "sil" }, g);
  // the mouth faces the viewer: the near half of its rim (the far half is the outline), and the lip's opening
  mk("path", { d: ring(MOUTH, RM, m0, m1, true), class: "nf" }, g);
  const lip = mk("path", { d: offset(P(...W(MOUTH, 0, 0)), RM - LIP / 2, -(LIP / 2) * (TUBE / (RW / 2)), 0, 2 * Math.PI), class: "nf hi" }, g);

  // each ring one path, filled with the plate: its outer edge, and its inner edge wound the other way
  const layer = mk("g", {}, g);
  const ringsOut = RR.map((r) => ({ r, last: NaN, band: mk("path", { class: "sil" }, layer) }));
  function drawRing(rg, x) {
    const c = P(...W(x, 0, 0)), rc = rg.r - RW / 2;
    rg.band.setAttribute("d", offset(c, rc, TUBE, 0, 2 * Math.PI) + offset(c, rc, -TUBE, 2 * Math.PI, 0));
  }

  // where the pointer is along the rings (0 to N - 1), and how much it is there at all (0 to 1)
  const focus = spring(0, CALM), amount = spring(0, CALM);
  /** How far ring i travels: a falloff from the focus, the ring nearest it most. */
  const travel = (i) => {
    const d = i - focus.x, s = d > 0 ? REACH_OUT : REACH_IN;
    return push * amount.x * Math.exp(-(d * d) / (2 * s * s));
  };
  let order = "", lit = -2;
  const B = register(stage, (dt) => {
    const moving = stepS(focus, dt) | stepS(amount, dt);
    ringsOut.forEach((rg, i) => {
      const x = RX[i] + travel(i);
      if (x !== rg.last) { drawRing(rg, x); rg.last = x; }
    });
    // the bright edge rides the spring, not the pointer, and the strokes fade between
    const on = amount.x > 0.15 ? clamp(Math.round(focus.x), 0, N - 1) : -1;
    if (on !== lit) {
      lit = on;
      ringsOut.forEach((rg, i) => rg.band.classList.toggle("hi", i === on));
      lip.classList.toggle("hi", on < 0); // at rest the lip is bright: where the sound starts
    }
    // nearer rings paint later: coaxial rings cross with the one farther along the axis in front
    const sorted = ringsOut.slice().sort((a, b) => a.last - b.last), key = sorted.map((rg) => ringsOut.indexOf(rg)).join();
    if (key !== order) { order = key; sorted.forEach((rg) => layer.append(rg.band)); }
    return Boolean(moving);
  });
  bag.add(B.unregister);

  // hit test: the pointer read against the rings' RESTING centres, inside the box of their resting circles
  const centres = RX.map((x) => P(...W(x, 0, 0))[0]);
  const box = hull(RX.flatMap((x, i) => circle(x, RR[i], 24)));
  const xs = box.map((p) => p[0]), ys = box.map((p) => p[1]);
  const [bx0, bx1, by0, by1] = [Math.min(...xs) - 4, Math.max(...xs) + 4, Math.min(...ys) - 4, Math.max(...ys) + 4];
  /** The pointer's place along the rings, as a fractional ring index; -1 outside them. */
  function along([x, y]) {
    if (x < bx0 || x > bx1 || y < by0 || y > by1) return -1;
    if (x <= centres[0]) return 0;
    for (let i = 0; i < N - 1; i++) if (x <= centres[i + 1]) return i + (x - centres[i]) / (centres[i + 1] - centres[i]);
    return N - 1;
  }

  /** Follows the pointer to f (-1 lets every ring settle back together). */
  function follow(f) {
    if (f >= 0) focus.t = f;
    if (f >= 0 && amount.x < 0.01) { focus.x = f; focus.v = 0; } // from rest: nothing is out, nothing jumps
    amount.t = f >= 0 ? 1 : 0;
    read.textContent = f < 0 ? "rest" : `ring ${Math.round(f) + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => follow(along(p)), leave: () => follow(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set: (v) => { push = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "megaphone",
  means: "A megaphone sends out four rings: the ring under the pointer travels out and brightens, and the rest pull back to the mouth.",
  rules: [1, 2, 4, 5],
  range: [5, 8, 11],
  mount,
});
