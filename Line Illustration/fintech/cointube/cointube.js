/**
 * Cointube: one squat glass tube standing on a small plate, closed by a cap with a coin slot cut in its top, and one
 * thin goal ring round the glass just under the cap. The tube is empty at rest. Each time the pointer comes onto the
 * tube, one coin comes down on its edge through the slot, tips flat inside the glass and lands on the stack; the
 * fourth brings the stack up to the goal ring, which brightens. The next entry empties the tube from the top: one coin
 * after another, 80ms apart, tips up on its edge, rises out through the slot and fades away above the cap.
 *
 * The hit area is the tube's resting cylinder, which never moves. Coins are identical discs that never change size:
 * each is one filled path, a cylinder of fixed radius and thickness, moved and turned along one track (flat in the
 * glass, tipping about its lowest point, upright through the slot). The part of a coin above the slot's front edge is
 * painted over the cap and fades out upward; the rest is painted under the cap, which hides it. Every curve is a true
 * Bézier. Leaving coins share one acceleration from rest, so each one gains on the next and none ever meets another.
 * The slider is how long a drop takes, in ms.
 */
const { Cam, fit, proj, unproj, tween, tset, tval, tdone, disposer, mk, pointer, register, fade, reducedMotion } = HL;

// The plate; the tube (radius R) from the plate to the cap; coins (radius CR, thickness T) stacked on the plate. The goal
// ring is level with the top of the fourth coin, a little under the cap. The cap's top stands just high enough that a coin
// tipping on the third one never reaches it, so it can only pass the top upright, through the slot.
const Z0 = 2.2, PLATE = 8, PR = 3, R = 4.3, CR = 2.9, T = 1.3, DROPS = 4, Q = Math.PI / 2;
const GOAL = Z0 + DROPS * T, TOP = GOAL + 2, QA = GOAL - T, HALF = Math.hypot(CR, T / 2), CAPT = QA + 2 * HALF + 0.05;
const CAP = { r: 4.9, h: CAPT - TOP }, SLOT = { l: 2 * CR + 0.5, w: 1.4 }, POOL = 9;
// The track a coin runs, by position q: flat while q ≤ QA (q is its foot), tipping about its lowest point over W, then upright
// with its lowest point at QA + (q - QB). QOUT is far enough above the cap that the coin has faded out.
const W = 1.5, QB = QA + W, FADE = CR + 1, QOUT = QB + CAPT + FADE - QA, ACC = 600, STEP = 80;
const NAMES = ["rest", "saving 1", "saving 2", "saving 3", "goal"];
const tilt = (q) => (q <= QA ? 0 : q >= QB ? Q : (Q * (1 - Math.cos((Math.PI * (q - QA)) / W))) / 2);
const low = (q) => (q <= QA ? q : q >= QB ? QA + q - QB : QA);
const high = (q) => low(q) + 2 * (CR * Math.sin(tilt(q)) + (T / 2) * Math.cos(tilt(q)));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let dur = value;

  const C = Cam(45, 0.5, 12.2);
  fit(C, [[-PLATE, -PLATE, 0], [PLATE, PLATE, 0], [-PLATE, PLATE, 0], [PLATE, -PLATE, 0], [0, 0, CAPT + 1]], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v)), EX = [1, 0, 0], EY = [0, 1, 0];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];

  // A world arc as cubics of at most 90°, handles k = 4/3·tan(Δ/4)·r: the camera is affine, so it projects exactly.
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
  // The screen's left and right extremes of a horizontal circle sit at FR and FR + π; its front half runs between.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]), front = (c, r, move = true) => arc(c, EX, EY, r, FR, FR + 2 * Q, move);
  const U = [Math.cos(FR), Math.sin(FR), 0], V = [-Math.sin(FR), Math.cos(FR), 0]; // U runs across the screen, V toward the viewer
  /** A cylinder from the circle (c0, r0) to (c1, r1), both in the plane of e1, e2: [its outline, the near arc of c1]. */
  function cyl(c0, r0, c1, r1, e1 = EX, e2 = EY) {
    const u = J(e1), v = J(e2), K = cross(u, v), p0 = P(...c0), p1 = P(...c1), Dv = [p1[0] - p0[0], p1[1] - p0[1]];
    const A = cross(Dv, v), Bv = -cross(Dv, u), base = Math.atan2(Bv, A), s = Math.acos(Math.max(-1, Math.min(1, (-(r1 - r0) * K) / (Math.hypot(A, Bv) || 1e-9))));
    const on1 = (f) => { const t = [-Math.sin(f) * u[0] + Math.cos(f) * v[0], -Math.sin(f) * u[1] + Math.cos(f) * v[1]], e = [Math.cos(f) * u[0] + Math.sin(f) * v[0], Math.cos(f) * u[1] + Math.sin(f) * v[1]];
      let n = [t[1], -t[0]]; if (dot(n, e) < 0) n = [-n[0], -n[1]]; const h = (c, r) => dot(n, c) + r * Math.hypot(dot(n, u), dot(n, v)); return h(p1, r1) >= h(p0, r0); };
    const [a, b] = on1(base) ? [base - s, base + s] : [base + s, base - s + 2 * Math.PI];
    return [arc(c1, e1, e2, r1, a, b, true) + arc(c0, e1, e2, r0, b, a + 2 * Math.PI, false) + "Z", arc(c1, e1, e2, r1, b, a + 2 * Math.PI, true)];
  }
  /** A rounded rectangle at height z, x0..x1 by y0..y1 with corner r: its silhouette and the front edge of its top. */
  function slab(x0, y0, x1, y1, r, za, zb) {
    const cs = [[x1 - r, y0 + r], [x1 - r, y1 - r], [x0 + r, y1 - r], [x0 + r, y0 + r]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(zb, FR + 2 * Q, FR + 4 * Q, true) + run(za, FR, FR + 2 * Q, false) + "Z", run(zb, FR, FR + 2 * Q, true)];
  }
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // Coins cross the slot's front edge, a line straight across the screen: what is above it is painted over the cap and
  // fades out upward over FADE; what is below it is painted under the cap.
  const sr = SLOT.w / 2, sl = SLOT.l / 2 - sr, yCut = P(V[0] * sr, V[1] * sr, CAPT)[1], yTop = P(0, 0, CAPT + FADE)[1];
  // back to front: plate; the glass body; the coins under the cut; the glass's near edges and the goal ring, a line round
  // the front of the glass under the cap; the cap; the slot's far half; the coins above the cut; the slot's near half
  const g = mk("g", {}, svg), [ps, pc] = slab(-PLATE, -PLATE, PLATE, PLATE, PR, 0, Z0);
  path(g, ps, "sil"); path(g, pc, "nf lo");
  path(g, cyl([0, 0, Z0], R, [0, 0, TOP], R)[0], "fo");
  const layer = mk("g", { mask: fade(svg, yCut + 0.5, yCut, 1) }, g);
  path(g, `M${pt(at3([0, 0, TOP], EX, EY, R, FR))}L${pt(at3([0, 0, Z0], EX, EY, R, FR))}` + front([0, 0, Z0], R, false) + `L${pt(at3([0, 0, TOP], EX, EY, R, FR + 2 * Q))}`, "nf sil");
  const goal = path(g, front([0, 0, GOAL], R), "nf sil");
  path(g, cyl([0, 0, TOP], CAP.r, [0, 0, CAPT], CAP.r)[0], "sil"); path(g, front([0, 0, CAPT], CAP.r), "nf lo");
  const ends = (s) => [[U[0] * sl * s, U[1] * sl * s, CAPT], U, V, sr]; // the slot's two round ends, s = 1 right, -1 left
  path(g, arc(...ends(-1), 2 * Q, 3 * Q, true) + arc(...ends(1), -Q, 0, false), "nf sil");
  const above = mk("g", { mask: fade(svg, yCut - 0.5, yCut, 1) }, mk("g", { mask: fade(svg, yCut, yTop, 1) }, g));
  path(g, arc(...ends(1), 0, Q, true) + arc(...ends(-1), Q, 2 * Q, false), "nf sil");

  /** A coin at track position q: its outline and the near edge of the face it shows, one filled path, always the same size. */
  function coin(q) {
    const a = tilt(q), s = Math.sin(a), c = Math.cos(a), z = low(q) + CR * s + (T / 2) * c, n = [V[0] * s, V[1] * s, c];
    const e2 = [V[0] * c, V[1] * c, -s], f = (k) => [n[0] * k, n[1] * k, z + n[2] * k], [o, cr] = cyl(f(-T / 2), CR, f(T / 2), CR, U, e2);
    return o + cr;
  }
  // a pool of coins: free (out of sight above the cap), stacked (in stack, on a drop tween to its place on the track),
  // or gone (leaving from the top: from q0 at time go, q = q0 + ACC·t²/2, all on one clock, STEP ms apart)
  const coins = [];
  for (let i = 0; i < POOL; i++) coins.push({ el: path(layer, "", "sil"), up: path(above, "", "sil"), q: QOUT, state: "free", last: "" });
  let stack = [], fresh = null, clear = 0; // clear: when the last leaving coin is out of sight
  const take = () => { const c = coins.find((x) => x.state === "free"); c.state = "stack"; layer.append(c.el); return c; };
  const draw = (c, q) => { const key = c.state === "free" ? "" : q.toFixed(3); if (key === c.last) return; c.last = key;
    const d = key && coin(q); c.el.setAttribute("d", d); c.up.setAttribute("d", d && high(q) > CAPT - 0.1 ? d : ""); };

  const B = register(stage, (dt, now) => {
    let moving = false, floor = -1;
    for (const c of stack) { // a falling coin never passes into the one under it
      const p = tval(c.tw, now); // squared, the drop starts from rest above the slot and still lands on the ease
      c.q = Math.max(QOUT + (c.to - QOUT) * p * p, floor < 0 ? 0 : floor <= QA ? floor : QB + floor - QA);
      floor = high(c.q); draw(c, c.q);
      if (!tdone(c.tw, now)) moving = true;
    }
    for (const c of coins) if (c.state === "gone") {
      const t = Math.max(0, now - c.go) / 1000;
      c.q = reducedMotion() ? QOUT : Math.min(QOUT, c.q0 + (ACC * t * t) / 2);
      if (c.q >= QOUT) c.state = "free"; else moving = true;
      draw(c, c.q);
    }
    return moving;
  });
  bag.add(B.unregister);

  /** One entry: one more coin drops through the slot; after the goal, the coins leave from the top, one by one. */
  function advance() {
    const now = performance.now();
    fresh = null;
    if (stack.length < DROPS) {
      const c = take(), k = stack.length;
      c.to = Z0 + k * T; c.tw = tween(0, dur); tset(c.tw, 1, now, Math.max(0, clear - now));
      stack.push(c); fresh = c;
    } else {
      stack.reverse().forEach((c, i) => { c.state = "gone"; c.q0 = c.q; c.go = now + i * STEP; });
      clear = now + (DROPS - 1) * STEP + 1000 * Math.sqrt((2 * (QOUT - Z0)) / ACC);
      stack = [];
    }
    coins.forEach((c) => { c.el.classList.toggle("hi", c === fresh); c.up.classList.toggle("hi", c === fresh); });
    goal.classList.toggle("hi", stack.length === DROPS);
    read.textContent = NAMES[stack.length];
    B.wake();
  }
  /** The pointer is off the tube: everything gives up its bright stroke. */
  function calm() { fresh = null; goal.classList.remove("hi"); coins.forEach((c) => { c.el.classList.remove("hi"); c.up.classList.remove("hi"); }); }

  // hit test: the pointer's line of sight against the tube's RESTING cylinder, plate to cap, which never moves
  function hit([sx, sy]) {
    for (let z = Z0; z <= CAPT; z += 0.5) { const [x, y] = unproj(C, sx, sy, z); if (Math.hypot(x, y) <= CAP.r + 1) return true; }
    return false;
  }
  let inside = false;
  bag.add(pointer(stage, {
    move: (p) => { const h = hit(p); if (h && !inside) advance(); if (!h && inside) calm(); inside = h; },
    leave: () => { if (inside) calm(); inside = false; },
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = NAMES[0];

  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "cointube",
  means: "Coins drop through the slot into one tube, one per visit, until the stack reaches the goal ring.",
  rules: [1, 4, 6, 8],
  range: [600, 800, 1000],
  mount,
});
