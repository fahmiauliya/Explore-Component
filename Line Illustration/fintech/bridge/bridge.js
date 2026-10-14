/**
 * Bridge: two identical grey cliffs on one axis (x), end faces squared off across a straight chasm. Hover anywhere and
 * the bridge builds: n planks (data-installments, 3 to 12, default 5) drop one by one from the left cliff to the right,
 * swinging level, top flush with the cliff tops, filling the chasm exactly from face to face. On the last plank the loan
 * is paid off: posts rise, two rope rails string across. data-goal (A-Z 0-9 space, 8 at most) flies as a flag on the
 * right cliff's far back corner; it gives one short ripple. Bright: the plank being laid, then the flag (no goal: the last plank).
 * Leaving takes it down in reverse, rails first. A new count replays the build once (or rebuilds it, under the pointer).
 *
 * The hit area is the whole figure's REST box on screen, which never moves. Planks run on 500ms tweens, rails on
 * 700ms; the stagger is the slider, in ms, capped so that n planks land within 1.6 s.
 */
const STROKES = {"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"],"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"]," ":[0.762,""]};
const { Cam, fit, proj, tween, tset, tval, tdone, reducedMotion, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, EX = [1, 0, 0], EY = [0, 1, 0], PI2 = 2 * Math.PI;
// two identical cliffs along x, length LC, half width WC, height ZT, corner 4; the chasm, 0.45 LC, runs from face GA to GB
const LC = 56, WC = 16, ZT = 26, GAP = 0.45 * LC, GA = -GAP / 2, GB = GAP / 2, XE = GB + LC;
// planks: half length (across the bridge), thickness, corner, drop, swing; their tops flush with the cliffs'; cap, ms
const DY = 12, PT = 3.5, PR = 1.5, DROP = 10, TILT = 0.42, CAP = 1100, DUR = 500;
// rails: posts HP above the deck at ±RY0, 16 along each cliff from its face, ropes tied under their tops, sagging SAG
const PR2 = 1.6, RY0 = 13.5, HP = 6, ZR = ZT + HP - 0.5, SAG = HP / 3 - 0.5, XA = GA - 16, XB = GB + 16;
// the flag: a pole, one thin line, on the right cliff's far back corner (FX, FY); the sheet in the plane x = FX flies to -y,
// ZF to ZF + FH; cap height TH, tracking TR, padding PU, PV; corner CN; the ripple's amplitude, wavelength, ms
const FX = XE - 3.5, FY = 3.5 - WC, ZF = ZT + 6.5, TH = 5, TR = 0.1, PU = 1.4, PV = 1.6, FH = TH + 2 * PV, ZP = ZF + FH + 0.8;
const CN = 0.8, AMP = 2, LAM = 16, WAVE = 300;
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.15), CUBE = [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[a * XE, b * WC, 0], [a * XE, b * WC, ZT]]));
  fit(C, CUBE, 200, 160); // the rest pose is symmetric about the chasm's centre: that point lands on (200, 160)
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(","), cr = (u, v) => u[0] * v[1] - u[1] * v[0];
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
  const set = (el, d) => el.setAttribute("d", d);

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics (≤ 90°) project exactly.
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${pt(at3(c, e1, e2, r, f0))}`;
    for (let i = 0, a = f0, b = f0 + h; i < n; i++, a = b, b += h) { const p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${pt(at3(c, e1, e2, r, a).map((x, j) => x + k * t0[j]))} ${pt(p3.map((x, j) => x - k * t3[j]))} ${pt(p3)}`; }
    return d;
  }
  /** A rounded slab: its top a rounded rectangle centred on c in the plane (a, b), half sizes hx, hy, corner r, t thick
   * below it. One closed silhouette (the top's far half, the bottom's near half, joined where the outline turns) and
   * the crease: the top's near half, inset by ins. */
  function slab(c, a, b, hx, hy, r, t, ins) {
    const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const low = c.map((x, i) => x - t * n[i]), A = J(a), B = J(b), D = J(n.map((x) => -t * x));
    const f = Math.atan2(-cr(D, A), cr(D, B)) + (cr(A, B) < 0 ? Math.PI : 0), CS = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
    const run = (o, rr, f0, f1, move) => {
      let d = "";
      for (let g = f0; g < f1 - 1e-9; move = false) { const i = Math.floor(g / Q + 1 + 1e-9), stop = Math.min(f1, i * Q), [u, v] = CS[((i % 4) + 4) % 4];
        d += arc(o.map((x, j) => x + u * (hx - r) * a[j] + v * (hy - r) * b[j]), a, b, rr, g, stop, move); g = stop; }
      return d;
    };
    return { sil: run(c, r, f + Q, f + 3 * Q, true) + run(low, r, f + 3 * Q, f + 5 * Q, false) + "Z", crease: run(c, r - ins, f - Q, f + Q, true) };
  }
  const solid = (parent) => ({ sil: mk("path", { class: "sil" }, parent), cr: mk("path", { class: "nf lo" }, parent) });
  const put = (o, k) => { set(o.sil, k ? k.sil : ""); set(o.cr, k ? k.crease : ""); return o.sil; };
  const block = (cx, cy, hx, hy, z1, t) => put(solid(g), slab([cx, cy, z1], EX, EY, hx, hy, 4, t, 1.6));

  /** A rope from post face A to post face B, sagging: a parabola (one quadratic, raised to a cubic), cut at t. */
  const rope = (y) => { const a = [XA + PR2, y, ZR], b = [XB - PR2, y, ZR], c = [(a[0] + b[0]) / 2, y, ZR - 2 * SAG];
    return [a, a.map((v, i) => v + (2 / 3) * (c[i] - v)), b.map((v, i) => v + (2 / 3) * (c[i] - v)), b]; };
  const mix = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
  const cut = ([p0, p1, p2, p3], t) => { const a = mix(p0, p1, t), b = mix(p1, p2, t), e = mix(a, b, t), m = mix(e, mix(b, mix(p2, p3, t), t), t);
    return `M${pt(p0)}C${pt(a)} ${pt(e)} ${pt(m)}`; };
  /** One side's rail: the near post, the rope, the far post (each into its own layer), which hides the rope's end. */
  const side = (y, pa, pr, pb) => { const a = { x: XA, y, ...solid(pa) }, el = mk("path", { class: "nf" }, pr); return { posts: [a, { x: XB, y, ...solid(pb) }], el, w: rope(y) }; };

  // back to front: the left cliff, the back rail's left post and rope, the planks by ascending x, the right cliff (it
  // hides the last plank's end, sunk to its face), the back rail's right post, the front rail, then the flag, its text
  // and its pole. A plank never reaches past GB, and above the deck projects clear of the right cliff; the back rope
  // stays above the planks and the right cliff's back edge on screen; the flag stands clear of all of them.
  const g = mk("g", {}, svg);
  block(GA - LC / 2, 0, LC / 2, WC, ZT, ZT);
  const ba = mk("g", {}, g), br = mk("g", {}, g), pg = mk("g", {}, g);
  block(GB + LC / 2, 0, LC / 2, WC, ZT, ZT);
  const rail = { rails: [side(-RY0, ba, br, g), side(RY0, g, g, g)], tw: tween(0), last: NaN };
  const flag = mk("path", { class: "sil" }, g), ink = mk("path", { class: "nf sil" }, g), pole = mk("path", { class: "nf sil" }, g);

  /** Plank p at progress e (0 away, 1 laid): it drops from DROP above, swinging level about the bridge's axis, and
   * grows from nothing over the first part of its fall, so an unlaid plank is never seen. The rails: the posts rise
   * out of the cliff tops, then the ropes string across from the near posts. */
  function draw(p, e) {
    e = Math.min(1, Math.max(0, e));
    if (Math.abs(e - p.last) < 1e-4) return;
    p.last = e;
    if (p.rails) {
      const h = (1 - Math.max(0, 1 - e / 0.6) ** 2) * HP, t = Math.min(1, Math.max(0, (e - 0.45) / 0.55));
      for (const r of p.rails) { set(r.el, t < 0.004 ? "" : cut(r.w, t)); r.posts.forEach((q) => put(q, h < 0.05 ? null : slab([q.x, q.y, ZT + h], EX, EY, PR2, PR2, PR2, h, 0.6))); }
      return;
    }
    const u = 1 - e, sc = 1 - Math.max(0, 1 - e / 0.3) ** 2, th = TILT * u;
    put(p, e < 0.004 ? null : slab([p.xc, 0, ZT + DROP * u], EX, [0, Math.cos(th), Math.sin(th)], (p.W / 2) * sc, DY * sc, p.r * sc, PT * sc, p.ins * sc));
  }

  let n = 0, planks = [], gone = [], goal = null, L = 0, text = [], box = [], flat = "";
  /** n planks fill the chasm evenly: width W, the same clear gap PG between every two (narrower as n grows), the first
   * flush with face GA, the last with face GB. The old ones all lift away at once and are removed once gone. */
  function setN(k, now) {
    planks.forEach((p) => { tset(p.tw, 0, now, 0); p.sil.classList.remove("hi"); }); gone = gone.concat(planks); n = k; hot = null;
    const PG = Math.min(2, GAP / (3.5 * n)), W = (GAP - (n - 1) * PG) / n, r = Math.min(PR, 0.4 * W), ins = Math.min(1, r - 0.4);
    planks = Array.from({ length: n }, (_, i) => ({ xc: GA + i * (W + PG) + W / 2, W, r, ins, tw: tween(0, DUR), last: NaN, ...solid(pg) }));
  }
  /** The goal as polylines in the flag's own [u, v] (u out from the pole, v up), the flag's length, the pole,
   * and the hit area: the whole figure's rest box on screen (the cliffs, the posts' and the flag's tops), padded. */
  function setGoal(s) {
    goal = s; text = []; flat = null;
    let x = PU;
    for (const c of s) { GL[c][1].forEach((q) => text.push(q.map(([gx, gy]) => [x + (gx - TR / 2) * TH, ZF + PV - gy * TH]))); x += (GL[c][0] - TR) * TH; }
    L = x + PU;
    set(pole, s ? `M${pt([FX, FY, ZT])}L${pt([FX, FY, ZP])}` : "");
    const q = CUBE.concat([XA, XB].flatMap((x) => [[x, -RY0, ZT + HP], [x, RY0, ZT + HP]]))
      .concat(s ? [[FX, FY, ZP], [FX, FY - L, ZF + FH]] : []).map((v) => P(...v));
    box = [0, 1].map((i) => [Math.min(...q.map((p) => p[i])) - 6, Math.max(...q.map((p) => p[i])) + 6]);
  }
  /** The flag at ripple progress s (flat at 0 and 1): each point pushed along x, the plane's normal, by a sine that
   * travels outward and grows from the pole to the free edge. Long edges are Hermite cubics on that exact surface,
   * the free corners quarter arcs; the text rides on it. */
  function drawFlag(s) {
    const key = goal ? (s >= 1 ? "flat" : s.toFixed(4)) : "";
    if (key === flat) return; flat = key;
    if (!goal) { set(flag, ""); set(ink, ""); return; }
    const A = s >= 1 ? 0 : (AMP / L) * Math.sin(Math.PI * s) * (1 - s), ph = (u) => PI2 * (u / LAM - 1.5 * s);
    const d1 = (u) => A * (Math.sin(ph(u)) + ((PI2 * u) / LAM) * Math.cos(ph(u)));
    const W = (u, v) => [FX + A * u * Math.sin(ph(u)), FY - u, v], hd = (u, v, h) => W(u, v).map((x, i) => x + (h / 3) * [d1(u), -1, 0][i]);
    const edge = (a, b, v) => { const m = Math.ceil(Math.abs(b - a) / 4), h = (b - a) / m; let o = "";
      for (let i = 0; i < m; i++) { const u = a + i * h; o += `C${pt(hd(u, v, h))} ${pt(hd(u + h, v, -h))} ${pt(W(u + h, v))}`; } return o; };
    const z0 = ZF, z1 = ZF + FH, k = 0.5523 * CN, C3 = (...q) => "C" + q.map((p) => pt(W(...p))).join(" ");
    set(flag, `M${pt(W(0, z0))}` + edge(0, L - CN, z0) + C3([L - CN + k, z0], [L, z0 + CN - k], [L, z0 + CN])
      + `L${pt(W(L, z1 - CN))}` + C3([L, z1 - CN + k], [L - CN + k, z1], [L - CN, z1]) + edge(L - CN, 0, z1)); // open at the pole, which draws that edge
    set(ink, text.map((q) => "M" + q.map((p) => pt(W(...p))).join("L")).join(""));
  }
  let on = false, act = false, demo = 0, wt = -1, state = -1, stag = value, seen = null, hot = null;
  /** 0 rest, 1 building, 2 paid off: the read-out; the flag is bright only once the bridge is whole. */
  function status(k) {
    if (k === state) return; state = k;
    [flag, ink, pole].forEach((el) => el.classList.toggle("hi", k === 2));
    read.textContent = ["rest", "building", "paid off"][k];
  }
  /** Building lays the planks still missing, left to right, a stagger apart; taking down drops the rails at once, then
   * lifts the planks still out, right to left. A plank already where it is going takes no turn. */
  function want(v, now, base = 0) {
    if (v === act) return; act = v;
    const step = Math.min(stag, CAP / (n - 1)), wait = tval(rail.tw, now) > 0.01 ? 350 : 0;
    let j = 0;
    if (v) for (const p of planks) tset(p.tw, 1, now, tval(p.tw, now) > 0.999 ? 0 : base + step * j++);
    else { tset(rail.tw, 0, now, 0); for (const p of [...planks].reverse()) tset(p.tw, 0, now, tval(p.tw, now) < 0.001 ? 0 : wait + step * j++); }
  }
  // both attributes are read on every frame the loop runs (an observer wakes it); a new count replays the build:
  // lay them all, hold, take them down. Under the pointer it rebuilds and stays.
  const attrs = () => ["installments", "goal"].map((a) => stage.getAttribute(`data-${a}`)).join("\n");
  function sync(now) {
    if (attrs() === seen) return;
    const first = seen === null, c = parseInt(stage.getAttribute("data-installments"), 10), k = Number.isFinite(c) ? Math.min(12, Math.max(3, c)) : 5;
    const s = [...(stage.getAttribute("data-goal") || "").toUpperCase()].filter((x) => /[A-Z0-9 ]/.test(x)).join("").trim().slice(0, 8).trim();
    seen = attrs();
    if (s !== goal) setGoal(s);
    if (k === n) return;
    const old = planks.some((p) => tval(p.tw, now) > 0.001);
    setN(k, now);
    if (!first) { act = false; tset(rail.tw, 0, now, 0); want(true, now, old ? 450 : 0); if (!on) demo = -1; }
  }

  const B = register(stage, (dt, now) => {
    sync(now);
    let moving = false, laid = true;
    gone = gone.filter((p) => { draw(p, tval(p.tw, now)); return tdone(p.tw, now) ? (p.sil.remove(), p.cr.remove(), false) : (moving = true); });
    for (const p of planks) { const e = tval(p.tw, now); laid = laid && p.tw.to === 1 && e > 0.98; draw(p, e); moving = !tdone(p.tw, now) || moving; }
    if (act && laid && rail.tw.to === 0) { // the last plank is down: string the rails, wave the flag
      tset(rail.tw, 1, now, 0); if (!reducedMotion()) wt = now; if (demo) demo = now + 1000; }
    if (demo > 0 && now >= demo) { demo = 0; want(false, now); }
    draw(rail, tval(rail.tw, now));
    const s = wt < 0 ? 1 : Math.min(1, (now - wt) / WAVE); if (s >= 1) wt = -1; drawFlag(s);
    status(act ? (rail.tw.to === 1 ? 2 : 1) : 0); // bright: the plank last set going, or the last one once paid off without a goal
    const h = !act ? null : state === 2 ? (goal ? null : planks[n - 1]) : planks.filter((p) => p.tw.to === 1 && now >= p.tw.t0 && !tdone(p.tw, now)).pop() || null;
    if (h !== hot) { if (hot) hot.sil.classList.remove("hi"); if ((hot = h)) h.sil.classList.add("hi"); }
    return moving || !tdone(rail.tw, now) || demo !== 0 || wt >= 0;
  });
  const mo = new MutationObserver(() => B.wake()), F = ["data-installments", "data-goal"];
  mo.observe(stage, { attributes: true, attributeFilter: F }), bag.add(B.unregister), bag.add(() => mo.disconnect());

  const hover = (v) => { if (v !== on) { on = v; demo = 0; want(v, performance.now()); B.wake(); } };
  const inside = (p) => p.every((x, i) => x > box[i][0] && x < box[i][1]);
  bag.add(pointer(stage, { move: (p) => hover(inside(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  sync(performance.now()); status(0); B.wake();
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({ name: "bridge", means: "Hover and planks bridge the gap one by one, like a loan paid off installment by installment.",
  rules: [1, 4, 6, 7], range: [110, 150, 190], mount });
