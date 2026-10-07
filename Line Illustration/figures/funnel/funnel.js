/**
 * Funnel: four open bands on a base plate, each band wider at its rim than at
 * its foot, so together they taper from a wide mouth down to a narrow neck,
 * driven by two meshing gears beside them. The pointer picks a band: it grows,
 * and the rest of the funnel draws in a little, staggered outwards from it.
 * The gears turn on their own and hold still for reduced motion. The slider
 * is how far the chosen band grows.
 *
 * The pattern: one of many. Tweens for the choice, a stagger by distance, and
 * a hit test on the bands' resting centres, so a band growing under the
 * pointer cannot flip the choice.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, seg, solid, put,
  tdone, tset, tval, tween, disposer, mk, pointer, register, reducedMotion,
} = HL;

const N = 4, BH = 15, GAP = 9, WALL = 5, SHRINK = 0.92, STEP = 40;
const TOP = (N * BH) + (N - 1) * GAP, MOUTH = 60, NECK = 17;
/** The funnel's half-width at height z: one straight taper, cut into bands. */
const HALF = (z) => NECK + ((MOUTH - NECK) * z) / TOP;
/** Band i's foot and rim heights: the mouth is 0, at the top. */
const Z0 = (i) => TOP - i * (BH + GAP) - BH, Z1 = (i) => Z0(i) + BH;
const BASE = { h: 30, z0: -12, z1: -6 };
// Two gears in one upright plane beside the funnel: same tooth size, so they mesh.
const GX = -74, MOD = 4.2, SPIN = 0.32, PHI = 1.95;
const BIG = { t: 12, y: 62, z: 28 }, SMALL = { t: 8 };
BIG.rp = (MOD * BIG.t) / 2; SMALL.rp = (MOD * SMALL.t) / 2;
SMALL.y = BIG.y + (BIG.rp + SMALL.rp) * Math.cos(PHI);
SMALL.z = BIG.z + (BIG.rp + SMALL.rp) * Math.sin(PHI);

/** A gear's toothed outline at angle a, as [u, v] around its centre, every corner rounded. */
function teeth(g, a) {
  const ro = g.rp + MOD * 0.55, rr = g.rp - MOD * 0.65, p = (2 * Math.PI) / g.t, pts = [];
  for (let k = 0; k < g.t; k++) {
    const c = a + k * p;
    for (const [r, f] of [[rr, -0.3], [ro, -0.16], [ro, 0.16], [rr, 0.3]]) pts.push([r * Math.cos(c + f * p), r * Math.sin(c + f * p)]);
  }
  return fillet(pts, pts.map((_, i) => (i % 4 === 1 || i % 4 === 2 ? 0.9 : 0.7)), 2);
}

/** A ring of `n` points round a circle of radius r. */
const round = (r, n) => Array.from({ length: n }, (_, k) => [r * Math.cos((k / n) * 2 * Math.PI), r * Math.sin((k / n) * 2 * Math.PI)]);
/** A soft square of half-width h: the funnel's plan, round enough to read as one piece. */
const plan = (h) => rrect(-h, -h, h, h, h * 0.42, 14);
/** Twice the signed area of a screen polygon, to wind a hole against its outline. */
const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const holed = (outline, hole) => poly(outline) + poly(Math.sign(area(outline)) === Math.sign(area(hole)) ? hole.slice().reverse() : hole);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let grow = value;

  const C = Cam(45, 0.5, 1.45);
  const gr = (g) => g.rp + MOD, m = MOUTH * 1.24;
  fit(C, [
    [-m, -m, TOP], [m, m, TOP], [m, -m, TOP], [-m, m, TOP], [BASE.h, BASE.h, BASE.z0], [-BASE.h, BASE.h, BASE.z0], [BASE.h, -BASE.h, BASE.z0],
    [GX, BIG.y + gr(BIG), BIG.z], [GX, BIG.y, BIG.z - gr(BIG)], [GX, SMALL.y, SMALL.z + gr(SMALL)], [GX, SMALL.y - gr(SMALL), SMALL.z],
  ], 200, 166);
  const P = proj(C), front = facing(C), back = (q) => !front(q);
  /** A point of the gears' upright plane, from [u, v] on it (u along y, v up). */
  const on = (cy, cz, x = GX) => ([u, v]) => P(x, cy + u, cz + v);

  const g = mk("g", {}, svg);

  // the gears share one plane, so both backs (their thickness) go down before either face, then the bore, rim and hub
  const backs = mk("g", {}, g), faces = mk("g", {}, g);
  const gears = [BIG, SMALL].map((gear) => {
    const grp = mk("g", {}, faces);
    return {
      gear, back: mk("path", { class: "lo" }, backs), face: mk("path", { class: "fo" }, grp),
      edge: mk("path", { class: "nf sil" }, grp), rim: mk("path", { class: "nf lo" }, grp), hub: mk("path", { class: "nf lo" }, grp),
    };
  });
  function drawGear(gd, a) {
    const { gear } = gd, out = teeth(gear, a), bore = round(gear.rp * 0.22, 16).reverse();
    const f = on(gear.y, gear.z), b = on(gear.y, gear.z, GX - 2.6);
    gd.back.setAttribute("d", poly(out.map(b)) + poly(bore.map(b)));
    gd.face.setAttribute("d", poly(out.map(f)) + poly(bore.map(f)));
    gd.edge.setAttribute("d", poly(out.map(f)));
    gd.rim.setAttribute("d", poly(round(gear.rp - MOD * 1.5, 28).map(f)));
    // the hub: a collar round the bore, keyed so the turn can be seen
    const key = [0.22, 0.4].map((r) => [gear.rp * r * Math.cos(a), gear.rp * r * Math.sin(a)]);
    gd.hub.setAttribute("d", poly(round(gear.rp * 0.4, 20).map(f)) + seg(f(key[0]), f(key[1])));
  }

  // the base plate the neck stands on
  const [baseR, baseIn] = rings(-BASE.h, -BASE.h, BASE.h, BASE.h, 9, 1.6);
  put(solid(g), prism(P, front, baseR, baseIn, BASE.z0, BASE.z1));

  // the bands, lowest first, so each wider band above covers what it should
  const bands = [];
  for (let i = 0; i < N; i++) bands.push({ s: tween(1), last: NaN });
  for (let i = N - 1; i >= 0; i--) {
    const grp = mk("g", {}, g), b = bands[i];
    b.body = mk("path", { class: "fo" }, grp); b.wall = mk("path", { class: "fo" }, grp);
    b.seam = mk("path", { class: "nf lo" }, grp); b.mouth = mk("path", { class: "nf" }, grp);
    b.edge = mk("path", { class: "nf sil" }, grp); b.crease = mk("path", { class: "nf lo" }, grp);
  }
  /** Band i at scale s: the tapered outside, the far inner wall seen through the mouth, and the rim between them. */
  function drawBand(i, s) {
    const b = bands[i], z0 = Z0(i), z1 = Z1(i), ht = HALF(z1) * s, hf = HALF(z0) * s;
    const top = plan(ht), foot = plan(hf), mouthR = plan(ht - WALL), neck = plan(hf - WALL);
    const outline = hull(ringAt(P, foot, z0).concat(ringAt(P, top, z1))), mouth = ringAt(P, mouthR, z1);
    b.body.setAttribute("d", holed(outline, mouth));
    // inside, only the far wall faces the viewer: from the mouth's far edge down to the neck's
    const farTop = ringAt(P, run(mouthR, back), z1), farFoot = ringAt(P, run(neck, back), z0);
    b.wall.setAttribute("d", poly(farTop.concat(farFoot.slice().reverse())));
    b.seam.setAttribute("d", open(farFoot));
    b.mouth.setAttribute("d", poly(mouth));
    b.edge.setAttribute("d", poly(outline));
    b.crease.setAttribute("d", open(ringAt(P, run(plan(ht - 1.6), front), z1)));
  }

  let ang = 0;
  const B = register(stage, (dt, now) => {
    let moving = false;
    bands.forEach((b, i) => {
      const s = tval(b.s, now);
      if (s !== b.last) { drawBand(i, s); b.last = s; }
      if (!tdone(b.s, now)) moving = true;
    });
    if (reducedMotion() && gears[0].drawn) return moving;
    ang += Math.min(dt, 0.05) * SPIN * (reducedMotion() ? 0 : 1);
    gears.forEach((gd, n) => {
      // the small gear turns the other way, faster by the tooth ratio, half a tooth out of phase
      drawGear(gd, n === 0 ? ang : -(ang - PHI) * (BIG.t / SMALL.t) + PHI + Math.PI + Math.PI / SMALL.t);
      gd.drawn = true;
    });
    return true;
  });
  bag.add(B.unregister);

  // hit test: the bands' RESTING centres down the stack, inside the funnel's resting box
  const centres = bands.map((_, i) => P(0, 0, (Z0(i) + Z1(i)) / 2)[1]);
  const box = hull(bands.flatMap((_, i) => ringAt(P, plan(HALF(Z0(i))), Z0(i)).concat(ringAt(P, plan(HALF(Z1(i))), Z1(i)))).concat(ringAt(P, baseR, BASE.z0)));
  const xs = box.map((p) => p[0]), ys = box.map((p) => p[1]);
  const [bx0, bx1, by0, by1] = [Math.min(...xs) - 6, Math.max(...xs) + 6, Math.min(...ys) - 6, Math.max(...ys) + 6];
  function hit([x, y]) {
    if (x < bx0 || x > bx1 || y < by0 || y > by1) return -1;
    let best = 0;
    centres.forEach((c, i) => { if (Math.abs(y - c) < Math.abs(y - centres[best])) best = i; });
    return clamp(best, 0, N - 1);
  }

  let act = -1;
  /** Picks band a (-1 lets the funnel go). The stagger spreads out from the band picked, or the one let go. */
  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    bands.forEach((b, i) => {
      tset(b.s, a < 0 ? 1 : i === a ? grow : SHRINK, now, Math.abs(i - from) * STEP);
      b.edge.classList.toggle("hi", i === a);
    });
    // at rest the mouth is bright: where everything enters
    bands[0].mouth.classList.toggle("hi", a < 0);
    read.textContent = a < 0 ? "rest" : `stage ${a + 1}`;
    B.wake();
  }

  bands[0].mouth.classList.add("hi");
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set: (v) => { grow = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "funnel",
  means: "Four open bands taper from a wide mouth to a narrow neck: the band under the pointer grows, and the rest draw in.",
  rules: [1, 2, 4, 9],
  range: [1.08, 1.15, 1.24],
  mount,
});
