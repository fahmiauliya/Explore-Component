/**
 * Snowball: a snowy slope on a small plate, with four small markers along its near side and one snowball at the top.
 * Hover a marker: the snowball rolls down to it, growing by the same factor at every marker it passes (the slider),
 * so each year's growth is bigger than the last: compound returns. Hover another marker and it rolls on, or back and
 * shrinks; on leave it rolls back up to rest.
 *
 * Hit areas are the four markers where they lie, which never move: the pointer is read along their fixed row, never
 * against the ball. The ball's place on the slope follows one critically damped spring; its size and its turning
 * seam follow from that place. Every curve is a true Bézier of a world arc, projected control point by control point.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, Z0 = 3, R0 = 2.8, MAXG = 1.4, N = 4;
// the slope: a wedge on the plate, high at the back left (x0), low at the front right (x1)
const SL = { x0: -30, y0: -12, x1: 30, y1: 17, r: 4, hi: 22, lo: 4 }, M = (SL.hi - SL.lo) / (SL.x1 - SL.x0);
const PL = { x0: -34, y0: -16, x1: 37, y1: 24, r: 7 };
const XR = -25, STEP = 10, YM = 13, DOT = 1.4; // the ball's contact at rest; one year's run; the markers' row
const TRAVEL = { k: 40, c: 2 * Math.sqrt(40) };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let G = value;

  const zt = (x) => Z0 + SL.hi - M * (x - SL.x0), nrm = [M, 0, 1].map((v) => v / Math.hypot(M, 1));
  const C = Cam(45, 0.5, 3.4);
  const P0 = proj(C), O0 = P0(0, 0, 0), J = (v) => { const q = P0(...v); return [q[0] - O0[0], q[1] - O0[1]]; };
  const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  let w = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))); if (w[2] < 0) w = w.map((x) => -x);
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), TH = Math.atan2(w[0], w[2]), S1 = unit(x3(w, EZ)), S2 = x3(w, S1);
  // the ball at s years: where it touches the slope, its radius, its centre
  const ballAt = (s, g) => { const x = XR + s * STEP, R = R0 * g ** s; return { R, c: [x, 0, zt(x)].map((v, i) => v + R * nrm[i]) }; };
  const big = ballAt(N, MAXG), far = ballAt(0, 1);
  const rim = (b) => [-1, 1].flatMap((a) => [S1, S2].map((e) => b.c.map((v, i) => v + a * b.R * e[i])));
  fit(C, [[PL.x0, PL.y0, 0], [PL.x1, PL.y1, 0], [PL.x0, PL.y1, 0], [PL.x1, PL.y0, 0], [SL.x0, SL.y0, zt(SL.x0)], ...rim(big), ...rim(far)], 200, 166);
  const P = proj(C), f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v));

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
  /** Part of a rounded rectangle's outline between angles f0 and f1 (0 faces +x), lying on the plane z = z(x), of slope m along x. */
  function rrun(b, z, m, f0, f1, move) {
    const cs = [[b.x1 - b.r, b.y0 + b.r], [b.x1 - b.r, b.y1 - b.r], [b.x0 + b.r, b.y1 - b.r], [b.x0 + b.r, b.y0 + b.r]], e1 = [1, 0, -m];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)), q = cs[((i % 4) + 4) % 4];
      d += arc([q[0], q[1], z(q[0])], e1, EY, b.r, f, stop, first); first = false; f = stop; }
    return d;
  }
  /** A solid with straight sides from z0 up to its top plane: its outline (back of the top, front of the foot) and the front of its top. */
  const box = (b, top, m, z0) => [rrun(b, top, m, FR + 2 * Q, FR + 4 * Q, true) + rrun(b, () => z0, 0, FR, FR + 2 * Q, false) + "Z", rrun(b, top, m, FR, FR + 2 * Q, true)];
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // back to front: the plate, the slope, the markers on it, the ball (markers and ball never overlap on screen)
  const g = mk("g", {}, svg);
  box(PL, () => Z0, 0, 0).forEach((d, i) => path(g, d, i ? "nf sil" : "sil"));
  const [slope, edge] = box(SL, zt, M, Z0);
  path(g, slope, "sil"); path(g, edge, "nf lo");
  const across = unit([1, 0, -M]);
  const marks = [1, 2, 3, 4].map((k) => { const x = XR + k * STEP, c = [x, YM, zt(x)];
    return { el: path(g, arc(c, across, EY, DOT, 0, 4 * Q, true) + "Z", "dot m"), at: P(...c) }; });
  // the ball: its fill, the seam on it, then its one outline over the seam's ends
  const body = path(g, "", "fo"), seam = path(g, "", "nf lo"), ball = path(g, "", "nf sil hi");

  const s = spring(0, TRAVEL);
  let last = "";
  function draw() {
    const key = `${s.x.toFixed(4)}|${G}`;
    if (key === last) return;
    last = key;
    const { R, c } = ballAt(s.x, G);
    // the seam: a great circle through the axle (y), its near half only. It turns forward as the ball rolls, 60° over the
    // whole run from nearly edge-on, so it opens only as the ball grows and never runs close beside the outline
    const th = TH - 0.17 + s.x * (1.05 / N), d = [Math.sin(th), 0, Math.cos(th)], f = Math.atan2(dot3(EY, w), dot3(d, w));
    const o = arc(c, S1, S2, R, 0, 4 * Q, true) + "Z";
    body.setAttribute("d", o); ball.setAttribute("d", o);
    seam.setAttribute("d", arc(c, d, EY, R, f - Q, f + Q, true));
  }
  const T = register(stage, (dt) => { const moving = stepS(s, dt); draw(); return moving; });
  bag.add(T.unregister);

  let act = -2;
  function choose(k) {
    if (k === act) return;
    act = k;
    marks.forEach((m, i) => m.el.setAttribute("class", i === k ? "dot" : "dot m"));
    ball.classList.toggle("hi", k < 0);
    s.t = k + 1;
    read.textContent = k < 0 ? "rest" : `year ${k + 1}`;
    T.wake();
  }
  // hit test: the pointer read along the markers' fixed row (on screen), as the nearest marker, within a band
  const a0 = marks[0].at, a3 = marks[N - 1].at, ax = [(a3[0] - a0[0]) / (N - 1), (a3[1] - a0[1]) / (N - 1)], L2 = ax[0] ** 2 + ax[1] ** 2;
  function hit([x, y]) {
    const qx = x - a0[0], qy = y - a0[1], t = (qx * ax[0] + qy * ax[1]) / L2, off = Math.abs(qx * ax[1] - qy * ax[0]) / Math.sqrt(L2);
    return off > 14 || t < -0.5 || t > N - 0.5 ? -1 : Math.round(t);
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { G = v; T.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "snowball",
  means: "A snowball rolls down the slope and grows at every marker, like compound returns.",
  rules: [1, 3, 5, 8],
  range: [1.25, 1.33, 1.4],
  mount,
});
