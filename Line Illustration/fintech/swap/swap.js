/**
 * Swap: currency exchange as two short coin stacks on a plate, side by side, the left stack's coins engraved with
 * a small circle and the right stack's with a small square. Two thin curved arrows join them: one arches over the
 * top, left to right; one swings round in front, right to left. Hover the figure and the top coin of each stack
 * travels its arrow to the other stack, flipping once in the air: the stacks have swapped a coin. Leaving sends both
 * on round once more, the same way the arrows point, so each coin is home again and the figure ends as it began.
 *
 * The hit area is the rest pose's box, which never moves. The swap is one number, timed by a tween: from 0 to 1
 * the coins swap, from 1 to 2 they swap back; each swap runs on an s-curve so the flip has time to read. Every
 * curve is a true Bézier, projected control point by control point. The slider is how long one swap takes, in ms.
 */
const { Cam, fit, proj, tween, tset, tval, tdone, EASE_LIFT, disposer, mk, pointer, register } = HL;

// The plate; two stacks of N coins (radius R, thickness T) at y = ±D, the left stack nearer the viewer.
const Q = Math.PI / 2, Z0 = 4, N = 4, T = 2.6, R = 9, D = 20, PL = { x0: -14, x1: 30, y0: -32, y1: 36, r: 11 };
const ZC = Z0 + (N - 1) * T + T / 2, H = 30, LIFT = 3, MARK = { c: 3.1, s: 2.6, r: 0.6 }, GAP = 3.5;
// Each coin travels a cubic between the two top slots: up over the top in the stacks' plane, or round in front of
// it, leaving along the line between the stacks and bowing toward the viewer (BOW is square to that line on
// screen, so the bow sits evenly between the stacks), only just lifted.
const BOW = [0.857, 0.514, 0], A = 10, B = 40;
const OVER = [[0, D, ZC], [0, D, ZC + H], [0, -D, ZC + H], [0, -D, ZC]];
const FRONT = [[0, -D, ZC], [B * BOW[0], A - D + B * BOW[1], ZC + LIFT], [B * BOW[0], D - A + B * BOW[1], ZC + LIFT], [0, D, ZC]];
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const bez = (c, t) => mix(mix(mix(c[0], c[1], t), mix(c[1], c[2], t), t), mix(mix(c[1], c[2], t), mix(c[2], c[3], t), t), t);
/** The part of a cubic from t0 to t1, as a cubic of its own (de Casteljau, twice). */
function part(c, t0, t1) {
  const head = (k, t) => { const a = mix(k[0], k[1], t), b = mix(k[1], k[2], t), e = mix(k[2], k[3], t), f = mix(a, b, t), g = mix(b, e, t); return [k[0], a, f, mix(f, g, t)]; };
  const tail = head(c.slice().reverse(), 1 - t0).reverse();
  return head(tail, (t1 - t0) / (1 - t0));
}
const STATUS = { moving: "exchanging", odd: "done", even: "rest" };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let dur = value;

  const C = Cam(45, 0.5, 3.65), EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
  const air = [0, 0.25, 0.5, 0.75, 1].flatMap((t) => [add(bez(OVER, t), EZ, R), add(bez(FRONT, t), [R, R, R])]);
  fit(C, [[PL.x0, PL.y0, 0], [PL.x1, PL.y1, 0], [PL.x0, PL.y1, 0], [PL.x1, PL.y0, 0], ...air], 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`, pt = (v) => f2(P(...v));
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // the way to the viewer, from the camera itself: a face whose normal points along it is the face we see
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let W = x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1]));
  if (W[2] < 0) W = W.map((x) => -x);

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
  /** A coin at c, face normal n, face axes e1 e2: its silhouette (the far arc of the face we see, the near arc of the
   * other, the two tangents) and, inside, the near arc of the face we see with the mark engraved on that face. */
  function coin(c, n, e1, e2, mark) {
    const s = dot3(n, W) >= 0 ? 1 : -1, cv = add(c, n, (s * T) / 2), ch = add(c, n, (-s * T) / 2);
    const u = J(e1), v = J(e2), p0 = P(...ch), p1 = P(...cv), Dv = [p1[0] - p0[0], p1[1] - p0[1]];
    const base = Math.atan2(-cross(Dv, u), cross(Dv, v));
    const eb = [Math.cos(base) * u[0] + Math.sin(base) * v[0], Math.cos(base) * u[1] + Math.sin(base) * v[1]];
    const [a, b] = dot(eb, Dv) >= 0 ? [base - Q, base + Q] : [base + Q, base + 3 * Q];
    const sil = arc(cv, e1, e2, R, a, b, true) + arc(ch, e1, e2, R, b, a + 4 * Q, false) + "Z";
    let m = "";
    if (mark === "circle") m = arc(cv, e1, e2, MARK.c, 0, 4 * Q, true) + "Z";
    else { const k = MARK.s - MARK.r; [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([i, j], q) => { m += arc(add(add(cv, e1, i * k), e2, j * k), e1, e2, MARK.r, q * Q, (q + 1) * Q, q === 0); }); m += "Z"; }
    return [sil, arc(cv, e1, e2, R, b, a + 4 * Q, true) + m];
  }
  /** A flat coin lying in slot k of the stack at y. */
  const flat = (y, k, mark) => coin([0, y, Z0 + k * T + T / 2], EZ, EX, EY, mark);
  const path = (parent, d, cls) => mk("path", { d, class: cls }, parent);

  // The plate: a rounded slab; its screen extremes sit mid-corner, at FR and FR + π, and FR → FR + π is its near half.
  const FR = Math.atan2(J(EY)[0], J(EX)[0]);
  function rim(z, f0, f1, move) {
    const cs = [[PL.x1 - PL.r, PL.y0 + PL.r], [PL.x1 - PL.r, PL.y1 - PL.r], [PL.x0 + PL.r, PL.y1 - PL.r], [PL.x0 + PL.r, PL.y0 + PL.r]];
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)); d += arc([...cs[((i % 4) + 4) % 4], z], EX, EY, PL.r, f, stop, first); first = false; f = stop; }
    return d;
  }

  // back to front: the plate; the right stack, then the left (nearer); the two arrows; the two top coins, which
  // ride over the arrows. A stack's top coin is a coin that travels; the rest stand still, and the highest of
  // them carries its crease and mark for the moment its top coin is away.
  const g = mk("g", {}, svg);
  path(g, rim(Z0, FR + 2 * Q, FR + 4 * Q, true) + rim(0, FR, FR + 2 * Q, false) + "Z", "sil");
  path(g, rim(Z0, FR, FR + 2 * Q, true), "nf lo");
  [[-D, "square"], [D, "circle"]].forEach(([y, mark]) => {
    for (let k = 0; k < N - 1; k++) { const [sil, inner] = flat(y, k, mark); path(g, sil, "sil"); if (k === N - 2) path(g, inner, "nf lo"); }
  });

  // An arrow runs along its coin's path, from where it clears the start coin to where it clears the end coin, by
  // GAP on screen; a small open head at the end, drawn on screen along the curve's last tangent.
  const EA = Math.hypot(J(EX)[0], J(EY)[0]) * R + GAP, EB = Math.hypot(J(EX)[1], J(EY)[1]) * R + GAP;
  const clear = (q, y) => { // whether the screen point q lies GAP outside the stack at y, at rest
    for (let z = Z0; z <= ZC + T / 2 + 1e-9; z += 0.5) { const c = P(0, y, z); if (Math.hypot((q[0] - c[0]) / EA, (q[1] - c[1]) / EB) < 1) return false; }
    return true;
  };
  const solve = (cp, y) => { let t = 0; while (t < 0.5 && !clear(P(...bez(cp, t)), y)) t += 0.002; return t; };
  function arrow(cp, y0, y1) {
    const t0 = solve(cp, y0), t1 = 1 - solve(cp.slice().reverse(), y1), k = part(cp, t0, t1).map((v) => P(...v));
    const tip = k[3], dx = k[3][0] - k[2][0], dy = k[3][1] - k[2][1], l = Math.hypot(dx, dy), L = 5.5, A = 0.5;
    const arm = (s) => [tip[0] - (L * (dx * Math.cos(A) - s * dy * Math.sin(A))) / l, tip[1] - (L * (dy * Math.cos(A) + s * dx * Math.sin(A))) / l];
    return path(g, `M${f2(k[0])}C${f2(k[1])} ${f2(k[2])} ${f2(k[3])}M${f2(arm(1))}L${f2(tip)}L${f2(arm(-1))}`, "nf");
  }
  const arrows = [arrow(OVER, D, -D), arrow(FRONT, -D, D)];

  // The two travelling coins: a (circle) starts on the left, b (square) on the right.
  const tops = ["circle", "square"].map((mark) => { const grp = mk("g", {}, g); return { grp, mark, sil: path(grp, "", "sil"), inner: path(grp, "", "nf lo"), c: [0, 0, 0] }; });
  /** A coin t of the way along a path: it flips half a turn about x, tipping the way it travels, in mid-flight. */
  function pose(cn, cp, t) {
    const c = bez(cp, t), th = Math.PI * sm((t - 0.2) / 0.6) * (cp === OVER ? 1 : -1), s = Math.sin(th), co = Math.cos(th);
    const [sil, inner] = coin(c, [0, -s, co], EX, [0, co, s], cn.mark);
    cn.sil.setAttribute("d", sil); cn.inner.setAttribute("d", inner); cn.c = c;
  }
  let order = "";
  function draw(p) {
    const q = ((p % 2) + 2) % 2, [a, b] = tops;
    // the tween's ease-out is quick off the mark; an s-curve over each swap gives the lift and the flip time to read
    if (q <= 1) { pose(a, OVER, sm(q)); pose(b, FRONT, sm(q)); } else { pose(a, FRONT, sm(q - 1)); pose(b, OVER, sm(q - 1)); }
    // the farther coin first, so a nearer one always covers it
    const ord = tops.slice().sort((m, n) => m.c[0] + m.c[1] - (n.c[0] + n.c[1])), key = ord.map((cn) => cn.mark).join();
    if (key !== order) { order = key; ord.forEach((cn) => g.append(cn.grp)); }
  }

  // The tween is the clock: its eased value is read back to the time it stands for, so each swap runs on the
  // s-curve in draw(), lift, flip and landing evenly spaced, instead of being over in the first third.
  let u = tween(0, dur), drawn = 0, shown = "";
  const clock = (e) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; EASE_LIFT(m) < e ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
  function show(state) {
    if (state === shown) return;
    shown = state;
    const on = state === "moving";
    arrows.forEach((el) => el.setAttribute("class", on ? "nf hi" : "nf"));
    tops.forEach((cn) => { cn.sil.setAttribute("class", on ? "sil hi" : "sil"); cn.inner.setAttribute("class", on ? "nf hi" : "nf lo"); });
    read.textContent = STATUS[state];
  }
  const B = register(stage, (_dt, now) => {
    const done = tdone(u, now), p = done ? u.to : u.from + (u.to - u.from) * clock((tval(u, now) - u.from) / (u.to - u.from || 1));
    if (p !== drawn) { drawn = p; draw(p); }
    if (!done) { show("moving"); return true; }
    const n = Math.round(p);
    show(n % 2 ? "odd" : "even");
    if (n !== n % 2) { u = tween(n % 2, dur); drawn = aim = n % 2; } // the same pose, one round on
    return false;
  });
  bag.add(B.unregister);

  // hit test: the box of the whole figure at rest, which never moves; inside, the swap runs forward to the next
  // odd step (swapped), outside to the next even one (home), always the way the arrows point
  const box = [[PL.x0, PL.y0, 0], [PL.x1, PL.y1, 0], [PL.x0, PL.y1, 0], [PL.x1, PL.y0, 0], [PL.x1, PL.y1, Z0], ...[0, 0.25, 0.5, 0.75, 1].flatMap((t) => [bez(OVER, t), bez(FRONT, t)])].map((v) => P(...v));
  const bx = [Math.min(...box.map((q) => q[0])) - 6, Math.max(...box.map((q) => q[0])) + 6], by = [Math.min(...box.map((q) => q[1])) - 14, Math.max(...box.map((q) => q[1])) + 6];
  const hit = ([x, y]) => x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1];
  let inside = false, aim = 0;
  function go() {
    const now = performance.now(), cur = drawn, to = inside ? 2 * Math.ceil((cur - 1) / 2 - 1e-9) + 1 : 2 * Math.ceil(cur / 2 - 1e-9);
    if (to === aim && !tdone(u, now)) return;
    aim = to;
    if (Math.abs(to - cur) < 1e-9) return;
    u = tween(cur, dur * Math.max(0.4, to - cur)); tset(u, to, now, 0);
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => { const h = hit(p); if (h !== inside) { inside = h; go(); } },
    leave: () => { if (inside) { inside = false; go(); } },
  }));
  bag.add(() => svg.replaceChildren());
  draw(0); show("even");

  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "swap",
  means: "Two coin stacks swap their top coins: hover and each coin flips across to the other stack.",
  rules: [1, 6, 8, 9],
  range: [900, 1200, 1500],
  mount,
});
