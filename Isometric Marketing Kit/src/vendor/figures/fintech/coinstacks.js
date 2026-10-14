/**
 * Coinstacks: a low rounded tray on the ground, its long side facing right, holding six straight stacks of identical
 * coins in a row that rise left to right like a growth chart: 1, 2, 3, 4, 5 and 6 coins, each coin a hair off the one
 * under it (seeded, the same every time). The mark (data-mark: A-Z, 0-9, $ € £ ¥ or Rp, default $) is drawn in single
 * strokes on each stack's top coin only, and moves to a coin the moment it lands. Hover: coins fall one at a time, left
 * to right, from above the frame onto the stacks, each landing with a tiny bounce, faster and faster, until the stacks
 * stand at their compound heights: the last one 8 coins at 1 year to 20 at 10 (data-years, 1-10, default 5), each final
 * height a constant ratio over the one before it, from 2. Leave: the added coins lift off the stacks' tops, right to left,
 * and rise out of the frame. Nothing fades; every coin moves. Both settings are read live: a change empties the stacks
 * and fills them once more, under the pointer or, when nobody hovers, on its own. Grey at rest; hovered, only the coin
 * that landed last is bright, then the top coin of the tallest stack. The hit area is a fixed box round the tray and the
 * full stacks. Every curve is a true Bézier: the camera is affine.
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"$":[0.952,"M0.381 -1.19 L0.381 0.19 M0.571 -1.19 L0.571 0.19 M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"p":[0.857,"M0.19 -0.667 L0.19 0.333 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"€":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 M0.048 -0.619 L0.619 -0.619 M0.048 -0.429 L0.571 -0.429"],"£":[0.952,"M0.762 -0.857 L0.714 -0.952 0.619 -1 0.476 -1 0.381 -0.952 0.333 -0.857 0.333 -0.524 0.333 -0.238 0.286 -0.095 0.19 -0.024 0.143 0 0.81 0 M0.143 -0.524 L0.619 -0.524"],"¥":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524 M0.143 -0.429 L0.714 -0.429 M0.143 -0.238 L0.714 -0.238"]};
const { Cam, fit, proj, disposer, mk, pointer, register, reducedMotion, clamp } = HL;
const Q = Math.PI / 2, N = 6, H = Math.SQRT1_2;
// coins: radius R, thickness T, the mark's radius / R, stacks SP apart along y (stack 1 at +y: left and nearest; on screen
// 0.707·SP ≥ 1.15·2R, so neighbouring stacks never overlap at any height), each coin's seeded offset at most JIT
const R = 5, T = 1.6, MR = 0.42, SP = 16.5, JIT = 0.32, TR = 0.1;
// the tray: ±TX by ±TY, corners TC, TT high; its lip LIP wide, its floor REC under the lip, where the coins stand
const TX = R + 3.5, TY = 2.5 * SP + R + 3.5, TC = 6, TT = 2.6, LIP = 1.4, REC = 0.8, ZF = TT - REC;
// s: a coin's fall and its bounce; a replay's hold when full. A coin lifts off at V0 and speeds up by ACC (world units/s, /s²)
const FALL = 0.36, BOUNCE = 0.12, HOLD = 0.9, V0 = 60, ACC = 300;
const lt = (c) => (Math.sqrt(V0 * V0 + 2 * ACC * (c.zs - c.zl)) - V0) / ACC; // the time a coin takes to rise out of the frame
const ys = Array.from({ length: N }, (_, j) => (2.5 - j) * SP);
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** The stacks' final heights for y years: from 2, a constant ratio to the last one's 8 (1 year) ... 20 (10 years). */
function finals(y) {
  const top = Math.round(8 * 2.5 ** ((y - 1) / 9)), r = (top / 2) ** (1 / (N - 1)), f = [];
  for (let i = 0; i < N; i++) f.push(i === N - 1 ? top : Math.max(Math.round(2 * r ** i), i ? f[i - 1] + 1 : 2, i + 1));
  return f;
}
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 3.7), F10 = finals(10);
  const ring = (cx, cy, r, z) => Array.from({ length: 8 }, (_, i) => [cx + r * Math.cos(i * Q / 2), cy + r * Math.sin(i * Q / 2), z]);
  const trayPts = [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [0, TT].flatMap((z) => ring(a * (TX - TC), b * (TY - TC), TC, z))));
  const stackPts = (F) => ys.flatMap((y, j) => ring(0, y, R + JIT, ZF + F[j] * T));
  fit(C, trayPts.concat(stackPts(F10)), 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, s2 = (a, k) => [a[0] * k, a[1] * k], ad = (p, a, k) => [p[0] + k * a[0], p[1] + k * a[1]];
  const EX = [1, 0, 0], EY = [0, 1, 0], ZF1 = O[1] - P(0, 0, 1)[1], EB = R * Math.hypot(J(EX)[1], J(EY)[1]);
  const at3 = (c, r, f) => [c[0] + r * Math.cos(f), c[1] + r * Math.sin(f), c[2]], S2 = (c, r, f) => P(...at3(c, r, f));
  /** An arc of a level world circle, as cubics of at most 90°: the camera is affine, so the projection is exact. */
  function arc(c, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    let d = `${move ? "M" : "L"}${f2(S2(c, r, f0))}`;
    for (let i = 0, a = f0, b = f0 + h; i < n; i++, a = b, b += h) {
      const p0 = at3(c, r, a), p3 = at3(c, r, b);
      d += `C${f2(P(p0[0] - k * r * Math.sin(a), p0[1] + k * r * Math.cos(a), c[2]))} ${f2(P(p3[0] + k * r * Math.sin(b), p3[1] - k * r * Math.cos(b), c[2]))} ${f2(P(...p3))}`;
    }
    return d;
  }
  // a level circle's right extreme on screen is at angle FR, its left at FL; the near half runs FR to FL
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), FL = FR + 2 * Q;
  /** The tray's rounded outline at height z, inset by `inset`, from angle f0 to f1 (each corner a quarter of the turn). */
  function rrect(z, f0, f1, move, inset = 0) {
    const r = TC - inset, cs = [[TX - TC, TC - TY], [TX - TC, TY - TC], [TC - TX, TY - TC], [TC - TX, TC - TY]];
    let d = "", f = f0, first = move;
    for (let stop; f < f1 - 1e-9; first = false, f = stop) { const i = Math.floor((f + Q) / Q + 1e-9); stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], r, f, stop, first); }
    return d;
  }
  // back to front: the tray (its outline, its lip's inner edge, the far part of its floor's edge, where it shows under
  // the lip), then the stacks from the farthest (stack 6) to the nearest, each coin over the one under it
  const g = mk("g", {}, svg), path = (d, cls) => mk("path", { d, class: cls }, g);
  const al = Math.asin(clamp((REC * ZF1) / (2 * (TC - LIP) * Math.hypot(J(EX)[1], J(EY)[1])), 0, 1));
  path(rrect(TT, FL, FR + 4 * Q, true) + rrect(0, FR, FL, false) + "Z", "sil");
  path(rrect(TT, -Q, 3 * Q, true, LIP) + "Z", "nf lo");
  path(rrect(ZF, FL + al, FR + 4 * Q - al, true, LIP), "nf lo");
  const zsOf = (y) => (P(0, y, 0)[1] + EB + 4) / ZF1; // a coin this high is wholly above the frame
  const stacks = ys.map((y, j) => ({ j, coins: Array.from({ length: F10[j] }, (_, s) => ({ j, s, x: JIT * (2 * rnd(j * 97 + s * 13 + 1) - 1),
    y: y + JIT * (2 * rnd(j * 57 + s * 31 + 7) - 1), zl: ZF + s * T, zs: zsOf(y), tl: Infinity, toff: Infinity, d: null })) }));
  for (let j = N - 1; j >= 0; j--) stacks[j].coins.forEach((c) => { c.el = path("", "sil"); });
  // the mark: its strokes in units of the coin's radius, centred; traced there and back, so the coin's fill adds nothing
  let MS = [];
  const back = (pts) => "M" + pts.concat(pts.slice(0, -1).reverse()).map(f2).join("L");
  function setMark(m) {
    let x = 0; const st = [];
    for (const ch of m) { GL[ch][1].forEach((p) => st.push(p.map(([gx, gy]) => [x + gx - TR / 2, gy]))); x += GL[ch][0] - TR; }
    const pts = st.flat(), bx = [0, 1].map((i) => [Math.min(...pts.map((p) => p[i])), Math.max(...pts.map((p) => p[i]))]);
    const em = MR / Math.hypot(...bx.map(([l, h]) => (h - l) / 2));
    MS = st.map((s) => s.map((p) => p.map((v, i) => (v - (bx[i][0] + bx[i][1]) / 2) * em)));
  }
  const AU = s2(J([H, -H, 0]), R), AV = s2(J([H, H, 0]), R); // on a level face: right, and down (toward the eye) on screen
  /** A coin with its foot at height z: its outline and its top face's near edge, as one filled path; the mark on top. */
  function coinPath(c, z, mark) {
    const c0 = [c.x, c.y, z], c1 = [c.x, c.y, z + T], F = P(...c1);
    return arc(c1, R, FL, FR + 4 * Q, true) + `L${f2(S2(c0, R, FR))}` + arc(c0, R, FR, FL, false) + "Z" + arc(c1, R, FR, FL, true)
      + (mark ? MS.map((st) => back(st.map(([u, v]) => ad(ad(F, AU, u), AV, v)))).join("") : "");
  }

  // the run, on the kernel's clock: clk s since mount. Each added coin has a landing time tl (its fall starts FALL
  // before) and a lift-off time toff. "in": it may still be lifting from an earlier leave, then it falls; "out": it may
  // still be falling, then it lifts.
  let mode = "out", clk = 0, tIn = 0, tGrown = 0, tOut = 0, BH = value, list = [], F = finals(5), HIT = [0, 0, 0, 0];
  function zOwn(c, t) {
    const s = Math.min(t - c.toff, lt(c)), lift = () => Math.min(c.zs, c.zl + V0 * s + (ACC * s * s) / 2), v = (t - c.tl) / BOUNCE;
    const drop = () => (t < c.tl ? c.zs - (c.zs - c.zl) * ((t - c.tl + FALL) / FALL) ** 2 : v < 1 ? c.zl + BH * 4 * v * (1 - v) : c.zl);
    if (mode === "in") return t >= c.tl - FALL ? drop() : t >= c.toff ? lift() : c.zl;
    return t >= c.toff ? lift() : t >= c.tl - FALL ? drop() : c.zs;
  }
  const onStack = (c, t) => (mode === "in" ? t >= c.tl || (t < c.tl - FALL && t < c.toff) : t >= c.tl && t < c.toff);
  /** Hover: the coins not on the stacks fall in fill order, landing faster and faster; one still lifting off first rises out. */
  function planIn(c0) {
    const rem = list.filter((c) => !(c0 >= c.tl - FALL && c0 < c.toff)), n = rem.length, span = 1 + 0.08 * n;
    let last = -Infinity;
    rem.forEach((c, r) => {
      const u = n > 1 ? r / (n - 1) : 0, lifting = c.toff <= c0 && c0 < c.toff + lt(c);
      c.tl = last = Math.max(c0 + FALL + span * (u + 0.5 * u * (1 - u)), lifting ? c.toff + lt(c) + FALL : -Infinity, last + 0.02);
      if (!(c.toff <= c0)) c.toff = -Infinity;
    });
    list.forEach((c) => { if (!rem.includes(c)) c.toff = -Infinity; });
    mode = "in"; tIn = c0; tGrown = Math.max(c0, ...list.map((c) => c.tl + BOUNCE));
  }
  /** Leave: the coins that came (landed, or still falling) lift off, the last first; the rest stay above the frame. */
  function planOut(c0) {
    const inn = list.filter((c) => c0 >= c.tl - FALL).reverse(), k = inn.length, gap = k > 1 ? (1 + 0.5 * clamp((k - 7) / 23, 0, 1) - 0.45) / (k - 1) : 0;
    list.forEach((c) => { if (!inn.includes(c)) c.tl = Infinity; });
    let last = -Infinity;
    inn.forEach((c, r) => { c.toff = last = Math.max(c0 + r * gap, c.tl + BOUNCE, last); });
    mode = "out"; tOut = Math.max(c0, ...inn.map((c) => c.toff + lt(c)));
  }
  /** Every coin at time t: a coin never sinks into the one under it; the mark on each stack's top coin. */
  function draw(t) {
    const tops = stacks.map((st) => {
      let prev = -Infinity, top = st.j;
      st.coins.forEach((c) => {
        const live = c.s < F[st.j], z = c.s <= st.j ? c.zl : Math.max(zOwn(c, t), prev + T);
        prev = z; c.z = z; c.show = live && P(c.x, c.y, z)[1] + EB > 0;
        if (live && c.s > st.j && c.s === top + 1 && onStack(c, t)) top = c.s;
      });
      st.coins.forEach((c) => { const d = c.show ? coinPath(c, c.z, c.s === top) : ""; if (d !== c.d) c.el.setAttribute("d", (c.d = d)); });
      return top;
    });
    return tops;
  }
  /** The stage's settings, cleaned: years 1-10 (default 5), the mark (default $). */
  function cfg() {
    const yv = (stage.getAttribute("data-years") ?? "").trim(), y = yv !== "" && Number.isFinite(+yv) ? clamp(Math.round(+yv), 1, 10) : 5;
    const m = (stage.getAttribute("data-mark") ?? "").trim(), m1 = [...m].length === 1 ? m.toUpperCase() : m;
    return { y, mark: /^rp$/i.test(m) ? "Rp" : /^[A-Z0-9$€£¥]$/.test(m1) ? m1 : "$" };
  }
  function apply(c) {
    F = finals(c.y); setMark(c.mark); stacks.forEach((st) => st.coins.forEach((k) => { k.tl = k.toff = Infinity; k.d = null; }));
    list = stacks.flatMap((st) => st.coins.filter((k) => k.s > st.j && k.s < F[st.j]));
    const pts = trayPts.concat(stackPts(F)).map((v) => P(...v));
    HIT = [0, 1, 0, 1].map((i, n) => (n < 2 ? Math.min : Math.max)(...pts.map((q) => q[i])) + (n < 2 ? -3 : 3));
  }

  let hover = false, demo = false, pending = false, lit = null, said = "";
  const attrs = () => `${stage.getAttribute("data-years")}\n${stage.getAttribute("data-mark")}`;
  let seen = attrs();
  apply(cfg());
  const tk = register(stage, (dt) => {
    if (attrs() !== seen) { seen = attrs(); pending = true; demo = false; }
    clk += reducedMotion() ? 60 : dt;
    if (pending && mode === "out" && clk >= tOut) { apply(cfg()); pending = false; demo = !hover; }
    const want = !pending && (hover || demo) ? "in" : "out";
    if (want !== mode) (want === "in" ? planIn : planOut)(clk);
    if (demo && !hover && clk >= tGrown + HOLD) { demo = false; planOut(clk); }
    const tops = draw(clk);
    // bright: the coin that landed last in this run (the first while it falls), then the tallest stack's top coin
    let on = null;
    if (mode === "in") {
      if (clk >= tGrown) on = stacks[N - 1].coins[tops[N - 1]];
      else on = list.reduce((b, c) => (c.tl <= clk && c.tl >= tIn && (!b || c.tl > b.tl) ? c : b), null)
        || list.reduce((b, c) => (c.tl - FALL <= clk && c.tl > clk && (!b || c.tl < b.tl) ? c : b), null);
    }
    if (on !== lit) { lit?.el.classList.remove("hi"); on?.el.classList.add("hi"); lit = on; }
    const state = mode === "out" ? "rest" : clk < tGrown ? "growing" : "grown";
    if (state !== said) read.textContent = said = state;
    return pending || (mode === "in" ? clk < tGrown + (demo ? HOLD : 0) : clk < tOut);
  });
  const mo = new MutationObserver(() => tk.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-years", "data-mark"] });
  bag.add(tk.unregister); bag.add(() => mo.disconnect());
  // the hit area: a fixed box round the tray and the full stacks, from the layout, never the pose on screen
  const inBox = ([x, y]) => x >= HIT[0] && x <= HIT[2] && y >= HIT[1] && y <= HIT[3];
  const hov = (v) => { if (v !== hover) { hover = v; if (v) demo = false; tk.wake(); } };
  bag.add(pointer(stage, { move: (pt) => hov(inBox(pt)), leave: () => hov(false) }));
  bag.add(() => svg.replaceChildren()); read.textContent = said = "rest"; tk.wake();
  return { set: (v) => { BH = v; tk.wake(); }, destroy: bag.dispose };
}

hairline({ name: "coinstacks", means: "Hover and coins land on the stacks year by year, growing faster as they compound.", rules: [1, 4, 5, 6], range: [0.25, 0.5, 0.75], mount });
