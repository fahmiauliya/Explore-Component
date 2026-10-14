/**
 * Receipt: a compact POS thermal printer on a low plate, its front (+x) the right-facing plane: a box rounded in plan,
 * the lid's seam across its top, the paper slot behind the front edge, a button on the lid, a rocker low on the front
 * and a logo (the stage's data-logo, unit-square path data; the Compo C by default; data-show-logo="false" hides it) small in the left side's back top corner. A blank stub of
 * thermal paper stands out of the slot. Hover the printer and it prints: the paper feeds up a row at a time, each row
 * coming out printed (three items, a total under a double rule, a dashed line, the name letter by letter), and jumps at
 * the cut; leave and it slides back. Name (data-name, default THANK YOU) and total (data-total) are read live, in
 * Hershey single strokes on the paper's surface: one ruled surface, flat up its lean, its top curling back on a circle.
 * Grey at rest; hovered, only the row printing is bright, and the name once it is out. Every curve is a true Bézier (the camera is affine).
 */
const STROKES = {"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"a":[0.952,"M0.714 -0.667 L0.714 0 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"b":[0.857,"M0.19 -1 L0.19 0 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"c":[0.857,"M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"d":[0.952,"M0.714 -1 L0.714 0 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"e":[0.857,"M0.143 -0.381 L0.714 -0.381 0.714 -0.476 0.667 -0.571 0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"f":[0.667,"M0.476 -1 L0.381 -1 0.286 -0.952 0.238 -0.81 0.238 0 M0.095 -0.667 L0.429 -0.667"],"g":[0.952,"M0.714 -0.667 L0.714 0.095 0.667 0.238 0.619 0.286 0.524 0.333 0.381 0.333 0.286 0.286 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"h":[0.952,"M0.19 -1 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0"],"i":[0.381,"M0.143 -1 L0.19 -0.952 0.238 -1 0.19 -1.048 0.143 -1 M0.19 -0.667 L0.19 0"],"j":[0.476,"M0.238 -1 L0.286 -0.952 0.333 -1 0.286 -1.048 0.238 -1 M0.286 -0.667 L0.286 0.143 0.238 0.286 0.143 0.333 0.048 0.333"],"k":[0.762,"M0.19 -1 L0.19 0 M0.667 -0.667 L0.19 -0.19 M0.381 -0.381 L0.714 0"],"l":[0.381,"M0.19 -1 L0.19 0"],"m":[1.429,"M0.19 -0.667 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0 M0.714 -0.476 L0.857 -0.619 0.952 -0.667 1.095 -0.667 1.19 -0.619 1.238 -0.476 1.238 0"],"n":[0.952,"M0.19 -0.667 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0"],"o":[0.952,"M0.381 -0.667 L0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143 0.762 -0.286 0.762 -0.381 0.714 -0.524 0.619 -0.619 0.524 -0.667 0.381 -0.667"],"p":[0.857,"M0.19 -0.667 L0.19 0.333 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"q":[0.952,"M0.714 -0.667 L0.714 0.333 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"r":[0.571,"M0.19 -0.667 L0.19 0 M0.19 -0.381 L0.238 -0.524 0.333 -0.619 0.429 -0.667 0.571 -0.667"],"s":[0.857,"M0.667 -0.524 L0.619 -0.619 0.476 -0.667 0.333 -0.667 0.19 -0.619 0.143 -0.524 0.19 -0.429 0.286 -0.381 0.524 -0.333 0.619 -0.286 0.667 -0.19 0.667 -0.143 0.619 -0.048 0.476 0 0.333 0 0.19 -0.048 0.143 -0.143"],"t":[0.667,"M0.238 -1 L0.238 -0.19 0.286 -0.048 0.381 0 0.476 0 M0.095 -0.667 L0.429 -0.667"],"u":[0.952,"M0.19 -0.667 L0.19 -0.19 0.238 -0.048 0.333 0 0.476 0 0.571 -0.048 0.714 -0.19 M0.714 -0.667 L0.714 0"],"v":[0.762,"M0.095 -0.667 L0.381 0 M0.667 -0.667 L0.381 0"],"w":[1.048,"M0.143 -0.667 L0.333 0 M0.524 -0.667 L0.333 0 M0.524 -0.667 L0.714 0 M0.905 -0.667 L0.714 0"],"x":[0.857,"M0.143 -0.667 L0.667 0 M0.667 -0.667 L0.143 0"],"y":[0.762,"M0.095 -0.667 L0.381 0 M0.667 -0.667 L0.381 0 0.286 0.19 0.19 0.286 0.095 0.333 0.048 0.333"],"z":[0.857,"M0.667 -0.667 L0.143 0 M0.143 -0.667 L0.667 -0.667 M0.143 0 L0.667 0"],"$":[0.952,"M0.381 -1.19 L0.381 0.19 M0.571 -1.19 L0.571 0.19 M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],".":[0.381,"M0.19 -0.238 L0.143 -0.19 0.19 -0.143 0.238 -0.19 0.19 -0.238"],",":[0.381,"M0.238 -0.19 L0.19 -0.143 0.143 -0.19 0.19 -0.238 0.238 -0.19 0.238 -0.095 0.143 0"],"-":[1.238,"M0.19 -0.429 L1.048 -0.429"],"!":[0.476,"M0.238 -1 L0.238 -0.333 M0.238 -0.095 L0.19 -0.048 0.238 0 0.286 -0.048 0.238 -0.095"],"&":[1.238,"M1.095 -0.571 L1.095 -0.619 1.048 -0.667 1 -0.667 0.952 -0.619 0.905 -0.524 0.81 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.333 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.286 0.19 -0.381 0.238 -0.429 0.571 -0.619 0.619 -0.667 0.667 -0.762 0.667 -0.857 0.619 -0.952 0.524 -1 0.429 -0.952 0.381 -0.857 0.381 -0.762 0.429 -0.619 0.524 -0.476 0.762 -0.143 0.857 -0.048 0.952 0 1.048 0 1.095 -0.048 1.095 -0.095"]};
const { Cam, fit, proj, hull, seg, tween, tset, tval, tdone, clamp, disposer, mk, pointer, register } = HL;
const Q = Math.PI / 2, DEG = Math.PI / 180;
// plate PL half wide, PH high; the body 2·BX deep (front at x = BX), 2·BY wide, BH high, corners BR
const PL = 16, PR = 4, PH = 3, BX = 11.5, BY = 12, BR = 3.5, BH = 16, ZT = PH + BH;
// the seam at x = XS; the slot at x = XC, 2·SW by 2·SL; the button 2·BB at (XB, YB), BT tall; the rocker 2·RW by 2·RH at
// (RU, RV) on the front; the logo's box, LS square on the left side (y = BY), from where its flat part starts and LI below the top, the same gap on screen as to the corner's silhouette
const XS = 4.2, XC = BX - 2.7, SW = 0.8, SL = 8.3, XB = -5.5, YB = -8.9, BB = 1.4, BT = 0.8, RU = 7.6, RV = PH + 3.8, RW = 1.2, RH = 1.7, LS = 1.9, LI = (BR * (Math.SQRT2 - 1) * Math.SQRT1_2) / Math.sqrt(0.75);
// the paper: HW either side of y = 0, leaning back LEAN, corners RC; its top LC (half its length at most) curls back
// by BEND once LF is out; print shows VIS above the slot's lip, M in from the sides
const HW = 7.5, LEAN = 10 * DEG, RC = 0.6, LC = 3.4, BEND = 75 * DEG, LF = 14, VIS = 0.25, M = 1, IW = 2 * (HW - M);
// the type: cap height H, tracking TR in glyph units, lines 1.75 H apart. The rows, as distances from the paper's top:
// the items [t, left bar, right bar], the double rule, the total, the dashed line, the name's first baseline
const H = 1.2, TR = 0.1, LH = 1.75 * H, ITEMS = [[2.4, 5.2, 2.2], [4, 3.6, 2.6], [5.6, 4.6, 1.8]], RULE = 6.9, TOT = 8.75, CUT = 10.6, NAME = 12.7;
// each row is out EM above the lip when its step ends; the steps' share of the print, in ms of 2200; the stub; the cut
const EM = 1.1, STEP = [300, 300, 300, 300, 200, 500, 300], L0 = 2, JUMP = 0.4, BACK = 600;
// the print dashes beside the paper's right edge: their u, foot and length up the paper's plane; the glyphs
const DASH = [[HW + 1.2, 0.3, 2.2], [HW + 2.1, 0.6, 1.6], [HW + 3, 0.9, 1]];
const GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
const clean = (s, n) => [...(s || "")].filter((c) => GL[c]).join("").slice(0, n).trim();
const wide = (s) => [...s].reduce((w, c) => w + (GL[c][0] - TR) * H, 0), fits = (s) => wide(s) <= IW;
const LOGO = "M0.511 1Q0.382 1 0.283 0.94Q0.185 0.88 0.13 0.768Q0.076 0.655 0.076 0.501L0.076 0.501Q0.076 0.349 0.13 0.236Q0.185 0.123 0.283 0.062Q0.382 0 0.512 0L0.512 0Q0.685 0 0.786 0.087Q0.886 0.174 0.918 0.336L0.918 0.336L0.765 0.344Q0.745 0.243 0.682 0.188Q0.62 0.134 0.512 0.134L0.512 0.134Q0.426 0.134 0.362 0.178Q0.297 0.223 0.262 0.305Q0.226 0.388 0.226 0.501L0.226 0.501Q0.226 0.615 0.262 0.697Q0.297 0.779 0.362 0.822Q0.426 0.866 0.511 0.866L0.511 0.866Q0.624 0.866 0.689 0.806Q0.753 0.747 0.772 0.636L0.772 0.636L0.924 0.644Q0.897 0.811 0.791 0.905Q0.685 1 0.511 1L0.511 1Z", ARGS = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
/** Unit-square path data, M L Q C Z only (anything else is skipped), each point mapped through f(x, y). */
const unit = (d, f) => (String(d).match(/[A-Za-z][^A-Za-z]*/g) || []).map((s) => {
  const c = s[0], n = ARGS[c], v = (s.slice(1).match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map((x) => clamp(+x, 0, 1));
  let o = n === 0 ? "Z" : "";
  for (let i = 0; n && i + n <= v.length; i += n) o += (i && c === "M" ? "L" : c) + [0, 2, 4].slice(0, n / 2).map((j) => f(v[i + j], v[i + j + 1])).join(" ");
  return o;
}).join("").replace(/^[^M]*/, "");
/** One line if it fits; else break at the last space that fits (or inside the word), the rest on a second line. */
function wrap(s) {
  let i = s.length, e;
  while (i > 1 && !fits(s.slice(0, i))) i--;
  if (i === s.length) return [s];
  const sp = s.lastIndexOf(" ", i), cut = sp > 0 && fits(s.slice(sp).trim()) ? sp : i, b = s.slice(cut).trim();
  for (e = b.length; e && !fits(b.slice(0, e)); e--);
  return [s.slice(0, cut).trim(), b.slice(0, e)];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let iv = value;
  // the frames: U to the right on screen (−y), F out of the front (+x), V up; D up the paper's lean, N its front normal
  const U = [0, -1, 0], F = [1, 0, 0], V = [0, 0, 1], D = [-Math.sin(LEAN), 0, Math.cos(LEAN)], N = [Math.cos(LEAN), 0, Math.sin(LEAN)];
  const add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const FOOT = [XC, 0, ZT], Wf = (u, s) => add(add(FOOT, U, u), D, s), Fp = (u, v, f) => [BX + f, -u, v];
  /** The paper L out of the slot: W(u, s) on its surface, T(s) up it, and its curl (centre line, radius, start). */
  function sheet(L) {
    const lc = Math.min(LC, L / 2), R = lc / Math.max(BEND * clamp(L / LF, 0, 1), 1e-3), sa = L - lc, ctr = add(Wf(0, sa), N, -R);
    const f = (s) => Math.max(0, s - sa) / R;
    const W = (u, s) => (s <= sa ? Wf(u, s) : add(add(add(ctr, U, u), N, R * Math.cos(f(s))), D, R * Math.sin(f(s))));
    const T = (s) => add(N.map((x) => -x * Math.sin(f(s))), D, Math.cos(f(s)));
    return { W, T, R, sa, lc, ctr };
  }
  // the camera as before, set a little lower so the longest receipt (two lines of name) clears the top
  const C = Cam(45, 0.5, 5.6), pc = [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[a * PL, b * PL, 0], [a * PL, b * PL, PH]]));
  fit(C, pc.concat([-1, 1].flatMap((a) => [-1, 1].map((b) => [a * BX, b * BY, ZT]))), 200, 172);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  // every curve is a cubic Bézier of a world arc: the camera is affine, so the projection is exact
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
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, corner r, from angle f0 to f1 (f0 < f1). */
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0, f1, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded outline on a face at o, run back by n: its silhouette (split where its tangent runs along n), and its crease. */
  function slab(o, e1, e2, rect, r, n) {
    const Tv = J(n), fs = Math.atan2(cross(J(e2), Tv), cross(J(e1), Tv)), m = J(add(e1.map((x) => x * Math.cos(fs + Q)), e2, Math.sin(fs + Q)));
    const a = (m[0] * Tv[0] + m[1] * Tv[1] < 0 ? fs : fs + 2 * Q) + 4 * Q;
    return { sil: rr(o, e1, e2, rect, r, a, a + 2 * Q) + rr(add(o, n), e1, e2, rect, r, a + 2 * Q, a + 4 * Q, false) + "Z", crease: rr(o, e1, e2, rect, r, a + 2 * Q, a + 4 * Q) };
  }
  // back to front: the plate, the body, its seam, slot and button; the rocker; the logo; the paper, its print
  const g = mk("g", {}, svg), path = (cls, d = "") => mk("path", { class: cls, d }, g);
  const plate = slab([0, 0, PH], U, F, [-PL, -PL, PL, PL], PR, [0, 0, -PH]);
  path("sil", plate.sil); path("nf lo", plate.crease);
  const body = slab([0, 0, ZT], U, F, [-BY, -BX, BY, BX], BR, [0, 0, -BH]);
  path("sil", body.sil); path("nf lo", body.crease);
  path("nf lo", seg(P(XS, BY, ZT), P(XS, -BY, ZT)));
  path("nf sil", rr([XC, 0, ZT], U, F, [-SL, -SW, SL, SW], SW, 0, 4 * Q) + "Z");
  const btn = slab([XB, YB, ZT + BT], U, F, [-BB, -BB, BB, BB], 0.6, [0, 0, -BT]);
  path("sil", btn.sil + btn.crease);
  path("nf sil", rr(Fp(RU, RV, 0), U, V, [-RW, -RH, RW, RH], 0.6, 0, 4 * Q) + "Z");
  const logo = path("nf sil"), mark = (d) => unit(d, (x, y) => pt([BR - BX + x * LS, BY, ZT - LI - y * LS]));
  const paper = path("sil"), ink = [1, 2, 3, 4, 5, 6].map(() => path("nf sil")), dashes = path("nf sil"); // one ink per row
  /** The receipt as polylines in the paper's [u, t] (t down from its top), each tagged with its row r and letter order j, and
   * the paper's length out at the end of each step: the stub, three items, the total, the dashed line, the name, the cut.
   * The total is right-aligned and always in full: a long one shortens its row's left bar, or drops it. */
  function layout() {
    const name = clean(stage.getAttribute("data-name")?.toUpperCase(), 20) || "THANK YOU", total = clean(stage.getAttribute("data-total"), 10);
    const out = [], u0 = -HW + M, u1 = HW - M, lines = wrap(name);
    const bar = (t, a, b, r) => out.push({ p: [[a, t], [b, t]], j: -1, r });
    const type = (s, x, tb, j0, r) => [...s].forEach((c, i) => {
      GL[c][1].forEach((p) => out.push({ p: p.map(([gx, gy]) => [x + (gx - TR / 2) * H, tb + gy * H]), j: j0 < 0 ? -1 : j0 + i, r }));
      x += (GL[c][0] - TR) * H;
    });
    ITEMS.forEach(([t, a, b], i) => { bar(t, u0, u0 + a, i + 1); bar(t, u1 - b, u1, i + 1); });
    const tl = total ? Math.min(2.4, u1 - wide(total) - 0.8 - u0) : 2.4;
    bar(RULE, u0, u1, 4); bar(RULE + 0.55, u0, u1, 4); if (tl >= 0.6) bar(TOT, u0, u0 + tl, 4);
    if (total) type(total, u1 - wide(total), TOT + H / 2, -1, 4); else bar(TOT, u1 - 3.4, u1, 4);
    for (let i = 0; i < 13; i++) bar(CUT, u0 + (i * (IW - 0.6)) / 12, u0 + (i * (IW - 0.6)) / 12 + 0.6, 5);
    let n = 0;
    lines.forEach((s, i) => { type(s, -wide(s) / 2, NAME + i * LH, n, 6); n += s.length; });
    const end = NAME + (lines.length - 1) * LH + EM;
    return { out, n, LV: [L0, ...ITEMS.map(([t]) => t + EM), TOT + H / 2 + EM, CUT + EM, end, end + JUMP] };
  }
  // name and total are read on every frame the loop runs (an observer wakes it): a change relays and retargets
  const attrs = () => ["name", "total", "logo", "show-logo"].map((a) => stage.getAttribute(`data-${a}`)).join("\n");
  let lay = layout(), seen = "", ver = 0, drawn = "";
  function draw(L, phi, hm) {
    const key = `${L.toFixed(4)}|${phi.toFixed(4)}|${hm.toFixed(4)}|${ver}`;
    if (key === drawn) return; drawn = key;
    const { W, T, R, sa, lc, ctr } = sheet(L), fc = (lc - RC) / R, kc = 0.5523 * RC, t1 = T(L - RC), side = (u) => add(ctr, U, u), cub = (a, b, c) => `C${pt(a)} ${pt(b)} ${pt(c)}`;
    // its two sides, a line up the lean and an arc round the curl, its rounded top; open at the foot, which the slot hides
    paper.setAttribute("d", `M${pt(W(-HW, 0))}L${pt(W(-HW, sa))}` + arc(side(-HW), N, D, R, 0, fc, false)
      + cub(add(W(-HW, L - RC), t1, kc), add(W(-HW + RC, L), U, -kc), W(-HW + RC, L)) + `L${pt(W(HW - RC, L))}`
      + cub(add(W(HW - RC, L), U, kc), add(W(HW, L - RC), t1, kc), W(HW, L - RC)) + arc(side(HW), N, D, R, fc, 0, false) + `L${pt(W(HW, 0))}`);
    // the print, cut at the slot's lip; the name's letters show left to right, evenly (the cube root undoes the ease)
    let rho = 1 - Math.cbrt(1 - clamp((hm - lay.LV[5]) / (lay.LV[6] - lay.LV[5]), 0, 1)), d = ["", "", "", "", "", "", ""];
    for (const { p, j, r } of lay.out) {
      if (j >= 0 && j >= rho * lay.n) continue;
      let run = []; const flush = () => { if (run.length > 1) d[r] += "M" + run.map(pt).join("L"); run = []; };
      p.forEach(([u, t], i) => {
        const s = L - t, [ua, ta] = p[i - 1] || p[0], sb = L - ta;
        if (i && (sb < VIS) !== (s < VIS)) { run.push(W(ua + ((VIS - sb) / (s - sb)) * (u - ua), VIS)); if (s < VIS) flush(); }
        if (s >= VIS) run.push(W(u, s));
      });
      flush();
    }
    ink.forEach((el, i) => el.setAttribute("d", d[i + 1]));
    // a dash grows up from its foot while φ runs 0 → 1, then its foot follows it up and it is gone at 2
    dashes.setAttribute("d", DASH.map(([u, f, n]) => [f + n * clamp(phi - 1, 0, 1), f + n * clamp(phi, 0, 1)])
      .map(([a, b], i) => (b - a > 0.4 ? `M${pt(Wf(DASH[i][0], a))}L${pt(Wf(DASH[i][0], b))}` : "")).join(""));
  }
  // one tween per step, each its own length; k is the step it runs to, hm the most paper out since the last rest
  let tw = tween(L0), on = false, k = 0, t1 = 0, ms = 1, hm = L0, lit = "", row = 0;
  const go = (now, i, m) => { k = i; t1 = now; ms = m; tw = tween(tval(tw, now), m); tset(tw, lay.LV[i], now, 0); }, step = (i) => (STEP[i - 1] * iv) / 2200;
  const B = register(stage, (_dt, now) => {
    if (attrs() !== seen) { seen = attrs(); lay = layout(); ver++; if (on) tset(tw, lay.LV[k], now, 0); logo.setAttribute("d", stage.getAttribute("data-show-logo") === "false" ? "" : mark(stage.getAttribute("data-logo")) || mark(LOGO)); }
    if (on && k < 7 && tdone(tw, now)) go(now, k + 1, step(k + 1));
    const L = tval(tw, now), done = tdone(tw, now);
    hm = on ? Math.max(hm, L) : done ? L : hm; // printed rows stay printed as the paper slides back in
    const q = clamp((now - t1) / ms, 0, 1), phi = on && !done && k < 7 ? 2 * q * q * (3 - 2 * q) : 0;
    draw(L, phi, hm);
    const state = !on ? "rest" : k === 7 && done ? "printed" : "printing", r = on ? Math.min(k, 6) : 0; // r: the row step k prints, bright
    if (state !== lit) lit = read.textContent = state; if (r !== row) { row = r; ink.forEach((el, i) => el.classList.toggle("hi", i + 1 === r)); }
    return !done || (on && k < 7);
  });
  bag.add(B.unregister); const mo = new MutationObserver(() => B.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-name", "data-total", "data-logo", "data-show-logo"] }), bag.add(() => mo.disconnect());
  // the hit area: the printer body at rest, plate to top, as the hull of its box on screen. Nothing in it ever moves
  const HIT = hull([-BX, BX].flatMap((x) => [-BY, BY].flatMap((y) => [PH, ZT].map((z) => P(x, y, z)))));
  const sideOf = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inside = (p) => new Set(HIT.map((a, i) => sideOf(p, a, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  function hover(v) {
    if (v === on) return;
    const now = performance.now(), L = tval(tw, now), i = lay.LV.findIndex((x) => x > L + 1e-3); // back in, feed on from there
    if (!(on = v)) go(now, 0, (BACK * iv) / 2200);
    else { const j = i < 0 ? 7 : Math.max(1, i); go(now, j, step(j)); }
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => hover(inside(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest", B.wake();
  return { set: (v) => { iv = v; }, destroy: bag.dispose };
}

hairline({
  name: "receipt",
  means: "A receipt printer: hover it and it prints a receipt, row by row, and the name at its foot, letter by letter.",
  rules: [1, 4, 5, 7, 8],
  // ms the whole print takes, from the pointer's arrival to the cut
  range: [1800, 2200, 2600],
  mount,
});