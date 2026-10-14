/**
 * Jars: a shelf holding three identical glass jars, each with a label band round its front and a straight stack of
 * coins inside. The split of one budget comes from the stage's data-jars ("LABEL:PCT|LABEL:PCT|LABEL:PCT", read live;
 * an invalid value keeps the last valid one): each jar holds its share of the coins, the label in single strokes on
 * the glass. Hover a jar and two or three coins hop into it from the others, over the rims; leave and they go back.
 * Grey at rest; the hovered jar, its label and its coins are bright. Hit areas are the jars' RESTING columns, which
 * never move. Every hop runs on one shared, critically damped spring; each moving coin keeps its own height lane.
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""]};
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

// A jar: a wide body, a cone shoulder and a short open neck. Coins fit through the neck with room to spare.
const N = 3, SP = 40, R = 13, RN = 10, HS = 26, HN = 29.5, H = 33, Q = Math.PI / 2;
// Coins: identical flat discs stacked straight from the jar's floor. COINS is the total, and a 100% jar holds them
// all, its top at 22, 85% of the way to the shoulder; a jar never holds more than CAPN, which stays under it.
const RC = 8, T = 2.1, Z0 = 1, COINS = 10, CAPN = Math.floor((HS - Z0) / T), LANE = T, CLEAR = H + 1.5, TOP = CLEAR + 3 * LANE + T;
const CALM = { k: 60, c: 15.5 }, BACK = { k: 200, c: 28.3 }; // hover: the house calm; back to the split: ~0.5 s, no overshoot
const BOARD = { x0: -16.5, x1: 16.5, y0: -(N - 1) * SP - 17.5, y1: 17.5, r: 9.5 }, BT = 5;
// The label: a band ±BA round the body's front, VB0..VB1 high, corner BRR; its type HT tall (only a label too wide is scaled)
const VB0 = 19.5, VB1 = 23.8, BA = 12.6, BRR = 1.4, HT = 3.2, TR = 0.1, TW = 2 * (BA - 1.2);
const DEF = "NEEDS:50|WANTS:30|SAVE:20";
const ys = Array.from({ length: N }, (_, j) => -j * SP), slotZ = (s) => Z0 + s * T;
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)), sum = (a) => a.reduce((x, y) => x + y, 0);
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));

/** "LABEL:PCT|LABEL:PCT|LABEL:PCT": three labels (up to 6 of A-Z 0-9 space) and whole percents summing to 100, or null. */
function parse(s) {
  const e = String(s ?? "").split("|").map((x) => x.match(/^([A-Za-z0-9 ]{0,6}):(\d{1,3})$/));
  const pct = e.length === N && e.every(Boolean) ? e.map((x) => +x[2]) : null;
  return !pct || pct.some((p) => p > 100) || sum(pct) !== 100 ? null : { labels: e.map((x) => x[1].toUpperCase().trim()), pct };
}
/** Coins per jar for a split: rounded shares of COINS, at least one in any jar above 0%, nudged until they sum to COINS. */
function share(pct) {
  const raw = pct.map((p) => (p * COINS) / 100), c = raw.map((x, i) => (pct[i] > 0 ? Math.max(1, Math.round(x)) : 0));
  const pick = (ok, by) => c.reduce((b, _, i) => (ok(i) && (b < 0 || by(i) > by(b)) ? i : b), -1);
  for (let s = sum(c); s !== COINS; s += s > COINS ? -1 : 1) c[s > COINS ? pick((i) => c[i] > 1, (i) => c[i] - raw[i]) : pick((i) => pct[i] > 0, (i) => raw[i] - c[i])] += s > COINS ? -1 : 1;
  return c;
}
/** The coins in each jar with jar k chosen: up to m come to it, one from each other jar that has one before any gives
 * twice, the fullest first, the nearer on a tie; never past CAPN. The total is always the same. */
function counts(base, k, m) {
  const c = base.slice(), key = (i) => (base[i] - c[i]) * 100 - c[i] * 10 + Math.abs(i - k);
  for (let t = 0; t < m && c[k] < CAPN; t++) {
    const d = c.reduce((b, n, i) => (i !== k && n > 0 && (b < 0 || key(i) < key(b)) ? i : b), -1);
    if (d < 0) break; c[d]--; c[k]++;
  }
  return c;
}

/** A coin's place at progress p of a hop: straight up or down in its own jar, or up to its lane (well inside its jar
 * before it leaves it), along the lane over the rims, and down into the next jar. */
function hop(f, p) {
  if (p >= 1) return [f.y1, f.z1];
  if (f.lane === null) return [f.y1, f.z0 + (f.z1 - f.z0) * sm(p / 0.6)];
  const y = f.y0 + (f.y1 - f.y0) * sm((p - 0.3) / 0.4);
  return [y, p < 0.66 ? f.z0 + (f.lane - f.z0) * sm(p / 0.32) : f.lane + (f.z1 - f.lane) * sm((p - 0.66) / 0.34)];
}
/** Moves the coins to the counts `want`: the top coins of every jar over its count go, lowest first, to the free slots,
 * lowest first. Hopping coins take lanes by height, one coin thick apart, so none meets another. */
function plan(coins, want) {
  const leave = [], open = [];
  want.forEach((w, j) => { const here = coins.filter((c) => c.jar === j).sort((a, b) => a.slot - b.slot); leave.push(...here.slice(w)); for (let s = here.length; s < w; s++) open.push([j, s]); });
  // a coin still over a jar that needs one takes its lowest free slot first, so nothing drops through it
  leave.sort((a, b) => a.z - b.z); open.sort((a, b) => a[1] - b[1]);
  open.slice().forEach((o) => { const i = leave.findIndex((c) => Math.abs(c.y - ys[o[0]]) < 1e-6); if (i >= 0) { [leave[i].jar, leave[i].slot] = o; leave.splice(i, 1); open.splice(open.indexOf(o), 1); } });
  leave.forEach((c, i) => { [c.jar, c.slot] = open[i]; });
  const hops = coins.filter((c) => Math.abs(c.y - ys[c.jar]) > 1e-6).sort((a, b) => a.z - b.z);
  ys.forEach((_, j) => { const to = hops.filter((c) => c.jar === j), sl = to.map((c) => c.slot).sort((a, b) => a - b); to.forEach((c, i) => { c.slot = sl[i]; }); });
  coins.forEach((c) => { c.f = { y0: c.y, z0: c.z, y1: ys[c.jar], z1: slotZ(c.slot), lane: null }; });
  hops.forEach((c, r) => { c.f.lane = CLEAR + r * LANE; });
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let m = Math.round(value), split = parse(stage.getAttribute("data-jars")) || parse(DEF), base = share(split.pct);
  const C = Cam(45, 0.5, 2.7);
  fit(C, [[BOARD.x0, BOARD.y0, 0], [BOARD.x1, BOARD.y1, -BT], [BOARD.x0, BOARD.y1, -BT], [BOARD.x1, BOARD.y0, 0], [-RC, ys[N - 1] - RC, TOP], [-RC, -RC, TOP]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], L = (q) => `L${f2(q)}`, cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics project exactly.
  const at3 = (c, r, f) => [c[0] + r * Math.cos(f), c[1] + r * Math.sin(f), c[2]], S2 = (c, r, f) => P(...at3(c, r, f));
  function arc(c, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    let d = `${move ? "M" : "L"}${f2(S2(c, r, f0))}`;
    for (let i = 0, a = f0, b = f0 + h; i < n; i++, a = b, b += h) {
      const p0 = at3(c, r, a), p3 = at3(c, r, b);
      d += `C${f2(P(p0[0] - k * r * Math.sin(a), p0[1] + k * r * Math.cos(a), c[2]))} ${f2(P(p3[0] + k * r * Math.sin(b), p3[1] - k * r * Math.cos(b), c[2]))} ${f2(P(...p3))}`;
    }
    return d;
  }
  // On screen, a level circle's right extreme is at angle FR, its left at FR + π, its nearest point FC between.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), FL = FR + 2 * Q, FC = FR + Q;
  // The shelf: a rounded plank, its outline the top's back half and the bottom's front half, one dim crease.
  function rrect(t, z, f0, f1, move, inset = 0) {
    const r = t.r - inset, cs = [[t.x1 - t.r, t.y0 + t.r], [t.x1 - t.r, t.y1 - t.r], [t.x0 + t.r, t.y1 - t.r], [t.x0 + t.r, t.y0 + t.r]];
    let d = "", f = f0, first = move;
    for (let stop; f < f1 - 1e-9; first = false, f = stop) { const i = Math.floor((f + Q) / Q + 1e-9); stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], r, f, stop, first); }
    return d;
  }
  const g = mk("g", {}, svg), path = (d, cls, par = g) => mk("path", { d, class: cls }, par);
  path(rrect(BOARD, 0, FL, FR + 4 * Q, true) + rrect(BOARD, -BT, FR, FL, false) + "Z", "sil"); path(rrect(BOARD, 0, FR, FL, true, 1.6), "nf lo");
  // The shoulder's outline touches its two circles at one angle each side (the circles are homothetic on
  // screen): A cos f + B sin f = −Δr·K. The neck's sides cut that line, where the outline turns up the neck.
  const u = J(EX), v = J(EY), D = [0, P(0, 0, HN)[1] - P(0, 0, HS)[1]], ca = cross(D, v), cb = -cross(D, u);
  const bs = Math.atan2(cb, ca), s = Math.acos((-(RN - R) * cross(u, v)) / Math.hypot(ca, cb)), fr = bs + s, fl = bs - s + 4 * Q;
  /** One jar standing at y: its outline (also its fill) and its rim. No crease: glass would draw it over the coins. */
  function jarPaths(y) {
    const c = (z) => [0, y, z], cut = (f, side) => {
      const a = S2(c(HS), R, f), b = S2(c(HN), RN, f), x = S2(c(HN), RN, side)[0], t = (x - a[0]) / (b[0] - a[0]);
      return [x, a[1] + t * (b[1] - a[1])];
    };
    // where the shoulder meets the neck, a small round instead of a corner: a cubic tangent to both lines
    const bend = (p, k, q) => {
      const to = (e) => { const l = Math.hypot(e[0] - k[0], e[1] - k[1]); return [k[0] + ((e[0] - k[0]) * 3) / l, k[1] + ((e[1] - k[1]) * 3) / l]; };
      const a = to(p), b = to(q), h = (e) => [e[0] + (k[0] - e[0]) * 0.55, e[1] + (k[1] - e[1]) * 0.55];
      return L(a) + `C${f2(h(a))} ${f2(h(b))} ${f2(b)}`;
    };
    const sl = S2(c(HS), R, fl), sr = S2(c(HS), R, fr), nl = S2(c(H), RN, FL), nr = S2(c(H), RN, FR);
    const out = arc(c(0), R, FR, FL, true) + L(S2(c(HS), R, FL)) + arc(c(HS), R, FL, fl, false) + bend(sl, cut(fl, FL), nl) + L(nl)
      + arc(c(H), RN, FL, FR + 4 * Q, false) + bend(nr, cut(fr, FR), sr) + L(sr) + arc(c(HS), R, fr + 4 * Q, FR + 4 * Q, false) + "Z";
    return { out, rim: arc(c(H), RN, FR, FL, true) };
  }
  // The label lies on the body's front: a point (s, z) of it is s along the circumference from the front (to the right
  // on screen) at height z. The band's top and bottom are arcs of the body's circles; its corners, cubics on the glass.
  const on = (y, sv, z) => S2([0, y, z], R, FC - sv / R), K4 = 0.5523;
  function bandPath(y) {
    const a = BA, b = BA - BRR, cor = (s0, z0, s1, z1, sx, zx) => `C${f2(on(y, s0 + (sx - s0) * K4, z0 + (zx - z0) * K4))} ${f2(on(y, s1 + (sx - s1) * K4, z1 + (zx - z1) * K4))} ${f2(on(y, s1, z1))}`;
    return `M${f2(on(y, a, VB0 + BRR))}` + L(on(y, a, VB1 - BRR)) + cor(a, VB1 - BRR, b, VB1, a, VB1) + arc([0, y, VB1], R, FC - b / R, FC + b / R, false)
      + cor(-b, VB1, -a, VB1 - BRR, -a, VB1) + L(on(y, -a, VB0 + BRR)) + cor(-a, VB0 + BRR, -b, VB0, -a, VB0) + arc([0, y, VB0], R, FC + b / R, FC - b / R, false)
      + cor(b, VB0, a, VB0 + BRR, a, VB0) + "Z";
  }
  /** The label's text in single strokes, centred on the band and wrapped onto the glass: each stroke cut fine enough to follow it. */
  function textPath(y, txt) {
    const w0 = [...txt].reduce((w, ch) => w + GL[ch][0] - TR, 0), h = Math.min(HT, TW / Math.max(w0, 1e-6)), zb = (VB0 + VB1) / 2 - h / 2;
    const fine = (o, q) => { const n = Math.max(1, Math.ceil(Math.abs(q[0] - o[0]) / 0.4)); return Array.from({ length: n }, (_, j) => L(on(y, o[0] + ((q[0] - o[0]) * (j + 1)) / n, o[1] + ((q[1] - o[1]) * (j + 1)) / n))).join(""); };
    let x = (-w0 * h) / 2, d = "";
    for (const ch of txt) { GL[ch][1].forEach((st) => { const p = st.map(([gx, gy]) => [x + (gx - TR / 2) * h, zb - gy * h]); d += "M" + f2(on(y, ...p[0])) + p.slice(1).map((q, i) => fine(p[i], q)).join(""); }); x += (GL[ch][0] - TR) * h; }
    return d;
  }
  // back to front: the jar furthest back (smallest y) first; in each, its coins, then its label over them, then the glass's
  // edge; last, the air the coins hop through
  const jars = ys.map((y) => ({ y })).reverse().map((jar) => {
    const p = jarPaths(jar.y), grp = mk("g", {}, g);
    path(p.out, "fo", grp); jar.inside = mk("g", {}, grp);
    return Object.assign(jar, { band: path(bandPath(jar.y), "sil", grp), text: path("", "nf sil", grp), edge: path(p.out + p.rim, "nf sil", grp) });
  }).reverse();
  const air = mk("g", {}, g), label = () => jars.forEach((jar, j) => jar.text.setAttribute("d", textPath(jar.y, split.labels[j]))); label();
  /** A coin with its foot at height z: its outline and its top face's near edge, as one filled path. */
  const coinPath = (y, z, c0 = [0, y, z], c1 = [0, y, z + T]) => arc(c1, RC, FL, FR + 4 * Q, true) + L(S2(c0, RC, FR)) + arc(c0, RC, FR, FL, false) + "Z" + arc(c1, RC, FR, FL, true);
  const coins = [];
  base.forEach((n, j) => { for (let s = 0; s < n; s++) coins.push({ jar: j, slot: s, y: ys[j], z: slotZ(s), f: { y0: ys[j], z0: slotZ(s), y1: ys[j], z1: slotZ(s), lane: null }, el: path("", "sil", jars[j].inside) }); });
  let go = spring(1, CALM), drawn = NaN, order = "", seen = stage.getAttribute("data-jars");
  /** Places every coin at progress p; a coin sits inside its jar while its middle is under the rim, and in the air above
   * everything otherwise. Each layer paints far to near, low to high. */
  function draw(p) {
    coins.forEach((c) => { [c.y, c.z] = hop(c.f, p); c.el.setAttribute("d", coinPath(c.y, c.z)); });
    const layer = (c) => { const j = ys.findIndex((y) => Math.abs(y - c.y) < 0.5); return j >= 0 && c.z + T / 2 < H ? j : N; };
    const sorted = coins.slice().sort((a, b) => 0.61 * (a.y - b.y) + 0.5 * (a.z - b.z));
    const key = sorted.map((c) => coins.indexOf(c) + ":" + layer(c)).join(",");
    if (key !== order) { order = key; sorted.forEach((c) => (layer(c) === N ? air : jars[layer(c)].inside).append(c.el)); }
  }
  draw(1);

  // data-jars is read on every frame the loop runs, and an observer wakes the loop when it changes. A valid new split
  // moves the coins to it; an invalid one is ignored, so the last valid split stays.
  const B = register(stage, (dt) => {
    const a = stage.getAttribute("data-jars");
    if (a !== seen) { seen = a; const p = parse(a); if (p) { split = p; base = share(p.pct); label(); apply(act, BACK); } }
    const moving = stepS(go, dt); if (go.x !== drawn) draw((drawn = go.x));
    return moving;
  }), mo = new MutationObserver(() => B.wake());
  mo.observe(stage, { attributes: true, attributeFilter: ["data-jars"] }); bag.add(B.unregister); bag.add(() => mo.disconnect());
  // hit test: the nearest RESTING jar along the row, within that jar's own height on screen. Jars never move.
  const left = ys.map((y) => S2([0, y, 0], R, FL)[0]), right = ys.map((y) => S2([0, y, 0], R, FR)[0]), mid = left.map((x, j) => (x + right[j]) / 2);
  const hit = ([x, y], j = mid.reduce((b, cx, i) => (Math.abs(x - cx) < Math.abs(x - mid[b]) ? i : b), 0)) =>
    x >= left[0] - 4 && x <= right[N - 1] + 4 && y >= S2([0, ys[j], H], RN, FR - Q)[1] - 6 && y <= S2([0, ys[j], 0], R, FR + Q)[1] + 6 ? j : -1;
  let act = -1;
  /** Moves the coins to jar k's pose (-1: the split) on spring sp; grey at rest, bright: the chosen jar, its label and its coins. */
  function apply(k, sp) {
    plan(coins, k < 0 ? base : counts(base, k, m));
    go = spring(0, sp); go.t = 1; drawn = NaN; read.textContent = k < 0 ? "rest" : `jar ${k + 1}`;
    jars.forEach((jar, j) => [jar.edge, jar.band, jar.text].forEach((e) => e.classList.toggle("hi", j === k)));
    coins.forEach((c) => c.el.classList.toggle("hi", k >= 0 && c.jar === k)); B.wake();
  }
  const choose = (k) => { if (k !== act) { act = k; apply(k, k < 0 ? BACK : CALM); } };
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) })); bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  return { set: (v) => { m = Math.max(2, Math.min(3, Math.round(v))); if (act >= 0) apply(act, CALM); }, destroy: bag.dispose };
}

hairline({
  name: "jars",
  means: "Three jars share one budget: hover a jar and coins move into it, then settle back to your split.",
  rules: [1, 4, 5, 6],
  range: [2, 2.5, 3],
  mount,
});
