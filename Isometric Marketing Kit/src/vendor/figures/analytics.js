/**
 * Analytics: a tick-mark meter. A semicircular dial stands on a slim, low plinth, its face turned 30° from the
 * viewer toward the right. Two rows of radial ticks follow the arc: the outer row is the scale, the inner row the value,
 * both in four segments with one missing tick between them. A thin needle turns on a small hub.
 * Hover a segment and the needle swings to its end: the inner ticks light one by one behind it, the ones past it
 * go dim, the ticks near its tip stretch a little, and that segment's scale brightens. On leave it eases back.
 *
 * Hit areas are the four tick segments; the gauge never moves. The needle follows a spring with a tiny settle.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

const PLINTH = { h: 2, over: 1.5, r: 1.2 }, TURN = (15 * Math.PI) / 180; // the face looks 15° right of the x axis: 30° off the view
const T = 3, RB = 26, DROP = 4, RC = 3, ZH = PLINTH.h + DROP, Q = Math.PI / 2;
// 91 tick places, 2° apart, from the left foot (0) to the right (90); 22, 45 and 68 stay empty between the segments
const N = 91, STEP = Math.PI / 90, SEG = 23, GAP = (i) => i % SEG === 22, OUT = [19, 22], INN = [14.5, 17], DOTR = 24;
const NEEDLE = 18.2, HUB = 1.8, REST = 4, SWING = { k: 70, c: 12 };
const segOf = (i) => Math.min(3, Math.floor(i / SEG)), endOf = (k) => SEG * k + 21;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stretch = value;

  // the dial's own plane: u to the right on screen, v up; its face looks along F
  const U = [Math.sin(TURN), -Math.cos(TURN), 0], V = [0, 0, 1], F = [Math.cos(TURN), Math.sin(TURN), 0];
  const Wd = (u, v, x = 0) => [u * U[0] + x * F[0], u * U[1] + x * F[1], ZH + v], base = -DROP - PLINTH.h;
  const C = Cam(45, 0.5, 5.6);
  fit(C, [Wd(-RB, base, PLINTH.over), Wd(RB, base, PLINTH.over), Wd(-RB, base, -T - PLINTH.over), Wd(RB, base, -T - PLINTH.over), Wd(0, RB, 0), Wd(0, RB, -T), Wd(-RB, 0, -T), Wd(RB, 0, 0)], 200, 160);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  // the dial's own plane: u to the right on screen (-y), v up; its face looks along +x, toward the lower right

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
  /** The outline of two parallel circles (basis e1, e2) of one cylinder: where it leaves the second circle. */
  function cyl(c0, r0, c1, r1, e1 = EX, e2 = EY) {
    const u = J(e1), v = J(e2), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), D = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(D, v), B = -cross(D, u), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const [a, b] = on1(base) ? [base - s, base + s] : [base + s, base - s + 2 * Math.PI];
    return arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  /** A rounded box turned by yaw, from z0 to z1: its silhouette and the front edge of its top. */
  function box(cx, cy, hx, hy, r, yaw, z0, z1) {
    const c = Math.cos(yaw), s = Math.sin(yaw), e1 = [c, s, 0], e2 = [-s, c, 0], qx = hx - r, qy = hy - r;
    const cs = [[qx, -qy], [qx, qy], [-qx, qy], [-qx, -qy]].map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], e1, e2, r, f, stop, first); first = false; f = stop; }
      return d; };
    const f = FR - yaw;
    return [run(z1, f + 2 * Q, f + 4 * Q, true) + run(z0, f, f + 2 * Q, false) + "Z", run(z1, f, f + 2 * Q, true)];
  }
  const path = (parent, d, cls = "sil") => mk("path", { d, class: cls }, parent);

  // the plinth: low, a little deeper than the dial and no wider, centred under it
  const g = mk("g", {}, svg), foot = Wd(0, 0, -T / 2);
  box(foot[0], foot[1], RB - 1, T / 2 + PLINTH.over, PLINTH.r, Math.atan2(U[1], U[0]), 0, PLINTH.h).forEach((d, i) => path(g, d, i ? "nf sil" : "sil"));

  // the dial: a D-shaped slab T thick. Back face, then the rim it shows (split where it turns from the camera), then the face
  const SEGS = [
    { l: [RB, -DROP + RC, RB, 0] }, { a: [0, 0, RB, 0, 2 * Q] }, { l: [-RB, 0, -RB, -DROP + RC] },
    { a: [-RB + RC, -DROP + RC, RC, 2 * Q, 3 * Q] }, { l: [-RB + RC, -DROP, RB - RC, -DROP] }, { a: [RB - RC, -DROP + RC, RC, 3 * Q, 4 * Q] },
  ];
  const Uw = U[0] * w[0] + U[1] * w[1], del = Math.atan2(w[2], Uw), seen = (nu, nv) => nu * Uw + nv * w[2] > 1e-9, pieces = [];
  SEGS.forEach((s) => {
    if (s.l) { const [u0, v0, u1, v1] = s.l, L = Math.hypot(u1 - u0, v1 - v0); pieces.push({ ...s, vis: seen((v1 - v0) / L, -(u1 - u0) / L) }); return; }
    const [cu, cv, r, f0, f1] = s.a, cuts = [del - Q, del + Q, del - 3 * Q, del + 3 * Q].filter((f) => f > f0 + 1e-6 && f < f1 - 1e-6).sort((x, y) => x - y);
    [f0, ...cuts, f1].reduce((a, b) => { pieces.push({ a: [cu, cv, r, a, b], vis: seen(Math.cos((a + b) / 2), Math.sin((a + b) / 2)) }); return b; });
  });
  const trace = (p, x, rev, move) => {
    if (p.l) { const [u0, v0, u1, v1] = p.l, [a, b] = rev ? [[u1, v1], [u0, v0]] : [[u0, v0], [u1, v1]]; return `${move ? "M" : "L"}${pt(Wd(...a, x))}L${pt(Wd(...b, x))}`; }
    const [cu, cv, r, f0, f1] = p.a; return arc(Wd(cu, cv, x), U, V, r, rev ? f1 : f0, rev ? f0 : f1, move);
  };
  const face = (x) => pieces.map((p, i) => trace(p, x, false, i === 0)).join("") + "Z";
  path(g, face(-T));
  const k0 = pieces.findIndex((p, i) => p.vis && !pieces[(i + pieces.length - 1) % pieces.length].vis), run = [];
  for (let i = 0; i < pieces.length && pieces[(k0 + i) % pieces.length].vis; i++) run.push(pieces[(k0 + i) % pieces.length]);
  path(g, run.map((p, i) => trace(p, 0, false, i === 0)).join("") + [...run].reverse().map((p) => trace(p, -T, true, false)).join("") + "Z");
  path(g, face(0));

  // on the face: five scale dots at the segment ends, the outer scale ticks, the inner value ticks, the needle, the hub
  const ring = (c, r) => arc(c, U, V, r, 0, 4 * Q, true) + "Z", ang = (i) => 2 * Q - i * STEP;
  [0, 22, 45, 68, 90].forEach((i) => path(g, ring(Wd(DOTR * Math.cos(ang(i)), DOTR * Math.sin(ang(i))), 0.55), "dot m"));
  const tick = (i, r0, r1) => `M${pt(Wd(r0 * Math.cos(ang(i)), r0 * Math.sin(ang(i))))}L${pt(Wd(r1 * Math.cos(ang(i)), r1 * Math.sin(ang(i))))}`;
  const places = [...Array(N).keys()].filter((i) => !GAP(i));
  const outer = places.map((i) => ({ i, el: path(g, tick(i, ...OUT), "nf"), cls: "nf" }));
  const inner = places.map((i) => ({ i, el: path(g, tick(i, ...INN), "nf lo"), cls: "nf lo", d: "" }));
  const needle = path(g, "", "lo"), hub = mk("g", {}, g);
  const hubDraw = (cls) => { hub.replaceChildren(); path(hub, cyl(Wd(0, 0, 0), HUB, Wd(0, 0, 1.2), HUB, U, V), cls); path(hub, ring(Wd(0, 0, 1.2), HUB), `nf ${cls}`); };

  const val = spring(REST, SWING);
  let act = -1, last = "";
  function draw() {
    const v = val.x, cls = act < 0 ? "lo" : "hi";
    inner.forEach((t) => {
      const ext = stretch * Math.exp(-(((t.i - v) / 2.6) ** 2)), d = tick(t.i, INN[0], INN[1] + ext), c = t.i <= v + 1e-3 ? "nf hi" : "nf lo";
      if (d !== t.d) { t.d = d; t.el.setAttribute("d", d); }
      if (c !== t.cls) { t.cls = c; t.el.setAttribute("class", c); }
    });
    const a = ang(v), e = [Math.cos(a), Math.sin(a)], n = [-e[1], e[0]], hw = 0.7, x = 0.4;
    needle.setAttribute("d", `M${pt(Wd(NEEDLE * e[0], NEEDLE * e[1], x))}L${pt(Wd(hw * n[0], hw * n[1], x))}` + arc(Wd(0, 0, x), U, V, hw, a + Q, a + 3 * Q, false) + "Z");
    if (needle.getAttribute("class") !== cls) { needle.setAttribute("class", cls); hubDraw(cls); }
  }
  hubDraw("lo");
  const B = register(stage, (dt) => {
    const moving = stepS(val, dt), key = `${val.x.toFixed(4)}|${act}|${stretch}`;
    if (key !== last) { last = key; draw(); }
    return moving;
  });
  bag.add(B.unregister);

  // hit areas: the four tick segments on the dial's face, read in the face's own plane
  function hit([sx, sy]) {
    const a = J(U), b = J(V), h = P(...Wd(0, 0)), d = [sx - h[0], sy - h[1]], k = cross(a, b), u = cross(d, b) / k, v = cross(a, d) / k, r = Math.hypot(u, v);
    if (r < 12 || r > RB || v < -2) return -1;
    return segOf(Math.max(0, Math.min(90, (2 * Q - Math.atan2(Math.max(v, 0), u)) / STEP)));
  }
  function choose(k) {
    if (k === act) return;
    act = k; val.t = k < 0 ? REST : endOf(k);
    outer.forEach((t) => { const c = segOf(t.i) === k ? "nf sil" : "nf"; if (c !== t.cls) { t.cls = c; t.el.setAttribute("class", c); } });
    read.textContent = k < 0 ? "rest" : `segment ${k + 1}`;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  B.wake();

  return { set: (v) => { stretch = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "analytics",
  means: "A tick-mark meter in four segments: point at one and the needle sweeps to its end, lighting the value ticks behind it.",
  rules: [1, 4, 7, 8],
  range: [0.6, 1.2, 1.7],
  mount,
});
