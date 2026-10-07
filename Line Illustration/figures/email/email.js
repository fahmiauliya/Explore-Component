/**
 * Email: open pigeonhole shelving on a plinth, four by three, its open front toward the lower right. An
 * envelope stands in every slot, leaning back against the back wall, face out. The envelope under the
 * pointer slides forward out of its slot and leans back to show its face and flap; the envelopes in
 * neighbouring slots come forward a little, less the farther they are: every subscriber gets their own.
 *
 * The pointer is read on the cabinet's front plane against the slots' RESTING grid, so nothing
 * flickers, and followed by a critically damped spring, so moving across the grid glides.
 */
const { Cam, fit, proj, spring, stepS, disposer, mk, pointer, register } = HL;

// The front is the plane x = 0, facing +x; columns run across y (column 1 at the left, the largest y),
// rows down z (row 1 on top). Thin dividers, an equal frame all round, one depth for every slot.
// Shallow slots: depth shows up and to the left, so a deep slot hides what stands at its back behind the
// divider and the shelf above; 5 deep, an envelope leaning on the back wall still shows nearly whole.
const COLS = 4, ROWS = 3, CW = 17, CH = 12, T = 1.2, M = 2.6, D = 5, BACK = 1.2, RC = 2.5, PLINTH = 3;
const W = 2 * M + COLS * CW + (COLS - 1) * T, H = 2 * M + ROWS * CH + (ROWS - 1) * T, Y1 = W / 2, DT = D + BACK, ZB = PLINTH;
// Envelopes: identical cards L tall, leaning LEAN back with their top on the back wall. At most they slide
// SLIDE and lean back LEAN + TIP; the foot slides at least as fast as the top leans, so it never hits the wall.
const LW = 10, LL = 8, LEAN = 18, TIP = 22, FOOT = LL * Math.sin((LEAN * Math.PI) / 180) + 0.1, CALM = { k: 60, c: 15.5 }, Q = Math.PI / 2, LIT = [1, 1];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const C = Cam(45, 0.5, 3.3);
  fit(C, [[-DT - 2, -Y1 - 2, 0], [2, Y1 + 2, 0], [2, -Y1 - 2, 0], [-DT, Y1, ZB + H], [-DT, -Y1, ZB + H], [reach + 4, -Y1, ZB + M]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const poly = (pts) => `M${pts.map((p) => f2(P(...p))).join("L")}Z`, line = (a, b) => `M${f2(P(...a))}L${f2(P(...b))}`;

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
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, from angle f0 to f1 either way. */
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0 = 0, f1 = 4 * Q, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (Math.abs(f1 - f) > 1e-9) {
      const up = f1 > f, i = Math.floor((f + Q) / Q + (up ? 1e-9 : -1e-9)), edge = -Q + Q * (up ? i + 1 : i), stop = up ? Math.min(f1, edge) : Math.max(f1, edge);
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded outline in the plane x = x0 run back to x1: its silhouette, the front outline's half facing away from the
   * depth and the back outline's other half, joined where the outline's tangent runs along the depth. */
  function extrude(rect, r, x0, x1, z) {
    const o = (x) => [x, 0, z], Tv = J([x1 - x0, 0, 0]), fs = Math.atan2(cross(J(EZ), Tv), cross(J(EY), Tv)), mid = fs + Q;
    const rad = J(add(EY.map((v) => Math.cos(mid) * v), EZ, Math.sin(mid))), a = ((rad[0] * Tv[0] + rad[1] * Tv[1] < 0 ? fs : fs + Math.PI) + 8 * Q) % (4 * Q);
    return rr(o(x0), EY, EZ, rect, r, a, a + 2 * Q) + rr(o(x1), EY, EZ, rect, r, a + 2 * Q, a + 4 * Q, false) + "Z";
  }

  const g = mk("g", {}, svg);
  // the plinth the cabinet stands on, then the cabinet's body
  const plinth = extrude([-Y1 - 1, 0, Y1 + 1, PLINTH], 1.2, 1, -DT - 1, 0), face = [-Y1, 0, Y1, H], body = extrude(face, RC, 0, -DT, ZB);
  mk("path", { d: plinth, class: "sil" }, g);
  mk("path", { d: rr([1, 0, 0], EY, EZ, [-Y1 - 1, 0, Y1 + 1, PLINTH], 1.2) + "Z", class: "sil" }, g);
  mk("path", { d: body, class: "fo" }, g);

  // The slots: a box each. Inside show the back wall, the floor and the side wall at the slot's right (the other
  // side and the ceiling face away), filled, with their creases; then the envelope. Depth shows up and to the
  // left, so slots paint from the right column to the left, bottom row up: each covers what earlier slots showed.
  const slot = (c, r) => [Y1 - M - CW - c * (CW + T), ZB + H - M - CH - r * (CH + T)];
  const inner = mk("g", {}, g), letters = [];
  for (let c = COLS - 1; c >= 0; c--) for (let r = ROWS - 1; r >= 0; r--) {
    const [y0, z0] = slot(c, r), y1 = y0 + CW, z1 = z0 + CH, grp = mk("g", {}, inner);
    mk("path", { d: poly([[-D, y0, z0], [-D, y1, z0], [-D, y1, z1], [-D, y0, z1]]) + poly([[0, y0, z0], [0, y1, z0], [-D, y1, z0], [-D, y0, z0]])
      + poly([[0, y0, z0], [-D, y0, z0], [-D, y0, z1], [0, y0, z1]]), class: "fo" }, grp);
    mk("path", { d: line([-D, y1, z0], [-D, y0, z0]) + line([-D, y0, z0], [-D, y0, z1]) + line([0, y0, z0], [-D, y0, z0]), class: "nf lo" }, grp);
    letters.push({ c, r, rest: c === LIT[0] && r === LIT[1], body: mk("path", { class: "sil" }, grp), flap: mk("path", { class: "nf lo" }, grp), last: "" });
  }
  // the front: the frame and the dividers' fronts, filled, the slots open, each divider a thin double line;
  // then the top and the side over whatever of the slots passes the front; then the cabinet's outline
  const holes = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { const [y0, z0] = slot(c, r); holes.push([[0, y0, z0], [0, y0 + CW, z0], [0, y0 + CW, z0 + CH], [0, y0, z0 + CH]]); }
  const front = rr([0, 0, ZB], EY, EZ, face, RC) + "Z";
  mk("path", { d: front + holes.map((h) => poly([...h].reverse())).join(""), class: "fo" }, g);
  mk("path", { d: holes.map(poly).join(""), class: "nf" }, g);
  mk("path", { d: body + rr([0, 0, ZB], EY, EZ, face, RC, 4 * Q, 0) + "Z", class: "fo" }, g);
  mk("path", { d: body + front, class: "nf sil" }, g);
  // what comes out of the slots, in front of everything, lowest row first: a fill, then its edges but not its cut
  const outs = mk("g", {}, g);
  letters.slice().sort((a, b) => b.r - a.r || b.c - a.c).forEach((l) => { const grp = mk("g", {}, outs); l.ofill = mk("path", { class: "fo" }, grp); l.obody = mk("path", { class: "nf sil" }, grp); l.oflap = mk("path", { class: "nf lo" }, grp); });

  /** Envelope l with its foot slid forward by s and leaning back by th: the whole card, and what is out of the slot. */
  function pose(l, s, th) {
    const [y0, z0] = slot(l.c, l.r), foot = [-D + FOOT + s, y0 + CW / 2, z0], up = [-Math.sin(th), 0, Math.cos(th)], pt = (u, v) => add(add(foot, EY, u), up, v);
    const vcut = Math.max(0, Math.min(LL, foot[0] / Math.sin(th))); // where the card crosses the front: below it is out
    const flap = (v1) => [-1, 1].map((sg) => { // the V, kept below v1: from each top corner to a point at the exact centre
      const a = [sg * (LW / 2 - 0.4), LL - 0.4], b = [0, LL * 0.42], t = Math.max(0, Math.min(1, (a[1] - v1) / (a[1] - b[1])));
      return t >= 1 ? "" : line(pt(a[0] + t * (b[0] - a[0]), a[1] - t * (a[1] - b[1])), pt(...b));
    }).join("");
    const card = rr(foot, EY, up, [-LW / 2, 0, LW / 2, LL], 0.6) + "Z", whole = vcut >= LL - 0.6;
    const edges = whole ? card : vcut <= 0.6 ? "" : `M${f2(P(...pt(-LW / 2, vcut)))}` + rr(foot, EY, up, [-LW / 2, 0, LW / 2, vcut + 0.6], 0.6, 2 * Q, 4 * Q, false) + `L${f2(P(...pt(LW / 2, vcut)))}`;
    return { card, flap: flap(LL), shape: whole ? card : edges && edges + "Z", out: edges, oflap: edges ? flap(whole ? LL : vcut) : "" };
  }

  const fc = spring(0, CALM), fr = spring(0, CALM), amount = spring(0, CALM);
  let lit = -2;
  const B = register(stage, (dt) => {
    let moving = false;
    for (const s of [fc, fr, amount]) moving = stepS(s, dt) || moving;
    letters.forEach((l) => {
      const d2 = (l.c - fc.x) ** 2 + ((l.r - fr.x) * 1.2) ** 2, k = amount.x * Math.exp(-d2 / (2 * 0.75 * 0.75));
      const s = reach * k, th = ((LEAN + TIP * k) * Math.PI) / 180, key = `${s.toFixed(3)},${th.toFixed(4)}`;
      if (key === l.last) return;
      const p = pose(l, s, th);
      l.body.setAttribute("d", p.card); l.flap.setAttribute("d", p.flap); l.ofill.setAttribute("d", p.shape); l.obody.setAttribute("d", p.out); l.oflap.setAttribute("d", p.oflap);
      l.last = key;
    });
    const on = amount.x > 0.15 ? letters.findIndex((l) => l.c === Math.round(fc.x) && l.r === Math.round(fr.x)) : letters.findIndex((l) => l.rest);
    if (on !== lit) { lit = on; letters.forEach((l, n) => [l.body, l.flap, l.obody, l.oflap].forEach((el) => el.classList.toggle("hi", n === on))); }
    return moving;
  });
  bag.add(B.unregister);

  // hit test: the pointer on the cabinet's front plane, read against the slots' RESTING grid
  const oy = J(EY), oz = J(EZ), det = oy[0] * oz[1] - oy[1] * oz[0];
  function at([sx, sy]) {
    const dx = sx - O[0], dy = sy - O[1], y = (dx * oz[1] - dy * oz[0]) / det, z = (oy[0] * dy - oy[1] * dx) / det;
    if (Math.abs(y) > Y1 || z < ZB || z > ZB + H) return null;
    const [ya, za] = slot(0, 0);
    return [Math.max(0, Math.min(COLS - 1, (ya + CW / 2 - y) / (CW + T))), Math.max(0, Math.min(ROWS - 1, (za + CH / 2 - z) / (CH + T)))];
  }
  function follow(p) {
    if (!p) return;
    if (amount.x < 0.01) { fc.x = p[0]; fr.x = p[1]; }
    fc.t = p[0]; fr.t = p[1]; amount.t = 1;
    read.textContent = `slot ${Math.round(p[0]) + 1}·${Math.round(p[1]) + 1}`;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => follow(at(p)), leave: () => { amount.t = 0; read.textContent = "rest"; B.wake(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "email",
  means: "A pigeonhole cabinet with a letter in every slot: the one under the pointer slides out, and its neighbours peek out a little.",
  rules: [1, 2, 4, 10],
  // at the farthest slide (7) and lean (40°) the card's top is still just inside its slot
  range: [4, 5.5, 7],
  mount,
});
