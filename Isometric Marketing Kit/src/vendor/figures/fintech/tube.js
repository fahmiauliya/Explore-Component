/**
 * Tube: two terminal boxes on a plate, joined by one low glass tube with a capsule inside. The tube leaves a round
 * opening in A's front face horizontally, turns once toward B, rises a little, runs across, comes down and enters a
 * round opening in B's side. Hover a terminal and the capsule shoots through to the other one and lands with a tiny
 * settle; the capsule and the receiving terminal take the bright stroke. At rest everything is the same grey and the
 * capsule waits in the middle of the run.
 *
 * Hit areas are the terminals' RESTING footprints, which never move, so nothing flickers. The capsule rides one
 * spring along the tube, damped a little under critical when it lands (the overshoot folds back at the tube's end:
 * a tiny bounce) and critically on the way home. Every curve is a true Bézier.
 */
const { Cam, fit, proj, hull, spring, stepS, disposer, mk, pointer, register } = HL;

// A stands at the back left (x 0, y +L), B at the front right (x XR, y −L), like a row seen from the front right.
// The tube leaves the middle of A's +x face, turns 90° (radius RB) to run along −y at x = XR, and enters the middle of
// B's +y face square on: both openings face the viewer. The turn is where the plan's circle is flattest on screen.
// The run is level at both ends and rises RISE on raised-cosine ramps. Glass: the outer wall at TUBE, the bore at
// BORE, 1.9 apart: 6.6 viewBox units along the walls, still over 4 where the mouths foreshorten it. The capsule
// (radius CR) clears the bore by 1.3, 4.5 units.
const Z0 = 4, Q = Math.PI / 2, KAPPA = (4 / 3) * Math.tan(Math.PI / 8), S = 3.5;
const L = 26, TW = 9.5, TR = 2.5, ZT = Z0 + 16, ZP = Z0 + 8, HOLE = 2, TUBE = 4.8, BORE = 2.9, CR = 1.6, CL = 4;
const LEG = 1, RB = 8, XR = TW + LEG + RB, RISE = 3.5, LEAD = 0.04, RAMP = 0.42, ZETA = 0.72;
// The plate is an L: full depth under A, and behind the run cut back to just behind B (x XN, from y YN down), so its
// back edges hide behind A, the tube and B and none shows between the terminals.
const PL = [-TW - 3, -L - TW - 3, XR + TW + 3, L + TW + 3], XN = XR - TW - 3, YN = L - TW - 3, PR = 8, PS = 4, PC = 3, AB = (RB * Math.PI) / 2, R0 = LEG + AB, RL = 2 * L - RB - TW, SPAN = R0 + RL;
const S0 = CL / 2 + CR + 0.6, REST = (R0 + RL / 2 - S0) / (SPAN - 2 * S0), LABEL = ["rest", "sending", "received"];
const bump = (q) => { const a = Math.min(q, 1 - q); return a < LEAD ? 0 : a < LEAD + RAMP ? (1 - Math.cos((Math.PI * (a - LEAD)) / RAMP)) / 2 : 1; };
/** The tube's centre line at s, from A's face (0) to B's (SPAN); straight past either end. */
function mid(s) {
  if (s < LEG) return [TW + s, L, ZP];
  if (s < R0) { const f = (s - LEG) / RB; return [TW + LEG + RB * Math.sin(f), L - RB + RB * Math.cos(f), ZP]; }
  return [XR, L - RB - (s - R0), ZP + RISE * bump(Math.min(1, (s - R0) / RL))];
}
const dir = (s) => { const a = mid(s - 1e-4), b = mid(s + 1e-4); return a.map((x, i) => b[i] - x); };
// where the Hermite pieces of each wall join: the leg, the turn's middle, the run's ramps (ends and thirds)
const KN = [0, LEG, LEG + AB / 2, ...[LEAD, LEAD + RAMP / 3, LEAD + (2 * RAMP) / 3, LEAD + RAMP].flatMap((q) => [q, 1 - q]).map((q) => R0 + q * RL).sort((a, b) => a - b), SPAN];

function mount({ stage, svg, read }, value) {
  const bag = disposer();

  const C = Cam(45, 0.5, S);
  fit(C, [[PL[0], YN, Z0], [PL[2], PL[3], 0], [PL[0], PL[3], 0], [PL[2], PL[1], 0], [XN, PL[1], Z0], [-TW, L - TW, ZT], [XR - TW, -L - TW, ZT]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), FR = Math.atan2(J(EY)[0], J(EX)[0]);

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics project exactly.
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
  /** A rounded rectangle at height z, x0..x1 by y0..y1, corner r, from angle f0 to f1. */
  function rr(z, [x0, y0, x1, y1], r, f0, f1, move = true) {
    const cs = [[x1 - r, y0 + r], [x1 - r, y1 - r], [x0 + r, y1 - r], [x0 + r, y0 + r]];
    let d = "", f = f0, first = move;
    while (f1 - f > 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded block from z0 to z1: its silhouette (the top's far half, the foot's near half), and its crease, the top's near half inset by b. */
  const block = ([x0, y0, x1, y1], r, z0, z1, b) => [
    rr(z1, [x0, y0, x1, y1], r, FR + 2 * Q, FR + 4 * Q) + rr(z0, [x0, y0, x1, y1], r, FR, FR + 2 * Q, false) + "Z",
    rr(z1, [x0 + b, y0 + b, x1 - b, y1 - b], r - b, FR, FR + 2 * Q),
  ];

  /** A wall of the tube on screen: the centre line offset by rad, to one side of travel. The view is orthographic,
   * so a round tube's outline is exactly that offset; it is drawn as Hermite cubics joined at KN. */
  const side = (s, sg, rad) => { const c = P(...mid(s)), t = J(dir(s)), n = Math.hypot(...t), w = rad * S * sg; return [c[0] - (w * t[1]) / n, c[1] + (w * t[0]) / n]; };
  const der = (s, sg, rad) => { const a = side(s - 1e-3, sg, rad), b = side(s + 1e-3, sg, rad); return [(b[0] - a[0]) / 2e-3, (b[1] - a[1]) / 2e-3]; };
  function wall(sg, rad, rev, move) {
    const ss = rev ? KN.slice().reverse() : KN;
    let d = `${move ? "M" : "L"}${f2(side(ss[0], sg, rad))}`;
    for (let i = 0; i + 1 < ss.length; i++) {
      const p = ss[i], q = ss[i + 1], h = (q - p) / 3, A = side(p, sg, rad), B = side(q, sg, rad), dp = der(p, sg, rad), dq = der(q, sg, rad);
      d += `C${f2([A[0] + dp[0] * h, A[1] + dp[1] * h])} ${f2([B[0] - dq[0] * h, B[1] - dq[1] * h])} ${f2(B)}`;
    }
    return d;
  }
  /** Where the tube meets an opening: the outward half of its end circle, radius rad (in the face, axes e1 e2), from wall sg to the other. */
  function end(s, e1, e2, sg, rad) {
    const t = J(dir(s)), n = Math.hypot(...t), nh = [-t[1] / n, t[0] / n], u = J(e1), v = J(e2), dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    const fa = Math.atan2(dot(v, nh), dot(u, nh)) + (sg > 0 ? 0 : Math.PI), m = fa + Q, o = [Math.cos(m) * u[0] + Math.sin(m) * v[0], Math.cos(m) * u[1] + Math.sin(m) * v[1]];
    return arc(mid(s), e1, e2, rad, fa, dot(o, t) * (s > 0 ? -1 : 1) < 0 ? fa + 2 * Q : fa - 2 * Q, false);
  }
  const loop = (rad) => wall(1, rad, false, true) + end(SPAN, EX, EZ, 1, rad) + wall(-1, rad, true, false) + end(0, EY, EZ, -1, rad) + "Z";

  /** The capsule at s, straight along the tube there: a sphere-swept segment, so on screen a stadium. */
  function capsule(s) {
    const c = mid(s), t = dir(s), m = Math.hypot(...t), a = P(...add(c, t, -CL / 2 / m)), b = P(...add(c, t, CL / 2 / m));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), r = CR * S, d = [((b[0] - a[0]) / l) * r, ((b[1] - a[1]) / l) * r], n = [-d[1], d[0]];
    const pt = (c, u, v, ku = 1, kv = 1) => f2([c[0] + ku * u[0] + kv * v[0], c[1] + ku * u[1] + kv * v[1]]);
    const half = (c, u, v) => `C${pt(c, u, v, 1, KAPPA)} ${pt(c, v, u, 1, KAPPA)} ${pt(c, v, u, 1, 0)}C${pt(c, v, u, 1, -KAPPA)} ${pt(c, u, v, -1, KAPPA)} ${pt(c, u, v, -1, 0)}`;
    return `M${pt(a, n, d, 1, 0)}L${pt(b, n, d, 1, 0)}` + half(b, n, d) + `L${pt(a, n, d, -1, 0)}` + half(a, [-n[0], -n[1]], [-d[0], -d[1]]) + "Z";
  }

  // back to front: the plate; B (further back), then A, each with its opening; the tube, in front of both (it leaves
  // A's front face and enters B's near side); its bore; the capsule inside
  const [x0, y0, x1, y1] = PL, corners = (z, list, b = 0) => list.map(([cx, cy, r, f0, f1], i) => arc([cx, cy, z], EX, EY, r - b, f0 * Q, f1 * Q, i === 0)).join("");
  const near = [[x1 - PR, y0 + PR, PR, 3.5, 4], [x1 - PR, y1 - PR, PR, 0, 1], [x0 + PR, y1 - PR, PR, 1, 1.5]];
  const far = [[x0 + PR, y1 - PR, PR, 1.5, 2], [x0 + PS, YN + PS, PS, 2, 3], [XN - PC, YN - PC, PC, 1, 0], [XN + PS, y0 + PS, PS, 2, 3], [x1 - PR, y0 + PR, PR, 3, 3.5]];
  const g = mk("g", {}, svg), ps = corners(Z0, far) + corners(0, near).replace(/^M/, "L") + "Z", pc = corners(Z0, near, 1.6);
  mk("path", { d: ps, class: "sil" }, g); mk("path", { d: pc, class: "nf lo" }, g);
  const terms = [[0, L, mid(0), EY], [XR, -L, mid(SPAN), EX]].map(([cx, cy, hole, e1]) => ({ rect: [cx - TW, cy - TW, cx + TW, cy + TW], hole, e1 }));
  terms.slice().reverse().forEach((t) => {
    const [sil, crease] = block(t.rect, TR, Z0, ZT, 1.4);
    t.sil = mk("path", { d: sil, class: "sil" }, g); mk("path", { d: crease, class: "nf lo" }, g);
    mk("path", { d: arc(t.hole, t.e1, EZ, TUBE + HOLE, 0, 4 * Q, true) + "Z", class: "nf sil" }, g); // the opening, a rim round the tube
  });
  mk("path", { d: loop(TUBE), class: "sil" }, g);
  mk("path", { d: loop(BORE), class: "nf" }, g); // the bore: the glass's inner wall, closed round each mouth
  const pod = mk("path", { class: "sil" }, g);

  // u: 0 is A, 1 is B, REST the middle of the run. A landing is damped at ZETA for the settle; the way home, critically
  let k = value;
  const go = spring(REST, { k, c: 2 * Math.sqrt(k), eps: 0.0005 }), damp = () => { go.c = 2 * (go.t === REST ? 1 : ZETA) * Math.sqrt(k); };
  let over = -1, landed = false, drawn = NaN, said = "";
  /** Draws the capsule where the spring is, folding an overshoot back at either end, and says what is happening. */
  function paint() {
    if (go.x !== drawn) {
      drawn = go.x;
      const u = go.x < 0 ? -go.x : go.x > 1 ? 2 - go.x : go.x;
      pod.setAttribute("d", capsule(S0 + u * (SPAN - 2 * S0)));
    }
    if (over >= 0 && !landed && Math.abs(go.x - go.t) < 0.01 && Math.abs(go.v) < 0.1) landed = true;
    // grey at rest; while a terminal is hovered, the capsule and the terminal it goes to are bright
    const state = over < 0 ? 0 : landed ? 2 : 1, to = over < 0 ? -1 : 1 - over;
    pod.classList.toggle("hi", over >= 0); pod.classList.toggle("sil", over < 0);
    terms.forEach((t, i) => t.sil.classList.toggle("hi", i === to));
    if (LABEL[state] !== said) { said = LABEL[state]; read.textContent = said; }
  }
  const T = register(stage, (dt) => { const moving = stepS(go, dt); paint(); return moving; });
  bag.add(T.unregister);

  // hit areas: each terminal's RESTING footprint on screen, the hull of its block's corners. Neither ever moves.
  const spots = terms.map((t) => hull([t.rect[0], t.rect[2]].flatMap((x) => [t.rect[1], t.rect[3]].flatMap((y) => [Z0, ZT].map((z) => P(x, y, z))))));
  const inside = (h, [x, y]) => { const c = h.map((a, i) => { const b = h[(i + 1) % h.length]; return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); }); return c.every((v) => v >= 0) || c.every((v) => v <= 0); };
  /** Hovering terminal k sends the capsule to the other one; leaving brings it back to the middle. */
  function choose(k) {
    if (k === over) return;
    over = k; landed = false;
    go.t = k < 0 ? REST : 1 - k; damp();
    paint(); T.wake();
  }
  bag.add(pointer(stage, { move: (p) => choose(spots.findIndex((h) => inside(h, p))), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  paint();

  return { set: (v) => { k = go.k = v; damp(); }, destroy: bag.dispose };
}

hairline({
  name: "tube",
  means: "Two terminals and one tube: hover a side and the capsule shoots across, like money sent in a second.",
  rules: [1, 4, 5, 8],
  range: [40, 90, 160],
  mount,
});
