/**
 * Moneyplant: a small tapered pot with a rim, flat soil flush in it and, at rest, nothing but a tiny sprout of two twigs.
 * Hover: a coin drops from above into the soil and sinks in like a seed (0.4 s); the sprout pushes up into one slender,
 * gently curved stem (0.6 s) whose twigs reach out left and right in turn; coins grow on the twigs pair by pair, bottom
 * to top, each scaling up from its twig tip with a tiny settle (0.15 s), and one larger coin appears on the tip last.
 * Leave: the coins shrink back top to bottom and the stem lowers into the soil (0.8 s). data-years (1-10, default 5)
 * sets the coins by compound growth (2 ... 12, plus the top one) and the stem (1.8 ... 2.6 × the pot); data-mark (A-Z,
 * 0-9, $ € £ ¥ or Rp, default $) is the mark on every face, in single strokes. Both are read live: a change shrinks the
 * plant back and grows it again once, under the pointer or, when nobody hovers, on its own (a replay that returns to
 * rest). Grey at rest; hovered, only the coin appearing is bright (the seed while it drops), then the top coin alone.
 * The hit area is a fixed box round the pot and the full-grown plant. Every curve is a true Bézier: the camera is affine.
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"$":[0.952,"M0.381 -1.19 L0.381 0.19 M0.571 -1.19 L0.571 0.19 M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"p":[0.857,"M0.19 -0.667 L0.19 0.333 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"€":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 M0.048 -0.619 L0.619 -0.619 M0.048 -0.429 L0.571 -0.429"],"£":[0.952,"M0.762 -0.857 L0.714 -0.952 0.619 -1 0.476 -1 0.381 -0.952 0.333 -0.857 0.333 -0.524 0.333 -0.238 0.286 -0.095 0.19 -0.024 0.143 0 0.81 0 M0.143 -0.524 L0.619 -0.524"],"¥":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524 M0.143 -0.429 L0.714 -0.429 M0.143 -0.238 L0.714 -0.238"]};
const { Cam, fit, proj, disposer, mk, pointer, register, reducedMotion, clamp } = HL;
const Q = Math.PI / 2, D = Math.PI / 180, TAU = 4 * Q;
// the pot: a tapered body (foot r 3.5 to r 4.2, 8 high) under a straight rim band (r 4.7, 2.4 high); soil flush in the rim
const POT = { foot: 3.5, top: 4.2, body: 8, rim: 4.7, band: 2.4, soil: 3.9 }, ZS = POT.body + POT.band;
// coins: twig coin and top coin radius, thickness, mark radius / coin radius; a twig coin's centre REACH out from the
// stem; centres from ZLO over the soil to ZTOP under the tip, at most GAP apart; a twig leaves the stem NODE under its
// coin; the stem's bend; the sprout's height at rest; the seed drops DROP high, TW in front of the stem
const CR = 1.45, CT = 1.85, TH = 0.5, MR = 0.56, REACH = 4.2, ZLO = 4.6, ZTOP = 0, GAP = 2.6, NODE = 1.3, B1 = 0.8, B2 = -0.5, H0 = 2.2, DROP = 12, TW = 2.2;
const COUNT = [2, 3, 4, 5, 6, 7, 8, 10, 11, 12]; // coins at full growth for years 1 ... 10
// s: the seed's drop, the stem's end, a coin's pop, the top coin's pop, the way back, a replay's hold when grown
const SEED = 0.4, GROW = 1, POP = 0.15, TOPP = 0.2, BACK = 0.8, HOLD = 0.9, TR = 0.1;
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const pop = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - (1 - u) ** 3) * (1 + 0.12 * Math.sin(Math.PI * u))); // scale up, a tiny settle

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 7.2), R = Math.SQRT1_2, A = [R, -R, 0], T = [R, R, 0], Z = [0, 0, 1], EX = [1, 0, 0], EY = [0, 1, 0];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), sc = (a, s) => a.map((x) => x * s), len = (a) => Math.hypot(...a);
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  const ROOT = [0, 0, ZS], bend = (t) => 3 * (1 - t) * (1 - t) * t * B1 + 3 * (1 - t) * t * t * B2;
  const stemPt = (z, h, H) => add(add(ROOT, Z, z), A, bend(clamp(z / h, 0, 1)) * (h / H)); // the stem h high, grown to H
  /** The plant for y years, in world units: the coins (side, height, facing, twig) and the run's timings. */
  function layout(y, beta) {
    const n = COUNT[y - 1], H = ZS * (1.8 + 0.8 * Math.sqrt((y - 1) / 9)), span = H - ZTOP - ZLO, dz = Math.min(GAP, span / (n - 1));
    const z0 = ZLO + (span - (n - 1) * dz) * 0.6, step = (0.6 + 0.12 * (n - 2)) / n; // the coins take 0.8 ... 2 s, the top one last
    const coins = Array.from({ length: n }, (_, i) => {
      const s = i % 2 ? 1 : -1, z = z0 + i * dz, nn = add(sc(T, Math.cos(beta * D)), A, s * Math.sin(beta * D)), rt = x3(nn, Z);
      const c = add(stemPt(z, H, H), A, s * REACH), a = add(sc(rt, -s * Math.cos(20 * D)), Z, -Math.sin(20 * D)), ein = add(c, a, CR);
      return { s, zn: z - NODE, n: nn, a, ein, V: add(ein, stemPt(z - NODE, H, H), -1), t: GROW + Math.floor(i / 2) * 2 * step + (i % 2) * POP };
    });
    return { y, n, H, coins, tTop: GROW + n * step, RUN: GROW + n * step + TOPP };
  }
  const ext = (L) => [...L.coins.flatMap((c) => [-1, 1].flatMap((k) => [add(c.ein, A, k * 2 * CR), add(add(c.ein, Z, k * CR), A, c.s * CR)])),
    add(ROOT, Z, L.H + 2 * CT), ...[...Array(16)].flatMap((_, i) => [0, ZS].map((z) => [POT.rim * Math.cos(i * Q / 4), POT.rim * Math.sin(i * Q / 4), z]))];
  fit(C, ext(layout(10, 34)), 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const S3 = (v) => P(...v), f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, s2 = (a, k) => [a[0] * k, a[1] * k], ad = (p, a, k) => [p[0] + k * a[0], p[1] + k * a[1]];
  /** An arc of the screen ellipse c + a·cos f + b·sin f, as cubics of at most 90°: the image of a circle, so exact. */
  function arc(c, a, b, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const pt = (f) => ad(ad(c, a, Math.cos(f)), b, Math.sin(f)), tg = (f) => ad(s2(b, Math.cos(f)), a, -Math.sin(f));
    let d = (move ? "M" : "L") + f2(pt(f0));
    for (let i = 0, u = f0; i < n; i++, u += h) d += `C${f2(ad(pt(u), tg(u), k))} ${f2(ad(pt(u + h), tg(u + h), -k))} ${f2(pt(u + h))}`;
    return d;
  }
  const warc = (c, r, f0, f1, move) => arc(S3(c), s2(J(EX), r), s2(J(EY), r), f0, f1, move); // a level world circle
  const FR = Math.atan2(J(EY)[0], J(EX)[0]); // a level circle's rightmost point; its near half runs to FR + π
  /** The outline of two level circles (c0, r0) below (c1, r1): an arc of each and the two tangent lines. */
  function cyl(c0, r0, c1, r1) {
    const u = J(EX), v = J(EY), K = cr(u, v), p0 = S3(c0), p1 = S3(c1), Dd = [p1[0] - p0[0], p1[1] - p0[1]];
    const a0 = cr(Dd, v), b0 = -cr(Dd, u), base = Math.atan2(b0, a0), s = Math.acos(clamp((-(r1 - r0) * K) / (Math.hypot(a0, b0) || 1e-9), -1, 1));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (n[0] * e[0] + n[1] * e[1] < 0) n = [-n[0], -n[1]];
      const hh = (c, r) => n[0] * c[0] + n[1] * c[1] + r * Math.hypot(n[0] * u[0] + n[1] * u[1], n[0] * v[0] + n[1] * v[1]); return hh(p1, r1) >= hh(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + TAU;
    return warc(c1, r1, a, b, true) + warc(c0, r0, b, a + TAU, false) + "Z";
  }
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
  /** The mark on a face centred at F, its right Au and its down Av on screen, cut off below the screen line yc. */
  function marks(F, Au, Av, yc, d = "") {
    for (const st of MS) {
      let run = [], o = null; const out = () => { if (run.length > 1) d += back(run); run = []; };
      for (const [u, v] of st) {
        const q = ad(ad(F, Au, u), Av, v), qin = q[1] <= yc;
        if (o && o[1] <= yc !== qin) { run.push([o[0] + ((yc - o[1]) / (q[1] - o[1])) * (q[0] - o[0]), yc]); if (!qin) out(); }
        if (qin) run.push(q); o = q;
      }
      out();
    }
    return d;
  }
  /** A coin: a disc centred at c, radius r, its face toward n (turned to the eye), up in its plane: the outline of both
   * faces and their tangents, the near face's inner edge (the rim), and the mark on that face, as one path. */
  function disc(c, n, up, r) {
    const rt = x3(n, up), Fv = S3(add(c, n, TH / 2)), Fh = S3(add(c, n, -TH / 2)), a = s2(J(rt), r), b = s2(J(up), r), d = [Fh[0] - Fv[0], Fh[1] - Fv[1]];
    const fs = Math.atan2(cr(b, d), cr(a, d)), m = ad(s2(a, Math.cos(fs + Q)), b, Math.sin(fs + Q)), f0 = m[0] * d[0] + m[1] * d[1] < 0 ? fs : fs + 2 * Q;
    return arc(Fv, a, b, f0, f0 + 2 * Q, true) + arc(Fh, a, b, f0 + 2 * Q, f0 + TAU, false) + "Z" + arc(Fv, a, b, f0 + 2 * Q, f0 + TAU, true) + marks(Fv, a, s2(b, -1), Infinity);
  }
  /** The seed coin, upright and facing the eye, its centre zc over the soil: only the part above the soil. */
  function seed(zc, r) {
    const c = add(add(ROOT, T, TW), Z, zc), F = S3(add(c, T, TH / 2)), B = S3(add(c, T, -TH / 2)), a = [J(A)[0] * r, 0], by = -J(Z)[1] * r, bb = [0, by];
    const yc = S3(add(ROOT, T, TW + TH / 2))[1], dl = yc - F[1];
    if (dl >= by) return disc(c, T, Z, r);
    if (dl <= -by) return "";
    const al = Math.asin(dl / by), e = (p, f) => f2([p[0] + a[0] * Math.cos(f), p[1] + by * Math.sin(f)]), lo = dl <= 0;
    const d = lo ? `M${e(F, 2 * Q - al)}L${e(B, 2 * Q - al)}` + arc(B, a, bb, 2 * Q - al, TAU + al, false) + `L${e(F, al)}Z`
      : arc(F, a, bb, 2 * Q - al, 2 * Q, true) + arc(B, a, bb, 2 * Q, TAU, false) + arc(F, a, bb, 0, al, false) + "Z";
    return d + arc(F, a, bb, lo ? 2 * Q - al : 2 * Q, lo ? TAU + al : TAU, true) + marks(F, a, [0, by], yc);
  }

  // back to front: the pot (body, rim band, the rim's near edge, the soil); the stem, its twigs, the coins; the seed
  const g = mk("g", {}, svg), path = (cls) => mk("path", { d: "", class: cls }, g), rimLo = [0, 0, POT.body];
  mk("path", { d: cyl([0, 0, 0], POT.foot, add(rimLo, Z, 0.5), POT.top), class: "sil" }, g);
  mk("path", { d: cyl(rimLo, POT.rim, ROOT, POT.rim), class: "sil" }, g);
  mk("path", { d: warc(ROOT, POT.rim, FR, FR + 2 * Q, true), class: "nf sil" }, g);
  mk("path", { d: warc(ROOT, POT.soil, 0, TAU, true) + "Z", class: "lo" }, g);
  const stem = path("nf sil"), twigs = Array.from({ length: 12 }, () => path("nf sil")), coins = Array.from({ length: 12 }, () => path("sil"));
  const topC = path("sil"), seedC = path("sil"), all = [...coins, topC, seedC];
  const put = (el, d) => el.getAttribute("d") !== d && el.setAttribute("d", d);

  let beta = value, L = null, lastKey = "", HIT = [0, 0, 0, 0];
  /** The stage's settings, cleaned: years 1-10 (default 5), the mark (default $). */
  function cfg() {
    const yv = (stage.getAttribute("data-years") ?? "").trim(), y = yv !== "" && Number.isFinite(+yv) ? clamp(Math.round(+yv), 1, 10) : 5;
    const m = (stage.getAttribute("data-mark") ?? "").trim(), m1 = [...m].length === 1 ? m.toUpperCase() : m;
    return { y, mark: /^rp$/i.test(m) ? "Rp" : /^[A-Z0-9$€£¥]$/.test(m1) ? m1 : "$" };
  }
  function apply(c) {
    L = layout(c.y, beta); setMark(c.mark); lastKey = "";
    const pts = ext(L).concat([...Array(16)].map((_, i) => [POT.foot * Math.cos(i * Q / 4), POT.foot * Math.sin(i * Q / 4), 0])).map(S3);
    HIT = [Math.min(...pts.map((q) => q[0])) - 3, Math.min(...pts.map((q) => q[1])) - 3, Math.max(...pts.map((q) => q[0])) + 3, Math.max(...pts.map((q) => q[1])) + 3];
  }
  /** The plant q s into its run; the seed shows only on the way in. */
  function draw(q, fwd) {
    const key = `${q.toFixed(4)}|${fwd}|${L.y}|${beta}|${MS.length}`;
    if (key === lastKey) return;
    lastKey = key;
    const H = L.H, h = H0 + (H - H0) * sm((q - SEED) / (GROW - SEED)), k = h / H, cub = (p0, p1, p2, p3) => `M${f2(S3(p0))}C${f2(S3(p1))} ${f2(S3(p2))} ${f2(S3(p3))}`;
    put(stem, cub(ROOT, add(add(ROOT, Z, h / 3), A, B1 * k), add(add(ROOT, Z, (2 * h) / 3), A, B2 * k), add(ROOT, Z, h)));
    L.coins.forEach((c, i) => {
      // a twig: the sprout's two ride up with the tip to their nodes, opening out of a Y; the rest grow as the tip passes
      const tl = i < 2 ? 0.4 + 0.6 * clamp((h - H0) / (c.zn + 1.5 - H0), 0, 1) : clamp((h - c.zn) / 1.5, 0, 1), w = i < 2 ? (tl - 0.4) / 0.6 : 1;
      if (tl <= 0) put(twigs[i], "");
      else {
        const N = stemPt(Math.min(c.zn, h - 0.1), h, H), V = sc(add(sc(add(sc(A, 2 * c.s), Z, 2.2), 1 - w), c.V, w), tl), l = len(V);
        put(twigs[i], cub(N, add(add(N, V, 0.25), Z, 0.35 * l), add(add(N, V, 0.7), Z, 0.2 * l), add(N, V)));
      }
      const s = pop((q - c.t) / POP); // the coin scales up from its twig's tip
      put(coins[i], s > 0.02 ? disc(add(c.ein, c.a, -CR * s), c.n, Z, CR * s) : "");
    });
    for (let i = L.n; i < 12; i++) { put(twigs[i], ""); put(coins[i], ""); }
    const st = pop((q - L.tTop) / TOPP), tip = add(ROOT, Z, H);
    put(topC, st > 0.02 ? disc(add(tip, Z, CT * st), T, Z, CT * st) : "");
    const u = q / SEED, zc = u < 0.6 ? DROP - (DROP - CR) * (u / 0.6) ** 2 : CR - (2 * CR + 0.4) * sm((u - 0.6) / 0.4); // falls, then sinks in
    put(seedC, fwd && u < 1 ? seed(zc, CR * sm(u / 0.15)) : "");
  }

  // the run: p s into it, forward while hovered (or replaying), back (RUN - SEED)/BACK as fast while not
  let p = 0, hover = false, demo = false, pending = false, lit = "";
  const attrs = () => `${stage.getAttribute("data-years")}\n${stage.getAttribute("data-mark")}`;
  let seen = attrs();
  apply(cfg());
  const tk = register(stage, (dt) => {
    if (attrs() !== seen) { seen = attrs(); pending = true; demo = false; }
    const rm = reducedMotion(), rate = (L.RUN - SEED) / BACK;
    if (pending) { // a change: back to the sprout first, then the new plant grows once, hovered or not
      p = rm ? 0 : p - dt * rate;
      if (p <= SEED) { p = 0; apply(cfg()); pending = false; demo = !hover; }
    } else if (hover || demo) {
      const end = L.RUN + (hover ? 0 : HOLD);
      p = Math.min(end, Math.max(p + dt, rm ? L.RUN : 0));
      if (!hover && p >= end) { demo = false; p = L.RUN; }
    } else if ((p = rm ? 0 : p - dt * rate) <= SEED) p = 0;
    const fwd = !pending && (hover || demo), q = Math.min(p, L.RUN);
    draw(q, fwd);
    // bright: the seed while it drops; then the coin appearing (the newest, until the next sets out); then the top alone
    let on = -1;
    if (fwd && q < SEED) on = 13;
    else if (fwd && q >= GROW) on = q >= L.tTop ? 12 : L.coins.reduce((b, c, i) => (c.t <= q ? i : b), -1);
    const state = !fwd ? "rest" : q < SEED ? "planting" : q < L.RUN ? "growing" : "grown";
    if (`${on}|${state}` !== lit) { lit = `${on}|${state}`; read.textContent = state; all.forEach((el, i) => el.classList.toggle("hi", i === on)); }
    return pending || (hover ? p < L.RUN : demo || p > 0);
  });
  const mo = new MutationObserver(() => tk.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-years", "data-mark"] });
  bag.add(tk.unregister); bag.add(() => mo.disconnect());
  // the hit area: a fixed box round the pot and the full-grown plant, from the layout, never the pose on screen
  const inBox = ([x, y]) => x >= HIT[0] && x <= HIT[2] && y >= HIT[1] && y <= HIT[3];
  const hov = (v) => { if (v !== hover) { hover = v; if (v) demo = false; tk.wake(); } };
  bag.add(pointer(stage, { move: (pt) => hov(inBox(pt)), leave: () => hov(false) }));
  bag.add(() => svg.replaceChildren()); read.textContent = "rest"; tk.wake();
  return { set: (v) => { beta = v; L = layout(L.y, beta); lastKey = ""; tk.wake(); }, destroy: bag.dispose };
}

hairline({ name: "moneyplant", means: "Hover to plant a coin and watch it grow into more coins over the years.", rules: [1, 4, 5, 8], range: [14, 24, 34], mount });
