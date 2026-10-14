/**
 * Calendar: a tear-off desk calendar on a small plate. A low stand, one block for the stack of pages, a clip bar along
 * its top edge, and on the front page a 7 × 4 grid of dim dots with one day circled and checked: this month is paid.
 * Hover the calendar: the front page lifts from the clip, curls up and back over the top and slips down behind the
 * block, and the next month's page shows its own paid day, stamped in at another place in the grid. While the pointer
 * stays, a page goes every 1.2 s through four months and round again; on leave the calendar keeps the page it is on.
 *
 * The page bends as a true cylinder, so its sides are circular arcs and its corners quarter circles, each a cubic
 * Bézier projected control point by control point. Its curl never spans the edge-on angle, so the sheet never folds
 * over itself in projection; it is painted in front of the block while it is in front of it or above the clip, and
 * behind the block once it is wholly behind it. The hit area is the calendar's rest outline, which never moves.
 */
const { Cam, fit, proj, hull, spring, stepS, disposer, mk, pointer, register } = HL;

const Z0 = 3, Q = Math.PI / 2, XF = 3, T = 6, W = 34, ZB = Z0 + 3, ZT = 30, ZTOP = ZT + 3, PL = { x: 14, y: W / 2 + 7, r: 6 };
const HP = ZT - ZB - 0.5, RC = 1.5, FL = 8, LC = 14, DOT = 0.6, RING = 1.9, GX = 4.2, ROWS = [7, 11, 15, 19];
const DAY = [[4, 1], [1, 2], [5, 3], [2, 0]]; // each month's paid day: column, row
const XB = XF - T - 0.3, H0 = [XF, 0, ZT], HC1 = [XF + 4, 0, ZT + 8], HC2 = [XB - 8, 0, ZT + 8], HB = [XB - 0.8, 0, 20];
const TOP = (300 * Math.PI) / 180; // the page's last angle: still turned away, so it never shows edge-on again
const TICK = [[-0.45, 0.02], [-0.12, -0.32], [0.46, 0.36]], GAP = 1200, MONTHS = 4;
const LIFT = { k: 144, c: 24 }, OVER = { k: 100, c: 20 }, POP = { k: 120, c: 2 * Math.sqrt(120) };
const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1], EH = [0, -1, 0]; // EH: the page's own "right", up-right on screen

/** A sum of scaled vectors: v([k, a], [m, b]) is k·a + m·b. */
const v = (...ts) => [0, 1, 2].map((i) => ts.reduce((s, [k, u]) => s + k * u[i], 0));
const bez = (a, b, c, d, t) => { const u = 1 - t; return v([u * u * u, a], [3 * u * u * t, b], [3 * u * t * t, c], [t * t * t, d]); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let curl = value;

  const C = Cam(45, 0.5, 4.45), J0 = proj(C), J = (u) => { const q = J0(...u), o = J0(0, 0, 0); return [q[0] - o[0], q[1] - o[1]]; };
  const x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let w = x3([EX, EY, EZ].map((e) => J(e)[0]), [EX, EY, EZ].map((e) => J(e)[1])); if (w[2] < 0) w = w.map((x) => -x);
  const PHE = Math.PI - Math.atan2(w[0], w[2]); // the lift at which the page is seen edge-on

  /** The page's pose: lifted on its hinge to edge-on, then rolled up and back over the top and down behind the block. */
  function pose(L, F, c) {
    if (F <= 0) { const q = Math.min(1, L / 0.97), phi = PHE * q; return { h: H0, phi, al: c * (PHE - phi) * Math.min(1, 3 * q), s: 1 }; }
    const phi = PHE + (TOP - PHE) * Math.pow(Math.min(1, F / 0.75), 1.3), G = Math.min(1, Math.max(0, (F - 0.12) / 0.55));
    return { h: bez(H0, HC1, HC2, HB, G), phi, al: c * Math.max(0, PHE + Math.PI - phi) * Math.min(1, 4 * F), s: 1 - 0.65 * Math.min(1, 3 * F) };
  }
  /** The bent sheet: flat from the hinge, then a cylinder, then flat; `at(t)` is the point and tangent t down its middle. */
  function shape({ h, phi, al, s }) {
    const d = [Math.sin(phi), 0, -Math.cos(phi)], n = [Math.cos(phi), 0, Math.sin(phi)], a = Math.max(al, 1e-3);
    const F = s * FL, L = s * LC, R = L / a, Cc = v([1, h], [F, d], [R, n]);
    const E = v([1, Cc], [-R * Math.cos(a), n], [R * Math.sin(a), d]), dE = v([Math.cos(a), d], [Math.sin(a), n]);
    const at = (t) => (t <= F ? [v([1, h], [t, d]), d] : t <= F + L
      ? [v([1, Cc], [-R * Math.cos((t - F) / R), n], [R * Math.sin((t - F) / R), d]), v([Math.cos((t - F) / R), d], [Math.sin((t - F) / R), n])]
      : [v([1, E], [t - F - L, dE]), dE]);
    return { h, d, n, a, s, R, Cc, E, dE, at };
  }
  const reach = [];
  for (const c of [0.45, 0.9]) for (let k = 0; k <= 60; k++) {
    const p = shape(k <= 30 ? pose(k / 30, 0, c) : pose(1, (k - 30) / 30, c));
    for (let t = 0; t <= 12; t++) { const q = p.at((t / 12) * p.s * HP)[0]; reach.push(v([1, q], [W / 2, EY]), v([1, q], [-W / 2, EY])); }
  }
  fit(C, [[-PL.x, -PL.y, 0], [PL.x, PL.y, 0], [-PL.x, PL.y, 0], [PL.x, -PL.y, 0], ...reach], 200, 160);
  const P = proj(C), pt = (u) => P(...u).map((x) => x.toFixed(2)).join(","), FR = Math.atan2(J(EY)[0], J(EX)[0]);

  // every curve is a cubic Bézier of a world arc (≤ 90° each, k = 4/3·tan(Δ/4)·r); the camera is affine, so it is exact
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
  /** A rounded box standing from z0 to z1 on the footprint [x0, x1] × [y0, y1]: its silhouette and its top's front edge. */
  function box(x0, y0, x1, y1, r, z0, z1) {
    const cs = [[x1 - r, y0 + r], [x1 - r, y1 - r], [x0 + r, y1 - r], [x0 + r, y0 + r]];
    const run = (z, f0, f1, move) => { let d = "", f = f0, first = move;
      while (f < f1 - 1e-9) { const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1)), q = cs[((i % 4) + 4) % 4];
        d += arc([q[0], q[1], z], EX, EY, r, f, stop, first); first = false; f = stop; }
      return d; };
    return [run(z1, FR + 2 * Q, FR + 4 * Q, true) + run(z0, FR, FR + 2 * Q, false) + "Z", run(z1, FR, FR + 2 * Q, true)];
  }
  /** One page's marks at scale k: the dim dots, and the paid day's ring and tick, each in the sheet's local plane. */
  function marks(sh, day, k) {
    let dots = "", paid = "";
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
      const [p, t] = sh.at(ROWS[r] * sh.s), o = v([1, p], [(c - 3) * GX * sh.s, EH]), up = v([-1, t]);
      if (c !== day[0] || r !== day[1]) { dots += arc(o, EH, up, DOT * sh.s, 0, 4 * Q, true) + "Z"; continue; }
      const rr = RING * sh.s * k, q = (m) => pt(v([1, o], [rr * m[0], EH], [rr * m[1], up])), [a, b, e] = TICK;
      const to = (m, l) => { const f = l / Math.hypot(m[0] - b[0], m[1] - b[1]); return [b[0] + (m[0] - b[0]) * f, b[1] + (m[1] - b[1]) * f]; };
      if (rr > 0.05) paid = arc(o, EH, up, rr, 0, 4 * Q, true) + `ZM${q(a)}L${q(to(a, 0.12))}Q${q(b)} ${q(to(e, 0.12))}L${q(e)}`;
    }
    return [dots, paid];
  }
  /** The sheet's outline: top edge at the hinge, sides of line, arc and line, four quarter-circle corners. */
  function outline({ h, d, n, a, s, R, Cc, E, dE }) {
    const wh = (s * W) / 2, rc = s * RC, nd = v([-1, d]), nn = v([-1, n]);
    const B = v([1, E], [s * (HP - FL - LC) - rc, dE]);
    return arc(v([1, h], [rc, d], [wh - rc, EH]), EH, nd, rc, Q, 0, true) + arc(v([1, Cc], [wh, EH]), nn, d, R, 0, a, false)
      + arc(v([1, B], [wh - rc, EH]), EH, dE, rc, 0, Q, false) + arc(v([1, B], [rc - wh, EH]), EH, dE, rc, Q, 2 * Q, false)
      + arc(v([1, Cc], [-wh, EH]), nn, d, R, a, 0, false) + arc(v([1, h], [rc, d], [rc - wh, EH]), EH, nd, rc, 2 * Q, Q, false) + "Z";
  }
  const path = (parent, d, cls = "sil") => mk("path", { d, class: cls }, parent);

  // back to front: plate, [the page once behind], stand, block, the front page's marks, clip bar, [the page in front]
  const g = mk("g", {}, svg);
  const [ps, pc] = box(-PL.x, -PL.y, PL.x, PL.y, PL.r, 0, Z0);
  path(g, ps); const plateTop = path(g, pc, "nf sil");
  const [bs, bc] = box(XF - T - 3, -W / 2 - 2.5, XF + 3, W / 2 + 2.5, 2.5, Z0, ZB);
  path(g, bs); path(g, bc, "nf sil");
  path(g, box(XF - T, -W / 2, XF, W / 2, 1.5, ZB, ZT)[0]);
  const faceDots = path(g, "", "dot off"), facePaid = path(g, "", "nf hi");
  const [ks, kc] = box(XF - T, -W / 2 - 1.2, XF, W / 2 + 1.2, 1.5, ZT, ZTOP);
  path(g, ks); path(g, kc, "nf sil");
  const pg = mk("g", {}, g), page = path(pg, ""), pageDots = path(pg, "", "dot off"), pagePaid = path(pg, "", "nf hi");
  const flat = shape({ h: H0, phi: 0, al: 0, s: 1 });

  const lift = spring(0, LIFT), over = spring(1, OVER), ck = spring(1, POP);
  let cur = 0, torn = 0, tearing = false, hover = false, next = null, last = -Infinity, drawn = "", behind = false;
  function draw() {
    const key = `${lift.x.toFixed(4)}|${over.x.toFixed(4)}|${ck.x.toFixed(4)}|${curl}|${cur}`;
    if (key === drawn) return;
    drawn = key;
    const [fd, fp] = marks(flat, DAY[cur], ck.x);
    faceDots.setAttribute("d", fd); facePaid.setAttribute("d", fp);
    if (!tearing || over.x > 0.985) { page.setAttribute("d", ""); pageDots.setAttribute("d", ""); pagePaid.setAttribute("d", ""); return; }
    const sh = shape(pose(lift.x, over.t ? over.x : 0, curl)), front = over.t === 0;
    page.setAttribute("d", outline(sh));
    const [pd, pp] = front ? marks(sh, DAY[torn], 1) : ["", ""]; // the marks only while the page faces us
    pageDots.setAttribute("d", pd); pagePaid.setAttribute("d", pp);
    // wholly behind the block's back plane: paint it behind the block; otherwise it is in front of it or above the clip
    let back = true;
    for (let t = 0; t <= 12 && back; t++) back = sh.at((t / 12) * sh.s * HP)[0][0] < XB;
    if (back !== behind) { behind = back; if (back) plateTop.after(pg); else g.append(pg); }
  }
  /** Tears the front page off: the next month is on the front, its paid day still to be stamped. */
  function tear(now) {
    tearing = true; torn = cur; cur = (cur + 1) % MONTHS; last = now;
    Object.assign(lift, { x: 0, v: 0, t: 1 }); Object.assign(over, { x: 0, v: 0, t: 0 }); Object.assign(ck, { x: 0, v: 0, t: 0 });
    if (behind) { behind = false; g.append(pg); }
    read.textContent = `month ${cur + 1}`;
  }

  const B = register(stage, (dt, now) => {
    if (hover) {
      if (next === null) next = Math.max(now, last + GAP);
      if (now >= next) { tear(now); next += GAP; if (next < now) next = now + GAP; }
    }
    if (tearing && lift.x >= 0.97 && over.t === 0) { over.t = 1; ck.t = 1; } // edge-on: it goes over, the new day is stamped
    let moving = stepS(lift, dt);
    moving = stepS(over, dt) || moving;
    moving = stepS(ck, dt) || moving;
    draw();
    return hover || moving;
  });
  bag.add(B.unregister);

  // the hit area: the calendar's outline at rest, stand to clip. It never moves, so the hover cannot flicker
  const rim = [];
  for (const x of [XF - T - 3, XF + 3]) for (const y of [-W / 2 - 2.5, W / 2 + 2.5]) rim.push(P(x, y, Z0), P(x, y, ZB));
  for (const x of [XF - T, XF]) for (const y of [-W / 2 - 1.2, W / 2 + 1.2]) rim.push(P(x, y, ZTOP));
  const area = hull(rim);
  const inside = ([x, y]) => {
    let sgn = 0;
    for (let i = 0; i < area.length; i++) {
      const a = area[i], b = area[(i + 1) % area.length], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
      if (c !== 0) { if (sgn && Math.sign(c) !== sgn) return false; sgn = Math.sign(c); }
    }
    return true;
  };
  function hoverTo(on) {
    if (on === hover) return;
    hover = on; next = null;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => hoverTo(inside(p)), leave: () => hoverTo(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "month 1";
  B.wake();

  return { set: (val) => { curl = val; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "calendar",
  means: "A tear-off calendar: hover it and the next month appears, already marked paid.",
  rules: [1, 5, 7, 8],
  range: [0.45, 0.7, 0.9],
  mount,
});
