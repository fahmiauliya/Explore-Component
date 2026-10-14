/**
 * Loop: a flat circular track lying on a small plate, four low round checkpoints standing evenly round its inner lane,
 * and one coin resting in the outer lane beside checkpoint 1, which carries a small standing check: month 1 is paid.
 * Each time the pointer comes onto the track, the coin slides a quarter of the way round to the next checkpoint, and
 * a check stands up on that checkpoint as the coin arrives: month 2, 3, 4. The entry after month 4 clears every check,
 * spreading back from the coin, and the coin slides on to checkpoint 1, whose check stands again: it repeats monthly.
 *
 * Grey at rest. While the pointer stays, the coin and the checkpoint it just reached, with its check, carry the bright
 * stroke; leaving lets them fade back to grey, and the checks already earned stay, grey. The hit area is the track's
 * resting disc, which never moves. The coin always sits on the track top, so the track never hides it; it is sorted
 * against the checkpoints by depth as it goes round. Every curve is a true Bézier, projected control point by control
 * point. The slider is how long the coin takes for a quarter of the loop, in ms.
 */
const { Cam, fit, proj, unproj, tween, tset, tval, tdone, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, Z0 = 5, TH = 1.6, Z1 = Z0 + TH;
// the track's edges RI and RO; the checkpoints (radius RM, height HM) on the inner lane at RK; the coin (radius CR,
// thickness T) on the outer lane at RC; the plate (half side PL, corner PR)
const RI = 11, RM = 2.3, HM = 1.3, RK = RI + 2 + RM, CR = 4, T = 2, RC = RK + RM + 1.2 + CR, RO = RC + CR + 2;
const PL = RO + 2.8, PR = 13, N = 4, STEP = 60;
// a check stands on its point on each checkpoint's top, in the plane facing the eye: short arm, vertex, long arm. It is
// a flat solid HW wide, filled, so it hides what stands behind it; its corners are rounded by RR
const TICK = [[-2, 2.5], [0, 0], [3.8, 6.6]], HW = 0.6, RR = 0.35;
const ANG = [0, 1, 2, 3].map((k) => Q / 2 - k * Q); // checkpoint k: front, right, back, left, so the coin runs right

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let dur = value;

  const C = Cam(45, 0.5, 3.35);
  const P0 = proj(C), J = (v) => { const q = P0(...v), o = P0(0, 0, 0); return [q[0] - o[0], q[1] - o[1]]; };
  const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1], u = J(EX), w = J(EY);
  const HZ = (() => { const h = [w[1], -u[1], 0], n = Math.hypot(h[0], h[1]) * (J(h)[0] > 0 ? 1 : -1); return h.map((x) => x / n); })();
  const add = (...ts) => [0, 1, 2].map((i) => ts.reduce((s, [k, a]) => s + k * a[i], 0));
  const on = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];
  const top = ANG.map((a) => on(RK, a, Z1 + HM)), tick = (k, s) => TICK.map(([h, z]) => add([1, top[k]], [s * h, HZ], [s * z, EZ]));
  const E = PL - PR * (1 - Math.SQRT1_2);
  fit(C, [[-E, -E, 0], [E, E, 0], [-E, E, 0], [E, -E, 0], ...[0, 1, 2, 3].flatMap((k) => tick(k, 1))], 200, 166);
  const P = proj(C), pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");

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
  // the screen's left and right extremes of a level circle sit at FR and FR + π; its near half runs between
  const FR = Math.atan2(w[0], u[0]), near = (c, r) => arc(c, EX, EY, r, FR, FR + 2 * Q, true);
  /** The outline of an upright cylinder of radius r from c0 up to c1: the far arc on top, the near arc below. */
  const cyl = (c0, c1, r) => arc(c1, EX, EY, r, FR + 2 * Q, FR + 4 * Q, true) + arc(c0, EX, EY, r, FR, FR + 2 * Q, false) + "Z";
  /** A low round solid of radius r on c, h tall: its silhouette and the near edge of its top. */
  const disc = (c, r, h) => [cyl(c, add([1, c], [h, EZ]), r), near(add([1, c], [h, EZ]), r)];
  /** A rounded square slab, half side h, corner r, from za to zb: its silhouette and the near edge of its top. */
  function slab(h, r, za, zb) {
    const cs = [[h - r, -h + r], [h - r, h - r], [-h + r, h - r], [-h + r, -h + r]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(zb, FR + 2 * Q, FR + 4 * Q, true) + run(za, FR, FR + 2 * Q, false) + "Z", run(zb, FR, FR + 2 * Q, true)];
  }
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // back to front: plate; the track, a ring whose hole is wound the other way so only the band is filled, then its near
  // top edge and, inside the hole, the foot of its far inner wall; then the checkpoints and the coin, sorted by depth
  const g = mk("g", {}, svg), [ps, pc] = slab(PL, PR, 0, Z0);
  path(g, ps, "sil"); path(g, pc, "nf lo");
  path(g, cyl([0, 0, Z0], [0, 0, Z1], RO) + arc([0, 0, Z1], EX, EY, RI, 4 * Q, 0, true) + "Z", "sil");
  // the inner wall's foot shows inside the hole's top edge: where it lies higher than half the wall's drop
  const A = RI * Math.hypot(u[1], w[1]), ph = Math.atan2(w[1], u[1]), g0 = Math.acos(Math.max(-1, (TH * J(EZ)[1]) / (2 * A)));
  path(g, near([0, 0, Z1], RO) + arc([0, 0, Z0], EX, EY, RI, ph + g0, ph + 2 * Math.PI - g0, true), "nf lo");
  const layer = mk("g", {}, g);
  const cps = ANG.map((a, k) => {
    const grp = mk("g", {}, layer), [s, c] = disc(on(RK, a, Z1), RM, HM);
    return { grp, sil: path(grp, s, "sil"), cr: path(grp, c, "nf lo"), el: path(grp, "", "sil"), s: tween(k === 0 ? 1 : 0), due: null, last: -1, depth: RK * (Math.cos(a) + Math.sin(a)) };
  });
  const coin = mk("g", {}, layer), coinSil = path(coin, "", "sil"), coinCr = path(coin, "", "nf lo");
  // the check's outline in its own plane (h right, z up): round caps, rounded corners between the arms and under them
  const n2 = (d) => { const l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; }, pp = (d) => [-d[1], d[0]];
  const p2 = (a, ...ts) => ts.reduce((q, [k, d]) => [q[0] + k * d[0], q[1] + k * d[1]], a);
  const meet = (a, da, b, db) => { const t = ((b[0] - a[0]) * db[1] - (b[1] - a[1]) * db[0]) / (da[0] * db[1] - da[1] * db[0]); return p2(a, [t, da]); };
  const [L, V, R] = TICK, d1 = n2(p2(L, [-1, V])), d2 = n2(p2(R, [-1, V])), o1 = pp(d1), o2 = pp(d2); // o1 points out of the V, o2 into it
  const CI = meet(p2(L, [-HW, o1]), d1, p2(R, [HW, o2]), d2), CO = meet(p2(L, [HW, o1]), d1, p2(R, [-HW, o2]), d2);
  const LIFT = -(CO[1] + 0.25 * RR * (d1[1] + d2[1])); // the rounded foot touches the top
  const tickPath = (k, s) => {
    const W = (q) => add([1, top[k]], [s * q[0], HZ], [s * (q[1] + LIFT), EZ]), Wd = (d) => add([d[0], HZ], [d[1], EZ]);
    const corner = (c, din, dout) => `L${pt(W(p2(c, [-RR, din])))}Q${pt(W(c))} ${pt(W(p2(c, [RR, dout])))}`;
    return arc(W(L), Wd(o1), Wd(d1), s * HW, 0, 2 * Q, true) + corner(CI, [-d1[0], -d1[1]], d2)
      + arc(W(R), Wd(o2), Wd(d2), s * HW, 0, 2 * Q, false) + corner(CO, [-d2[0], -d2[1]], d1) + "Z";
  };

  let mv = tween(ANG[0], dur), goal = ANG[0], at = 0, lastA = null, order = "";
  const B = register(stage, (_dt, now) => {
    let moving = !tdone(mv, now);
    const a = tval(mv, now);
    if (a !== lastA) { lastA = a; const [s, c] = disc(on(RC, a, Z1), CR, T); coinSil.setAttribute("d", s); coinCr.setAttribute("d", c); }
    cps.forEach((cp, k) => {
      if (cp.due !== null) { if (now >= cp.due) { tset(cp.s, 1, now, 0); cp.due = null; } moving = true; }
      const s = tval(cp.s, now);
      if (s !== cp.last) { cp.last = s; cp.el.setAttribute("d", s < 0.02 ? "" : tickPath(k, s)); }
      if (!tdone(cp.s, now)) moving = true;
    });
    // paint the checkpoints and the coin back to front, by the depth of their centres
    const seq = [...cps.map((cp, k) => [cp.depth, k]), [RC * (Math.cos(a) + Math.sin(a)), -1]].sort((p, q) => p[0] - q[0]);
    const key = seq.map((p) => p[1]).join();
    if (key !== order) { order = key; seq.forEach(([, k]) => layer.append(k < 0 ? coin : cps[k].grp)); }
    return moving;
  });
  bag.add(B.unregister);

  let lit = false;
  function light(v) {
    lit = v;
    coinSil.classList.toggle("hi", v);
    cps.forEach((cp, k) => { cp.sil.classList.toggle("hi", v && k === at); cp.el.classList.toggle("hi", v && k === at); });
  }
  /** One entry: the coin slides a quarter round; its check stands as it arrives. After month 4 every check clears first. */
  function advance() {
    const now = performance.now(), from = at;
    at = (at + 1) % N;
    if (tdone(mv, now)) mv = tween(tval(mv, now), dur);
    goal -= Q; tset(mv, goal, now, 0);
    if (at === 0) cps.forEach((cp, k) => { tset(cp.s, 0, now, ((from - k + N) % N) * STEP); cp.due = null; });
    cps[at].due = now + 0.6 * dur;
    light(true);
    read.textContent = `month ${at + 1}`;
    B.wake();
  }

  // hit test: the pointer's line of sight against the track's RESTING disc, from the plate up to the coin's top
  function hit([sx, sy]) {
    for (let z = Z0; z <= Z1 + T; z += 0.5) { const [x, y] = unproj(C, sx, sy, z); if (Math.hypot(x, y) <= RO + 1) return true; }
    return false;
  }
  let inside = false;
  bag.add(pointer(stage, {
    move: (p) => { const h = hit(p); if (h && !inside) advance(); if (!h && lit) light(false); inside = h; },
    leave: () => { inside = false; light(false); },
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "month 1";
  B.wake();

  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "loop",
  means: "A coin goes round a loop of four checkpoints: each month one more is paid, then it starts again.",
  rules: [1, 2, 6, 8],
  range: [600, 800, 1000],
  mount,
});
