/**
 * Segmentation: a lazy-susan tray on a pedestal, split by thin walls into four compartments of
 * 40, 25, 20 and 15 percent, each holding its own kind of token: cubes, spheres, cylinders, pawns.
 * Hover a compartment and the tray turns to bring it to the front; its tokens lift and brighten,
 * its neighbours lift a little. On leave the tray settles back and the tokens lower.
 *
 * Hit areas turn with the tray, but are read only once it has settled and the pointer has moved
 * since, so the turn never flickers. Angle and lifts follow critically damped springs.
 */
const { Cam, fit, proj, unproj, spring, stepS, disposer, mk, pointer, register } = HL;

const Z0 = 4, PLATE = 25, BASE = { r: 20, h: 2 }, FLARE = { r: 15, h: 5 }, STEM = { r: 6, h: 15 }, ZB = Z0 + BASE.h + FLARE.h + STEM.h;
const R = 44, WALLR = 1.5, RIN = R - WALLR, FLOOR = ZB + 2, ZT = FLOOR + 4, HUB = 3, T = 1.2, Q = Math.PI / 2, CALM = { k: 60, c: 15.5 };
// Compartments: spans 144°, 90°, 72°, 54°; tokens at (radius, degrees into the span). Every token clears the
// walls by ≥ 3.7, the rim by ≥ 3.5, the hub by ≥ 8, and the next token by ≥ 7.4; it never moves sideways.
const SPAN = [144, 90, 72, 54].map((d) => (d * Math.PI) / 180), START = SPAN.map((_, i) => SPAN.slice(0, i).reduce((a, b) => a + b, 0));
const SETS = [[[16, 40], [16, 104], [30, 26], [30, 72], [30, 118]], [[14, 45], [27, 18], [27, 72], [36, 45]], [[16, 36], [30, 16], [30, 56], [36, 36]], [[18, 27], [34, 12], [34, 42]]];
const KIND = ["cube", "sphere", "cylinder", "pawn"], REST_TURN = -1.1;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 2.95);
  fit(C, [[-R, -R, ZB], [R, R, ZB], [-R, R, ZB], [R, -R, ZB], [0, 0, ZT + 8], [PLATE, PLATE, 0]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const CAM = Math.atan2(w[1], w[0]), FR = Math.atan2(J(EY)[0], J(EX)[0]), S1 = unit(x3(w, EZ)), S2 = x3(w, S1);

  // Every curve is a true Bézier: the camera is affine, so world arcs built as cubics project exactly.
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i]));
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${f2(P(...at3(c, e1, e2, r, f0)))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${f2(P(...p0.map((x, j) => x + k * t0[j])))} ${f2(P(...p3.map((x, j) => x - k * t3[j])))} ${f2(P(...p3))}`;
    }
    return d;
  }
  const ring = (c, r) => arc(c, EX, EY, r, 0, 4 * Q, true) + "Z", ball = (c, r) => arc(c, S1, S2, r, 0, 4 * Q, true) + "Z";
  /** An upright cylinder from c0 (radius r0) to c1 (radius r1): its outline, two arcs and the two tangents. */
  function cyl(c0, r0, c1, r1) {
    const u = J(EX), v = J(EY), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), D = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(D, v), B = -cross(D, u), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 2 * Math.PI;
    return arc(c1, EX, EY, r1, a, b, true) + arc(c0, EX, EY, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  /** A rounded box (half sizes hx, hy, corner r, turned by yaw) from z0 to z1: its silhouette, back of the top and front of the foot split mid-corner, and its top edge. */
  function box(cx, cy, hx, hy, r, yaw, z0, z1) {
    const c = Math.cos(yaw), s = Math.sin(yaw), e1 = [c, s, 0], e2 = [-s, c, 0], qx = hx - r, qy = hy - r;
    const cs = [[qx, -qy], [qx, qy], [-qx, qy], [-qx, -qy]].map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], e1, e2, r, f, stop, first); first = false; f = stop; }
      return d; };
    const f = FR - yaw;
    return [run(z1, f + 2 * Q, f + 4 * Q, true) + run(z0, f, f + 2 * Q, false) + "Z", run(z1, f, f + 2 * Q, true)];
  }

  const g = mk("g", {}, svg);
  // the plate; the pedestal: a foot, a flare and a stem
  const [ps, pt] = box(0, 0, PLATE, PLATE, 7, 0, 0, Z0);
  mk("path", { d: ps, class: "sil" }, g); mk("path", { d: pt, class: "nf sil" }, g);
  const ZF = Z0 + BASE.h, ZS = ZF + FLARE.h, top = (z, r) => arc([0, 0, z], EX, EY, r, FR, FR + 2 * Q, true);
  mk("path", { d: cyl([0, 0, Z0], BASE.r, [0, 0, ZF], BASE.r) + top(ZF, BASE.r), class: "sil" }, g);
  mk("path", { d: cyl([0, 0, ZF], FLARE.r, [0, 0, ZS], STEM.r), class: "sil" }, g);
  mk("path", { d: cyl([0, 0, ZS], STEM.r, [0, 0, ZB], STEM.r), class: "sil" }, g);
  // the tray, back to front: its body; the back of its rim; the opening, and the floor's far edge inside it
  mk("path", { d: cyl([0, 0, ZB], R, [0, 0, ZT], R), class: "fo" }, g);
  mk("path", { d: arc([0, 0, ZT], EX, EY, R, FR + 2 * Q, FR + 4 * Q, true) + ring([0, 0, ZT], RIN), class: "nf sil" }, g);
  mk("path", { d: arc([0, 0, FLOOR], EX, EY, RIN, FR + 2 * Q, FR + 4 * Q, true), class: "nf sil" }, g);

  // what turns: four compartments of tokens, four walls, the hub. Each wall is a vertical plane through the
  // centre, so the camera's side of it says which of its two compartments is in front: the order is exact.
  const inside = mk("g", {}, g), turn = spring(REST_TURN, CALM), ups = SPAN.map(() => spring(0, CALM));
  const comps = SETS.map((set, k) => ({ g: mk("g", {}, inside), tokens: set.map(([r, d]) => ({ r, a: (d * Math.PI) / 180, g: null })) }));
  comps.forEach((cp) => cp.tokens.forEach((t) => { t.g = mk("g", {}, cp.g); }));
  const walls = START.map(() => mk("g", {}, inside)), hub = mk("g", {}, inside);
  let lit = -1, lastKey = "";
  function token(t, k, x, y, a, z, cls) { // every token is 1.25 times its unit size
    t.g.replaceChildren();
    const put = (d, c = cls) => mk("path", { d, class: c }, t.g), front = (c, r) => arc(c, EX, EY, r, FR, FR + 2 * Q, true), u = 1.25;
    if (KIND[k] === "cube") box(x, y, 2.25 * u, 2.25 * u, 0.6 * u, a + Q / 2, z, z + 4.5 * u).forEach((d, i) => put(d, i ? `nf ${cls}` : cls));
    if (KIND[k] === "sphere") put(ball([x, y, z + 2.4 * u], 2.4 * u));
    if (KIND[k] === "cylinder") { put(cyl([x, y, z], 2.2 * u, [x, y, z + 4 * u], 2.2 * u)); put(front([x, y, z + 4 * u], 2.2 * u), `nf ${cls}`); }
    if (KIND[k] === "pawn") { put(cyl([x, y, z], 2.2 * u, [x, y, z + u], 2.2 * u)); put(front([x, y, z + u], 2.2 * u), `nf ${cls}`);
      put(cyl([x, y, z + u], 1.4 * u, [x, y, z + 4.6 * u], 0.8 * u)); put(ball([x, y, z + 6 * u], 1.6 * u)); }
  }
  function drawInside() {
    const al = turn.x, view = (x, y) => x * Math.cos(CAM) + y * Math.sin(CAM);
    comps.forEach((cp, k) => {
      const z = FLOOR + ups[k].x, cls = k === lit ? "hi" : "sil";
      cp.tokens.map((t) => { const a = al + START[k] + t.a; return { t, x: t.r * Math.cos(a), y: t.r * Math.sin(a), a }; })
        .sort((p, q) => view(p.x, p.y) - view(q.x, q.y)).forEach((p) => { token(p.t, k, p.x, p.y, p.a, z, cls); cp.g.append(p.t.g); });
    });
    START.forEach((s, j) => { const phi = al + s, m = (HUB + RIN) / 2;
      walls[j].replaceChildren(); box(m * Math.cos(phi), m * Math.sin(phi), (RIN - HUB) / 2, T / 2, 0.5, phi, FLOOR, ZT).forEach((d, i) => mk("path", { d, class: i ? "nf sil" : "sil" }, walls[j])); });
    const hc = lit < 0 ? "hi" : "sil";
    hub.replaceChildren(); mk("path", { d: cyl([0, 0, FLOOR], HUB, [0, 0, ZT], HUB), class: hc }, hub); mk("path", { d: arc([0, 0, ZT], EX, EY, HUB, FR, FR + 2 * Q, true), class: `nf ${hc}` }, hub);
    // order: nodes 0-3 compartments, 4-7 walls, 8 hub. A wall is a vertical half-plane through the centre, so the side
    // the camera is on says which of its two compartments is in front; the hub hides the ends of the back walls only.
    const nodes = [...comps.map((c) => c.g), ...walls, hub], before = nodes.map(() => []);
    START.forEach((s, j) => { const phi = al + s, [fr, bk] = Math.sin(CAM - phi) > 0 ? [j, (j + 3) % 4] : [(j + 3) % 4, j];
      before[4 + j].push(bk); before[fr].push(4 + j);
      if (Math.cos(phi - CAM) < 0) before[8].push(4 + j); else before[4 + j].push(8); });
    const order = [], seen = new Set(), visit = (n) => { if (seen.has(n)) return; seen.add(n); before[n].forEach(visit); order.push(n); };
    nodes.forEach((_, n) => visit(n));
    const key = order.join();
    if (key !== lastKey) { lastKey = key; order.forEach((n) => inside.append(nodes[n])); }
  }
  // the front of the rim last: it hides whatever sits low just behind it
  const fl = (z, f) => f2(P(...at3([0, 0, z], EX, EY, R, f)));
  mk("path", { d: arc([0, 0, ZT], EX, EY, RIN, FR, FR + 2 * Q, true) + `L${fl(ZT, FR + 2 * Q)}L${fl(ZB, FR + 2 * Q)}` + arc([0, 0, ZB], EX, EY, R, FR + 2 * Q, FR, false) + `L${fl(ZT, FR)}Z`, class: "fo" }, g);
  mk("path", { d: arc([0, 0, ZT], EX, EY, RIN, FR, FR + 2 * Q, true) + arc([0, 0, ZT], EX, EY, R, FR, FR + 2 * Q, true) + `M${fl(ZT, FR)}L${fl(ZB, FR)}` + arc([0, 0, ZB], EX, EY, R, FR, FR + 2 * Q, false) + `L${fl(ZT, FR + 2 * Q)}`, class: "nf sil" }, g);

  let last = "";
  const B = register(stage, (dt) => {
    let moving = stepS(turn, dt);
    ups.forEach((u) => { moving = stepS(u, dt) || moving; });
    const key = [turn.x, ...ups.map((u) => u.x), lit].map((v) => +v.toFixed(4)).join();
    if (key !== last) { last = key; drawInside(); }
    return moving;
  });
  bag.add(B.unregister);

  // hit test: the compartment under the pointer at the tray's settled angle. While the tray turns the pointer is not
  // read, and after it settles a new turn needs the pointer to cross a wall, so one turn never chains into another
  let act = -1, under = -1; // under: the compartment the pointer was over once the tray last settled (null: not read yet)
  const settled = () => Math.abs(turn.x - turn.t) < 0.01 && Math.abs(turn.v) < 0.05;
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, FLOOR + 3);
    if (Math.hypot(x, y) > RIN) return -1;
    const a = (((Math.atan2(y, x) - turn.x) % (4 * Q)) + 4 * Q) % (4 * Q);
    return START.findIndex((s, k) => a >= s && a < s + SPAN[k]);
  }
  function choose(k) {
    act = k; lit = k; under = k < 0 ? -1 : null;
    const goal = k < 0 ? REST_TURN : CAM - (START[k] + SPAN[k] / 2), d = ((((goal - turn.t) % (4 * Q)) + 6 * Q) % (4 * Q)) - 2 * Q;
    turn.t += d;
    ups.forEach((u, i) => { u.t = k < 0 ? 0 : i === k ? lift : Math.abs(((i - k + 6) % 4) - 2) === 1 ? lift * 0.25 : 0; });
    read.textContent = k < 0 ? "rest" : `segment ${k + 1}`;
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => {
      if (!settled()) return;
      const k = hit(p);
      if (under === null || k === under) { under = k; return; } // a turn starts only when the pointer crosses into another compartment
      under = k; if (k >= 0 && k !== act) choose(k);
    },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { lift = v; if (act >= 0) choose(act); }, destroy: bag.dispose };
}

hairline({
  name: "segmentation",
  means: "A lazy-susan tray in four compartments: hover one and the tray turns it to the front, and its tokens lift and brighten.",
  rules: [1, 4, 5, 8],
  range: [2, 3.5, 5],
  mount,
});
