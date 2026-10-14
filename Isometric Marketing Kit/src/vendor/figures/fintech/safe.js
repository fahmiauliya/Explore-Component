/**
 * Safe: a cube safe standing on the ground, its front facing +x, the right-facing isometric plane. Every part of the
 * front is built in that plane's own frame (u along −y, v up, f out along +x) and projected through P: the door
 * outline, a code display of four rounded cells, a numbered dial (ten ticks, the 0 tick longer) and a lever handle.
 * Hover the safe and the dial enters the code: it turns to digit 1 clockwise and the digit appears in its cell, then
 * digit 2 counter-clockwise, 3 clockwise, 4 counter-clockwise (each digit is 36° on the dial); then the handle swings
 * down and the display lights. Leave: the handle swings up, the digits clear right to left and the dial goes home.
 * The stage's data-code (four digits, default 2580) and data-hide-code ("true": dots) are read live; a change plays
 * the unlock once. Digits are Hershey single strokes on the door's plane. Every curve is a true Bézier (affine camera).
 */
const DIGITS = {"0":"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1","1":"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0","2":"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0","3":"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19","4":"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0","5":"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19","6":"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333","7":"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1","8":"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1","9":"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"};
const { Cam, fit, proj, hull, seg, clamp, lerp, EASE_LIFT, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const Q = Math.PI / 2, deg = (d) => (d * Math.PI) / 180;
// the body: 2·BX deep (front at x = BX), 2·BY wide, BH high, corners BR, standing on the ground
const BX = 16, BY = 19, BR = 3, BH = 32;
// the door: inset DI from the body's sides, top and bottom, corners DR
const DI = 4, DR = 2.2;
// the display: four cells CW square, CG apart, centred on the door at height CV, corners CR; digits H tall
const CW = 3.8, CG = 0.8, CV = 24, CR = 0.9, H = 2.3;
// the dial at (DU, DV): RD round and DT thick, a knob RK round and KT thick, ten ticks from T1 to T2 (the 0 tick to T0)
const DU = -6, DV = 12.6, RD = 4.2, DT = 1.5, RK = 1.7, KT = 1.2, T1 = 6.3, T2 = 7.3, T0 = 7.9;
// the handle at (HU, DV): a boss HB round, BT thick; a lever LL long, 2·LW wide, LT thick, level when locked, down open
const HU = 6.5, HB = 2, BT = 1.1, LL = 5, LW = 1.2, LT = 1.3, DOWN = deg(-90);
// timing in ms: a step is a turn and a short pause; the handle; leaving clears a digit every CLR, the dial comes home
const TURN = 0.75, HAND = 400, HOLD = 600, OUT = 300, CLR = 100, HOME = 500;
const GL = Object.fromEntries(Object.entries(DIGITS).map(([c, d]) => [c, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;

  // the front plane's frame: u to the right on screen (−y), v up (z), f out of the face (+x)
  const U = [0, -1, 0], V = [0, 0, 1], F = [1, 0, 0], Fp = (u, v, f) => [BX + f, -u, v];
  const C = Cam(45, 0.5, 4.7);
  fit(C, [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[a * BX, b * BY, 0], [a * BX, b * BY, BH]])), 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const dir = (a) => add(U.map((x) => x * Math.cos(a)), V, Math.sin(a)), nrm = (a) => add(U.map((x) => -x * Math.sin(a)), V, Math.cos(a));

  // every curve is a cubic Bézier of a world arc: the camera is affine, so the projection is exact
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
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, from angle f0 to f1 (f0 < f1). */
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0, f1, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded outline on a visible face at o, run back by the vector n: one silhouette, and the face's inner half as
   * its crease. The outline splits where its tangent runs along n on screen, so each half is one smooth run. */
  function slab(o, e1, e2, rect, r, n) {
    const Tv = J(n), fs = Math.atan2(cross(J(e2), Tv), cross(J(e1), Tv)), m = J(add(e1.map((x) => x * Math.cos(fs + Q)), e2, Math.sin(fs + Q)));
    const a = (m[0] * Tv[0] + m[1] * Tv[1] < 0 ? fs : fs + 2 * Q) + 4 * Q;
    return { sil: rr(o, e1, e2, rect, r, a, a + 2 * Q) + rr(add(o, n), e1, e2, rect, r, a + 2 * Q, a + 4 * Q, false) + "Z", crease: rr(o, e1, e2, rect, r, a + 2 * Q, a + 4 * Q) };
  }
  const back = (d) => [-d, 0, 0], disc = (r) => [-r, -r, r, r], lone = (q) => ({ sil: q.sil, crease: "" });
  const whole = (q) => ({ sil: q.sil + q.crease, crease: "" }), line = (a, b) => seg(P(...a), P(...b));
  const polar = (r, a, f = 0) => Fp(DU + r * Math.cos(a), DV + r * Math.sin(a), f), tick = (p) => Q - deg(36) * p;

  // back to front: the body; on the face the door outline with the dial's ticks, and the display's cells and digits;
  // then what stands off the face: dial and knob, the handle's boss and lever
  const g = mk("g", {}, svg), path = (cls, d = "") => mk("path", { class: cls, d }, g), face = Fp(0, 0, 0), D = BY - DI;
  const body = solid(g);
  put(body, slab([0, 0, BH], U, F, [-BY, -BX, BY, BX], BR, [0, 0, -BH]));
  const ticks = Array.from({ length: 10 }, (_, i) => line(polar(T1, tick(i)), polar(i ? T2 : T0, tick(i)))).join("");
  path("nf sil", rr(face, U, V, [-D, DI, D, BH - DI], DR, 0, 4 * Q) + "Z" + ticks);
  const cu = (j) => (j - 1.5) * (CW + CG);
  const cells = [0, 1, 2, 3].map((j) => path("nf sil", rr(face, U, V, [cu(j) - CW / 2, CV - CW / 2, cu(j) + CW / 2, CV + CW / 2], CR, 0, 4 * Q) + "Z"));
  const marks = [0, 1, 2, 3].map(() => path("nf sil"));
  /** What cell j shows: a Hershey digit centred in it, a small ring for a hidden digit, or a dash. */
  const glyph = (j, c, hide) => c == null ? line(Fp(cu(j) - 0.45 * H, CV, 0), Fp(cu(j) + 0.45 * H, CV, 0))
    : hide ? arc(Fp(cu(j), CV, 0), U, V, 0.32, 0, 4 * Q, true) + "Z"
    : GL[c].map((p) => "M" + p.map(([x, y]) => pt(Fp(cu(j) + (x - 0.476) * H, CV - (y + 0.5) * H, 0))).join("L")).join("");
  const dial = solid(g), knob = solid(g), boss = solid(g), lever = solid(g);
  put(knob, whole(slab(Fp(DU, DV, DT + KT), U, V, disc(RK), RK, back(KT))));
  put(boss, lone(slab(Fp(HU, DV, BT), U, V, disc(HB), HB, back(BT))));
  const dialAt = (a) => ({ sil: whole(slab(Fp(DU, DV, DT), U, V, disc(RD), RD, back(DT))).sil + line(polar(RK + 0.45, a, DT), polar(RD - 0.55, a, DT)), crease: "" });
  const leverAt = (a) => lone(slab(Fp(HU, DV, BT + LT), dir(a), nrm(a), [-LW, -LW, LL, LW], LW, back(LT)));

  // one clock: the mode's start T0 and what was snapshot then. "on": enter the code and unlock; "off": relock
  const ease = (x) => EASE_LIFT(clamp(x, 0, 1)), mod = (p) => ((p % 10) + 10) % 10;
  let code = "2580", hide = false, seen = null, mode = "rest", T = 0, ps = [0], pL = 0, pT = 0, hL = 0, nL = 0, hovered = false, demo = false;
  /** The pose at now: dial position p (in digits, clockwise from 0), handle h, digits shown n, the cell being entered. */
  function pose(now) {
    const e = reducedMotion() ? 1e9 : now - T, s = step, tt = TURN * s;
    if (mode === "on") {
      const i = clamp(Math.floor(e / s), 0, 3), n = clamp(Math.floor((e - tt) / s) + 1, 0, 4);
      return { p: lerp(ps[i], ps[i + 1], ease((e - i * s) / tt)), h: ease((e - 4 * s) / HAND), n, cur: e < 4 * s ? i : -1, hand: e >= 4 * s, open: e >= 4 * s + HAND, e };
    }
    if (mode === "off") return { p: lerp(pL, pT, ease((e - CLR) / HOME)), h: hL * (1 - ease(e / OUT)), n: Math.max(0, nL - Math.floor(e / CLR)), cur: -1, done: e >= CLR + HOME, e };
    return { p: 0, h: 0, n: 0, cur: -1 };
  }
  /** Enter from wherever the dial is: each digit strictly past it, clockwise for 1 and 3, counter-clockwise for 2 and 4. */
  function enter(now) {
    const p0 = pose(now).p;
    ps = [p0];
    [...code].forEach((c, i) => { const p = ps[i], dlt = i % 2 ? mod(p - +c) || 10 : mod(+c - p) || 10; ps.push(p + (i % 2 ? -dlt : dlt)); });
    mode = "on"; T = now; B.wake();
  }
  function leave(now) {
    if (mode !== "on") return;
    const s = pose(now);
    pL = mod(s.p); pT = pL > 5 ? 10 : 0; hL = s.h; nL = s.n; mode = "off"; T = now; B.wake();
  }
  let dl = NaN, hl = NaN, shown = "", lit = "";
  const B = register(stage, (_dt, now) => {
    const attrs = [stage.getAttribute("data-code"), stage.getAttribute("data-hide-code")].join("|");
    if (attrs !== seen) {
      const first = seen === null, c = stage.getAttribute("data-code");
      seen = attrs; code = /^\d{4}$/.test(c || "") ? c : "2580"; hide = stage.getAttribute("data-hide-code") === "true";
      if (!first && !hovered) { demo = true; enter(now); }
    }
    let s = pose(now);
    if (demo && s.open && s.e >= 4 * step + HAND + HOLD) { demo = false; if (!hovered) { leave(now); s = pose(now); } }
    if (mode === "off" && s.done) { mode = "rest"; s = pose(now); }
    if (s.p !== dl) { dl = s.p; put(dial, dialAt(tick(s.p))); }
    if (s.h !== hl) { hl = s.h; put(lever, leverAt(DOWN * s.h)); }
    const key = `${s.n}|${code}|${hide}`;
    if (key !== shown) { shown = key; marks.forEach((m, j) => m.setAttribute("d", glyph(j, j < s.n ? code[j] : null, hide))); }
    // grey at rest; entering: the dial, the cell being entered and the digits so far; unlocked: handle and display
    const on = mode === "on", state = on ? (s.open ? "unlocked" : "entering") : "rest", hk = `${state}|${s.cur}|${s.n}|${s.hand}`;
    if (hk !== lit) {
      lit = hk;
      [dial, knob].forEach((p) => p.sil.classList.toggle("hi", on && !s.hand));
      [boss, lever].forEach((p) => p.sil.classList.toggle("hi", on && s.hand));
      cells.forEach((el, j) => el.classList.toggle("hi", on && (s.open || s.cur === j)));
      marks.forEach((el, j) => el.classList.toggle("hi", on && j < s.n));
      if (read.textContent !== state) read.textContent = state;
    }
    return mode === "off" || (on && (!s.open || demo));
  });
  bag.add(B.unregister);
  const mo = new MutationObserver(() => B.wake());
  mo.observe(stage, { attributes: true, attributeFilter: ["data-code", "data-hide-code"] });
  bag.add(() => mo.disconnect());

  // the hit area: the safe's body at rest, as the hull of its box on screen. Nothing in it ever moves
  const HIT = hull([-BX, BX].flatMap((x) => [-BY, BY].flatMap((y) => [0, BH].map((z) => P(x, y, z)))));
  const side = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inside = (p) => new Set(HIT.map((a, i) => side(p, a, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  function hover(v) {
    if (v === hovered) return;
    const now = performance.now();
    hovered = v;
    if (v) { demo = false; if (mode !== "on") enter(now); } else if (!demo) leave(now);
  }
  bag.add(pointer(stage, { move: (p) => hover(inside(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  B.wake();

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "safe",
  means: "A safe: hover and the dial enters the code digit by digit, then the handle unlocks.",
  rules: [1, 4, 6, 8],
  // ms per digit (a turn of three quarters of it, then a pause); at 400 the safe unlocks 2 s after the pointer arrives
  range: [320, 400, 480],
  mount,
});
