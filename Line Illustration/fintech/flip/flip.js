/**
 * Flip: currency exchange as one large coin standing upright in a low round stand on a plate, its face turned to the
 * right. One face carries a small engraved ring, the other a small rounded square; nothing else. The coin's foot sits
 * in a slot cut across the stand's top, so its lower part is hidden inside. Each time the pointer comes onto the
 * figure the coin spins half a turn about its vertical axis, slot and all, and shows its other face: the face narrows
 * to edge-on, the rim band passes, and the other face widens. The rim and outline brighten while it spins.
 *
 * The hit area is the rest pose's box, which never moves. The flips are one number, counted half turns, timed by a
 * tween and run on an s-curve so the spin starts and lands softly. The coin is a cylinder cut by the stand's top:
 * its outline is the two cut faces joined by their common tangents, every curve a true Bézier projected control point
 * by control point. It only turns, never scales. The slider is how long one flip takes, in ms.
 */
const { Cam, fit, proj, tween, tset, tval, tdone, EASE_LIFT, disposer, mk, pointer, register } = HL;

// The plate (half PL, corner PR, PH high); the stand (radius SR) from the plate to ZT; the coin (radius R, thickness
// T) centred ZC, so its lowest quarter is inside the stand; its slot is GAP wider than the coin all round.
const Q = Math.PI / 2, PL = 17, PR = 6, PH = 3, ZT = 6.6, R = 14, T = 2.4, ZC = ZT + 0.74 * R, GAP = 1.5;
const BETA = Math.asin((ZC - ZT) / R), HALF = Math.sqrt(R * R - (ZC - ZT) ** 2), SR = HALF + GAP + 2.2;
const LO = -BETA, MID = Math.PI + BETA, HI = 2 * Math.PI - BETA, MARK = { c: 0.28 * R, s: 0.24 * R, r: 0.07 * R };
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let dur = value;

  const C = Cam(45, 0.5, 5.2), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const plate = [[-PL, -PL], [PL, PL], [-PL, PL], [PL, -PL]].flatMap(([x, y]) => [[x, y, 0], [x, y, PH]]);
  const swing = Array.from({ length: 16 }, (_, i) => [R * Math.cos((i * Math.PI) / 8), R * Math.sin((i * Math.PI) / 8), ZC]);
  const pose = [...plate, ...swing, [0, 0, ZC + R]];
  fit(C, pose, 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v));
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // the way to the viewer, from the camera itself: a face whose normal points along it is the face we see
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let W = x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]));
  if (W[2] < 0) W = W.map((x) => -x);

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
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);
  // A horizontal circle's screen extremes sit at FR and FR + π; FR → FR + π is its near half.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  /** The plate: a rounded square slab, its silhouette and the near edge of its top. */
  function slab(h, r, za, zb) {
    const cs = [[h - r, -h + r], [h - r, h - r], [-h + r, h - r], [-h + r, -h + r]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(zb, FR + 2 * Q, FR + 4 * Q, true) + run(za, FR, FR + 2 * Q, false) + "Z", run(zb, FR, FR + 2 * Q, true)];
  }
  /** The stand: an upright drum, its silhouette and the near edge of its top. */
  const drum = (r, za, zb) => [arc([0, 0, zb], EX, EY, r, FR - 2 * Q, FR, true) + arc([0, 0, za], EX, EY, r, FR, FR + 2 * Q, false) + "Z",
    arc([0, 0, zb], EX, EY, r, FR, FR + 2 * Q, true)];

  // back to front: plate, stand, slot, coin. The coin stands above the stand's top wherever it shows, so on any ray
  // through it the coin is nearer than the stand: it is always painted last, at every angle.
  const g = mk("g", {}, svg);
  const [ps, pc] = slab(PL, PR, 0, PH), [ds, dc] = drum(SR, PH, ZT);
  path(g, ps, "sil"); path(g, pc, "nf lo"); path(g, ds, "sil"); path(g, dc, "nf lo");
  const slot = path(g, "", "sil"), coinG = mk("g", {}, g);
  const sil = path(coinG, "", "sil"), rim = path(coinG, "", "nf lo"), mark = path(coinG, "", "nf lo");

  /** A face of the cut coin, at centre c, in face axes e1 (level) and e2 (up), as one loop on s: the arc above the
   * cut from LO to MID, then the chord along the cut from MID to HI (≡ LO). pos gives a loop point on screen. */
  function face(c, e1, e2) {
    const A = at3(c, e1, e2, R, MID), B = at3(c, e1, e2, R, HI);
    const norm = (s) => { const k = Math.floor((s - LO) / (4 * Q)); return [s - k * 4 * Q, k]; };
    const pos = (s) => { const [l] = norm(s); return P(...(l <= MID ? at3(c, e1, e2, R, l) : mix(A, B, (l - MID) / (HI - MID)))); };
    function trace(s0, s1, move) {
      let d = "", s = s0, first = move;
      while (s < s1 - 1e-9) {
        const [l, k] = norm(s), base = k * 4 * Q;
        if (l < MID - 1e-9) { const stop = Math.min(s1, base + MID); d += arc(c, e1, e2, R, l, stop - base, first); s = stop; }
        else { const stop = Math.min(s1, base + 4 * Q + LO); d += (first ? `M${f2(pos(s))}` : "") + `L${f2(pos(stop))}`; s = stop; }
        first = false;
      }
      return d;
    }
    return { pos, trace };
  }
  /** The loop point that reaches farthest along screen direction m: an arc's turning point, or a corner of the cut. */
  function support(e1, e2, m) {
    const f = Math.atan2(dot(m, J(e2)), dot(m, J(e1))), val = (s) => (s <= MID ? dot(m, J(add(e1.map((x) => x * Math.cos(s)), e2, Math.sin(s)))) : -Infinity);
    const cand = [f, f + 2 * Q].map((s) => s - Math.floor((s - LO) / (4 * Q)) * 4 * Q).concat([LO, MID]);
    return cand.reduce((b, s) => (val(s) > val(b) ? s : b), LO);
  }

  /** The coin turned th about its vertical axis: face A (the ring) has normal [cos th, sin th, 0]. */
  function draw(th) {
    const nA = [Math.cos(th), Math.sin(th), 0], e1 = [-Math.sin(th), Math.cos(th), 0], sA = dot3(nA, W) >= 0 ? 1 : -1;
    const c = [0, 0, ZC], cv = add(c, nA, (sA * T) / 2), ch = add(c, nA, (-sA * T) / 2), V = face(cv, e1, EZ), H = face(ch, e1, EZ);
    const D = [P(...cv)[0] - P(...ch)[0], P(...cv)[1] - P(...ch)[1]], m = [-D[1], D[0]];
    // the outline is the two faces swept along D: the side of the seen face that looks along D, a common tangent,
    // the hidden face's far side, and the other tangent. The seen face's other side is the rim's inner edge.
    let a = support(e1, EZ, m), b = support(e1, EZ, [-m[0], -m[1]]);
    if (b <= a) b += 4 * Q;
    const pa = V.pos(a), pb = V.pos(b), mid = V.pos((a + b) / 2), dir = [pb[0] - pa[0], pb[1] - pa[1]];
    if (cross(dir, [mid[0] - pa[0], mid[1] - pa[1]]) * cross(dir, D) < 0) { [a, b] = [b, a]; if (b <= a) b += 4 * Q; }
    sil.setAttribute("d", V.trace(a, b, true) + H.trace(b, a + 4 * Q, false) + "Z");
    rim.setAttribute("d", V.trace(b, a + 4 * Q, true));
    let mk2 = "";
    if (sA > 0) mk2 = arc(cv, e1, EZ, MARK.c, 0, 4 * Q, true) + "Z";
    else { const k = MARK.s - MARK.r; [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([i, j], q) => { mk2 += arc(add(add(cv, e1, i * k), EZ, j * k), e1, EZ, MARK.r, q * Q, (q + 1) * Q, q === 0); }); mk2 += "Z"; }
    mark.setAttribute("d", mk2);
    // the slot turns with the coin: a stadium round its foot on the stand's top, GAP clear of the coin all round
    const z = [0, 0, ZT], w = T / 2 + GAP, l = HALF + GAP - w;
    slot.setAttribute("d", arc(add(z, e1, l), e1, nA, w, -Q, Q, true) + arc(add(z, e1, -l), e1, nA, w, Q, 3 * Q, false) + "Z");
  }

  // The tween is the clock: its eased value is read back to the time it stands for, and each flip runs on an
  // s-curve over that time, so the coin eases out of rest and into its landing instead of snapping round at once.
  let u = tween(0, dur), drawn = NaN, shown = "", aim = 0;
  const clock = (e) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; EASE_LIFT(m) < e ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
  function show(state) {
    if (state === shown) return;
    shown = state;
    const on = state === "flipping";
    sil.setAttribute("class", on ? "sil hi" : "sil");
    rim.setAttribute("class", on ? "nf hi" : "nf lo");
    read.textContent = state;
  }
  const B = register(stage, (_dt, now) => {
    const done = tdone(u, now), p = done ? u.to : u.from + (u.to - u.from) * sm(clock((tval(u, now) - u.from) / (u.to - u.from || 1)));
    if (p !== drawn) { drawn = p; draw(-Math.PI * p); }
    if (!done) { show("flipping"); return true; }
    show(aim % 2 ? "square" : "circle");
    if (aim >= 2) { aim %= 2; u = tween(aim, dur); drawn = aim; } // the same pose, a full turn on
    return false;
  });
  bag.add(B.unregister);

  // hit test: the box of the whole figure at rest, coin's sweep included, which never moves; each entry is one flip
  const box = pose.map((v) => P(...v));
  const bx = [Math.min(...box.map((q) => q[0])) - 6, Math.max(...box.map((q) => q[0])) + 6], by = [Math.min(...box.map((q) => q[1])) - 6, Math.max(...box.map((q) => q[1])) + 6];
  const hit = ([x, y]) => x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1];
  let inside = false;
  function flip() {
    const now = performance.now(), cur = drawn;
    aim += 1;
    u = tween(cur, dur * Math.max(0.5, aim - cur)); tset(u, aim, now, 0);
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => { const h = hit(p); if (h && !inside) flip(); inside = h; },
    leave: () => { inside = false; },
  }));
  bag.add(() => svg.replaceChildren());
  draw(0); drawn = 0; show("circle");

  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "flip",
  means: "A coin in its stand flips to its other face: hover and it spins half a turn, ring side to square side.",
  rules: [1, 4, 6, 8],
  range: [700, 800, 900],
  mount,
});
