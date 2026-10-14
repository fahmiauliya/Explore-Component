/**
 * Stamp: a flat document lies on a long plate, three text lines across its back (left) half and its front (right) half
 * empty; beside it, to the right, a rubber stamp stands on its rubber face, a rounded rectangle a little wider than deep,
 * under a rounded block, a short neck and a round knob. Hover the figure and the stamp lifts, moves over the empty half,
 * presses straight down with a 6% squash of its block and neck, lifts and goes home. Where it pressed it leaves its own
 * mark, straight on the paper and centred on its footprint: a check, a word (data-text, Hershey single strokes)
 * or a logo (data-logo, unit-square path data, the Compo C by default), as the stage's data-mark says. The stamp is
 * bright on its way to the press; the mark fades in at the contact, bright, and fades out when the pointer leaves.
 *
 * The hit area is the whole figure at rest, which never moves. The motion is a list of timed legs on eased curves; the
 * mark's opacity is one of the kernel's fade() masks, a level per twentieth. Every curve is a true Bézier of a world arc.
 */
const STROKES = {"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"],"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"]," ":[0.762,""]};
const LOGO = "M0.511 1Q0.382 1 0.283 0.94Q0.185 0.88 0.13 0.768Q0.076 0.655 0.076 0.501L0.076 0.501Q0.076 0.349 0.13 0.236Q0.185 0.123 0.283 0.062Q0.382 0 0.512 0L0.512 0Q0.685 0 0.786 0.087Q0.886 0.174 0.918 0.336L0.918 0.336L0.765 0.344Q0.745 0.243 0.682 0.188Q0.62 0.134 0.512 0.134L0.512 0.134Q0.426 0.134 0.362 0.178Q0.297 0.223 0.262 0.305Q0.226 0.388 0.226 0.501L0.226 0.501Q0.226 0.615 0.262 0.697Q0.297 0.779 0.362 0.822Q0.426 0.866 0.511 0.866L0.511 0.866Q0.624 0.866 0.689 0.806Q0.753 0.747 0.772 0.636L0.772 0.636L0.924 0.644Q0.897 0.811 0.791 0.905Q0.685 1 0.511 1L0.511 1Z", ARGS = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
const { Cam, fit, proj, hull, bezier, fade, clamp, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, Z0 = 4, IO = bezier(0.45, 0, 0.3, 1), IN = bezier(0.55, 0, 0.85, 0.7);
// one roundness for every solid: corner radius RK times its shorter side, RK the plate's (6 on 29.2)
const RK = 6 / 29.2, PLATE = { x0: -14.6, x1: 14.6, y0: -21.6, y1: 22.5, r: 6 };
// the document: a thin slab, DT thick; its lines run along y at x, from y0 to y1 (the third is short), all on its back half
const DOC = { x0: -11.6, x1: 11.6, y0: 0, y1: 19.5, r: RK * 19.5 }, DT = 1.3, LINES = [[-8.6, 17, 2.5], [-5.6, 17, 2.5], [-2.6, 17, 9]];
// the rubber face: FX half deep (along x), FY half wide (along y); it presses at (MX, MY), the front half's middle
const FX = 5, FY = 6.5, MX = 5.8, MY = 9.75, HX = 0.5, HY = -11.4;
// the stamp: the rubber (PT thick), the block (BI wider all round, BZ tall), the neck (NR, NZ tall), the knob (KR, centre KC above the neck's top)
const PT = 1.5, BI = 0.9, BZ = 5.6, NR = 1.6, NZ = 3.2, KR = 4, KC = 3, SQ = 0.06, TOP = PT + BZ + NZ + KC + KR;
const FR = RK * 2 * (FX + BI); // the block's corner, by its shorter side; the rubber face under it keeps the same corner
// the mark, in the paper's frame (u to the right on screen, along −y; v down the page, along x): the check's three points,
// 45% of the face's depth tall, its short stroke nearly down the page so it still reads as a check at this angle; the logo, 50% of its depth
const CK = [[-0.875, 0], [-0.75, 0.5], [0.875, -0.5]].map(([u, v]) => [u * 0.9 * FX, v * 0.9 * FX]), TRK = 0.02, LS = FX;
// the legs, in ms: lift, move, press, the squash, lift, move back, set down; the mark fades in and out
const T = { lift: 250, move: 350, press: 150, squash: 150, up: 200, back: 350, down: 200, in: 100, out: 300 };
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
/** A word as polylines in cap heights (x along it, y centred on the cap), and its inked extent lo..hi along x.
 * TRK is taken off each glyph's advance: 0.02, so letters sit 0.08 cap heights wider apart than the font's 0.1. */
function type(word) {
  let x = 0, lo = Infinity, hi = -Infinity; const polys = [];
  for (const c of word) {
    GL[c][1].forEach((p) => polys.push(p.map(([gx, gy]) => { lo = Math.min(lo, x + gx); hi = Math.max(hi, x + gx); return [x + gx, gy + 0.5]; })));
    x += GL[c][0] - TRK;
  }
  return { polys, lo, hi };
}
// one fixed cap height: APPROVED at 85% of the face's width (the mark has no border, so a wider word may pass the face;
// even WWWWWWWW keeps more than 10% of the document's width clear each side)
const ink = (w) => { const t = type(w); return t.hi - t.lo; }, TH = (0.85 * 2 * FY) / ink("APPROVED");
/** Unit-square path data, M L Q C Z only (anything else is skipped), each point clamped and mapped through f(x, y). */
const unit = (d, f) => (String(d).match(/[A-Za-z][^A-Za-z]*/g) || []).map((s) => {
  const c = s[0], n = ARGS[c], v = (s.slice(1).match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map((x) => clamp(+x, 0, 1));
  let o = n === 0 ? "Z" : "";
  for (let i = 0; n && i + n <= v.length; i += n) o += (i && c === "M" ? "L" : c) + [0, 2, 4].slice(0, n / 2).map((j) => f(v[i + j], v[i + j + 1])).join(" ");
  return o;
}).join("").replace(/^[^M]*/, "");

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 5.75);
  const pc = [PLATE.x0, PLATE.x1].flatMap((x) => [PLATE.y0, PLATE.y1].flatMap((y) => [[x, y, 0], [x, y, Z0]]));
  const stampPts = (x, y, z) => [-1, 1].flatMap((a) => [-1, 1].map((b) => [x + a * (FX + BI), y + b * (FY + BI), Z0 + z])).concat([[x, y, Z0 + z + TOP + KR * 0.16]]);
  fit(C, pc.concat(stampPts(HX, HY, 0), stampPts(MX, MY, DT + 11)), 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(","), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const FA = Math.atan2(J(EY)[0], J(EX)[0]); // the plan angle of a horizontal ring's right extreme on screen
  // the camera is orthographic: the world vectors along the screen's x and y span the plane a sphere's outline lies in
  const S = Math.hypot(J(EX)[0], J(EY)[0], J(EZ)[0]), E1 = [J(EX)[0] / S, J(EY)[0] / S, J(EZ)[0] / S], E2 = [J(EX)[1] / S, J(EY)[1] / S, J(EZ)[1] / S];

  // every curve is a cubic Bézier of a world arc (≤ 90°, k = 4/3·tan(Δ/4)): the camera is affine, so it projects exactly
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
  /** A solid rounded in plan from z0 to z1: [its silhouette (top's far half, foot's near half), its crease (top's near half)]. */
  const box = (cx, cy, hx, hy, r, z0, z1, R = [-hx, -hy, hx, hy]) => [
    rr([cx, cy, z1], EX, EY, R, r, FA + 2 * Q, FA + 4 * Q) + rr([cx, cy, z0], EX, EY, R, r, FA, FA + 2 * Q, false) + "Z", rr([cx, cy, z1], EX, EY, R, r, FA, FA + 2 * Q),
  ];
  const rect = ({ x0, x1, y0, y1, r }, z0, z1) => box((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, r, z0, z1);
  const path = (d, cls, parent = g) => mk("path", { d, class: cls }, parent);

  // back to front: the plate, the document, its lines, the mark on it, then the stamp, which is always above the paper
  const g = mk("g", {}, svg), ZD = Z0 + DT, [ps, pcr] = rect(PLATE, 0, Z0), [ds, dc] = rect(DOC, Z0, ZD);
  path(ps, "sil"); path(pcr, "nf lo"); path(ds, "sil"); path(dc, "nf lo");
  path(LINES.map(([x, y0, y1]) => `M${pt([x, y0, ZD])}L${pt([x, y1, ZD])}`).join(""), "nf lo");
  // the mark's opacity: the kernel's fade() mask, flat over the frame (its ramp runs far past it), one per twentieth
  const LEVELS = Array.from({ length: 21 }, (_, i) => fade(svg, 0, 1e7, i / 20));
  const mg = mk("g", { mask: LEVELS[0] }, g), mark = path("", "nf lo", mg);
  const sg = mk("g", {}, g), stamp = [["sil"], ["sil"], ["nf lo"], ["sil"], ["sil"]].map(([c]) => [path("", c, sg), c]);
  const light = (parts, on) => parts.forEach(([el, c]) => el.setAttribute("class", on ? (c[0] === "n" ? "nf hi" : "sil hi") : c));

  // the stamp at (x, y), its rubber's face z above the plate, its block and neck squashed to s of their height
  let drawnS = "";
  function drawStamp([x, y, z], s) {
    const key = [x, y, z, s].map((v) => v.toFixed(3)).join();
    if (key === drawnS) return; drawnS = key;
    const z0 = Z0 + z, z1 = z0 + PT, z2 = z1 + BZ * s, z3 = z2 + NZ * s, [bs, bc] = box(x, y, FX + BI, FY + BI, FR, z1, z2);
    const d = [box(x, y, FX, FY, FR, z0, z1)[0], bs, bc, box(x, y, NR, NR, NR, z2, z3)[0], arc([x, y, z3 + KC], E1, E2, KR, 0, 4 * Q, true) + "Z"];
    stamp.forEach(([el], i) => el.setAttribute("d", d[i]));
  }

  // the mark, read live from the stage: a check, a word or a logo, centred where the face pressed, with no border
  const W = ([u, v]) => pt([MX + v, MY - u, ZD]);
  const attrs = () => ["data-mark", "data-text", "data-logo"].map((a) => stage.getAttribute(a)).join("\n");
  function drawMark() {
    const a = stage.getAttribute("data-mark"), kind = /^(text|logo)$/.test(a) ? a[0] : "c";
    let d = "";
    if (kind === "c") d += "M" + CK.map(([u, v]) => W([u - (CK[0][0] + CK[2][0]) / 2, v])).join("L");
    if (kind === "l") { const f = (x, y) => W([(x - 0.5) * LS, (y - 0.5) * LS]); d += unit(stage.getAttribute("data-logo"), f) || unit(LOGO, f); }
    if (kind === "t") {
      const word = [...(stage.getAttribute("data-text") || "").toUpperCase()].filter((c) => GL[c]).join("").slice(0, 8).trim() || "APPROVED";
      const { polys, lo, hi } = type(word);
      d += polys.map((p) => "M" + p.map(([u, v]) => W([(u - (lo + hi) / 2) * TH, v * TH])).join("L")).join("");
    }
    mark.setAttribute("d", d);
  }

  // the motion: legs [to, ms, ease, squash, at its end], run on the loop's clock from the pose they start at
  let pose = [HX, HY, 0], from = pose, legs = [], li = 0, t0 = 0, sq = 1, on = false, want = false, seen = "", op = [0, 0, 0, 1], lvl = -1;
  const far = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.05;
  function plan(list, now) { legs = list.filter((l) => l[1] > 0); li = 0; t0 = now; from = pose.slice(); }
  const fadeTo = (a, ms, now) => { op = [opacity(now), a, now, ms]; };
  const opacity = (now) => { const [a, b, s, ms] = op, p = clamp((now - s) / ms, 0, 1); return a + (b - a) * p * p * (3 - 2 * p); };
  function turn(v, now) { // on the loop's own clock, so legs, squash and fades share one time
    on = v;
    const [x, y, z] = pose, L = lift, M = [MX, MY], H = [HX, HY], up = z < L - 0.01;
    read.textContent = v ? "stamping" : "rest";
    light(stamp, v);
    if (v) plan([[[x, y, L], up ? (T.lift * (L - z)) / L : 0, IO], [[...M, L], far(pose, M) ? T.move : 0, IO], [[...M, DT], T.press, IN],
      [[...M, DT], T.squash, IO, true, contact], [[...M, L], T.up, IO], [[...H, L], T.back, IO], [[...H, 0], T.down, IO]], now);
    else {
      plan(far(pose, H) ? [[[x, y, L], up ? T.up : 0, IO], [[...H, L], T.back, IO], [[...H, 0], T.down, IO]] : [[[...H, 0], (T.down * z) / L, IO]], now);
      fadeTo(0, T.out, now);
    }
  }
  const hover = (v) => { if (v !== want) { want = v; B.wake(); } };
  function contact(now) { // the press: the mark fades in under the rubber, bright; the bright leaves the stamp
    read.textContent = "approved"; light(stamp, false); light([[mark, "nf lo"]], true); op = [0, 1, now, T.in];
  }

  const B = register(stage, (_dt, now) => {
    if (attrs() !== seen) { seen = attrs(); drawMark(); } // read live: a change redraws the mark
    if (want !== on) turn(want, now);
    sq = 1;
    while (li < legs.length) {
      const [to, ms, ease, squash, done] = legs[li], p = clamp((now - t0) / ms, 0, 1);
      pose = from.map((v, i) => v + (to[i] - v) * ease(p));
      if (squash) { sq = 1 - SQ * Math.sin(Math.PI * p); if (done && !legs[li].hit) { legs[li].hit = true; done(now); } }
      if (p < 1) break;
      from = to.slice(); t0 += ms; li++;
    }
    drawStamp(pose, sq);
    const a = opacity(now), k = Math.round(a * 20);
    if (k !== lvl) { lvl = k; mg.setAttribute("mask", LEVELS[k]); if (!k && !on) light([[mark, "nf lo"]], false); }
    return li < legs.length || now < op[2] + op[3];
  });
  bag.add(B.unregister);
  const mo = new MutationObserver(() => B.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-mark", "data-text", "data-logo"] }), bag.add(() => mo.disconnect());

  // the hit area: the whole figure at rest, the plate and the stamp at home, as one hull on screen. Nothing in it moves
  const HIT = hull(pc.concat(stampPts(HX, HY, 0)).map((v) => P(...v)));
  const side = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inside = (p) => new Set(HIT.map((a, i) => side(p, a, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  bag.add(pointer(stage, { move: (p) => hover(inside(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest", B.wake();

  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}

hairline({
  name: "stamp",
  means: "An approval stamp beside a document: hover and it presses its own footprint, a check, a word or a logo, onto the page.",
  rules: [1, 4, 5, 7, 8],
  // how high the stamp lifts to travel, in world units above where it stands
  range: [7, 9, 11],
  mount,
});
