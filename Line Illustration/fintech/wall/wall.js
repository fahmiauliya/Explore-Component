/**
 * Wall: a low wall of twelve identical bricks on a long plate, four courses of three in a running bond, its
 * face toward the lower right. A flagpole stands on the plate past the wall's far end, its small flag down.
 * Four marker dots sit on the plate's front side. Hover marker 1–4: the wall builds up to that course, brick
 * by brick, each brick dropping into place from just above; at course 4 the flag runs up the pole. On leave
 * the bricks lift away, the last laid first, back to the two bricks of rest. The slider is the stagger, in ms.
 *
 * Hit areas are four fixed bands along the plate's side, which never moves, so nothing flickers. Every curve
 * is a true Bézier: world arcs as cubics of 90° or less, projected control point by control point.
 */
const { Cam, fit, proj, tween, tset, tval, tdone, disposer, mk, pointer, register } = HL;

// Bricks: L long (along y), D deep (along x), H tall, corner R, a joint G between the bricks of a course.
// Courses stack with no gap, so a brick's foot lies on the crease of the brick below: one line, never two.
const L = 13, D = 6.5, H = 4.5, R = 0.9, G = 0.6, N = 3, COURSES = 4, Q = Math.PI / 2;
const Z0 = 5, DROP = 9, REST = 2; // the plate's thickness; how far above its place a brick starts; bricks laid at rest
// Each course's bricks, nearest (+y, front left) first; courses 2 and 4 shift half a brick toward the flag.
const YC = (c, k) => (1 - k) * (L + G) + (c % 2 ? -1 : 1) * (L + G) / 4, YMIN = YC(1, 2) - L / 2;
// The flagpole stands past the far end of the wall; the flag flies away from the wall, along −y.
const PY = YMIN - 6.5, FW = 9, FH = 6, ZTOP = Z0 + COURSES * H + 8, FLO = Z0 + 2, FHI = ZTOP - 1.5 - FH;
const PLATE = { x0: -6.5, x1: 9, y0: PY - FW - 4.5, y1: YC(0, 0) + L / 2 + 5, r: 5 };
const MARK = [18, 5, -8, -21], MR = 1.25, NAMES = ["rest", "course 1", "course 2", "course 3", "goal"];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;

  const C = Cam(45, 0.5, 4.3);
  const { x0, x1, y0, y1 } = PLATE;
  fit(C, [[x0, y0, 0], [x1, y1, 0], [x0, y1, 0], [x1, y0, 0], [x0, y0, Z0], [0, PY - FW, ZTOP], [0, YMIN, Z0 + COURSES * H + DROP]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);

  // A world arc as cubics of at most 90°, handles k = 4/3·tan(Δ/4)·r: the camera is affine, so it projects exactly.
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
  /** A run of a rounded rectangle's outline in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, from angle f0 up to f1. */
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0, f1, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  // The screen's left and right extremes of a horizontal round sit at FR and FR + π: split outlines there.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  /** A rounded box from z0 to z1: [its silhouette, one filled path; the front edge of its top, the crease]. */
  function box(rect, r, z0, z1) {
    const top = [0, 0, z1], foot = [0, 0, z0];
    return [rr(top, EX, EY, rect, r, FR + 2 * Q, FR + 4 * Q) + rr(foot, EX, EY, rect, r, FR, FR + 2 * Q, false) + "Z", rr(top, EX, EY, rect, r, FR, FR + 2 * Q)];
  }
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // back to front: the plate and its marker dots, the pole and its flag (past the far end), then the wall
  const g = mk("g", {}, svg), [ps, pc] = box([x0, y0, x1, y1], PLATE.r, 0, Z0);
  path(g, ps, "sil"); path(g, pc, "nf lo");
  const marks = MARK.map((y) => path(g, arc([x1, y, Z0 / 2], EY, EZ, MR, 0, 4 * Q, true) + "Z", "dot m"));
  path(g, `M${pt([0, PY, Z0])}L${pt([0, PY, ZTOP])}`, "nf sil");
  const flag = path(g, "", "sil");

  // the bricks, painted course by course from the bottom, and in a course from the far end (−y) forward;
  // each knows its place in the build order: course by course, the nearest brick of each course first
  const bricks = [];
  for (let c = 0; c < COURSES; c++) for (let k = N - 1; k >= 0; k--) {
    const grp = mk("g", {}, g), j = c * N + k;
    bricks[j] = { c, y: YC(c, k), z: Z0 + c * H, sil: path(grp, "", "sil"), cr: path(grp, "", "nf lo"), tw: tween(j < REST ? 1 : 0), last: NaN };
  }
  /** Brick b at p of its way down: it drops the last DROP into its place, reaching full size early in the fall. */
  function drawBrick(b, p) {
    if (p < 0.01) { b.sil.setAttribute("d", ""); b.cr.setAttribute("d", ""); return; }
    const s0 = Math.min(1, 0.35 + 1.6 * p), hx = (D / 2) * s0, hy = (L / 2) * s0, hz = (H / 2) * s0, cz = b.z + H / 2 + (1 - p) * DROP;
    const [s, c] = box([-hx, b.y - hy, hx, b.y + hy], R * s0, cz - hz, cz + hz);
    b.sil.setAttribute("d", s); b.cr.setAttribute("d", c);
  }
  const fl = tween(0);
  let flast = NaN;
  function drawFlag(f) {
    const z = FLO + (FHI - FLO) * f;
    flag.setAttribute("d", rr([0, 0, 0], EY, EZ, [PY - FW, z, PY, z + FH], 1, 0, 4 * Q) + "Z");
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    bricks.forEach((b) => {
      const p = tval(b.tw, now);
      if (p !== b.last) { b.last = p; drawBrick(b, p); }
      if (!tdone(b.tw, now)) moving = true;
    });
    const f = tval(fl, now);
    if (f !== flast) { flast = f; drawFlag(f); }
    return moving || !tdone(fl, now);
  });
  bag.add(B.unregister);

  // hit test: the pointer on the plate's front side plane (x = x1), which never moves; the nearest marker wins
  const ey = J(EY), ez = J(EZ), det = ey[0] * ez[1] - ey[1] * ez[0], S0 = P(x1, 0, 0);
  function hit([sx, sy]) {
    const dx = sx - S0[0], dy = sy - S0[1], y = (dx * ez[1] - dy * ez[0]) / det, z = (ey[0] * dy - ey[1] * dx) / det;
    if (z < -5 || z > Z0 + 3 || y < y0 || y > y1) return -1;
    return MARK.reduce((best, m, i) => (Math.abs(y - m) < Math.abs(y - MARK[best]) ? i : best), 0);
  }
  let act = -2, laid = REST;
  /** Builds up to course k (−1 is rest): new bricks drop in one after another in build order; bricks no longer
   * wanted lift away, the last laid first. The flag goes up once the top course is in, and down at once. */
  function choose(k) {
    if (k === act) return;
    act = k;
    const now = performance.now(), want = k < 0 ? REST : (k + 1) * N;
    bricks.forEach((b, j) => {
      const delay = j >= laid ? (j - laid) * step : (laid - 1 - j) * step;
      tset(b.tw, j < want ? 1 : 0, now, Math.max(0, delay));
      b.sil.classList.toggle("hi", k >= 0 && k < COURSES - 1 && b.c === k);
    });
    tset(fl, k === COURSES - 1 ? 1 : 0, now, k === COURSES - 1 ? Math.max(0, want - laid) * step + 200 : 0);
    flag.classList.toggle("hi", k < 0 || k === COURSES - 1);
    marks.forEach((m, i) => m.setAttribute("class", k < 0 || i <= k ? "dot m" : "dot off"));
    laid = want;
    read.textContent = NAMES[k + 1];
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "wall",
  means: "A wall built brick by brick: hover a level and the next course lays down until the goal flag rises.",
  rules: [1, 2, 6, 8],
  range: [50, 90, 140],
  mount,
});
