/**
 * Plant: a flower pot standing on the ground, one stem, no tree. At rest a tiny sprout shows just above the soil, its
 * two leaves folded shut into its tip. Hover the pot and the plant grows in one gentle run (2.2 s): the stem sprouts,
 * the pair of leaves turns open, the stem grows taller as a closed bud forms, and the bud opens into the bloom. Leave
 * and it all draws back, in reverse, to the sprout (0.8 s); leaving or coming back mid-way turns it round from there.
 * The stage's data-bloom picks the bloom (daisy, the default: five petals round a small centre turned up to the eye;
 * tulip: a cup of three petals; leaf: no flower, a larger leaf pair). data-label (6 of A–Z, 0–9, space) puts a garden
 * marker in the soil at the front of the pot, its text in Hershey single strokes. Both are read live.
 * Grey at rest; hovered, the part that is growing is bright, and the open bloom and its marker stay bright.
 * The hit area is a fixed box round the pot and the tallest plant. Leaves and petals keep their size and open by
 * turning; the bud grows from nothing as it forms. Every curve is a true arc or cubic (the camera is affine).
 */
const STROKES = {"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"]};
const { Cam, fit, proj, disposer, mk, pointer, register, reducedMotion } = HL;
const Q = Math.PI / 2, D = Math.PI / 180;
// the pot on the ground: a tapered body (foot r 5, top r 6.1) under a rim band (r 7); the soil sits flush in the rim
const POT = { foot: 5, top: 6.1, body: 5, rim: 7, band: 2.6, soil: 5.8 }, SOIL = POT.body + POT.band;
// the stem's height at rest and at the end of each phase; the leaf pair's node; leaf, petal, sepal sizes
const H = [0.6, 2.8, 4.4, 7.3, 8], NODE = 2.8, LEAF = 4.4, SEP = 1.4, AZ = 15, BL = 0.5;
// the phases' ends in seconds of the run: sprout, leaves, bud, bloom; the way back takes BACK seconds
const ENDS = [0, 0.5, 1, 1.6, 2.2], RUN = 2.2, BACK = 0.8, KINDS = ["daisy", "tulip", "leaf"];
// the blooms: petal azimuths in paint order (null: the centre's turn), petal length, tip radius, base ring, open angle(s)
const BLOOM = {
  daisy: { th: [1, 9, null, 3, 7, 5].map((i) => (i === null ? null : (i * Math.PI) / 5)), L: 2.5, rt: 0.88, rb: 0.57, rc: 0.48, open: 80, tilt: 32, twist: true },
  tulip: { th: [Math.PI / 3, -Math.PI / 3, Math.PI], L: 2.9, rt: 1, rb: 0.4, rc: 0, open: [22, 22, 0], tilt: 0, twist: false },
};
// the marker: cap height, tracking, padding, corner; where it stands in the soil (toward the eye), its stake, its lean back
const TH = 0.95, TR = 0.1, PADU = 0.5, PADV = 0.35, TRC = 0.32, RF = 5, SK = 0.3, LEAN = 10 * D;
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
const clean = (s) => [...String(s || "").toUpperCase()].filter((c) => GL[c]).join("").slice(0, 6).trim();

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;
  const C = Cam(45, 0.5, 13.2);
  const P0 = proj(C), J = (v) => { const q = P0(...v), o = P0(0, 0, 0); return [q[0] - o[0], q[1] - o[1]]; };
  const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1], cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), sc = (a, s) => a.map((x) => x * s), dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), ROOT = [0, 0, SOIL], up = (v) => add(ROOT, EZ, v);
  const R = Math.SQRT1_2, ACROSS = [R, -R, 0], TOWARD = [R, R, 0], VW = [0.75 * R * Math.sqrt(4 / 3), 0.75 * R * Math.sqrt(4 / 3), 0.5]; // VW: toward the eye
  const turn = (s) => add(sc(ACROSS, Math.cos(AZ * D)), TOWARD, s * Math.sin(AZ * D)), PAIR = [turn(1), sc(turn(1), -1)], TOP = [turn(-1), sc(turn(-1), -1)];
  const ring8 = (r, z) => [...Array(8)].map((_, i) => [r * Math.cos(i * Q / 2), r * Math.sin(i * Q / 2), z]), crownZ = SOIL + H[4] + 3.5;
  fit(C, [...ring8(POT.foot, 0), ...ring8(POT.rim, SOIL), [0, 0, crownZ], add(up(H[4]), ACROSS, 3), add(up(H[4]), ACROSS, -3)], 200, 162);
  const P = proj(C), pt = (v) => { const q = P(...v); return `${q[0].toFixed(2)},${q[1].toFixed(2)}`; };

  // a world arc as cubics of at most 90°, handles k = 4/3·tan(Δ/4)·r: the camera is affine, so it projects exactly
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
  /** The outline of two horizontal circles (c0, r0) below (c1, r1): an arc of each and the two tangent lines. */
  function cyl(c0, r0, c1, r1) {
    const u = J(EX), v = J(EY), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), Dd = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(Dd, v), B = -cross(Dd, u), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 2 * Math.PI;
    return arc(c1, EX, EY, r1, a, b, true) + arc(c0, EX, EY, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  const ring = (c, e1, e2, r) => arc(c, e1, e2, r, 0, 4 * Q, true) + "Z";
  /** A pointed oval from base b along d, L long and W wide, in the plane of d and n: two true arcs, and its vein. */
  function lens(b, d, n, L, W, vein) {
    const rho = (L * L + W * W) / (4 * W), h = rho - W / 2, f = Math.atan2(h, L / 2), mid = add(b, d, L / 2);
    return arc(add(mid, n, -h), d, n, rho, Math.PI - f, f, true) + arc(add(mid, n, h), d, n, rho, -f, f - Math.PI, false) + "Z" + (vein ? `M${pt(b)}L${pt(add(b, d, 0.82 * L))}` : "");
  }
  /** A leaf from base b along e, lifted a above level: its blade turned halfway (BL) from upright toward the eye. */
  function leaf(b, e, a, L) {
    const d = add(sc(e, Math.cos(a)), EZ, Math.sin(a)), nUp = add(sc(e, -Math.sin(a)), EZ, Math.cos(a));
    let nf = [VW[1] * d[2] - VW[2] * d[1], VW[2] * d[0] - VW[0] * d[2], VW[0] * d[1] - VW[1] * d[0]];
    nf = sc(nf, Math.sign(dot3(nf, nUp) || 1) / Math.hypot(...nf));
    const n = add(sc(nUp, 1 - BL), nf, BL);
    return lens(b, d, sc(n, 1 / Math.hypot(...n)), L, 0.36 * L, true);
  }
  /** A petal from base b along d, its width along t: two swelling cubics into a round tip of radius rt. */
  function petal(b, d, t, L, rt) {
    const w = (s, v) => add(add(b, d, s), t, v), m = L - rt;
    return `M${pt(b)}C${pt(w(0.06 * L, 0.75 * rt))} ${pt(w(m - 0.32 * L, rt))} ${pt(w(m, rt))}` + arc(add(b, d, m), d, t, rt, Q, -Q, false) +
      `C${pt(w(m - 0.32 * L, -rt))} ${pt(w(0.06 * L, -0.75 * rt))} ${pt(b)}Z`;
  }
  const path = (parent, cls) => mk("path", { d: "", class: cls }, parent), set = (el, d) => el.getAttribute("d") !== d && el.setAttribute("d", d);

  // back to front: the pot (body, rim band, the rim's front edge, the soil), the plant, then the marker in front
  const g = mk("g", {}, svg), rimLo = [0, 0, POT.body];
  mk("path", { d: cyl([0, 0, 0], POT.foot, add(rimLo, EZ, 0.5), POT.top), class: "sil" }, g);
  mk("path", { d: cyl(rimLo, POT.rim, ROOT, POT.rim), class: "sil" }, g);
  mk("path", { d: arc(ROOT, EX, EY, POT.rim, FR, FR + 2 * Q, true), class: "nf sil" }, g);
  mk("path", { d: ring(ROOT, EX, EY, POT.soil), class: "lo" }, g);
  // the plant: the leaf pointing away, the stem, the leaf toward the eye; the sepals; six bloom slots in paint order
  const leaves = PAIR.slice().sort((a, b) => dot3(a, TOWARD) - dot3(b, TOWARD)).map((e) => ({ e }));
  leaves[0].el = path(g, "sil");
  const stem = path(g, "nf sil");
  leaves[1].el = path(g, "sil");
  const sepals = [Q, -Q].map((th) => ({ th, el: path(g, "sil") })), slots = [...Array(6)].map(() => path(g, "sil"));
  const stake = path(g, "nf sil"), tag = path(g, "sil"), text = path(g, "nf sil");

  /** The marker: a rounded tag on a stake, leaning back LEAN, its face to the eye, the text centred on it. */
  function marker(s) {
    if (!s) return ["", "", ""];
    const Vt = add(sc(EZ, Math.cos(LEAN)), TOWARD, -Math.sin(LEAN)), foot = add(ROOT, TOWARD, RF), W = (u, v) => add(add(foot, ACROSS, u), Vt, v);
    const tw = [...s].reduce((w, c) => w + (GL[c][0] - TR) * TH, 0), hw = tw / 2 + PADU, v0 = SK, v1 = SK + TH + 2 * PADV, r = TRC;
    const cs = [[hw - r, v0 + r], [hw - r, v1 - r], [-hw + r, v1 - r], [-hw + r, v0 + r]];
    const out = cs.map(([u, v], i) => arc(W(u, v), ACROSS, Vt, r, (i - 1) * Q, i * Q, !i)).join("") + "Z";
    let x = -tw / 2, d = "";
    for (const c of s) { GL[c][1].forEach((p) => (d += "M" + p.map(([gx, gy]) => pt(W(x + (gx - TR / 2) * TH, v0 + PADV - gy * TH))).join("L"))); x += (GL[c][0] - TR) * TH; }
    return [`M${pt(foot)}L${pt(W(0, v0))}`, out, d];
  }
  const soft = (x) => { x = Math.max(0, Math.min(1, x)); return 0.35 * x + 0.65 * x * x * (3 - 2 * x); }, ph = (p, i) => soft((p - ENDS[i - 1]) / (ENDS[i] - ENDS[i - 1]));
  let kind = "daisy", label = "", lastKey = "";
  function draw(p) {
    const key = `${p.toFixed(4)}|${LIFT}|${kind}|${label}`;
    if (key === lastKey) return;
    lastKey = key;
    const a = ph(p, 1), b = ph(p, 2), c = ph(p, 3), u = ph(p, 4), h = H[0] + (H[1] - H[0]) * a + (H[2] - H[1]) * b + (H[3] - H[2]) * c + (H[4] - H[3]) * u;
    const B = BLOOM[kind], tau = (B ? B.tilt : 0) * u * D, A = add(sc(EZ, Math.cos(tau)), TOWARD, Math.sin(tau)), AW = add(sc(EZ, Math.sin(tau)), TOWARD, -Math.cos(tau));
    const tip = add(up(h), TOWARD, 0.2 * h * Math.sin(tau));
    set(stem, `M${pt(ROOT)}C${pt(up(h / 3))} ${pt(add(tip, A, -h / 3))} ${pt(tip)}`);
    // the leaves: shut into the tip at rest, they ride up with it to their node and turn open as it passes
    const fold = (s) => (90 + (LIFT - 90) * s) * D;
    for (const lf of leaves) set(lf.el, leaf(up(Math.min(NODE, h)), lf.e, fold(b), LEAF * (0.3 + 0.12 * a + 0.58 * b)));
    // the bloom forms (c, from nothing) and opens (u): petals turn open about the axis, a daisy's twisting as it unfurls
    const on = c > 0.02, rad = (th) => add(sc(AW, Math.cos(th)), ACROSS, Math.sin(th)), tng = (th) => add(sc(AW, -Math.sin(th)), ACROSS, Math.cos(th));
    const dir = (th, f) => add(sc(rad(th), Math.sin(f)), A, Math.cos(f)), open = 0.4 + 0.6 * u, tw = B && B.twist ? (-Math.PI / 5) * u : 0;
    sepals.forEach((sp) => set(sp.el, on && kind === "daisy" ? lens(tip, dir(sp.th, (58 + 46 * u) * D), tng(sp.th), SEP * c, 0.36 * SEP * c, false) : ""));
    slots.forEach((el, i) => {
      if (!on) return set(el, "");
      if (!B) return set(el, i === 0 || i === 5 ? leaf(tip, TOP[i ? 1 : 0], fold(u), 1.3 * LEAF * c * (0.3 + 0.7 * u)) : "");
      const th = B.th[i];
      if (th === undefined) return set(el, "");
      if (th === null) return set(el, ring(add(tip, A, 0.02), ACROSS, AW, B.rc * c * open));
      const phi = (([].concat(B.open)[i] ?? B.open) * u - (8 + 8 * Math.abs(Math.cos(th))) * (1 - u)) * D;
      set(el, petal(add(tip, rad(th + tw), B.rb * c * (B.twist ? open : 1)), dir(th + tw, phi), tng(th + tw), B.L * c, B.rt * c));
    });
  }

  // the run: p seconds into it, forward while hovered, back BACK/RUN as long while not; one gentle ease per phase
  let p = 0, hover = false, seen = null, lit = "";
  const attrs = () => `${stage.getAttribute("data-label")}\n${stage.getAttribute("data-bloom")}`;
  const T = register(stage, (dt) => {
    if (attrs() !== seen) {
      seen = attrs(); label = clean(stage.getAttribute("data-label"));
      const k = (stage.getAttribute("data-bloom") || "").trim().toLowerCase(); kind = KINDS.includes(k) ? k : "daisy";
      const [s, t, x] = marker(label); set(stake, s); set(tag, t); set(text, x);
    }
    const goal = hover ? RUN : 0;
    p = reducedMotion() ? goal : hover ? Math.min(RUN, p + dt) : Math.max(0, p - (dt * RUN) / BACK);
    draw(p);
    // the bright stroke: what is growing now; once open, the bloom and the marker
    const ph4 = !hover ? -1 : p < ENDS[1] ? 0 : p < ENDS[2] ? 1 : p < ENDS[3] ? 2 : 3, state = !hover ? "rest" : p < RUN ? "growing" : "bloom";
    if (`${ph4}|${state}|${kind}` !== lit) {
      lit = `${ph4}|${state}|${kind}`; read.textContent = state;
      const hiSet = [[stem], leaves.map((l) => l.el), [stem, ...sepals.map((s) => s.el), ...slots], [...slots, stake, tag, text]][ph4] || [];
      [stem, ...leaves.map((l) => l.el), ...sepals.map((s) => s.el), ...slots, stake, tag, text].forEach((el) => el.classList.toggle("hi", hiSet.includes(el)));
    }
    return p !== goal;
  });
  bag.add(T.unregister);
  const mo = new MutationObserver(() => T.wake());
  mo.observe(stage, { attributes: true, attributeFilter: ["data-label", "data-bloom"] });
  bag.add(() => mo.disconnect());
  // the hit area: a fixed box round the pot and the tallest plant
  const rl = P(...at3(ROOT, EX, EY, POT.rim, FR)), rr = P(...at3(ROOT, EX, EY, POT.rim, FR + 2 * Q)), foot = P(...at3([0, 0, 0], EX, EY, POT.foot, FR + Q));
  const BOX = [Math.min(rl[0], rr[0]) - 3, P(0, 0, crownZ)[1], Math.max(rl[0], rr[0]) + 3, foot[1] + 3];
  const inBox = ([x, y]) => x >= BOX[0] && x <= BOX[2] && y >= BOX[1] && y <= BOX[3];
  const hov = (v) => { if (v !== hover) { hover = v; T.wake(); } };
  bag.add(pointer(stage, { move: (q) => hov(inBox(q)), leave: () => hov(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  T.wake();
  return { set: (v) => { LIFT = v; T.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "plant",
  means: "Hover and the plant grows from a sprout to full bloom, like an investment growing over time.",
  rules: [1, 4, 5, 8],
  range: [16, 26, 36],
  mount,
});
