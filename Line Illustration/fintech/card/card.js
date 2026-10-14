/**
 * Card: a credit card stands in a low stand on a long plate, leaning back a little, its face toward the lower right
 * with a chip and two number lines. Beside it, to the right, five rating bars rise like signal bars, shortest nearest
 * the card. Hover a bar and the bars fill one by one, shortest first, up to it: a filled bar's outline takes the bright
 * stroke. At bar 5 the card lights too. On leave every bar eases back to grey at once.
 *
 * Hit areas are the bars' rest boxes on screen, made generous, which never move; where two overlap, the bar whose
 * centre is nearest the pointer's x wins, so nothing flickers. Every curve is a true Bézier: world arcs as cubics of
 * 90° or less, projected control point by control point.
 */
const { Cam, fit, proj, hull, tween, tset, tval, tdone, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, Z0 = 4, TH = (12 * Math.PI) / 180, CT = Math.cos(TH), ST = Math.sin(TH);
// the stand: a low rounded block under the card; the card's back face meets its top at x = XC
const STAND = { x0: -4.5, x1: 4.5, y0: 5, y1: 35, r: 2.5 }, ZS = Z0 + 3, XC = -1.2, CY = 20;
// the card: u runs along −y (to the screen's right), v up its leaning face; HW half its width, H its height out of the
// stand, R its corner, T its thickness. The chip and the two number lines lie on its front face, in (u, v)
const HW = 13, H = 16.5, R = 2.6, T = 3, CHIP = [-9.5, 8, -4.5, 12], CR = 0.9;
const LINES = [[-9.5, 5, 9.5], [-9.5, 2.5, 0]];
// the bars: square, BW wide, on one row along −y, PITCH apart, each taller than the last
const BW = 5, BR = 1.3, PITCH = 7, BY0 = -3.5, HS = [6, 10.5, 15, 19.5, 24], N = 5;
const NAMES = ["poor", "fair", "good", "very good", "excellent"];
const PLATE = { x0: -11, x1: 11, y0: BY0 - (N - 1) * PITCH - BW / 2 - 5, y1: STAND.y1 + 4.5, r: 6 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;

  const C = Cam(45, 0.5, 3.75);
  const by = (i) => BY0 - i * PITCH, { x0, x1, y0, y1 } = PLATE;
  const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1], EU = [0, -1, 0], D = [-ST, 0, CT], NN = [CT, 0, ST];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const W = (u, v, n) => add(add(add([XC, CY, ZS], EU, u), D, v), NN, n); // a point of the card
  fit(C, [[x0, y0, 0], [x1, y1, 0], [x0, y1, 0], [x1, y0, 0], [x0, y0, Z0], [x0, y1, Z0],
    [0, by(N - 1) - BW / 2, Z0 + HS[N - 1]], W(-HW, H, 0), W(HW, H, 0)], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(","), cross = (a, b) => a[0] * b[1] - a[1] * b[0];

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
  const path = (d, cls) => mk("path", { d, class: cls }, g);

  // The card: its face outline at n = T and its back at n = 0, both cut by the stand's top (z = ZS, so v = −n·tan θ).
  // Its top right corner hands the silhouette from the face to the back where the corner's tangent runs along the
  // thickness on screen (FS); the face's left edge, top and the rest of that corner are its crease.
  const JN = J(NN), FS = Math.atan2(cross(J(D), JN), cross(J(EU), JN));
  const oF = W(0, 0, T), oB = W(0, 0, 0), vb = -T * Math.tan(TH), face = (u, v) => W(u, v, T), cardRect = [-HW, 0, HW, H];
  const cardSil = `M${pt(face(HW, vb))}L${pt(face(HW, H - R))}` + rr(oF, EU, D, cardRect, R, 0, FS, false)
    + rr(oB, EU, D, cardRect, R, FS, 2 * Q, false) + `L${pt(W(-HW, 0, 0))}L${pt(face(-HW, vb))}Z`;
  const cardCr = rr(oF, EU, D, cardRect, R, FS, 2 * Q, true) + `L${pt(face(-HW, vb))}`;
  const chip = rr(oF, EU, D, CHIP, CR, -Q, 3 * Q, true) + "Z";
  const lines = LINES.map(([u0, v, u1]) => `M${pt(face(u0, v))}L${pt(face(u1, v))}`).join("");

  // back to front: the plate, the bars from the tallest (farthest) to the shortest, the stand, then the card
  const g = mk("g", {}, svg), [ps, pc] = box([x0, y0, x1, y1], PLATE.r, 0, Z0);
  path(ps, "sil"); path(pc, "nf lo");
  const bars = [];
  for (let i = N - 1; i >= 0; i--) {
    const [s, c] = box([-BW / 2, by(i) - BW / 2, BW / 2, by(i) + BW / 2], BR, Z0, Z0 + HS[i]);
    bars[i] = { parts: [[path(s, "sil"), "sil"], [path(c, "nf lo"), "nf lo"]], tw: tween(0), lit: false };
  }
  box([STAND.x0, STAND.y0, STAND.x1, STAND.y1], STAND.r, Z0, ZS).forEach((d, i) => path(d, i ? "nf lo" : "sil"));
  const card = [[path(cardSil, "sil"), "sil"], [path(cardCr, "nf lo"), "nf lo"], [path(chip, "nf lo"), "nf lo"], [path(lines, "nf lo"), "nf lo"]];
  const light = (parts, on) => parts.forEach(([el, cls]) => el.setAttribute("class", on ? (cls[0] === "n" ? "nf hi" : "sil hi") : cls));

  // a bar is filled once its tween is past halfway; the card lights with the fifth
  let cardLit = false;
  const B = register(stage, (dt, now) => {
    let moving = false;
    bars.forEach((b) => {
      const on = tval(b.tw, now) > 0.5;
      if (on !== b.lit) { b.lit = on; light(b.parts, on); }
      moving = moving || !tdone(b.tw, now);
    });
    if (bars[N - 1].lit !== cardLit) { cardLit = bars[N - 1].lit; light(card, cardLit); }
    return moving;
  });
  bag.add(B.unregister);

  // hit areas: each bar's rest box, grown by GROW on every side, as a hull on screen; nearest centre x among those hit
  const GROW = 2.5;
  const HIT = bars.map((_, i) => {
    const xs = [-BW / 2 - GROW, BW / 2 + GROW], ys = [by(i) - BW / 2 - GROW, by(i) + BW / 2 + GROW], zs = [Z0, Z0 + HS[i] + GROW];
    return { cx: P(0, by(i), 0)[0], poly: hull(xs.flatMap((x) => ys.flatMap((y) => zs.map((z) => P(x, y, z))))) };
  });
  const inside = (p, H) => H.every((a, i) => { const b = H[(i + 1) % H.length]; return cross([b[0] - a[0], b[1] - a[1]], [p[0] - a[0], p[1] - a[1]]) >= 0; })
    || H.every((a, i) => { const b = H[(i + 1) % H.length]; return cross([b[0] - a[0], b[1] - a[1]], [p[0] - a[0], p[1] - a[1]]) <= 0; });
  function hit(p) {
    let best = -1, bd = Infinity;
    HIT.forEach((h, i) => { const d = Math.abs(p[0] - h.cx); if (inside(p, h.poly) && d < bd) { bd = d; best = i; } });
    return best;
  }
  let act = -2;
  function choose(k) {
    if (k === act) return;
    const now = performance.now(), from = Math.max(0, act + 1);
    act = k;
    read.textContent = k < 0 ? "rest" : NAMES[k];
    // filling runs up from the first empty bar, one step apart; emptying is all at once
    bars.forEach((b, i) => tset(b.tw, i <= k ? 1 : 0, now, i <= k ? Math.max(0, i - from) * step : 0));
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "card",
  means: "A credit card beside five rating bars: hover a bar and the bars fill up to it, from poor to excellent.",
  rules: [1, 2, 4, 5, 8],
  // ms between one bar filling and the next
  range: [70, 110, 150],
  mount,
});
