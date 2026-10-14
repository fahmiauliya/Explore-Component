/**
 * Cointube: a glass tube on a slim base ring, a slotted cap, level ticks and a goal ring with a tag naming the goal; empty
 * at rest. Hover: coins come in from beyond the right edge, flip twice on an arc, drop upright through the slot and turn
 * flat onto the stack; bright: the coin on its way down (in the slot, its larger part), then the tick it lands at; at the goal
 * only the ring and tag, and the tag swings. Leave:
 * they go back out from the top, reversed, 0.12 s apart. data-goal, data-coins (3-10; same ring height, so thinner coins)
 * and data-mark are read live; a change empties the tube and refills it under the pointer. Coins never change size.
 */
const STROKES = {"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"$":[0.952,"M0.381 -1.19 L0.381 0.19 M0.571 -1.19 L0.571 0.19 M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"p":[0.857,"M0.19 -0.667 L0.19 0.333 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"€":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 M0.048 -0.619 L0.619 -0.619 M0.048 -0.429 L0.571 -0.429"],"£":[0.952,"M0.762 -0.857 L0.714 -0.952 0.619 -1 0.476 -1 0.381 -0.952 0.333 -0.857 0.333 -0.524 0.333 -0.238 0.286 -0.095 0.19 -0.024 0.143 0 0.81 0 M0.143 -0.524 L0.619 -0.524"],"¥":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524 M0.143 -0.429 L0.714 -0.429 M0.143 -0.238 L0.714 -0.238"]};
const { Cam, fit, proj, unproj, disposer, mk, pointer, register, reducedMotion, clamp } = HL;
const Q = Math.PI / 2, TAU = 4 * Q;
// world: the base ring RB round, ZB high; the glass R round from ZB to the cap at Z1; the cap RC round up to ZC. The goal
// ring (RG) is G above the floor at any count, so a coin is G/N thick; Z1 leaves room for the thinnest to turn under the cap
const R = 10, RB = 13, ZB = 2.4, G = 18, ZG = ZB + G, RG = R + 0.45, CR = 7.8, Z1 = ZG + 14.2, RC = R + 1.1, ZC = Z1 + 3;
// s at 450 ms a coin: toss, slot, fall (least, extra), settle; the next sets out LEAD before the last lands; leaving
// runs LR times as fast, LG apart; the tag's swing. Tag: text height, padding, string, corner; tracking; mark radius / CR
const ARC = 0.22, SLOT = 0.15, FALL = [0.08, 0.05], SET = 0.12, LEAD = 0.2, LR = 1.3, LG = 0.12, SWING = 0.3;
const TH = 2.5, TP = 0.8, TS = 1.6, TC = 0.7, TR = 0.1, MR = 0.5, half = (T) => Math.hypot(CR, T / 2), sm = (u) => u * u * (3 - 2 * u);
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
/** A string in single strokes: its polylines in em (x right, y down, baseline 0) and its advance. */
const lay = (s) => { let x = 0; const st = []; for (const ch of s) { GL[ch][1].forEach((p) => st.push(p.map(([gx, gy]) => [x + gx - TR / 2, gy]))); x += GL[ch][0] - TR; } return { st, w: x }; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 4.4), box = [[0, 0, ZC + 2 * half(G / 10) + 0.3]];
  for (let i = 0; i < 16; i++) { const c = Math.cos((i * Q) / 4), s = Math.sin((i * Q) / 4); box.push([RB * c, RB * s, 0], [RC * c, RC * s, ZC]); }
  fit(C, box, 200, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  // U runs across the screen, V toward the viewer: coins turn about U, so every face projects to an upright ellipse
  const FR = Math.atan2(J([0, 1, 0])[0], J([1, 0, 0])[0]), JU = J([Math.cos(FR), Math.sin(FR), 0]), JV = J([-Math.sin(FR), Math.cos(FR), 0]), JZ = J([0, 0, 1]);
  const hx = JU[0], jv = JV[1], jz = JZ[1], sc2 = (a, k) => [a[0] * k, a[1] * k], ad = (p, a, k) => [p[0] + k * a[0], p[1] + k * a[1]];
  const sp = (u, w, z) => ad(ad(ad(O, JU, u), JV, w), JZ, z), f2 = (q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`;
  /** An arc of the ellipse c + a·cos f + b·sin f, as cubics of at most 90°: an affine image of a circle, so exact. */
  function arc(c, a, b, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const pt = (f) => ad(ad(c, a, Math.cos(f)), b, Math.sin(f)), tg = (f) => ad(sc2(b, Math.cos(f)), a, -Math.sin(f));
    let d = (move ? "M" : "L") + f2(pt(f0));
    for (let i = 0, u = f0; i < n; i++, u += h) d += `C${f2(ad(pt(u), tg(u), k))} ${f2(ad(pt(u + h), tg(u + h), -k))} ${f2(pt(u + h))}`;
    return d;
  }
  // a level circle (f = 0 at its right, π/2 nearest the viewer); a polyline traced there and back, so its fill adds nothing
  const ring = (u, w, z, r, f0, f1, move = true) => arc(sp(u, w, z), sc2(JU, r), sc2(JV, r), f0, f1, move);
  const back = (pts) => "M" + pts.concat(pts.slice(0, -1).reverse()).map(f2).join("L"), path = (parent, d, cls) => mk("path", { d, class: cls }, parent);
  /** Half the slot's outline on the cap's top: a rounded rectangle hu by hw, corner r; its far or its near half. */
  const slot = (hu, hw, r, far, a = hu - r, b = hw - r, x = far ? -hu : hu) => `M${f2(sp(x, 0, ZC))}` +
    (far ? [[-a, -b, 2 * Q], [a, -b, 3 * Q]] : [[a, b, 0], [-a, b, Q]]).map(([u, w, f]) => ring(u, w, ZC, r, f, f + Q, false)).join("") + `L${f2(sp(-x, 0, ZC))}`;

  let N = 6, T = 3, HF = 0, Zp = 0, Lt = 0, Ls = 0, d1 = 0, S0 = 0, sc = value / 450, scN = sc, goal = "GOAL", MS = [], fall = [], land = [], END = [];
  /** A coin at (u along U, z), turned th about U: outline, the inner edge of the face it shows, and its mark, one path. */
  function coin(u, z, th) {
    const p = sp(u, 0, z), vis = Math.cos(th) * jv - Math.sin(th) * jz, dz = T * (Math.cos(th) * jz + Math.sin(th) * jv);
    const a = [CR * hx, 0], b = [0, CR * Math.abs(vis)], yv = p[1] + (vis >= 0 ? dz : -dz) / 2, yo = 2 * p[1] - yv, up = yv <= yo;
    return arc([p[0], Math.min(yv, yo)], a, b, 2 * Q, TAU, true) + arc([p[0], Math.max(yv, yo)], a, b, 0, 2 * Q, false) + "Z" +
      arc([p[0], yv], a, b, up ? 0 : 2 * Q, up ? 2 * Q : TAU, true) + marks([p[0], yv], Math.abs(vis), Infinity);
  }
  /** The mark on a face centred at F, squashed to sy, cut off below the screen line yc. */
  function marks(F, sy, yc, d = "") {
    for (const st of MS) {
      let run = [], o = null; const out = () => { if (run.length > 1) d += back(run); run = []; };
      for (const [u, v] of st) {
        const q = [F[0] + u * hx, F[1] + v * sy], qin = q[1] <= yc;
        if (o && o[1] <= yc !== qin) { run.push([o[0] + ((yc - o[1]) / (q[1] - o[1])) * (q[0] - o[0]), yc]); if (!qin) out(); }
        if (qin) run.push(q); o = q;
      }
      out();
    }
    return d;
  }
  /** The part of an upright coin (centre z, on the axis) above the cap's top plane, which cuts its front face at y = yc. */
  function piece(z, yc) {
    const p = sp(0, 0, z), by = -CR * jz, F = [p[0], p[1] + (T * jv) / 2], B = [p[0], F[1] - T * jv], a = [CR * hx, 0], b = [0, by], dl = yc - F[1];
    if (dl <= -by || dl >= by) return dl > 0 ? coin(0, z, Q) : "";
    const al = Math.asin(dl / by), e = (c, f) => f2([c[0] + a[0] * Math.cos(f), c[1] + by * Math.sin(f)]), lo = dl <= 0;
    const d = lo ? `M${e(F, 2 * Q - al)}L${e(B, 2 * Q - al)}` + arc(B, a, b, 2 * Q - al, TAU + al, false) + `L${e(F, al)}Z`
      : arc(F, a, b, 2 * Q - al, 2 * Q, true) + arc(B, a, b, 2 * Q, TAU, false) + arc(F, a, b, 0, al, false) + "Z";
    return d + arc(F, a, b, lo ? 2 * Q - al : 2 * Q, lo ? TAU + al : TAU, true) + marks(F, by / CR, yc);
  }
  /** Coin k at t s along its way in: [u, z, th, layer], layer 0 in the air, 1 in the slot, 2 in the tube. */
  function pose(k, t) {
    const A = ARC * sc, Bs = SLOT * sc, zk = ZB + k * T;
    if (t < A) { // the toss: a cubic in (u, z) from beyond the right edge onto the slot, two flips, then upright
      const p = t / A, q = 1 - p, bz = (v) => q * q * q * v[0] + 3 * q * q * p * v[1] + 3 * q * p * p * v[2] + p * p * p * v[3], r = Math.min(1, p / 0.85);
      return [bz([S0, S0 * 0.5, 0, 0]), bz([Zp - 4, Zp + 16, Zp + 9, Zp]), Q + 2 * TAU * (1 - r) * (1 - r), 0];
    }
    if (t < A + Bs) return [0, Lt - (d1 * (t - A)) / Bs + CR, Q, 1];
    const u = clamp((t - A - Bs) / fall[k], 0, 1), D = Ls - zk, w = Math.min(1, ((d1 / Bs) * fall[k]) / Math.max(D, 1e-6));
    let th = Q * (1 - sm(u)); if (t > land[k]) { const e = Math.min(1, (t - land[k]) / (SET * sc)); th = 0.06 * Math.sin(TAU * e) * (1 - e); }
    return [0, Ls - D * (w * u + (1 - w) * u * u) + CR * Math.abs(Math.sin(th)) + (T / 2) * Math.abs(Math.cos(th)), th, 2];
  }

  // back to front: the base ring; the glass's far lines (the floor's and the goal ring's far halves); the coins in the
  // tube; the glass's near lines, glints, ticks, the goal ring's near half; the tag; the cap and its slot's far half; the
  // part of a coin above the cap; the slot's near half; the coins in the air
  const g = mk("g", {}, svg);
  path(g, ring(0, 0, ZB, RB, 2 * Q, TAU) + ring(0, 0, 0, RB, 0, 2 * Q, false) + "Z", "sil"); path(g, ring(0, 0, ZB, RB, 0, 2 * Q), "nf lo");
  path(g, ring(0, 0, ZB, R, 2 * Q, TAU), "nf lo"); const ringB = path(g, ring(0, 0, ZG, RG, 2 * Q, TAU), "nf lo"), inner = mk("g", {}, g);
  path(g, `M${f2(sp(-R, 0, Z1))}` + ring(0, 0, ZB, R, 2 * Q, 0, false) + `L${f2(sp(R, 0, Z1))}`, "nf sil");
  const glint = (f, z0, z1) => `M${f2(sp(R * Math.cos(f), R * Math.sin(f), z0))}L${f2(sp(R * Math.cos(f), R * Math.sin(f), z1))}`;
  path(g, glint(0.8 * Math.PI, ZG + 3.5, ZG + 9.5) + glint(0.86 * Math.PI, ZG + 4.5, ZG + 7.5), "nf lo");
  const ticks = mk("g", {}, g), ringF = path(g, ring(0, 0, ZG, RG, 0, 2 * Q), "nf sil"), tagB = path(g, "", "sil"), tagL = path(g, "", "nf sil");
  path(g, ring(0, 0, ZC, RC, 2 * Q, TAU) + ring(0, 0, Z1, RC, 0, 2 * Q, false) + "Z", "sil"); path(g, ring(0, 0, ZC, RC, 0, 2 * Q), "nf lo");
  const slotB = path(g, "", "nf sil"), cut = mk("g", {}, g), slotF = path(g, "", "nf sil"), air = mk("g", {}, g);
  const lite = (el, on, lo) => { el.classList.toggle("hi", on); if (lo) el.classList.toggle("lo", !on); }; // hi gives way to lo, so lo goes

  /** The tag, swung by ps about where it hangs on the goal ring's front, on the plane facing +x. */
  function tag(ps) {
    const L = lay(goal), tw = Math.max(L.w * TH, 2.6 * TH) + 2 * TP, th = TH + 2 * TP, H = P(RG, 0, ZG), EU = J([0, -1, 0]), EV = J([0, 0, -1]);
    const Ux = ad(sc2(EU, Math.cos(ps)), EV, Math.sin(ps)), Vx = ad(sc2(EU, -Math.sin(ps)), EV, Math.cos(ps)), at = (u, v) => ad(ad(H, Ux, u), Vx, v);
    const cs = [[tw / 2 - TC, TS + TC, -Q], [tw / 2 - TC, TS + th - TC, 0], [-tw / 2 + TC, TS + th - TC, Q], [-tw / 2 + TC, TS + TC, 2 * Q]];
    tagB.setAttribute("d", cs.map(([u, v, f], i) => arc(at(u, v), sc2(Ux, TC), sc2(Vx, TC), f, f + Q, !i)).join("") + "Z");
    tagL.setAttribute("d", `M${f2(H)}L${f2(at(0, TS))}` + L.st.map((s) => "M" + s.map(([x, y]) => f2(at((x - L.w / 2) * TH, TS + TP + TH + y * TH))).join("L")).join(""));
  }
  /** The stage's three settings, cleaned: the goal's name, the coins to the goal, the mark. */
  function cfg() {
    const a = (n) => stage.getAttribute("data-" + n) ?? "", n = Number(a("coins")), m = a("mark").trim(), m1 = [...m].length === 1 ? m.toUpperCase() : m;
    return { goal: [...a("goal").toUpperCase()].filter((c) => /[A-Z0-9 ]/.test(c)).join("").slice(0, 6).trim() || "GOAL",
      N: a("coins").trim() !== "" && Number.isInteger(n) ? clamp(n, 3, 10) : 6, mark: /^rp$/i.test(m) ? "Rp" : /^[A-Z0-9$€£¥]$/.test(m1) ? m1 : "C" };
  }
  /** Sets the tube out for the settings, only ever while it is empty: coin thickness and timings, mark, ticks, slot, tag. */
  function apply() {
    const c = cfg(); goal = c.goal; N = c.N; T = G / N; HF = half(T); sc = scN; fall = []; land = []; END = [];
    Zp = ZC + HF + 0.3; Lt = Zp - CR; Ls = Z1 - 2 * HF - 0.1; d1 = Lt - Ls; S0 = (404 - sp(0, 0, 0)[0]) / hx + CR;
    for (let k = 0; k < N; k++) { fall[k] = sc * (FALL[0] + (FALL[1] * (Ls - ZB - k * T)) / (Ls - ZB)); land[k] = sc * (ARC + SLOT) + fall[k]; END[k] = land[k] + SET * sc; }
    const L = lay(c.mark), pts = L.st.flat(), bx = [0, 1].map((i) => [Math.min(...pts.map((p) => p[i])), Math.max(...pts.map((p) => p[i]))]);
    const em = (MR * CR) / Math.hypot(...bx.map(([l, h]) => (h - l) / 2));
    MS = L.st.map((s) => s.map((p) => p.map((v, i) => (v - (bx[i][0] + bx[i][1]) / 2) * em)));
    ticks.replaceChildren();
    for (let i = 1; i < N; i++) path(ticks, ring(0, 0, ZB + i * T, R, 0.58 * Math.PI, 0.67 * Math.PI), "nf lo");
    const hw = T / 2 + 0.5; slotB.setAttribute("d", slot(CR + 0.5, hw, Math.min(0.8, hw), true)); slotF.setAttribute("d", slot(CR + 0.5, hw, Math.min(0.8, hw), false));
    coins.forEach((o) => { Object.assign(o, { tau0: 0, t0: 0, dir: 0, last: "" }); o.el.remove(); o.pc.setAttribute("d", ""); });
    tag(0); order = "";
  }

  // each coin runs its own way in on one clock: tau0 at t0, then dir·rate s per s, held between 0 and END
  const coins = Array.from({ length: 10 }, () => ({ el: mk("path", { d: "", class: "sil" }), pc: path(cut, "", "sil"), tau0: 0, t0: 0, dir: 0, rate: 1, last: "" }));
  const tau = (o, now, k) => (reducedMotion() && o.dir ? (o.dir > 0 ? END[k] : 0) : clamp(o.tau0 + (o.dir * o.rate * Math.max(0, now - o.t0)) / 1000, 0, END[k]));
  const go = (o, tau0, t0, dir, rate = 1) => Object.assign(o, { tau0, t0, dir, rate });
  /** Hover: the coins still out set off in turn, each LEAD before the one below lands; moving ones turn back in. */
  function enter(now) {
    for (let k = 0, e = -Infinity; k < N; k++) {
      const o = coins[k], t = tau(o, now, k);
      if (t >= land[k]) { if (o.dir < 0) go(o, END[k], now, 0); e = -Infinity; }
      else if (t > 0) { go(o, t, now, 1); e = now - t * 1000; }
      else { const st = k ? Math.max(now, e + (land[k - 1] - LEAD * sc) * 1000) : now; go(o, 0, st, 1); e = st; }
    }
  }
  /** Leave: from the top, the coins on their way turn back at once and the landed ones follow, LG apart. */
  function leave(now) {
    for (let k = N - 1, e = -Infinity; k >= 0; k--) {
      const o = coins[k], t = tau(o, now, k);
      if (t <= 0) go(o, 0, now, 0);
      else if (t < land[k]) { go(o, t, now, -1, LR); e = now - ((land[k] - t) / LR) * 1000; }
      else { if (!(o.dir < 0 && o.t0 <= now)) go(o, t < END[k] ? t : land[k], Math.max(now, e + LG * sc * 1000), -1, LR); e = o.t0 + ((o.tau0 - land[k]) / LR) * 1000; }
    }
  }

  let inside = false, pending = false, forced = false, seen = null, order = "", swing = -1, full = false, drawnTag = 0;
  const attrs = () => ["goal", "coins", "mark"].map((n) => stage.getAttribute("data-" + n)).join("\n");
  seen = attrs(); apply();
  const B = register(stage, (dt, now) => {
    if (attrs() !== seen) { seen = attrs(); pending = true; } // a change empties the tube first, then sets it out afresh
    if ((pending || scN !== sc) && coins.every((o, k) => k >= N || tau(o, now, k) <= 0)) { apply(); pending = forced = false; if (inside) enter(now); }
    else if (pending && !forced) { forced = true; leave(now); }
    let moving = false, landed = 0; const live = [];
    coins.forEach((o, k) => {
      if (k >= N) return; const t = tau(o, now, k);
      if (o.dir && (now < o.t0 || (o.dir > 0 ? t < END[k] : t > 0))) moving = true;
      if (t >= land[k] && landed === k) landed++;
      if (t <= 0) { if (o.last) { o.el.remove(); o.pc.setAttribute("d", ""); o.last = ""; } return; } // out beyond the edge
      const [u, z, th, ly] = pose(k, t), key = `${u.toFixed(2)} ${z.toFixed(3)} ${th.toFixed(4)}`;
      if (key !== o.last) { o.last = key; o.el.setAttribute("d", coin(u, z, th)); o.pc.setAttribute("d", ly === 1 ? piece(z, sp(0, T / 2, ZC)[1]) : ""); }
      o.top = ly === 1 && t - ARC * sc < (SLOT * sc) / 2; live.push([o, ly ? inner : air, z, k]); // top: mostly still above the cap
    });
    live.sort((a, b) => a[2] - b[2]); // low to high: a higher coin covers the one under it
    const key = live.map(([, p, , k]) => k + (p === air ? "a" : "i")).join(",");
    if (key !== order) { order = key; live.forEach(([o, p]) => p.append(o.el)); }
    const goalNow = inside && landed >= N, s = (now - swing) / (SWING * 1000), cur = (k) => inside && !goalNow && k === landed;
    coins.forEach((o, k) => { lite(o.el, cur(k) && !o.top); lite(o.pc, cur(k) && o.top); }); // bright: one coin, on its way down; the next waits
    if (goalNow && !full && !reducedMotion()) swing = now; full = goalNow;
    [...ticks.children].forEach((el, i) => lite(el, inside && !goalNow && i === landed - 1, true)); lite(ringB, goalNow, true);
    [ringF, tagB, tagL].forEach((el) => lite(el, goalNow));
    const ps = swing >= 0 && s >= 0 && s < 1 ? 0.13 * Math.sin(TAU * s) * (1 - s) : 0;
    if (ps !== drawnTag) { drawnTag = ps; tag(ps); }
    read.textContent = inside ? (goalNow ? "goal" : "saving") : "rest";
    return moving || pending || ps !== 0;
  });
  const mo = new MutationObserver(() => B.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-goal", "data-coins", "data-mark"] });
  bag.add(B.unregister); bag.add(() => mo.disconnect()); bag.add(() => { coins.forEach((o) => o.el.remove()); svg.replaceChildren(); });

  // hit test: the pointer's line of sight against the RESTING base, glass and cap, which never move
  const hit = ([sx, sy]) => Array.from({ length: Math.floor(ZC * 2) + 1 }, (_, i) => i / 2).some((z) => Math.hypot(...unproj(C, sx, sy, z)) <= (z <= ZB ? RB : RC) + 0.5);
  const turn = (h) => { if (h === inside) return; inside = h; if (!pending) (h ? enter : leave)(performance.now()); B.wake(); };
  bag.add(pointer(stage, { move: (p) => turn(hit(p)), leave: () => turn(false) }));
  read.textContent = "rest";
  return { set: (v) => { scN = v / 450; B.wake(); }, destroy: bag.dispose };
}

hairline({ name: "cointube", means: "Hover and coins flip in through the slot one by one until they reach your goal.", rules: [1, 4, 6, 7], range: [600, 450, 360], mount });
