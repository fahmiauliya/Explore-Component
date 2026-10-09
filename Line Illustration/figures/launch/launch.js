/**
 * Launch: a hot air balloon moored over a small plate. A teardrop envelope, widest in its upper third, with six
 * gores from crown to mouth, a crown ring and a skirt ring; a small burner frame under the skirt; four ropes to an
 * open woven basket with three identical sandbags on short ropes. A tether runs from the basket to a mooring post.
 * Hover sandbag 1, 2 or 3: it and every bag before it fall, each with its rope, to the plate below where it hung, and
 * the balloon floats up one large step per dropped bag while the tether pulls taut. On leave all of it comes back.
 *
 * Hit areas stay at the bags' rest positions. Height and bags follow critically damped springs; the balloon bobs a
 * little at rest. Every curve is a true Bézier, and the envelope's outline is exact: a sphere and a tangent cone.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register, reducedMotion } = HL;

const Z0 = 4, PLATE = 18, GAP = 3, B = 3, BR = 0.7, BH = 4.5, WALL = 0.6, Q = Math.PI / 2, D = Math.SQRT1_2;
const ROPE = 7, SKIRT = { h: 1.4, r: 2.2 }, MOUTH = 2.4, ENV = { dz: 20, r: 11 }, CAP = Math.acos(2.4 / 11), FRAME = { dz: 1, h: 0.8, r: 0.35 };
const BAG = { r: 1.35, neck: 0.5, tie: 0.3, frill: 0.35, out: 1.5, hang: 2 }, POST = { x: 12, y: -15, r: 1.1, h: 6.5, tie: 5 }, SAG = 2.6;
const FLOAT = { k: 14, c: 2 * Math.sqrt(14) }, FALL = { k: 60, c: 2 * Math.sqrt(60) }, LABEL = ["rest", "pre-launch", "launch", "scale"];
// the three bags, left to right: on the left wall, at the front corner, on the right wall. at: where the rope meets the rim
const CC = B - BR, BAGS = [
  { c: [0, B + BAG.out], at: [0, B], out: [0, 1] },
  { c: [CC + (BR + BAG.out) * D, CC + (BR + BAG.out) * D], at: [CC + BR * D, CC + BR * D], out: [D, D] },
  { c: [B + BAG.out, 0], at: [B, 0], out: [1, 0] },
];
const HIGH = GAP + BH + ROPE + SKIRT.h + ENV.dz; // the envelope's centre above the plate, at rest

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LV = value;

  const C = Cam(45, 0.5, 3.15);
  fit(C, [[-PLATE, -PLATE, 0], [PLATE, PLATE, 0], [-PLATE, PLATE, 0], [PLATE, -PLATE, 0], [0, 0, Z0 + HIGH + 42 + ENV.r + 2]], 200, 160);
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
  const g = mk("g", {}, svg), [ps, pc] = box(0, 0, PLATE, 6, 0, Z0);
  path(g, ps); path(g, pc, "nf sil");
  const air = mk("g", {}, g), post = mk("g", {}, g), tether = path(g, "", "nf sil"), bags = BAGS.map(() => mk("g", {}, g));
  const pr = POST.r, pz = Z0 + POST.h;
  path(post, cyl([POST.x, POST.y, Z0], pr + 0.7, [POST.x, POST.y, Z0 + 0.7], pr + 0.7)); path(post, front([POST.x, POST.y, Z0 + 0.7], pr + 0.7), "nf sil");
  path(post, cyl([POST.x, POST.y, Z0 + 0.7], pr, [POST.x, POST.y, pz], pr)); path(post, cyl([POST.x, POST.y, Z0 + POST.tie - 0.4], pr + 0.25, [POST.x, POST.y, Z0 + POST.tie + 0.4], pr + 0.25)); // the lashing
  path(post, cyl([POST.x, POST.y, pz], pr + 0.5, [POST.x, POST.y, pz + 0.8], pr + 0.5)); path(post, ring([POST.x, POST.y, pz + 0.8], pr + 0.5), "nf sil");

  const lift = spring(0, FLOAT), drops = BAGS.map(() => spring(0, FALL));
  let act = -1, bob = 0;
  function draw() {
    const F = Z0 + GAP + lift.x * LV + bob, rim = F + BH, zs = rim + ROPE, zt = zs + SKIRT.h, zc = zt + ENV.dz;
    air.replaceChildren();
    // ropes: straight from the skirt ring to the basket's top corners, through the burner frame's corners
    const ang = (k) => (Math.PI / 4) * (2 * k + 1), RA = (CC + BR * D) * Math.SQRT2, at = (r, z, k) => [r * Math.cos(ang(k)), r * Math.sin(ang(k)), z];
    const rope = (k) => path(air, `M${pt(at(SKIRT.r, zs, k))}L${pt(at(RA, rim, k))}`, "nf sil");
    const zf = zs - FRAME.dz, fr = SKIRT.r + ((RA - SKIRT.r) * FRAME.dz) / ROPE, fh = fr * D + FRAME.r * (1 - D);
    rope(2);
    const [bs, bc] = box(0, 0, B, BR, F, rim); // the basket: open top with its inner rim, and two weave bands
    path(air, bs); path(air, bc, "nf sil"); path(air, rrun(0, 0, B - WALL, BR - WALL, rim, 0, 4 * Q, true) + "Z", "nf sil");
    [1, 2].forEach((n) => path(air, rrun(0, 0, B, BR, F + (n * BH) / 3, FR, FR + 2 * Q, true), "nf sil"));
    rope(1); rope(3);
    const [ks, kc] = box(0, 0, fh, FRAME.r, zf - FRAME.h, zf);
    path(air, ks); path(air, kc, "nf sil");
    // the skirt, then the envelope over its top edge: outline, the gores on the side facing the camera, the crown ring
    path(air, cyl([0, 0, zs], SKIRT.r, [0, 0, zt], MOUTH));
    const c = [0, 0, zc], R = ENV.r, { d, tk } = bulb(c, R, [0, 0, zt], MOUTH);
    path(air, d);
    let gores = "";
    for (let k = 0; k < 6; k++) { // six gores like meridians, none facing the camera; the two along the outline are the outline
      if (k === 1 || k === 4) continue;
      const f = CAM + Math.PI / 6 + (Math.PI / 3) * k, e1 = [Math.cos(f), Math.sin(f), 0], del = Math.atan2(w[2], dot3(e1, w));
      const t0 = Math.max(tk, del - Q + 0.02), t1 = Math.min(CAP, del + Q - 0.02);
      if (t0 >= t1) continue;
      gores += t0 === tk ? `M${pt(at3([0, 0, zt], e1, EZ, MOUTH, 0))}` + arc(c, e1, EZ, R, tk, t1, false) : arc(c, e1, EZ, R, t0, t1, true);
    }
    path(air, gores, "nf sil"); path(air, ring([0, 0, zc + R * Math.sin(CAP)], R * Math.cos(CAP)), "nf sil");
    rope(0);
    // the tether: from the basket's right corner, just under the rim, to a lashing on the post; a soft curve at rest, taut at the top
    const t0 = [CC + BR * D, -(CC + BR * D), rim - 0.6], u = [t0[0] - POST.x, t0[1] - POST.y].map((v, i, a) => v / Math.hypot(...a));
    const t3 = [POST.x + (pr + 0.25) * u[0], POST.y + (pr + 0.25) * u[1], Z0 + POST.tie], sag = SAG * (1 - 0.32 * Math.min(3, Math.max(0, lift.x)));
    const t1 = t0.map((x, i) => x + (t3[i] - x) / 3 - (i === 2 ? sag : 0)), t2 = t0.map((x, i) => x + (2 * (t3[i] - x)) / 3 - (i === 2 ? sag : 0));
    tether.setAttribute("d", `M${pt(t0)}C${pt(t1)} ${pt(t2)} ${pt(t3)}`);
    // the bags: each falls straight down, its rope with it, and lands on the plate below where it hung, the rope behind it
    BAGS.forEach((b, i) => {
      const p = Math.max(0, Math.min(1, drops[i].x)), hang = rim - BAG.hang - BAG.frill - BAG.neck - BAG.r, z = hang + (Z0 + BAG.r - hang) * p;
      const [x, y] = b.c, cls = i === act ? "hi" : "sil", gi = bags[i], nk = [x, y, z + BAG.r + BAG.neck], fk = [x, y, nk[2] + BAG.frill];
      const up = [b.at[0] - x, b.at[1] - y, BAG.hang], down = [-(BAG.r + 1.3) * b.out[0], -(BAG.r + 1.3) * b.out[1], Z0 + 0.12 - (Z0 + 2 * BAG.r + BAG.neck + BAG.frill)];
      const bend = [-0.8 * BAG.r * b.out[0], -0.8 * BAG.r * b.out[1], 0.25], e = fk.map((v, j) => v + up[j] + (down[j] - up[j]) * p), m = fk.map((v, j) => v + up[j] / 2 + (bend[j] - up[j] / 2) * p);
      gi.replaceChildren();
      path(gi, `M${pt(fk)}Q${pt(m)} ${pt(e)}`, `nf ${cls}`); // the rope first: once down it lies behind the bag
      path(gi, bulb([x, y, z], BAG.r, nk, BAG.tie).d, cls); path(gi, cyl(nk, BAG.tie, fk, BAG.tie + 0.25), cls); path(gi, ring(fk, BAG.tie + 0.25), `nf ${cls}`);
    });
  }

  const still = reducedMotion();
  const T = register(stage, (dt, now) => {
    let moving = stepS(lift, dt);
    drops.forEach((s) => { moving = stepS(s, dt) || moving; });
    bob = still ? 0 : 0.3 * Math.sin((now / 1000) * ((2 * Math.PI) / 4.5));
    draw();
    return moving || !still;
  });
  bag.add(T.unregister);

  // hit areas: the bags where they hang at rest, never where they are now, so the drop never flickers
  const RESTF = Z0 + GAP + BH - BAG.hang - BAG.frill - BAG.neck - BAG.r, HIT = 9, spots = BAGS.map((b) => P(b.c[0], b.c[1], RESTF));
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
  range: [10, 12, 14],
  mount,
});
