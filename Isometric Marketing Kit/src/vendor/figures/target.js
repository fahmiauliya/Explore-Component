/**
 * Target: a spotlight on the audience. A rounded plate holds fourteen pawns in four loose clusters;
 * a stage spotlight on a stand at the back corner throws a cone of light onto the plate. Hover a
 * cluster and the lamp swivels, the pool slides over it, and its pawns lift and brighten; nearby
 * pawns stir with a falloff. On leave the light returns to the centre and the pawns settle.
 *
 * Hit areas are the clusters' RESTING positions, so the hover never flickers. The pool and the
 * effect follow critically damped springs, so moving between clusters is one continuous slide.
 */
const { Cam, fit, proj, unproj, spring, stepS, disposer, mk, pointer, register } = HL;

const PLATE = { hx: 58, hy: 46, r: 12, h: 5 }, Z0 = PLATE.h, CALM = { k: 60, c: 15.5 }, Q = Math.PI / 2;
// Clusters: centres and pawn offsets, laid out as a staggered front and back row as the camera sees
// them, so no pawn stands right behind another; every two pawns are at least 9 apart (bases are 6 across).
const CLUSTERS = [[[-26, 24], [[-2.1, 7.8], [6.4, -0.7], [-4.2, -2.8], [4.9, -10.6]]], [[24, 28], [[-2.1, 6.4], [6.4, -2.1], [-3.5, -3.5]]], [[32, -16], [[-2.8, 8.5], [5.7, 0.0], [-4.9, -2.1], [3.5, -10.6]]], [[-4, -22], [[-2.1, 6.4], [6.4, -2.1], [-2.8, -4.2]]]];
const LAMP = [-46, -34], HEIGHT = 28, POOL = 15, HIT = 16;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 2);
  fit(C, [[-PLATE.hx, -PLATE.hy, 0], [PLATE.hx, PLATE.hy, 0], [-PLATE.hx, PLATE.hy, 0], [PLATE.hx, -PLATE.hy, 0], [...LAMP, Z0 + HEIGHT + 6]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  // the way to the viewer, from the camera itself
  let w = x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]));
  w = unit(w[2] < 0 ? w.map((x) => -x) : w);

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
  const ring = (c, e1, e2, r) => arc(c, e1, e2, r, 0, 2 * Math.PI, true) + "Z";
  /** The outline of the solid between two parallel circles (c0, r0) and (c1, r1) with axes e1 e2: an arc of
   * each and two tangents. Their ellipses are homothetic, so the tangents touch both at one angle. */
  function solid(c0, r0, c1, r1, e1, e2) {
    const U = J(e1), V = J(e2), K = cross(U, V), p0 = P(...c0), p1 = P(...c1), D = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(D, V), B = -cross(D, U), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const R2 = (f) => [Math.cos(f) * U[0] + Math.sin(f) * V[0], Math.cos(f) * U[1] + Math.sin(f) * V[1]];
    const on1 = (f) => { const t = [-Math.sin(f) * U[0] + Math.cos(f) * V[0], -Math.sin(f) * U[1] + Math.cos(f) * V[1]]; let n = [t[1], -t[0]];
      if (dot(n, R2(f)) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, U), dot(n, V)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 2 * Math.PI;
    return arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  /** A rounded rectangle on the ground at height z, from angle f0 to f1 (corner i spans [−90° + 90°i, 90°i]). */
  function rrect(hx, hy, r, z, f0, f1, move) {
    const cs = [[hx - r, -hy + r], [hx - r, hy - r], [-hx + r, hy - r], [-hx + r, -hy + r]];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  const FR = Math.atan2(J(EY)[0], J(EX)[0]); // the plate's screen extremes sit mid-corner, at FR and FR + π

  const g = mk("g", {}, svg);
  mk("path", { d: rrect(PLATE.hx, PLATE.hy, PLATE.r, Z0, FR + Math.PI, FR + 2 * Math.PI, true) + rrect(PLATE.hx, PLATE.hy, PLATE.r, 0, FR, FR + Math.PI, false) + "Z", class: "sil" }, g);
  mk("path", { d: rrect(PLATE.hx - 1.6, PLATE.hy - 1.6, PLATE.r - 1.6, Z0, FR, FR + Math.PI, true), class: "nf lo" }, g);

  // the light: a cone from the lens to a pool on the plate, tinted with the palette's faintest colour, under everything else
  const beam = mk("path", { class: "dot off" }, g), edges = mk("path", { class: "nf" }, g);
  // the spotlight: a base, a stand, and a drum that swivels on top of it
  const foot = [...LAMP, Z0], pivot = [...LAMP, Z0 + HEIGHT];
  mk("path", { d: solid(foot, 6, add(foot, EZ, 1.6), 6, EX, EY), class: "sil" }, g);
  mk("path", { d: solid(add(foot, EZ, 1.6), 1.4, add(pivot, EZ, -2), 1.4, EX, EY), class: "sil" }, g);
  const drum = mk("path", { class: "sil" }, g), lens = mk("path", { class: "sil hi" }, g);

  // the pawns: a base, a tapered body, a round head; back to front, never moving sideways
  const e1w = unit(x3(w, EZ)), e2w = x3(w, e1w); // a sphere's outline is a circle square to the view
  const pawns = CLUSTERS.flatMap(([[cx, cy], offs], k) => offs.map(([u, v]) => ({ k, at: [cx + u, cy + v], up: 0, last: NaN })))
    .sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  pawns.forEach((p) => { const grp = mk("g", {}, g); p.parts = [0, 1, 2].map(() => mk("path", { class: "lo" }, grp)); });
  function drawPawn(p) {
    const z = Z0 + p.up, c = (h) => [...p.at, z + h];
    p.parts[0].setAttribute("d", solid(c(0), 3, c(1.2), 3, EX, EY));
    p.parts[1].setAttribute("d", solid(c(1.2), 1.7, c(7), 1, EX, EY));
    p.parts[2].setAttribute("d", ring(c(8.7), e1w, e2w, 2.1));
  }

  const T = [spring(0, CALM), spring(0, CALM)], amount = spring(0, CALM);
  function drawLight() {
    const tc = [T[0].x, T[1].x, Z0], d = unit(add(tc, pivot, -1)), a1 = unit(x3(d, EZ)), a2 = x3(a1, d);
    drum.setAttribute("d", solid(add(pivot, d, -4), 4.6, add(pivot, d, 5), 4.6, a1, a2));
    const apex = add(pivot, d, 5);
    lens.setAttribute("d", ring(apex, a1, a2, 3.6));
    // the cone: the two tangents from the lens to the pool, and the pool's far arc
    const U = J(EX), V = J(EY), pc = P(...tc), a = P(...apex), det = cross(U, V);
    const q = [cross([a[0] - pc[0], a[1] - pc[1]], V) / det / POOL, cross(U, [a[0] - pc[0], a[1] - pc[1]]) / det / POOL];
    const th = Math.atan2(q[1], q[0]), al = Math.acos(Math.min(1, 1 / Math.hypot(...q))), E = (f) => f2(P(...at3(tc, EX, EY, POOL, f)));
    beam.setAttribute("d", `M${f2(a)}` + arc(tc, EX, EY, POOL, th + al, th + 2 * Math.PI - al, false) + "Z");
    edges.setAttribute("d", `M${E(th + al)}L${f2(a)}L${E(th - al)}` + ring(tc, EX, EY, POOL));
  }

  let lit = "";
  const B = register(stage, (dt) => {
    let moving = false;
    for (const s of [...T, amount]) moving = stepS(s, dt) || moving;
    drawLight();
    const on = [];
    pawns.forEach((p, n) => {
      const d = Math.hypot(p.at[0] - T[0].x, p.at[1] - T[1].x);
      p.up = lift * amount.x * Math.exp(-(d * d) / (2 * 20 * 20)); // the lit cluster most, nearby pawns a little
      if (Math.abs(p.up - p.last) > 1e-3) { drawPawn(p); p.last = p.up; }
      if (amount.x > 0.5 && d < POOL) on.push(n);
    });
    // brightness follows the light, not the pointer; strokes fade between
    const key = on.join();
    if (key !== lit) { lit = key; pawns.forEach((p, n) => p.parts.forEach((el) => { el.classList.toggle("hi", on.includes(n)); el.classList.toggle("lo", !on.includes(n)); })); }
    return moving;
  });
  bag.add(B.unregister);
  pawns.forEach(drawPawn);

  // hit test: the pointer at pawn-body height, nearest RESTING cluster centre within HIT
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, Z0 + 4);
    let best = -1, bd = HIT;
    CLUSTERS.forEach(([[cx, cy]], k) => { const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = k; } });
    return best;
  }
  function choose(k) {
    const [x, y] = k < 0 ? [0, 0] : CLUSTERS[k][0];
    T[0].t = x; T[1].t = y; amount.t = k < 0 ? 0 : 1;
    lens.classList.toggle("hi", k < 0); // at rest the lens is bright: where the light comes from
    read.textContent = k < 0 ? "rest" : `segment ${k + 1}`;
    B.wake();
  }

  // between clusters the light stays where it is, so gliding from one to the next is one slide; leaving resets it
  bag.add(pointer(stage, { move: (p) => { const k = hit(p); if (k >= 0) choose(k); }, leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set: (v) => { lift = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "target",
  means: "A spotlight on the audience: hover a cluster of pawns and the light swings onto it; its pawns lift and brighten.",
  rules: [1, 4, 5, 8],
  range: [2, 4, 7],
  mount,
});
