/**
 * Vault: a round door set flush into a square frame on a low plate, its face turned 15° right of the x axis like the
 * Analytics meter. A gap ring runs between door and frame; two hinge knuckles bridge it on the left. In the centre a
 * three-spoke wheel stands off the door on a short shaft. Four rectangular bolts lie on the door, on the diagonals.
 * Hover the wheel: it turns 120° clockwise while the bolts slide outward across the gap onto the frame one by one,
 * clockwise from the top right, each lighting up as it lands. Leave and they draw back in reverse.
 *
 * The hit area is the wheel's round footprint, which never moves (the wheel only turns in place). Each bolt rides the
 * 700ms ease-out on its own tween, staggered by the slider's step; the wheel's angle is the bolts' mean, so it turns
 * as they slide. Every curve is a true Bézier: world arcs as cubics of 90° or less, projected control point by point.
 */
const { Cam, fit, proj, tween, tset, tval, tdone, disposer, mk, pointer, put, register, solid } = HL;

const Q = Math.PI / 2, T = (15 * Math.PI) / 180, deg = (d) => (d * Math.PI) / 180;
// plate PH high; frame 2H square, RC corners, DF deep, with a round opening RG; the door R sits flush in it
const PH = 3, H = 25, RC = 5, DF = 8, R = 18, RG = 21, ZC = PH + H;
// the wheel: a ring RW round, 2·RB wide and WT thick, standing WF off the door; three spokes 2·SW wide; a hub cap
const RW = 8.5, RB = 1.1, WT = 1.5, WF = 3, SW = 1, HUB = 2.8, HUBT = 3, SHAFT = 2;
// bolts: BL long, 2·BW wide, BH high, on the diagonals; at rest they end 1 inside the door's rim, locked 1 past the gap
const BW = 2.2, BL = 7, BH = 2, B0 = R - 1 - BL, SL = RG + 1 - B0, BOLTS = [45, -45, -135, 135].map(deg);
// hinge knuckles: barrels KR round and KL long, standing on the face across the gap at the left, KV above and below
const KR = 2, KL = 5.5, KV = 7.5, KU = -(Math.sqrt(R * R - KV * KV) + Math.sqrt(RG * RG - KV * KV)) / 2;
const REST = deg(90), TURN = deg(120);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;

  // the door's own frame: u to the right on screen, v up (world z), f out of the face toward the lower right
  const U = [Math.sin(T), -Math.cos(T), 0], V = [0, 0, 1], F = [Math.cos(T), Math.sin(T), 0];
  const Wv = (u, v, f) => [u * U[0] + f * F[0], u * U[1] + f * F[1], v];
  const C = Cam(45, 0.5, 3.8), far = B0 + BL + SL;
  fit(C, [Wv(-H - 2, 0, -DF - 2), Wv(H + 2, 0, -DF - 2), Wv(-H - 2, 0, 6), Wv(H + 2, 0, 6),
    Wv(-H, PH + 2 * H, -DF), Wv(H, PH + 2 * H, -DF), Wv(H, PH, 0), ...BOLTS.map((a) => Wv(far * Math.cos(a), ZC + far * Math.sin(a), BH))], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v));
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const dir = (a) => add(U.map((x) => x * Math.cos(a)), V, Math.sin(a)), nrm = (a) => add(U.map((x) => -x * Math.sin(a)), V, Math.cos(a));

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
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, from angle f0 to f1 (f0 < f1). */
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0, f1, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded outline on a visible face at o, run back by the vector n: one silhouette, and the face's inner half as
   * its crease. The outline splits where its tangent runs along n on screen, so each half is one smooth run. */
  function slab(o, e1, e2, rect, r, n) {
    const Tv = J(n), fs = Math.atan2(cross(J(e2), Tv), cross(J(e1), Tv)), m = J(add(e1.map((x) => x * Math.cos(fs + Q)), e2, Math.sin(fs + Q)));
    const a = (m[0] * Tv[0] + m[1] * Tv[1] < 0 ? fs : fs + 2 * Q) + 4 * Q;
    return { sil: rr(o, e1, e2, rect, r, a, a + 2 * Q) + rr(add(o, n), e1, e2, rect, r, a + 2 * Q, a + 4 * Q, false) + "Z", crease: rr(o, e1, e2, rect, r, a + 2 * Q, a + 4 * Q) };
  }
  const back = (d) => F.map((x) => -d * x), disc = (r) => [-r, -r, r, r], lone = (q) => ({ sil: q.sil, crease: "" });
  const circle = (c, r, f0, f1, move = true) => arc(c, U, V, r, f0, f1, move);

  // back to front: plate; frame (its opening drawn in its own outline, wound the same way so the face stays filled);
  // the door, flush in the opening; bolts and hinge knuckles on the face; then the wheel: shaft, spokes, ring, hub cap
  const g = mk("g", {}, svg), face = Wv(0, ZC, 0), wf = Wv(0, ZC, WF + WT);
  const plate = solid(g), frame = solid(g), door = solid(g), bolts = BOLTS.map(() => solid(g)), knuckles = solid(g);
  const shaft = solid(g), spokes = solid(g), ring = solid(g), hub = solid(g);
  put(plate, slab([0, 0, PH], U, F, [-H - 2, -DF - 2, H + 2, 6], 3, [0, 0, -PH]));
  const fr = slab(Wv(0, PH, 0), U, V, [-H, 0, H, 2 * H], RC, back(DF));
  put(frame, { sil: fr.sil + circle(face, RG, 0, 4 * Q) + "Z", crease: fr.crease });
  put(door, { sil: circle(face, R, 0, 4 * Q) + "Z", crease: "" });
  const kn = [KV, -KV].map((v) => lone(slab(Wv(KU, ZC + v + KL / 2, KR), U, F, disc(KR), KR, [0, 0, -KL])).sil);
  put(knuckles, { sil: kn.join(""), crease: "" });
  put(shaft, lone(slab(Wv(0, ZC, WF), U, V, disc(SHAFT), SHAFT, back(WF))));
  put(hub, slab(Wv(0, ZC, WF + HUBT), U, V, disc(HUB), HUB, back(HUBT)));
  // the ring: its outline, and the opening seen through it (where the front and back inner circles overlap), wound back
  const ri = RW - RB, Tv = J(back(WT)), ju = J(U), jv = J(V), K = cross(ju, jv), tu = cross(Tv, jv) / K, tv = cross(ju, Tv) / K;
  const th = Math.atan2(tv, tu), dl = Math.acos(Math.hypot(tu, tv) / (2 * ri));
  put(ring, { sil: lone(slab(wf, U, V, disc(RW + RB), RW + RB, back(WT))).sil + circle(wf, ri, th + dl, th - dl) + circle(add(wf, back(WT)), ri, th + 2 * Q + dl, th + 2 * Q - dl, false) + "Z", crease: "" });
  const boltAt = (a, s) => lone(slab(Wv(0, ZC, BH), dir(a), nrm(a), [B0 + s * SL, -BW, B0 + BL + s * SL, BW], 0.8, back(BH)));
  const spokesAt = (a) => [0, 1, 2].map((k) => slab(wf, dir(a + (4 * Q * k) / 3), nrm(a + (4 * Q * k) / 3), [1.5, -SW, RW, SW], 0.5, back(WT)).sil).join("");

  const tw = BOLTS.map(() => tween(0)), last = BOLTS.map(() => NaN);
  let on = false, phi = NaN, lit = "";
  const B = register(stage, (_dt, now) => {
    const v = tw.map((t) => tval(t, now)), a = REST - (TURN * v.reduce((s, x) => s + x, 0)) / 4;
    v.forEach((x, i) => { if (x !== last[i]) { last[i] = x; put(bolts[i], boltAt(BOLTS[i], x)); } });
    if (a !== phi) { phi = a; put(spokes, { sil: spokesAt(a), crease: "" }); }
    // one highlight: the wheel while the door is open and idle, else each bolt once it is past halfway
    const shut = v.map((x) => x > 0.5), idle = !on && !shut.some(Boolean), key = `${shut}|${idle}`;
    if (key !== lit) {
      lit = key;
      bolts.forEach((b, i) => b.sil.classList.toggle("hi", shut[i]));
      [shaft, spokes, ring, hub].forEach((p) => p.sil.classList.toggle("hi", idle));
    }
    const done = tw.every((t) => tdone(t, now));
    if (on && done && read.textContent !== "locked") read.textContent = "locked";
    return !done;
  });
  bag.add(B.unregister);

  // the hit area: the wheel's round footprint, on its front and on its back, read in the face's plane. It never moves
  const inside = (q, f) => { const o = P(...Wv(0, ZC, f)), d = [q[0] - o[0], q[1] - o[1]]; return Math.hypot(cross(d, jv) / K, cross(ju, d) / K) <= RW + RB + 1; };
  const hit = (q) => inside(q, WF) || inside(q, WF + HUBT);
  /** Lock or unlock: the bolts go one by one, clockwise from the top right, and come back in reverse. */
  function lock(want) {
    if (want === on) return;
    on = want;
    const now = performance.now();
    tw.forEach((t, i) => tset(t, on ? 1 : 0, now, (on ? i : BOLTS.length - 1 - i) * step));
    read.textContent = on ? "locking" : "open";
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => lock(hit(p)), leave: () => lock(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "open";
  B.wake();

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "vault",
  means: "A vault door with one dial: hover it and the bolts slide shut one by one.",
  rules: [1, 2, 4, 6],
  // the stagger between bolts, in ms: at 340 the last bolt lands 1.72 s after the pointer arrives
  range: [180, 260, 340],
  mount,
});
