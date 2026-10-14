/**
 * Board: a desk flip board, one block standing on the ground, its front (+x) the right-facing plane, leaning back
 * 10° like a desk clock's. On the front, inside a thin frame, three large flap tiles spell a currency code in Hershey
 * single strokes: data-from at rest (USD), data-to on hover (IDR). Hover and each tile's top half folds down over its
 * hinge, left to right, and shows the other code; leave and they fold back. A change of either code plays the flip
 * once, there and back. Grey at rest; a tile's falling flap is bright while it flips to the other code, then the other
 * code's letters once all three have landed; flipping back is grey.
 * The block is a rounded profile swept along its width; every curve is a true Bézier (the camera is affine).
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"]};
const { Cam, fit, proj, hull, seg, clamp, reducedMotion, disposer, mk, pointer, register } = HL;
const Q = Math.PI / 2, LEAN = Math.PI / 18;
// the tiles: TW by TH, corner TR, G apart and G in from the frame's sides, VM from its top and bottom; cap height CH
const TW = 7, TH = 9, TR = 0.9, G = 4.2, VM = 1.6, CH = 0.6 * TH, STAG = 120, HOLD = 600;
// the block: its profile in (x, z), corners R, the front from XF leaning back LEAN, the back at XB; FI the frame's inset,
// LF the front's length up its lean, wb..wt its flat part; W half its width along y
const R = 2, XF = 5, XB = -6, FI = 1, LF = TH + 2 * (VM + FI) + R / Math.tan(2 * Q * 4 / 9) + R / Math.tan(2 * Q * 5 / 9);
const HB = LF * Math.cos(LEAN), WB = R / Math.tan(2 * Q * 4 / 9), WT = LF - R / Math.tan(2 * Q * 5 / 9), WC = (WB + WT) / 2;
const W = (3 * TW + 4 * G) / 2 + FI;
// the glyphs sit with their hinge at YH of the cap height, a hair under its middle, clear of the E, F, H and B bars
const YH = -0.6;
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [, d]]) => [c, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]));
/** A glyph's two halves about the hinge: polylines [u from the tile's centre, s from the hinge], above and below. */
const HALF = Object.fromEntries(Object.entries(GL).map(([c, ps]) => {
  const xs = ps.flat().map((p) => p[0]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, out = [[], []];
  for (const p of ps) {
    let run = [], side = -1;
    const flush = () => { if (run.length > 1) out[side].push(run); run = []; };
    p.map(([x, y]) => [(x - cx) * CH, (y - YH) * CH]).forEach(([u, v], i, a) => {
      const sd = v < 0 ? 0 : 1;
      if (i && sd !== side) { const [pu, pv] = a[i - 1], k = pv / (pv - v), q = [pu + k * (u - pu), 0]; run.push(q); flush(); run.push(q); }
      side = sd; run.push([u, Math.abs(v)]);
    });
    flush();
  }
  return [c, out];
}));
const code = (s, d) => { const c = String(s || "").toUpperCase().replace(/[^A-Z]/g, ""); return c.length === 3 ? c : d; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let dur = value;
  const U = [0, -1, 0], F = [1, 0, 0], V = [0, 0, 1], add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const D = [-Math.sin(LEAN), 0, Math.cos(LEAN)], N = [Math.cos(LEAN), 0, Math.sin(LEAN)]; // up the front, out of it
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // the profile's corners in the order of their normals, from the front's foot round: each its centre and normal range
  const VX = [[XF, 0], [XF - HB * Math.tan(LEAN), HB], [XB, HB], [XB, 0]], NA = [-Q, LEAN, Q, 2 * Q, 3 * Q];
  const CC = VX.map(([x, z], k) => { const a = [Math.cos(NA[k]), Math.sin(NA[k])], b = [Math.cos(NA[k + 1]), Math.sin(NA[k + 1])], s = R / (1 + a[0] * b[0] + a[1] * b[1]);
    return [x - s * (a[0] + b[0]), z - s * (a[1] + b[1])]; });
  const C = Cam(45, 0.5, 7), box = VX.flatMap(([x, z]) => [[x, W, z], [x, -W, z]]);
  fit(C, box, 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  // the way to the viewer: a flap folded th down from upright faces it until TE, when it is edge-on
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let EW = x3([F, [0, 1, 0], V].map((e) => J(e)[0]), [F, [0, 1, 0], V].map((e) => J(e)[1])); if (EW[2] < 0) EW = EW.map((x) => -x);
  const TE = Math.atan2(dot3(N, EW), dot3(D, EW));
  // every curve is a cubic Bézier of a world arc (≤ 90° each, k = 4/3·tan(Δ/4)·r): the projection is exact
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
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, all the way round. */
  function rr(o, e1, e2, [u0, v0, u1, v1], r) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    return cs.map((c, i) => arc(c, e1, e2, r, (i - 1) * Q, i * Q, !i)).join("") + "Z";
  }
  /** The profile's outline at y, by normal angle from f0 to f1: its corner arcs, joined by its straight sides. */
  function trace(y, f0, f1, move) {
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const w = Math.floor((f + Q) / (4 * Q) + 1e-9) * 4 * Q, g = f - w, k = NA.findIndex((a, i) => i < 4 && g < NA[i + 1] - 1e-9);
      const stop = Math.min(f1, NA[k + 1] + w);
      d += arc([CC[k][0], y, CC[k][1]], F, V, R, g, stop - w, first); first = false; f = stop;
    }
    return d;
  }
  // the block swept from its near end (y = W) to its far one: the silhouette splits where the outline runs along the sweep
  const Tv = J([0, -2 * W, 0]), fs = Math.atan2(cross(J(V), Tv), cross(J(F), Tv)), mm = J(add(F.map((x) => x * Math.cos(fs + Q)), V, Math.sin(fs + Q)));
  const a0 = (mm[0] * Tv[0] + mm[1] * Tv[1] < 0 ? fs : fs + 2 * Q) + 4 * Q;
  // back to front: the block, its near end's crease, the frame, the tiles; then the flaps, right to left
  const g = mk("g", {}, svg), path = (cls, d = "") => mk("path", { class: cls, d }, g);
  path("sil", trace(W, a0, a0 + 2 * Q, true) + trace(-W, a0 + 2 * Q, a0 + 4 * Q, false) + "Z");
  path("nf lo", trace(W, a0 + 2 * Q, a0 + 4 * Q, true));
  const Fp = (u, w) => add(add([XF, 0, 0], U, u), D, w);
  path("nf sil", rr(Fp(0, WC), U, D, [-W + FI, WB + FI - WC, W - FI, WT - FI - WC], 1.4));
  const on = (h, f) => { const d = add(D.map((x) => x * Math.cos(f)), N, Math.sin(f)); return (u, s) => add(add(h, U, u), d, s); };
  const type = (c, half, m) => (HALF[c] ? HALF[c][half] : []).map((p) => "M" + p.map(([u, s]) => pt(m(u, s))).join("L")).join("");
  const tiles = [0, 1, 2].map((i) => {
    const h = Fp((i - 1) * (TW + G), WC), t = { i, h, box: path("sil", rr(h, U, D, [-TW / 2, -TH / 2, TW / 2, TH / 2], TR)), hinge: path("nf sil"), ink: path("nf sil") };
    return Object.assign(t, { a: " ", b: " ", mv: { p0: 0, p1: 0, t0: 0, ms: 0 }, go: 0, key: "" });
  });
  [...tiles].reverse().forEach((t) => { t.flap = path("sil"); t.fink = path("nf sil"); });
  /** The top flap folded th down from upright: a quad from the hinge to its turning top edge, its far corners round. */
  function flap(h, th) {
    const m = on(h, th), d = add(D.map((x) => x * Math.cos(th)), N, Math.sin(th)), c = (u) => m(u, TH / 2 - TR);
    return `M${pt(m(-TW / 2, 0))}` + arc(c(-TW / 2 + TR), U, d, TR, 2 * Q, Q, false) + arc(c(TW / 2 - TR), U, d, TR, Q, 0, false) + `L${pt(m(TW / 2, 0))}Z`;
  }
  // a tile turns from a (p = 0) to b (p = 1) on an s-curve, ms in proportion to the way left, so a turn back is as calm
  const val = ({ mv }, now) => (mv.ms <= 0 ? mv.p1 : mv.p0 + (mv.p1 - mv.p0) * ((q) => q * q * (3 - 2 * q))(clamp((now - mv.t0) / mv.ms, 0, 1)));
  const done = ({ mv }, now) => now >= mv.t0 + mv.ms;
  const run = (t, to, now) => { const p = val(t, now); t.mv = { p0: p, p1: to, t0: now, ms: reducedMotion() ? 0 : dur * Math.abs(to - p) }; };
  // the top half shows b, the bottom a, the flap between them at p·π
  function paint(t, now) {
    const p = val(t, now), busy = !done(t, now), th = busy ? p * Math.PI : 0, hot = busy && aim === to, key = `${t.a}${t.b}${th}${p}${hot}`;
    if (key !== t.key) {
      t.key = key;
      const top = busy || p > 0.5 ? t.b : t.a, bot = !busy && p > 0.5 ? t.b : t.a, h0 = on(t.h, 0);
      t.hinge.setAttribute("d", seg(P(...h0(-TW / 2, 0)), P(...h0(TW / 2, 0))));
      t.ink.setAttribute("d", type(top, 0, h0) + type(bot, 1, on(t.h, Math.PI)));
      t.flap.setAttribute("d", busy ? flap(t.h, th) : "");
      t.fink.setAttribute("d", busy ? (th < TE ? type(t.a, 0, on(t.h, th)) : type(t.b, 1, on(t.h, th))) : "");
      [t.flap, t.fink].forEach((el) => el.classList.toggle("hi", hot)); // only the flap falling toward the other code
    }
    return busy;
  }
  const shown = (t, now) => (val(t, now) > 0.5 ? t.b : t.a);
  // the codes are read on every frame the loop runs (an observer wakes it); a change plays the flip there and back
  const attrs = () => ["from", "to"].map((a) => stage.getAttribute(`data-${a}`) || "").join("\n");
  const codes = () => { const [f, t] = attrs().split("\n"); return [code(f, "USD"), code(t, "IDR")]; };
  let seen = attrs(), [from, to] = codes(), over = false, demo = 0, aim = from, lit = "";
  tiles.forEach((t) => { t.a = t.b = from[t.i]; });
  /** Aim the board at s: a tile on its way to or from the letter turns there at once; the rest start in turn, left to right. */
  function aimAt(s, now) {
    aim = s;
    tiles.forEach((t) => {
      const c = s[t.i];
      if (!done(t, now) && (c === t.a || c === t.b)) run(t, c === t.b ? 1 : 0, now);
      else t.go = now + (reducedMotion() ? 0 : t.i * STAG);
    });
  }
  const B = register(stage, (_dt, now) => {
    if (attrs() !== seen) { seen = attrs(); [from, to] = codes(); demo = Infinity; }
    const want = over || now < demo ? to : from;
    if (want !== aim) aimAt(want, now);
    let busy = false, wait = false;
    tiles.forEach((t) => {
      const c = aim[t.i];
      if (done(t, now) && shown(t, now) !== c && now >= t.go) { t.a = shown(t, now); t.b = c; t.mv.p1 = 0; run(t, 1, now); }
      busy = paint(t, now) || busy; wait = wait || shown(t, now) !== c || !done(t, now);
    });
    if (demo === Infinity && aim === to && !wait) demo = now + HOLD;
    const landed = !wait && aim === to, word = busy || wait ? "flipping" : landed ? to.toLowerCase() : "rest";
    if (word !== lit) { lit = read.textContent = word; tiles.forEach((t) => t.ink.classList.toggle("hi", landed)); } // the result: its letters
    return busy || wait || (demo > now && demo !== 0);
  });
  bag.add(B.unregister); const mo = new MutationObserver(() => B.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-from", "data-to"] }), bag.add(() => mo.disconnect());
  // the hit area: the block at rest, as its hull on screen. Nothing in it ever moves
  const HIT = hull(box.map((v) => P(...v)));
  const sideOf = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inside = (p) => new Set(HIT.map((a, i) => sideOf(p, a, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  bag.add(pointer(stage, { move: (p) => { const h = inside(p); if (h !== over) { over = h; B.wake(); } }, leave: () => { over = false; B.wake(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = lit = "rest", B.wake();
  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "board",
  means: "A flip board: hover and the currency flips from one to the other.",
  rules: [1, 2, 4, 6, 8],
  // ms one tile's flap takes to fall
  range: [200, 250, 300],
  mount,
});
