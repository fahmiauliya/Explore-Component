/**
 * Jars: a shelf holding three identical open glass jars, each with a straight stack of coins inside and its label on the
 * shelf's front edge below it, like a price tag. The split of one budget comes from the stage's data-jars
 * ("LABEL:PCT|LABEL:PCT|LABEL:PCT", read live; an invalid value keeps the last valid one): each jar holds its share of
 * MAXC coins. Hover a jar and one or two coins lift out of the others, arc over the rims and drop into it; leave and
 * they go back. Grey at rest; the hovered jar's coins and its label are bright, the glass stays grey. Hit areas are the jars' resting
 * columns, which never move. Every hop runs on one shared, critically damped spring; each moving coin keeps its own lane.
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""]};
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

// A jar: a plain open glass cylinder, R round and H tall, its rim a double ring RIM thick. Jars stand SP apart, so on
// screen the gap between neighbours is 0.707·SP − 2R, about 31% of a jar's width: their outlines never meet.
const N = 3, SP = 52, R = 14, H = 26, RIM = 0.9, Q = Math.PI / 2;
// Coins: identical flat discs stacked straight up the jar's middle, clear of its wall; a 100% jar holds MAXC, its top
// well under the rim. T ≤ (R − RIM − RC)/√3: a coin crossing the rim plane stays inside the mouth's inner ring on
// screen, so drawn over the glass it covers nothing it shouldn't. A hopping coin lifts to its own lane over the rims (HC: it moves sideways only above it), arcs
// ARC higher on the way across, and drops; the lift and the drop take A of the hop each.
const RC = 8.6, T = 2.6, Z0 = 1, MAXC = 6, LANE = T + 0.6, HC = H + 0.4, CLEAR = H + 1.2, ARC = 3, A = 0.35, TOP = CLEAR + 3 * LANE + T + ARC;
const CALM = { k: 60, c: 15.5 }, BACK = { k: 200, c: 28.3 }; // hover: the house calm; back to the split: ~0.5 s, no overshoot
// The shelf: a rounded plank BT thick, 4.5 past the end jars. Each label is drawn on its front face (x = x1), centred
// under its jar at one fixed size HT; only a label wider than TW is scaled down, to stay on the flat of the face.
const BOARD = { x0: -17.5, x1: 17.5, y0: -(N - 1) * SP - R - 4.5, y1: R + 4.5, r: 5 }, BT = 8.5, HT = 5.4, TR = 0.1, TW = 26;
const DEF = "NEEDS:50|WANTS:30|SAVE:20";
const ys = Array.from({ length: N }, (_, j) => -j * SP), slotZ = (s) => Z0 + s * T;
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)), sum = (a) => a.reduce((x, y) => x + y, 0);
const inv = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : 0.5 - Math.sin(Math.asin(1 - 2 * v) / 3)); // sm(inv(v)) = v
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));

/** "LABEL:PCT|LABEL:PCT|LABEL:PCT": three labels (up to 6 of A-Z 0-9 space) and whole percents summing to 100, or null. */
function parse(s) {
  const e = String(s ?? "").split("|").map((x) => x.match(/^([A-Za-z0-9 ]{0,6}):(\d{1,3})$/));
  const pct = e.length === N && e.every(Boolean) ? e.map((x) => +x[2]) : null;
  return !pct || pct.some((p) => p > 100) || sum(pct) !== 100 ? null : { labels: e.map((x) => x[1].toUpperCase().trim()), pct };
}
/** Coins per jar for a split: its share of MAXC, rounded, and at least one in any jar above 0%. */
const share = (pct) => pct.map((p) => (p > 0 ? Math.max(1, Math.round((p * MAXC) / 100)) : 0));
/** The coins in each jar with jar k chosen: up to m come to it, one from each other jar that has one before any gives
 * twice, the fullest first, the nearer on a tie; never past MAXC. The total is always the same. */
function counts(base, k, m) {
  const c = base.slice(), key = (i) => (base[i] - c[i]) * 100 - c[i] * 10 + Math.abs(i - k);
  for (let t = 0; t < m && c[k] < MAXC; t++) {
    const d = c.reduce((b, n, i) => (i !== k && n > 0 && (b < 0 || key(i) < key(b)) ? i : b), -1);
    if (d < 0) break; c[d]--; c[k]++;
  }
  return c;
}

/** A coin's place at progress p of a hop: straight up or down in its own jar; or up out of its jar to its lane, across
 * in a low arc (only while it is above the rims), and down into the next jar. */
function hop(f, p) {
  if (p >= 1) return [f.y1, f.z1];
  if (f.lane === null) return [f.y1, f.z0 + (f.z1 - f.z0) * sm(p / 0.6)];
  const z = p < A ? f.z0 + (f.lane - f.z0) * sm(p / A) : p > 1 - A ? f.lane + (f.z1 - f.lane) * sm((p - 1 + A) / A) : f.lane;
  const u = Math.min(1, Math.max(0, (p - f.pa) / Math.max(1e-6, f.pb - f.pa)));
  return [f.y0 + (f.y1 - f.y0) * sm(u), z + ARC * Math.sin(Math.PI * u)];
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
  // pa, pb: when the lift reaches HC and when the drop leaves it; the coin moves sideways only between them
  hops.forEach((c, r) => {
    const f = c.f, l = (f.lane = CLEAR + r * LANE);
    f.pa = f.z0 >= HC ? 0 : A * inv((HC - f.z0) / (l - f.z0)); f.pb = 1 - A + A * inv((l - HC) / (l - f.z1));
  });
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let m = Math.max(1, Math.min(2, Math.round(value))), split = parse(stage.getAttribute("data-jars")) || parse(DEF), base = share(split.pct);
  const C = Cam(45, 0.5, 2.35);
  fit(C, [[BOARD.x0, BOARD.y0, 0], [BOARD.x1, BOARD.y1, -BT], [BOARD.x0, BOARD.y1, -BT], [BOARD.x1, BOARD.y0, 0], [-RC, ys[N - 1] - RC, TOP], [-RC, -RC, TOP]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], L = (q) => `L${f2(q)}`;
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
  // On screen, a level circle's right extreme is at angle FR, its left at FR + π; the near half runs between.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), FL = FR + 2 * Q;
  // The shelf: a rounded plank, its outline the top's back half and the bottom's front half, one dim crease.
  function rrect(t, z, f0, f1, move, inset = 0) {
    const r = t.r - inset, cs = [[t.x1 - t.r, t.y0 + t.r], [t.x1 - t.r, t.y1 - t.r], [t.x0 + t.r, t.y1 - t.r], [t.x0 + t.r, t.y0 + t.r]];
    let d = "", f = f0, first = move;
    for (let stop; f < f1 - 1e-9; first = false, f = stop) { const i = Math.floor((f + Q) / Q + 1e-9); stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], r, f, stop, first); }
    return d;
  }
  const g = mk("g", {}, svg), path = (d, cls, par = g) => mk("path", { d, class: cls }, par);
  path(rrect(BOARD, 0, FL, FR + 4 * Q, true) + rrect(BOARD, -BT, FR, FL, false) + "Z", "sil"); path(rrect(BOARD, 0, FR, FL, true, 1.6), "nf lo");
  /** A label in single strokes on the shelf's front face, centred under the jar at y: s runs along the shelf (left to
   * right on screen), z up the face. The face is flat and the camera affine, so each stroke projects straight. */
  function labelPath(y, txt) {
    const w0 = [...txt].reduce((w, ch) => w + GL[ch][0] - TR, 0), h = Math.min(HT, TW / Math.max(w0, 1e-6)), zb = -BT / 2 - h / 2;
    const face = (s, z) => f2(P(BOARD.x1, y - s, z));
    let x = (-w0 * h) / 2, d = "";
    for (const ch of txt) { GL[ch][1].forEach((st) => { d += st.map(([gx, gy], i) => (i ? "L" : "M") + face(x + (gx - TR / 2) * h, zb - gy * h)).join(""); }); x += (GL[ch][0] - TR) * h; }
    return d;
  }
  /** One jar standing at y: its outline (also its fill: the near half of its foot, the sides, the far half of its mouth)
   * and its rim: the mouth's near half and the inner ring, the glass's thickness. */
  function jarPaths(y) {
    const c = (z) => [0, y, z];
    return { out: arc(c(0), R, FR, FL, true) + L(S2(c(H), R, FL)) + arc(c(H), R, FL, FR + 4 * Q, false) + "Z",
      rim: arc(c(H), R, FR, FL, true) + arc(c(H), R - RIM, FR, FR + 4 * Q, true) + "Z" };
  }
  // back to front: the shelf's labels, then the jar furthest back (smallest y) first, in each its coins, then the glass's
  // edge; last, the air the coins hop through, above every rim, so nothing there is ever covered
  const tags = ys.map(() => path("", "nf sil"));
  const jars = ys.map((y) => ({ y })).reverse().map((jar) => {
    const p = jarPaths(jar.y), grp = mk("g", {}, g);
    path(p.out, "fo", grp); jar.inside = mk("g", {}, grp);
    return Object.assign(jar, { edge: path(p.out + p.rim, "nf sil", grp) });
  }).reverse();
  jars.forEach((jar, j) => { jar.text = tags[j]; });
  const air = mk("g", {}, g), label = () => jars.forEach((jar, j) => jar.text.setAttribute("d", labelPath(jar.y, split.labels[j]))); label();
  /** A coin with its foot at height z: its outline and its top face's near edge, as one filled path. */
  const coinPath = (y, z, c0 = [0, y, z], c1 = [0, y, z + T]) => arc(c1, RC, FL, FR + 4 * Q, true) + L(S2(c0, RC, FR)) + arc(c0, RC, FR, FL, false) + "Z" + arc(c1, RC, FR, FL, true);
  const coins = [];
  base.forEach((n, j) => { for (let s = 0; s < n; s++) coins.push({ jar: j, slot: s, y: ys[j], z: slotZ(s), f: { y0: ys[j], z0: slotZ(s), y1: ys[j], z1: slotZ(s), lane: null }, el: path("", "sil", jars[j].inside) }); });
  let go = spring(1, CALM), drawn = NaN, order = "", seen = stage.getAttribute("data-jars");
  /** Places every coin at progress p: wholly under the rim it is in its jar, behind the glass; otherwise in the air
   * over everything. Each layer paints far to near, low to high. */
  function draw(p) {
    coins.forEach((c) => { [c.y, c.z] = hop(c.f, p); c.el.setAttribute("d", coinPath(c.y, c.z)); });
    const layer = (c) => (c.z + T <= H ? ys.reduce((b, y, i) => (Math.abs(y - c.y) < Math.abs(ys[b] - c.y) ? i : b), 0) : N);
    const sorted = coins.slice().sort((a, b) => 0.61 * (a.y - b.y) + 0.5 * (a.z - b.z));
    const key = sorted.map((c) => coins.indexOf(c) + ":" + layer(c)).join(",");
    if (key !== order) { order = key; sorted.forEach((c) => (layer(c) === N ? air : jars[layer(c)].inside).append(c.el)); }
  }
  /** Rebuilds the coins for a new split: as many as it needs, all at rest in their jars. */
  function refill() {
    coins.splice(0).forEach((c) => c.el.remove());
    base.forEach((n, j) => { for (let s = 0; s < n; s++) coins.push({ jar: j, slot: s, y: ys[j], z: slotZ(s), f: { y0: ys[j], z0: slotZ(s), y1: ys[j], z1: slotZ(s), lane: null }, el: path("", "sil", jars[j].inside) }); });
    order = "";
  }
  draw(1);

  // data-jars is read on every frame the loop runs, and an observer wakes the loop when it changes. A valid new split
  // moves the coins to it (a split with another number of coins sets them out afresh); an invalid one is ignored.
  const B = register(stage, (dt) => {
    const a = stage.getAttribute("data-jars");
    if (a !== seen) {
      seen = a; const p = parse(a);
      if (p) { split = p; const nb = share(p.pct); if (sum(nb) !== coins.length) { base = nb; refill(); } else base = nb; label(); apply(act, BACK); }
    }
    const moving = stepS(go, dt); if (go.x !== drawn) draw((drawn = go.x));
    return moving;
  }), mo = new MutationObserver(() => B.wake());
  mo.observe(stage, { attributes: true, attributeFilter: ["data-jars"] }); bag.add(B.unregister); bag.add(() => mo.disconnect());
  // hit test: the nearest RESTING jar along the row, from above its rim down to the foot of its label. Jars never move.
  const left = ys.map((y) => S2([0, y, 0], R, FL)[0]), right = ys.map((y) => S2([0, y, 0], R, FR)[0]), mid = left.map((x, j) => (x + right[j]) / 2);
  const hit = ([x, y], j = mid.reduce((b, cx, i) => (Math.abs(x - cx) < Math.abs(x - mid[b]) ? i : b), 0)) =>
    x >= left[0] - 4 && x <= right[N - 1] + 4 && y >= S2([0, ys[j], H], R, FR - Q)[1] - 6 && y <= P(BOARD.x1, ys[j], -BT)[1] + 3 ? j : -1;
  let act = -1;
  /** Moves the coins to jar k's pose (-1: the split) on spring sp; grey at rest, bright: the chosen jar's label and its coins. */
  function apply(k, sp) {
    plan(coins, k < 0 ? base : counts(base, k, m));
    go = spring(0, sp); go.t = 1; drawn = NaN; read.textContent = k < 0 ? "rest" : `jar ${k + 1}`;
    jars.forEach((jar, j) => jar.text.classList.toggle("hi", j === k));
    coins.forEach((c) => c.el.classList.toggle("hi", k >= 0 && c.jar === k)); B.wake();
  }
  const choose = (k) => { if (k !== act) { act = k; apply(k, k < 0 ? BACK : CALM); } };
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) })); bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  return { set: (v) => { m = Math.max(1, Math.min(2, Math.round(v))); if (act >= 0) apply(act, CALM); }, destroy: bag.dispose };
}

hairline({
  name: "jars",
  means: "Three jars share one budget: hover a jar and coins move into it, then settle back to your split.",
  rules: [1, 4, 5, 6],
  range: [1, 1.5, 2],
  mount,
});
