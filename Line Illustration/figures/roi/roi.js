/**
 * ROI: four identical glasses on a tray, fed by one pipe from a small source tank at the back, each
 * through its own valve. The liquid is the budget. Hover a glass and its valve opens and it fills,
 * while the tank and the other three give a little: the total stays the same, it only moves to the
 * channel you pick.
 *
 * Hit areas are the glasses' RESTING centres along the row, so nothing flickers. Levels and valve
 * levers follow critically damped springs, so moving between glasses glides and leaving settles.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

const Z0 = 5, CALM = { k: 60, c: 15.5 }, Q = Math.PI / 2;
// The row runs along −y: from the front left up to the back right. 32 apart, the glasses never overlap
// on screen, and the pipe 16 behind them shows in the clear gap to the left of each glass: each valve
// (its body and its turning lever) fits in that gap. The highest a glass fills (20 + 13) stays under its rim.
const N = 4, SP = 32, R = 8, RIM = 0.7, H = 38, REST = [12, 20, 9, 15];
const PIPE = 16, PR = 1.8, SR = 1.3, VR = 2.6, VH = 7, LEVER = 3;
// The source tank at the back end: wider and shorter than a glass, closed by a lid with a knob, and set
// far enough back that it never touches the last glass on screen.
const TANK = { y: -(N - 1) * SP - 36, r: 11, h: 20, rest: 13 };
const MARGIN = 6, TRAY = { x0: -PIPE - VR - MARGIN, x1: R + MARGIN, y0: TANK.y - TANK.r - MARGIN, y1: R + MARGIN, r: 10 };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let shift = value;

  const C = Cam(45, 0.5, 2.05);
  fit(C, [[TRAY.x0, TRAY.y0, 0], [TRAY.x1, TRAY.y1, 0], [TRAY.x0, TRAY.y1, 0], [TRAY.x1, TRAY.y0, 0], [0, 0, Z0 + H], [0, TANK.y, Z0 + H]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];

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
  const ring = (c, e1, e2, r) => arc(c, e1, e2, r, 0, 4 * Q, true) + "Z";
  /** A cylinder's outline between parallel circles (c0, r0), (c1, r1) on axes e1 e2: an arc of each and
   * the two tangent lines, which touch both at one angle since the ellipses are homothetic. */
  function hull2(c0, r0, c1, r1, e1, e2) {
    const u = J(e1), v = J(e2), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), D = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(D, v), B = -cross(D, u), base = Math.atan2(B, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, B) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const a = on1(base) ? base - s : base + s, b = on1(base) ? base + s : base - s + 2 * Math.PI;
    return arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 2 * Math.PI, false) + "Z";
  }
  // The tray: a rounded block like every other base; its screen extremes sit mid-corner, at FR and FR + π.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  function rrect(t, z, f0, f1, move, inset = 0) {
    const r = t.r - inset, cs = [[t.x1 - t.r, t.y0 + t.r], [t.x1 - t.r, t.y1 - t.r], [t.x0 + t.r, t.y1 - t.r], [t.x0 + t.r, t.y0 + t.r]];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A see-through vessel: its body, the liquid inside (tinted, sides unstroked so they never double the
   * walls) with its flat surface, then its own edges: rims, two straight walls, the front of its foot. */
  function vessel(parent, c, r, h, rims) {
    const top = add(c, EZ, h), grp = mk("g", {}, parent), side = `M${f2(P(...at3(top, EX, EY, r, FR)))}L${f2(P(...at3(c, EX, EY, r, FR)))}`;
    mk("path", { d: hull2(c, r, top, r, EX, EY), class: "fo" }, grp);
    const liquid = mk("path", { class: "dot off" }, grp), level = mk("path", { class: "nf" }, grp);
    const edge = mk("path", { d: rims.map((k) => ring(top, EX, EY, r - k)).join("") + side + arc(c, EX, EY, r, FR, FR + 2 * Q, false) + `L${f2(P(...at3(top, EX, EY, r, FR + 2 * Q)))}`, class: "nf sil" }, grp);
    const draw = (z) => { const surf = add(c, EZ, Math.max(0.5, z)), ri = r - RIM; liquid.setAttribute("d", hull2(c, ri, surf, ri, EX, EY)); level.setAttribute("d", ring(surf, EX, EY, ri)); };
    return { c, level, edge, draw };
  }

  const g = mk("g", {}, svg);
  mk("path", { d: rrect(TRAY, Z0, FR + 2 * Q, FR + 4 * Q, true) + rrect(TRAY, 0, FR, FR + 2 * Q, false) + "Z", class: "sil" }, g);
  mk("path", { d: rrect(TRAY, Z0, FR, FR + 2 * Q, true, 1.6), class: "nf lo" }, g);

  // back to front: the pipe lying on the tray behind the row, from the first valve back to a rounded elbow,
  // then into the tank's back; the tank; the valves with their stubs into each glass; the glasses, back first
  const ys = REST.map((_, i) => -i * SP), pz = Z0 + PR, corner = [-PIPE, TANK.y, pz];
  mk("path", { d: hull2([-PIPE, ys[0], pz], PR, corner, PR, EY, EZ), class: "sil" }, g);
  mk("path", { d: hull2(corner, PR, [-TANK.r + 1, TANK.y, pz], PR, EX, EZ), class: "sil" }, g);
  // the elbow: a ball joint. A sphere's outline is a circle square to the view, the view being the one
  // direction the camera flattens to a point
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (v) => v.map((x) => x / Math.hypot(...v));
  const view = unit(x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]))), b1 = unit(x3(view, EZ)), b2 = x3(view, b1);
  mk("path", { d: ring(corner, b1, b2, PR * 1.25), class: "sil" }, g);
  const tank = vessel(g, [0, TANK.y, Z0], TANK.r, TANK.h, [0]), lid = add([0, TANK.y, Z0], EZ, TANK.h);
  mk("path", { d: ring(lid, EX, EY, TANK.r), class: "sil" }, tank.edge.parentNode); // the lid closes the top
  mk("path", { d: hull2(lid, 2.2, add(lid, EZ, 2.4), 2.2, EX, EY) + ring(add(lid, EZ, 2.4), EX, EY, 2.2), class: "sil" }, tank.edge.parentNode);
  const valves = ys.map((y) => {
    const foot = [-PIPE, y, Z0], top = add(foot, EZ, VH);
    mk("path", { d: hull2([-PIPE + VR - 0.4, y, pz], SR, [-R + 0.6, y, pz], SR, EX, EZ), class: "sil" }, g);
    mk("path", { d: hull2(foot, VR, top, VR, EX, EY), class: "sil" }, g);
    mk("path", { d: ring(top, EX, EY, VR), class: "sil" }, g);
    return { top, lever: mk("path", { class: "sil" }, g), turn: spring(0, CALM), last: NaN };
  });
  /** A valve's lever: a rounded bar on its top, along the pipe (shut) or turned along the stub (open). */
  function drawLever(v) {
    const ang = v.turn.x * Q, a = [-Math.sin(ang), Math.cos(ang), 0], b = [-Math.cos(ang), -Math.sin(ang), 0], hw = 0.85, s = LEVER - hw;
    v.lever.setAttribute("d", arc(add(v.top, a, s), a, b, hw, -Q, Q, true) + arc(add(v.top, a, -s), a, b, hw, Q, 3 * Q, false) + "Z");
  }
  const glasses = ys.map((y, i) => ({ ...vessel(g, [0, y, Z0], R, H, [0, RIM]), vol: spring(REST[i], CALM), last: NaN }));
  // the glasses paint back to front: the one furthest back (smallest y) first
  glasses.slice().reverse().forEach((gl) => g.append(gl.edge.parentNode));
  const tankVol = spring(TANK.rest, CALM);

  let act = -2;
  const B = register(stage, (dt) => {
    let moving = stepS(tankVol, dt);
    glasses.forEach((gl, i) => {
      moving = stepS(gl.vol, dt) || moving; moving = stepS(valves[i].turn, dt) || moving;
      if (gl.vol.x !== gl.last) { gl.draw(gl.vol.x); gl.last = gl.vol.x; }
      if (valves[i].turn.x !== valves[i].last) { drawLever(valves[i]); valves[i].last = valves[i].turn.x; }
    });
    if (tankVol.x !== tank.last) { tank.draw(tankVol.x); tank.last = tankVol.x; }
    return moving;
  });
  bag.add(B.unregister);

  // hit test: nearest RESTING glass centre along the row (left to right on screen), within the figure's height
  const centres = glasses.map((gl) => P(...add(gl.c, EZ, H / 2))[0]), top = P(0, ys[N - 1], Z0 + H)[1] - 6, bottom = P(TRAY.x1, TRAY.y1, 0)[1] + 6;
  const hit = ([x, y]) => (y < top || y > bottom ? -1 : centres.reduce((best, c, i) => (Math.abs(x - c) < Math.abs(x - centres[best]) ? i : best), 0));
  /** Opens valve k: its glass rises by shift; the tank gives half of that volume and the other three glasses
   * the other half, so the total stays exactly the same. */
  function choose(k) {
    if (k === act) return;
    act = k;
    const gi = (R - RIM) ** 2, ti = (TANK.r - RIM) ** 2;
    glasses.forEach((gl, i) => {
      gl.vol.t = REST[i] + (k < 0 ? 0 : i === k ? shift : -shift / (2 * (N - 1)));
      valves[i].turn.t = i === k ? 1 : 0;
      gl.edge.classList.toggle("hi", i === k); gl.level.classList.toggle("hi", k < 0 ? i === 1 : i === k);
    });
    tankVol.t = TANK.rest - (k < 0 ? 0 : (shift / 2) * (gi / ti));
    read.textContent = k < 0 ? "rest" : `channel ${k + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return { set: (v) => { shift = v; const k = act; act = -2; choose(k); }, destroy: bag.dispose };
}

hairline({
  name: "roi",
  means: "Four glasses share one budget: hover a glass and its valve opens and it fills, while the others drain a little.",
  rules: [1, 4, 5, 8],
  range: [6, 10, 13],
  mount,
});
