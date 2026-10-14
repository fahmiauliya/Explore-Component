/**
 * Ladder: a five-rung ladder leans on a wall as tall as itself, standing at the back of a small plate; its rails end on
 * the wall's top edge. A pawn stands on rung 1. Hover a rung and the pawn climbs to it, rung by rung, with a small step
 * over each; the rung it stands on takes the bright stroke and the rungs below it a middle one. On leave it climbs back
 * down to rung 1.
 *
 * Hit areas are the rungs where they lie, read on the ladder's own plane, so the climbing pawn can never change
 * what the pointer is over. The pawn follows one critically damped spring, so gliding between rungs is one climb.
 */
const { Cam, clamp, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, A = (68 * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A), Z0 = 3.5;
// the ladder: two rails HALF either side of y = 0, rising from the foot at x = FX to their top ends on the wall's top
// edge at LEN; five rungs SP apart along them, each one line.
const FX = 2, HALF = 10, RR = 1.5, S1 = 7, SP = 9, N = 5, LEN = S1 + (N - 1) * SP + 3.5;
// the pawn, the Marketing spotlight's construction at F times its size, centred on a rung: its base just on the rung's
// line (RG) and OFF in front of it, so at rung 5 it stays clear of the wall's face
const F = 1.3, RG = 0.3, OFF = 1.2, CALM = { k: 60, c: 15.5 };
const NAMES = ["poor", "fair", "good", "very good", "excellent"];
const axis = (s) => [FX - s * CA, 0, Z0 + 0.6 + s * SA];
// the wall's top front edge is where the rails' top ends rest, one rail radius off their axis. Its long edges run parallel
// to the rungs on screen; S1, SP and LEN keep its foot and its top edge 14 viewBox units from every rung.
const WX = FX - LEN * CA - RR * SA, WTOP = Z0 + 0.6 + LEN * SA - RR * CA, WALL = { x0: WX - 6, x1: WX, hy: 16, r: 2.4 };
const PLATE = { x0: WALL.x0 - 5, x1: FX + 9, hy: 19, r: 7 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hop = value;

  const C = Cam(45, 0.5, 3.85);
  const p5 = axis(S1 + (N - 1) * SP), pawnTop = [p5[0] + OFF, 0, p5[2] + RG + 10.8 * F];
  fit(C, [[PLATE.x0, -PLATE.hy, 0], [PLATE.x1, PLATE.hy, 0], [PLATE.x0, PLATE.hy, 0], [PLATE.x1, -PLATE.hy, 0],
    [WALL.x0, -WALL.hy, WTOP], [WALL.x0, WALL.hy, WTOP], axis(LEN), pawnTop], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  // the way to the viewer, from the camera itself: a sphere's outline is the circle square to it
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const W1 = unit(x3(w, EZ)), W2 = x3(w, W1), FR = Math.atan2(J(EY)[0], J(EX)[0]);
  const D = [-CA, 0, SA], NL = [SA, 0, CA]; // up the ladder, and out of its plane

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics of 90° or less project exactly.
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${pt(at3(c, e1, e2, r, f0))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${pt(p0.map((x, j) => x + k * t0[j]))} ${pt(p3.map((x, j) => x - k * t3[j]))} ${pt(p3)}`;
    }
    return d;
  }
  const ring = (c, e1, e2, r) => arc(c, e1, e2, r, 0, 4 * Q, true) + "Z";
  /** The outline of the solid between two parallel circles (c0, r0) and (c1, r1) in the plane e1 e2: an arc of each
   * and the two tangents. The two ellipses are homothetic, so both tangents touch them at one angle. */
  function solid(c0, r0, c1, r1, e1, e2) {
    const U = J(e1), V = J(e2), K = cross(U, V), p0 = P(...c0), p1 = P(...c1), Dd = [p1[0] - p0[0], p1[1] - p0[1]];
    const Aa = cross(Dd, V), B = -cross(Dd, U), base = Math.atan2(B, Aa), s = Math.acos(clamp((-(r1 - r0) * K) / (Math.hypot(Aa, B) || 1e-9), -1, 1));
    const R2 = (f) => [Math.cos(f) * U[0] + Math.sin(f) * V[0], Math.cos(f) * U[1] + Math.sin(f) * V[1]];
    const on1 = (f) => { const t = [-Math.sin(f) * U[0] + Math.cos(f) * V[0], -Math.sin(f) * U[1] + Math.cos(f) * V[1]]; let n = [t[1], -t[0]];
      if (dot(n, R2(f)) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, U), dot(n, V)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 4 * Q;
    return arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 4 * Q, false) + "Z";
  }
  /** A box with rounded vertical corners from z0 to z1: its silhouette, and the front edge of its top as the crease. */
  function box({ x0, x1, hy, r }, z0, z1) {
    const cs = [[x1 - r, -hy + r], [x1 - r, hy - r], [x0 + r, hy - r], [x0 + r, -hy + r]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)), q = cs[((i % 4) + 4) % 4];
        d += arc([q[0], q[1], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(z1, FR + 2 * Q, FR + 4 * Q, true) + run(z0, FR, FR + 2 * Q, false) + "Z", run(z1, FR, FR + 2 * Q, true)];
  }
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // back to front: the plate, the wall, the rungs, the far rail, the pawn, the near rail. Each rung is one stroke from
  // rail axis to rail axis, so the rails cover its ends; the pawn stands between the rails, in front of every rung.
  const g = mk("g", {}, svg);
  box(PLATE, 0, Z0).forEach((d, i) => path(g, d, i ? "nf lo" : "sil"));
  box(WALL, Z0, WTOP).forEach((d, i) => path(g, d, i ? "nf lo" : "sil"));
  const rungAt = (k) => S1 + k * SP;
  const rungs = Array.from({ length: N }, (_, k) => { const c = axis(rungAt(k));
    return path(g, `M${pt(add(c, EY, -HALF))}L${pt(add(c, EY, HALF))}`, "nf"); });
  const rail = (y) => solid(add(axis(0), EY, y), RR, add(axis(LEN), EY, y), RR, EY, NL);
  path(g, rail(-HALF), "sil");
  const pawn = mk("g", {}, g), parts = [0, 1, 2].map(() => path(pawn, "", "sil"));
  path(g, rail(HALF), "sil");

  // where the pawn stands at s: k on rung k + 1; between two rungs on the straight line, lifted by a step
  const stand = (k) => add(axis(rungAt(k)), [OFF, 0, RG]);
  function pose(s) {
    const i = Math.min(N - 2, Math.floor(s)), f = s - i, a = stand(i), b = stand(i + 1);
    return add(add(a, add(b, a, -1), f), EZ, hop * Math.sin(Math.PI * f));
  }
  function drawPawn(p) {
    const c = (h) => add(p, EZ, h * F);
    parts[0].setAttribute("d", solid(c(0), 3 * F, c(1.2), 3 * F, EX, EY));
    parts[1].setAttribute("d", solid(c(1.2), 1.7 * F, c(7), 1 * F, EX, EY));
    parts[2].setAttribute("d", ring(c(8.7), W1, W2, 2.1 * F));
  }

  const s = spring(0, CALM);
  let last = "", lit = -1;
  const B = register(stage, (dt) => {
    const moving = stepS(s, dt), x = clamp(s.x, 0, N - 1), key = x.toFixed(4) + "|" + hop;
    if (key !== last) { last = key; drawPawn(pose(x)); }
    // the bright rung follows the pawn, not the pointer: the one it is on, the ones below a middle tone
    const on = Math.round(x);
    if (on !== lit) { lit = on; rungs.forEach((el, k) => el.setAttribute("class", k === on ? "nf hi" : k < on ? "nf sil" : "nf")); }
    return moving;
  });
  bag.add(B.unregister);

  // hit test: the pointer read on the ladder's plane, against the rungs' RESTING places along it: one band across each
  // rung, rail to rail, split halfway between rungs, so the bands run from the foot to the top without a gap
  const U = J(D), V = J(EY), det = cross(U, V), F0 = P(...axis(0));
  function hit([sx, sy]) {
    const q = [sx - F0[0], sy - F0[1]], u = cross(q, V) / det, y = cross(U, q) / det;
    if (Math.abs(y) > HALF + RR || u < 0 || u > LEN) return -1;
    return clamp(Math.round((u - S1) / SP), 0, N - 1);
  }
  let act = -2;
  function choose(k) {
    if (k === act) return;
    act = k; s.t = Math.max(0, k);
    read.textContent = NAMES[Math.max(0, k)];
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { hop = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "ladder",
  means: "A five-rung ladder: hover a rung and the figure climbs, like a credit score built step by step.",
  rules: [1, 4, 5, 8],
  range: [0, 1.5, 3],
  mount,
});
