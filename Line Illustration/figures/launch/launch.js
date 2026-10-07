/**
 * Launch: a hot air balloon moored over a small plate. A rounded envelope with eight gores, a burner frame, and four
 * ropes down to a woven basket, with three identical sandbags hanging from its rim on the visible side. A tether runs
 * from the basket to a mooring post. Hover sandbag 1, 2 or 3: it and every bag before it drop to the plate, the
 * balloon rises one level per dropped bag and the tether stretches. On leave the bags return and the balloon settles.
 *
 * Hit areas stay at the bags' rest positions. Height and bags follow critically damped springs; the balloon sways a
 * little at rest. Every curve is a true Bézier, and the envelope's outline is exact: a sphere and a tangent cone.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register, reducedMotion } = HL;

const Z0 = 4, PLATE = 24, GAP = 3.5, B = 7, BR = 1.5, BH = 8, WALL = 0.8, Q = Math.PI / 2, D = Math.SQRT1_2;
const FRAME = { dz: 7.5 }, BURNER = { r: 1.4, h: 2 }, THROAT = { dz: 10, r: 4 }, ENV = { dz: 15, r: 13 }, CAP = 1.3;
const BAG = { r: 2.3, neck: 1.2, tie: 0.55, frill: 0.7, out: 2.6, hang: 2.6 }, POST = { x: 15, y: -19, r: 1.4, h: 8, tie: 6 }, SAG = 2.4;
const FLOAT = { k: 20, c: 2 * Math.sqrt(20) }, FALL = { k: 70, c: 2 * Math.sqrt(70) }, LABEL = ["rest", "pre-launch", "launch", "scale"];
// the three bags, left to right: on the left face, at the front corner, on the right face. at: where the rope meets the rim
const CC = B - BR, BAGS = [
  { c: [0, B + BAG.out], at: [0, B], out: [0, 1] },
  { c: [CC + (BR + BAG.out) * D, CC + (BR + BAG.out) * D], at: [CC + BR * D, CC + BR * D], out: [D, D] },
  { c: [B + BAG.out, 0], at: [B, 0], out: [1, 0] },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LV = value;

  const C = Cam(45, 0.5, 3), TOP = GAP + BH + THROAT.dz + ENV.dz + ENV.r;
  fit(C, [[-PLATE, -PLATE, 0], [PLATE, PLATE, 0], [-PLATE, PLATE, 0], [PLATE, -PLATE, 0], [0, 0, Z0 + TOP + 30]], 200, 160);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), CAM = Math.atan2(w[1], w[0]), S1 = unit(x3(w, EZ)), S2 = x3(w, S1);

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
  const ring = (c, r) => arc(c, EX, EY, r, 0, 4 * Q, true) + "Z", front = (c, r) => arc(c, EX, EY, r, FR, FR + 2 * Q, true);
  /** The angles where the outline of two horizontal circles (one homothetic pair) leaves the second circle. */
  function tang(c0, r0, c1, r1) {
    const u = J(EX), v = J(EY), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), Dv = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(Dv, v), Bv = -cross(Dv, u), base = Math.atan2(Bv, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, Bv) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    return on1(base) ? [base - s, base + s] : [base + s, base - s + 2 * Math.PI];
  }
  const cyl = (c0, r0, c1, r1) => { const [a, b] = tang(c0, r0, c1, r1); return arc(c1, EX, EY, r1, a, b, true) + arc(c0, EX, EY, r0, b, a + 2 * Math.PI, false) + "Z"; };
  /** A sphere (centre c, radius R) joined by a tangent cone to a ring on its axis (centre rc, radius rr): the outline, and the tangency. */
  function bulb(c, R, rc, rr) {
    const dz = rc[2] - c[2], al = Math.atan2(dz, rr), be = Math.acos(R / Math.hypot(rr, dz)), tk = dz < 0 ? al + be : al - be;
    const kc = [c[0], c[1], c[2] + R * Math.sin(tk)], kr = R * Math.cos(tk), [a, b] = tang(rc, rr, kc, kr);
    const th = (f) => { const q = at3(kc, EX, EY, kr, f).map((x, i) => x - c[i]); return Math.atan2(dot3(q, S2), dot3(q, S1)); };
    const ta = th(a), span = (((th(b) - ta) % (4 * Q)) + 4 * Q) % (4 * Q), o = P(...rc);
    const far = (s) => { const q = P(...at3(c, S1, S2, R, ta + s / 2)); return Math.hypot(q[0] - o[0], q[1] - o[1]); };
    const s = far(span) > far(span - 4 * Q) ? span : span - 4 * Q; // round the side away from the ring
    return { d: arc(c, S1, S2, R, ta, ta + s, true) + arc(rc, EX, EY, rr, b, a + 2 * Math.PI, false) + "Z", tk };
  }
  /** Part of a rounded rectangle's outline at height z, between angles f0 and f1 (0 faces +x). */
  function rrun(cx, cy, h, r, z, f0, f1, move) {
    const cs = [[h - r, -(h - r)], [h - r, h - r], [-(h - r), h - r], [-(h - r), -(h - r)]];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)), q = cs[((i % 4) + 4) % 4];
      d += arc([cx + q[0], cy + q[1], z], EX, EY, r, f, stop, first); first = false; f = stop; }
    return d;
  }
  const box = (cx, cy, h, r, z0, z1) => [rrun(cx, cy, h, r, z1, FR + 2 * Q, FR + 4 * Q, true) + rrun(cx, cy, h, r, z0, FR, FR + 2 * Q, false) + "Z", rrun(cx, cy, h, r, z1, FR, FR + 2 * Q, true)];
  const path = (parent, d, cls = "sil") => mk("path", { d, class: cls }, parent);

  // the ground: the plate. The balloon, the tether, the post and the bags are redrawn each frame, back to front
  const g = mk("g", {}, svg), [ps, pc] = box(0, 0, PLATE, 7, 0, Z0);
  path(g, ps); path(g, pc, "nf sil");
  const air = mk("g", {}, g), post = mk("g", {}, g), tether = path(g, "", "nf sil"), bags = BAGS.map(() => mk("g", {}, g));
  const pr = POST.r, pz = Z0 + POST.h;
  path(post, cyl([POST.x, POST.y, Z0], pr + 0.8, [POST.x, POST.y, Z0 + 0.8], pr + 0.8)); path(post, front([POST.x, POST.y, Z0 + 0.8], pr + 0.8), "nf sil");
  path(post, cyl([POST.x, POST.y, Z0 + 0.8], pr, [POST.x, POST.y, pz], pr)); path(post, cyl([POST.x, POST.y, Z0 + POST.tie - 0.5], pr + 0.3, [POST.x, POST.y, Z0 + POST.tie + 0.5], pr + 0.3)); // the lashing
  path(post, cyl([POST.x, POST.y, pz], pr + 0.6, [POST.x, POST.y, pz + 1], pr + 0.6)); path(post, ring([POST.x, POST.y, pz + 1], pr + 0.6), "nf sil");

  const lift = spring(0, FLOAT), drops = BAGS.map(() => spring(0, FALL));
  let act = -1, sway = 0;
  function draw() {
    const F = Z0 + GAP + lift.x * LV, rim = F + BH, sx = sway * D, sy = -sway * D, zt = rim + THROAT.dz, zc = zt + ENV.dz;
    air.replaceChildren();
    // ropes run from the throat to the basket's rim corners, through the burner frame's corners
    const top = (k) => at3([sx, sy, zt], EX, EY, THROAT.r, (Math.PI / 4) * (2 * k + 1)), foot = (k) => { const a = (Math.PI / 4) * (2 * k + 1), r = (CC + BR * D) * Math.SQRT2; return [sx + r * Math.cos(a), sy + r * Math.sin(a), rim]; };
    const rope = (k) => path(air, `M${pt(top(k))}L${pt(foot(k))}`, "nf sil"), fr = top(0).map((x, i) => x + ((foot(0)[i] - x) * (THROAT.dz - FRAME.dz)) / THROAT.dz), fh = Math.hypot(fr[0] - sx, fr[1] - sy) * D + (1 - D) * 0.5;
    rope(2);
    const [bs, bc] = box(sx, sy, B, BR, F, rim);
    path(air, bs); path(air, bc, "nf sil"); path(air, rrun(sx, sy, B - WALL, BR - WALL, rim, 0, 4 * Q, true) + "Z", "nf sil");
    [1, 2].forEach((n) => path(air, rrun(sx, sy, B, BR, F + (n * BH) / 3, FR, FR + 2 * Q, true), "nf sil")); // the woven bands
    // the burner frame: an open wire square on the ropes, with four spokes holding the burner at its centre
    const zf = rim + FRAME.dz, spoke = (k) => { const a = (Math.PI / 4) * (2 * k + 1), r0 = BURNER.r, r1 = (fh - 0.5 + 0.5 * D) * Math.SQRT2;
      return `M${pt([sx + r0 * Math.cos(a), sy + r0 * Math.sin(a), zf])}L${pt([sx + r1 * Math.cos(a), sy + r1 * Math.sin(a), zf])}`; };
    path(air, rrun(sx, sy, fh, 0.5, zf, FR + 2 * Q, FR + 4 * Q, true) + spoke(1) + spoke(2) + spoke(3), "nf sil");
    path(air, cyl([sx, sy, zf - BURNER.h / 2], BURNER.r, [sx, sy, zf + BURNER.h / 2], BURNER.r)); path(air, front([sx, sy, zf + BURNER.h / 2], BURNER.r), "nf sil");
    path(air, rrun(sx, sy, fh, 0.5, zf, FR, FR + 2 * Q, true) + spoke(0), "nf sil");
    rope(1); rope(3);
    // the envelope: its outline, then the gores on the side facing the camera, then the crown
    const c = [sx, sy, zc], R = ENV.r, { d, tk } = bulb(c, R, [sx, sy, zt], THROAT.r);
    path(air, d);
    let gores = "";
    for (let k = 0; k < 6; k++) { // six gores, none facing the camera; the two at the outline are the outline itself
      if (k === 1 || k === 4) continue;
      const f = CAM + Math.PI / 6 + (Math.PI / 3) * k, e1 = [Math.cos(f), Math.sin(f), 0], del = Math.atan2(w[2], dot3(e1, w));
      const t0 = Math.max(tk, del - Q + 0.02), t1 = Math.min(CAP, del + Q - 0.02);
      if (t0 >= t1) continue;
      gores += t0 === tk ? `M${pt(at3([sx, sy, zt], e1, EZ, THROAT.r, 0))}` + arc(c, e1, EZ, R, tk, t1, false) : arc(c, e1, EZ, R, t0, t1, true);
    }
    path(air, gores, "nf sil"); path(air, ring([sx, sy, zc + R * Math.sin(CAP)], R * Math.cos(CAP)), "nf sil");
    rope(0);
    // the tether: from the basket's right corner to a knot on the front of the post, slack at rest and drawn tighter as the balloon climbs
    const t0 = [sx + CC + BR * D, sy - CC - BR * D, F + 0.6], u = [t0[0] - POST.x, t0[1] - POST.y].map((v, i, a) => v / Math.hypot(...a)), t3 = [POST.x + (pr + 0.3) * u[0], POST.y + (pr + 0.3) * u[1], Z0 + POST.tie], sag = SAG * (1 - 0.85 * Math.min(1, lift.x / 3));
    const t1 = t0.map((x, i) => x + (t3[i] - x) / 3 - (i === 2 ? sag : 0)), t2 = t0.map((x, i) => x + (2 * (t3[i] - x)) / 3 - (i === 2 ? sag : 0));
    tether.setAttribute("d", `M${pt(t0)}C${pt(t1)} ${pt(t2)} ${pt(t3)}`);
    // the bags: each falls straight down from where it hangs, its rope with it, and lies with the rope draped over it
    BAGS.forEach((b, i) => {
      const p = Math.max(0, Math.min(1, drops[i].x)), hang = rim - BAG.hang - BAG.r - BAG.neck - BAG.frill, z = hang + (Z0 + BAG.r - hang) * p;
      const x = b.c[0] + sx * (1 - p), y = b.c[1] + sy * (1 - p), cls = i === act ? "hi" : "sil", gi = bags[i], nk = [x, y, z + BAG.r + BAG.neck];
      gi.replaceChildren();
      const fk = [x, y, nk[2] + BAG.frill]; // the sack, then the gathered cloth above its tie
      const end = [b.at[0] + sx, b.at[1] + sy, rim], lay = [x - 4.5 * b.out[0], y - 4.5 * b.out[1], Z0 + 0.3], mid = [x - 2.8 * b.out[0], y - 2.8 * b.out[1], fk[2] + 0.2];
      const e = end.map((v, j) => v + (lay[j] - v) * p), m = fk.map((v, j) => (v + end[j]) / 2 + (mid[j] - (v + end[j]) / 2) * p);
      path(gi, `M${pt(fk)}Q${pt(m)} ${pt(e)}`, `nf ${cls}`); // the rope first: once down it lies behind the bag
      path(gi, bulb([x, y, z], BAG.r, nk, BAG.tie).d, cls); path(gi, cyl(nk, BAG.tie, fk, BAG.tie + 0.5), cls); path(gi, ring(fk, BAG.tie + 0.5), `nf ${cls}`);
    });
  }

  const still = reducedMotion();
  const T = register(stage, (dt, now) => {
    let moving = stepS(lift, dt);
    drops.forEach((s) => { moving = stepS(s, dt) || moving; });
    sway = still ? 0 : 0.45 * Math.sin((now / 1000) * ((2 * Math.PI) / 7));
    draw();
    return moving || !still;
  });
  bag.add(T.unregister);

  // hit areas: the bags where they hang at rest, never where they are now, so the drop never flickers
  const RESTF = Z0 + GAP + BH - BAG.hang - BAG.r - BAG.neck - BAG.frill, HIT = 11, spots = BAGS.map((b) => P(b.c[0], b.c[1], RESTF));
  function choose(k) {
    act = k; lift.t = k + 1;
    drops.forEach((s, i) => { s.t = i <= k ? 1 : 0; });
    read.textContent = LABEL[k + 1];
    T.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => {
      let k = -1, best = HIT;
      spots.forEach((q, i) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best) { best = d; k = i; } });
      if (k !== act) choose(k);
    },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { LV = v; T.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "launch",
  means: "A moored hot air balloon: drop sandbags one by one and it climbs a level for each, its tether stretching to the post.",
  rules: [1, 5, 7, 8],
  range: [6, 8, 10],
  mount,
});
