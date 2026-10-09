/**
 * Journey: a paper map folded in three equal panels, zig-zag, lying on a small plate. One smooth route runs across
 * all three panels and curls back toward its start; five dots sit on it (discover, consider, buy, use, return) and a
 * map pin stands on it. Hover a dot: the pin travels along the route to it, forward or back; the route behind the
 * pin turns solid and bright, the route ahead stays dashed and dim, and the dot brightens. On leave the pin stays.
 *
 * The route is drawn in the unfolded map and carried onto each panel by that panel's own affine map, split exactly
 * at the folds, so it is one continuous curve lying on the paper. Hit areas are the five dots, which never move.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

const Z0 = 3, PLATE = { hx: 24, hy: 18, r: 6 }, HALF = 14, RUN = 13.5, RISE = 4.5, Q = Math.PI / 2;
const XS = [-20.25, -6.75, 6.75, 20.25], ZS = [RISE, 0, RISE, 0], WP = Math.hypot(RUN, RISE); // the fold profile: down, up, down
const NAMES = ["discover", "consider", "buy", "use", "return"];
// the route's points in the unfolded map (across the folds, along them): the five dots and one turn after "use",
// so the route swings round and comes back along the near edge to finish beside the start
const WAY = [[4, 8], [11, -5], [21, 1], [34, -4], [39.5, 5], [11, 11.5]], DOTAT = [0, 1, 2, 3, 5], DOTS = DOTAT.map((i) => WAY[i]), PIN = { needle: 3.2, head: 1.35 }, DOT = 0.95;
const TRAVEL = { k: 38, c: 2 * Math.sqrt(38) }, SETTLE = { k: 140, c: 15 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;

  const C = Cam(45, 0.5, 4.9);
  fit(C, [[-PLATE.hx, -PLATE.hy, 0], [PLATE.hx, PLATE.hy, 0], [-PLATE.hx, PLATE.hy, 0], [PLATE.hx, -PLATE.hy, 0], [0, 0, Z0 + RISE + 7]], 200, 160);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), S1 = unit(x3(w, EZ)), S2 = x3(w, S1);

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
  /** A rounded box from z0 to z1: its silhouette and the front edge of its top. */
  function box(hx, hy, r, z0, z1) {
    const cs = [[hx - r, -(hy - r)], [hx - r, hy - r], [-(hx - r), hy - r], [-(hx - r), -(hy - r)]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)), q = cs[((i % 4) + 4) % 4];
        d += arc([q[0], q[1], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(z1, FR + 2 * Q, FR + 4 * Q, true) + run(z0, FR, FR + 2 * Q, false) + "Z", run(z1, FR, FR + 2 * Q, true)];
  }
  const path = (parent, d, cls = "sil") => mk("path", { d, class: cls }, parent);

  // the folded map: panel p carries the unfolded strip a in [p, p + 1] * WP onto its slope, an affine map
  const panelOf = (a) => Math.max(0, Math.min(2, Math.floor(a / WP)));
  const onPanel = (p, [a, y]) => { const t = (a - p * WP) / WP; return [XS[p] + t * (XS[p + 1] - XS[p]), y, Z0 + ZS[p] + t * (ZS[p + 1] - ZS[p])]; };
  const across = (p) => unit([XS[p + 1] - XS[p], 0, ZS[p + 1] - ZS[p]]);

  // the route: a Catmull-Rom curve through the dots, as cubics in the unfolded map, cut exactly at the folds
  const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const split = (c, t) => { const a = lerp(c[0], c[1], t), b = lerp(c[1], c[2], t), d = lerp(c[2], c[3], t), e = lerp(a, b, t), f = lerp(b, d, t), m = lerp(e, f, t); return [[c[0], a, e, m], [m, f, d, c[3]]]; };
  const bez = (c, t) => { const u = 1 - t; return c[0].map((_, i) => u * u * u * c[0][i] + 3 * u * u * t * c[1][i] + 3 * u * t * t * c[2][i] + t * t * t * c[3][i]); };
  const LAST = WAY.length - 1, tangent = (i) => { const a = WAY[Math.max(0, i - 1)], b = WAY[Math.min(LAST, i + 1)], n = i === 0 || i === LAST ? 1 : 2; return [(b[0] - a[0]) / n, (b[1] - a[1]) / n]; };
  const firstCut = (c) => { // the parameter of the first fold crossing, if any
    for (let k = 1; k <= 64; k++) {
      const t0 = (k - 1) / 64, t1 = k / 64;
      for (const f of [WP, 2 * WP]) {
        if ((bez(c, t0)[0] - f) * (bez(c, t1)[0] - f) >= 0) continue;
        let lo = t0, hi = t1;
        for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if ((bez(c, lo)[0] - f) * (bez(c, m)[0] - f) <= 0) hi = m; else lo = m; }
        return (lo + hi) / 2;
      }
    }
    return null;
  };
  const pieces = [], marks = [0];
  for (let i = 0; i < LAST; i++) {
    const ta = tangent(i), tb = tangent(i + 1);
    let c = [WAY[i], [WAY[i][0] + ta[0] / 3, WAY[i][1] + ta[1] / 3], [WAY[i + 1][0] - tb[0] / 3, WAY[i + 1][1] - tb[1] / 3], WAY[i + 1]];
    for (let cut = firstCut(c); cut !== null && cut > 1e-6 && cut < 1 - 1e-6; cut = firstCut(c)) { const [l, r] = split(c, cut); pieces.push(l); c = r; }
    pieces.push(c);
    marks.push(pieces.length);
  }
  // each piece in 3D on its own panel, with an arc-length table for travel
  const route = pieces.map((c) => { const p = panelOf(bez(c, 0.5)[0]); return { c, w: c.map((q) => onPanel(p, q)) }; });
  let total = 0;
  route.forEach((r) => { r.s0 = total; r.lens = [0]; let prev = bez(r.w, 0);
    for (let k = 1; k <= 48; k++) { const q = bez(r.w, k / 48); total += Math.hypot(...q.map((x, i) => x - prev[i])); r.lens.push(total - r.s0); prev = q; } });
  const STOP = DOTAT.map((i) => (marks[i] < route.length ? route[marks[i]].s0 : total));
  const locate = (s) => {
    s = Math.max(0, Math.min(total, s));
    let j = route.findIndex((r) => s <= r.s0 + r.lens[48] + 1e-9); if (j < 0) j = route.length - 1;
    const r = route[j], d = s - r.s0;
    let k = 1; while (k < 48 && r.lens[k] < d) k++;
    return { j, t: Math.min(1, (k - 1 + (d - r.lens[k - 1]) / Math.max(1e-9, r.lens[k] - r.lens[k - 1])) / 48) };
  };
  const curve = (cs, move) => `${move ? `M${pt(cs[0])}` : ""}C${pt(cs[1])} ${pt(cs[2])} ${pt(cs[3])}`;
  const upTo = ({ j, t }) => route.slice(0, j).map((r, i) => curve(r.w, i === 0)).join("") + curve(split(route[j].w, t)[0], j === 0);

  // back to front: the plate, the three panels (all face the camera, so none hides another), the dim dashed route,
  // the bright travelled route over it, the dots, the pin
  const g = mk("g", {}, svg);
  box(PLATE.hx, PLATE.hy, PLATE.r, 0, Z0).forEach((d, i) => path(g, d, i ? "nf sil" : "sil"));
  [0, 1, 2].forEach((p) => path(g, [[XS[p], -HALF, ZS[p]], [XS[p + 1], -HALF, ZS[p + 1]], [XS[p + 1], HALF, ZS[p + 1]], [XS[p], HALF, ZS[p]]].map(([x, y, z], i) => `${i ? "L" : "M"}${pt([x, y, Z0 + z])}`).join("") + "Z"));
  path(g, route.map((r, i) => curve(r.w, i === 0)).join(""), "nf dash");
  const trail = path(g, "", "nf hi");
  const dots = DOTS.map((q) => { const p = panelOf(q[0]); return { el: path(g, arc(onPanel(p, q), across(p), EY, DOT, 0, 4 * Q, true) + "Z", "dot m"), at: P(...onPanel(p, q)) }; });
  const pin = mk("g", {}, g);

  const s = spring(0, TRAVEL), up = spring(0, SETTLE);
  let act = -1, last = "";
  function draw() {
    const where = locate(s.x), tip = bez(route[where.j].w, where.t), foot = [tip[0], tip[1], tip[2] + up.x], head = [foot[0], foot[1], foot[2] + PIN.needle + PIN.head];
    trail.setAttribute("d", s.x > 1e-3 ? upTo(where) : "");
    pin.replaceChildren();
    path(pin, `M${pt(foot)}L${pt([head[0], head[1], head[2] - PIN.head])}`, "nf sil");
    path(pin, arc(head, S1, S2, PIN.head, 0, 4 * Q, true) + "Z");
  }
  const T = register(stage, (dt) => {
    let moving = stepS(s, dt);
    up.t = Math.abs(s.x - s.t) > 0.05 || Math.abs(s.v) > 0.5 ? LIFT : 0; // up while it travels; a small drop as it lands
    moving = stepS(up, dt) || moving;
    const key = `${s.x.toFixed(4)}|${up.x.toFixed(4)}`;
    if (key !== last) { last = key; draw(); }
    return moving;
  });
  bag.add(T.unregister);

  function choose(k) {
    if (k === act) return;
    act = k;
    dots.forEach((d, i) => d.el.setAttribute("class", i === k ? "dot" : "dot m"));
    if (k >= 0) s.t = STOP[k];
    read.textContent = k < 0 ? "rest" : NAMES[k];
    T.wake();
  }
  // hit areas: the five dots where they lie, which never move
  bag.add(pointer(stage, {
    move: (p) => { let k = -1, best = 10; dots.forEach((d, i) => { const e = Math.hypot(p[0] - d.at[0], p[1] - d.at[1]); if (e < best) { best = e; k = i; } }); choose(k); },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  T.wake();

  return { set: (v) => { LIFT = v; }, destroy: bag.dispose };
}

hairline({
  name: "journey",
  means: "A folded map of a customer journey: point at a stop and the pin travels the route to it, drawing the road behind it.",
  rules: [1, 5, 7, 8],
  range: [0.8, 1.4, 2],
  mount,
});
