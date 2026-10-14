/**
 * EDC: a handheld card terminal, built in 3D and drawn through one true isometric (30°) camera. It lies flat, keypad up, its long axis along x and its
 * foot end facing right: one rounded body with the printer hump on its far end (paper cover, hinge, serrated tear bar; a logo on the hump's front face:
 * data-logo, unit-square path data, none by default), a bezelled screen and a small contactless mark near the hump, and on one grid as wide as the
 * bezel 3 × 4 raised keys with single-stroke digits over ✕ ◁ ✓; the card slot on the foot end, a swipe groove on the near side. A card lies flat beside
 * it. Hover: the card lifts, tilts and taps over the face as three arcs grow out and draw back, then goes home; the amount (data-amount, Hershey strokes,
 * one fixed size) is written in, a check drawn, the ✓ key dips, a receipt rises out of the hump. Nothing fades. Grey at rest; bright is what changes. */
const STROKES = {"0":[0.952,"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1"],"1":[0.952,"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0"],"2":[0.952,"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0"],"3":[0.952,"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"4":[0.952,"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0"],"5":[0.952,"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19"],"6":[0.952,"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333"],"7":[0.952,"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1"],"8":[0.952,"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1"],"9":[0.952,"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"]," ":[0.762,""],"A":[0.857,"M0.429 -1 L0.048 0 M0.429 -1 L0.81 0 M0.19 -0.333 L0.667 -0.333"],"B":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 M0.19 -0.524 L0.619 -0.524 0.762 -0.476 0.81 -0.429 0.857 -0.333 0.857 -0.19 0.81 -0.095 0.762 -0.048 0.619 0 0.19 0"],"C":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238"],"D":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.524 -1 0.667 -0.952 0.762 -0.857 0.81 -0.762 0.857 -0.619 0.857 -0.381 0.81 -0.238 0.762 -0.143 0.667 -0.048 0.524 0 0.19 0"],"E":[0.857,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524 M0.19 0 L0.81 0"],"F":[0.762,"M0.19 -1 L0.19 0 M0.19 -1 L0.81 -1 M0.19 -0.524 L0.571 -0.524"],"G":[1.048,"M0.857 -0.762 L0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.857 -0.381 M0.619 -0.381 L0.857 -0.381"],"H":[1.048,"M0.19 -1 L0.19 0 M0.857 -1 L0.857 0 M0.19 -0.524 L0.857 -0.524"],"I":[0.381,"M0.19 -1 L0.19 0"],"J":[0.762,"M0.571 -1 L0.571 -0.238 0.524 -0.095 0.476 -0.048 0.381 0 0.286 0 0.19 -0.048 0.143 -0.095 0.095 -0.238 0.095 -0.333"],"K":[0.952,"M0.19 -1 L0.19 0 M0.857 -1 L0.19 -0.333 M0.429 -0.571 L0.857 0"],"L":[0.667,"M0.19 -1 L0.19 0 M0.19 0 L0.762 0"],"M":[1.143,"M0.19 -1 L0.19 0 M0.19 -1 L0.571 0 M0.952 -1 L0.571 0 M0.952 -1 L0.952 0"],"N":[1.048,"M0.19 -1 L0.19 0 M0.19 -1 L0.857 0 M0.857 -1 L0.857 0"],"O":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1"],"P":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.667 0.81 -0.571 0.762 -0.524 0.619 -0.476 0.19 -0.476"],"Q":[1.048,"M0.429 -1 L0.333 -0.952 0.238 -0.857 0.19 -0.762 0.143 -0.619 0.143 -0.381 0.19 -0.238 0.238 -0.143 0.333 -0.048 0.429 0 0.619 0 0.714 -0.048 0.81 -0.143 0.857 -0.238 0.905 -0.381 0.905 -0.619 0.857 -0.762 0.81 -0.857 0.714 -0.952 0.619 -1 0.429 -1 M0.571 -0.19 L0.857 0.095"],"R":[0.952,"M0.19 -1 L0.19 0 M0.19 -1 L0.619 -1 0.762 -0.952 0.81 -0.905 0.857 -0.81 0.857 -0.714 0.81 -0.619 0.762 -0.571 0.619 -0.524 0.19 -0.524 M0.524 -0.524 L0.857 0"],"S":[0.952,"M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],"T":[0.762,"M0.381 -1 L0.381 0 M0.048 -1 L0.714 -1"],"U":[1.048,"M0.19 -1 L0.19 -0.286 0.238 -0.143 0.333 -0.048 0.476 0 0.571 0 0.714 -0.048 0.81 -0.143 0.857 -0.286 0.857 -1"],"V":[0.857,"M0.048 -1 L0.429 0 M0.81 -1 L0.429 0"],"W":[1.143,"M0.095 -1 L0.333 0 M0.571 -1 L0.333 0 M0.571 -1 L0.81 0 M1.048 -1 L0.81 0"],"X":[0.952,"M0.143 -1 L0.81 0 M0.81 -1 L0.143 0"],"Y":[0.857,"M0.048 -1 L0.429 -0.524 0.429 0 M0.81 -1 L0.429 -0.524"],"Z":[0.952,"M0.81 -1 L0.143 0 M0.143 -1 L0.81 -1 M0.143 0 L0.81 0"],"a":[0.952,"M0.714 -0.667 L0.714 0 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"b":[0.857,"M0.19 -1 L0.19 0 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"c":[0.857,"M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"d":[0.952,"M0.714 -1 L0.714 0 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"e":[0.857,"M0.143 -0.381 L0.714 -0.381 0.714 -0.476 0.667 -0.571 0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"f":[0.667,"M0.476 -1 L0.381 -1 0.286 -0.952 0.238 -0.81 0.238 0 M0.095 -0.667 L0.429 -0.667"],"g":[0.952,"M0.714 -0.667 L0.714 0.095 0.667 0.238 0.619 0.286 0.524 0.333 0.381 0.333 0.286 0.286 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"h":[0.952,"M0.19 -1 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0"],"i":[0.381,"M0.143 -1 L0.19 -0.952 0.238 -1 0.19 -1.048 0.143 -1 M0.19 -0.667 L0.19 0"],"j":[0.476,"M0.238 -1 L0.286 -0.952 0.333 -1 0.286 -1.048 0.238 -1 M0.286 -0.667 L0.286 0.143 0.238 0.286 0.143 0.333 0.048 0.333"],"k":[0.762,"M0.19 -1 L0.19 0 M0.667 -0.667 L0.19 -0.19 M0.381 -0.381 L0.714 0"],"l":[0.381,"M0.19 -1 L0.19 0"],"m":[1.429,"M0.19 -0.667 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0 M0.714 -0.476 L0.857 -0.619 0.952 -0.667 1.095 -0.667 1.19 -0.619 1.238 -0.476 1.238 0"],"n":[0.952,"M0.19 -0.667 L0.19 0 M0.19 -0.476 L0.333 -0.619 0.429 -0.667 0.571 -0.667 0.667 -0.619 0.714 -0.476 0.714 0"],"o":[0.952,"M0.381 -0.667 L0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143 0.762 -0.286 0.762 -0.381 0.714 -0.524 0.619 -0.619 0.524 -0.667 0.381 -0.667"],"p":[0.857,"M0.19 -0.667 L0.19 0.333 M0.19 -0.524 L0.286 -0.619 0.381 -0.667 0.524 -0.667 0.619 -0.619 0.714 -0.524 0.762 -0.381 0.762 -0.286 0.714 -0.143 0.619 -0.048 0.524 0 0.381 0 0.286 -0.048 0.19 -0.143"],"q":[0.952,"M0.714 -0.667 L0.714 0.333 M0.714 -0.524 L0.619 -0.619 0.524 -0.667 0.381 -0.667 0.286 -0.619 0.19 -0.524 0.143 -0.381 0.143 -0.286 0.19 -0.143 0.286 -0.048 0.381 0 0.524 0 0.619 -0.048 0.714 -0.143"],"r":[0.571,"M0.19 -0.667 L0.19 0 M0.19 -0.381 L0.238 -0.524 0.333 -0.619 0.429 -0.667 0.571 -0.667"],"s":[0.857,"M0.667 -0.524 L0.619 -0.619 0.476 -0.667 0.333 -0.667 0.19 -0.619 0.143 -0.524 0.19 -0.429 0.286 -0.381 0.524 -0.333 0.619 -0.286 0.667 -0.19 0.667 -0.143 0.619 -0.048 0.476 0 0.333 0 0.19 -0.048 0.143 -0.143"],"t":[0.667,"M0.238 -1 L0.238 -0.19 0.286 -0.048 0.381 0 0.476 0 M0.095 -0.667 L0.429 -0.667"],"u":[0.952,"M0.19 -0.667 L0.19 -0.19 0.238 -0.048 0.333 0 0.476 0 0.571 -0.048 0.714 -0.19 M0.714 -0.667 L0.714 0"],"v":[0.762,"M0.095 -0.667 L0.381 0 M0.667 -0.667 L0.381 0"],"w":[1.048,"M0.143 -0.667 L0.333 0 M0.524 -0.667 L0.333 0 M0.524 -0.667 L0.714 0 M0.905 -0.667 L0.714 0"],"x":[0.857,"M0.143 -0.667 L0.667 0 M0.667 -0.667 L0.143 0"],"y":[0.762,"M0.095 -0.667 L0.381 0 M0.667 -0.667 L0.381 0 0.286 0.19 0.19 0.286 0.095 0.333 0.048 0.333"],"z":[0.857,"M0.667 -0.667 L0.143 0 M0.143 -0.667 L0.667 -0.667 M0.143 0 L0.667 0"],"$":[0.952,"M0.381 -1.19 L0.381 0.19 M0.571 -1.19 L0.571 0.19 M0.81 -0.857 L0.714 -0.952 0.571 -1 0.381 -1 0.238 -0.952 0.143 -0.857 0.143 -0.762 0.19 -0.667 0.238 -0.619 0.333 -0.571 0.619 -0.476 0.714 -0.429 0.762 -0.381 0.81 -0.286 0.81 -0.143 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.143 -0.143"],".":[0.381,"M0.19 -0.238 L0.143 -0.19 0.19 -0.143 0.238 -0.19 0.19 -0.238"],",":[0.381,"M0.238 -0.19 L0.19 -0.143 0.143 -0.19 0.19 -0.238 0.238 -0.19 0.238 -0.095 0.143 0"],"*":[0.762,"M0.381 -1 L0.381 -0.429 M0.143 -0.857 L0.619 -0.571 M0.619 -0.857 L0.143 -0.571"],"#":[1,"M0.524 -1.19 L0.19 0.333 M0.81 -1.19 L0.476 0.333 M0.19 -0.571 L0.857 -0.571 M0.143 -0.286 L0.81 -0.286"]};
const { Cam, fit, proj, hull, clamp, bezier, reducedMotion, disposer, mk, pointer, register } = HL;
const Q = Math.PI / 2, NS = 12, TH = (12 * Math.PI) / 180, add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]);
// built in 3D and seen through one true isometric camera: x runs down to the right (the foot end faces it), y down to the left, z up. The machine lies
// flat: on its top face u runs to the right (−y) and v from the foot toward the hump (−x). The body: 2·W wide, L = 2.1 × that long, T = a quarter of it
// thick, corners BR; the hump on its far end, from VH to the end, HH = 0.35 × the width tall, the body's own sides carried up
const W = 10, L = 42, T = 5, BR = 2.6, X0 = 21, HH = 7, VH = 0.72 * L, ZH = T + HH;
const U = [0, -1, 0], D = [-1, 0, 0], Z = [0, 0, 1], F = (u, v, z = T) => [X0 - v, -u, z];
// on the hump's top: its tear bar at VE, serrated edge first, the paper cover behind it, its hinge at HG; the logo LS square on its front face
const VE = VH + 1.6, HG = L - 2.6, LS = 0.5 * HH;
// [v0, v1, half width] on the top face: the screen's bezel, its display BZ inside; the contactless mark at VM; the card slot on the foot face, half [length, height]
const SCR = [17.4, 27, 7.6], BZ = 1, VM = 28.6, SLOT = [5.6, 0.3];
// the keys, KT tall, corners KR, all KW by KH (half sizes) on one grid: 3 columns KP apart, spanning the bezel's width; the function row at FV, then the
// 4 digit rows, PV apart; digits KG tall
const KT = 0.6, KW = 2.2, KH = 1, KP = 2 * KW + 1, PV = 2.9, FV = 3.4, KG = 1.15, KR = 0.5, KEYS = "123456789*0#";
const SYM = [[[[-1, -1], [1, 1]], [[-1, 1], [1, -1]]], [[[0.9, -1], [-0.9, 0], [0.9, 1], [0.9, -1]]], [[[-1, 0.1], [-0.3, -0.8], [1, 0.9]]]]; // ✕ ◁ ✓
// the card: 2·CW long (along x) by 2·CH, CT thick; its chip (CU by CV, half) at CX, CY with its contacts, the contactless mark beside it, 4 × 4 number dashes at DY
const CW = 7, CH = 4.4, CT = 0.6, CU = 1, CV = 0.78, CX = -CW + 2.5, CY = 0.8, DY = -2;
// where it rests flat beside the machine; the control point its path bows out through, clear of the body over the whole path (it takes it home too); the
// tap: over the face, its far end lifted TH and clear of the hump, centred at VK and ZK up, dipping DP
const REST = [0, W + 1.8 + CH, CT], CTRL = [2, 15, 20], VK = VH - CW * Math.cos(TH) - 0.8, ZK = 9.3, DP = 1.3, ARCS = [1.5, 2.6, 3.7], SPAN = (50 * Math.PI) / 180;
// the receipt: RW either side, a cubic rising from behind the tear bar in the plane across the hump, curling back a little; its bars [lag, length]
const RW = 4.6, RB = [[0, 0], [0, 4], [0.9, 7.4], [3.2, 8.8]].map(([v, z]) => F(0, VE + 0.9 + v, ZH + z)), BARS = [[0.16, 6], [0.3, 3.6]];
// the amount: one cap height for every amount, set so the widest 10-character amount, "$000000.00", spans 80% of the display
const TR = 0.1, ARGS = { M: 2, L: 2, Q: 4, C: 6, Z: 0 }, GL = Object.fromEntries(Object.entries(STROKES).map(([c, [a, d]]) => [c, [a, d.split("M").filter(Boolean)
  .map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), []))]]));
function type(s, x = 0, lo = Infinity, hi = -Infinity, ps = []) { // polylines in cap heights, x along the line, y down from the baseline; the inked extent along x
  for (const c of s) { GL[c][1].forEach((p) => ps.push(p.map(([gx, gy]) => { lo = Math.min(lo, x + gx); hi = Math.max(hi, x + gx); return [x + gx, gy]; }))); x += GL[c][0] - TR; } return { ps, lo, hi }; }
const ink = (s) => { const t = type(s); return t.hi - t.lo; }, DW = SCR[2] - BZ, AH = (0.8 * 2 * DW) / ink("$000000.00");
// the display's layout: the amount's band (from the dollar's top, 1.19 caps up, to the descenders, 0.333 down), a gap, the check 30% of it tall
const HS = SCR[1] - SCR[0] - 2 * BZ, CK = 0.3 * HS, GK = 0.13 * HS, BLK = 1.523 * AH + GK + CK, VB = SCR[0] + BZ + HS / 2 + BLK / 2 - 1.19 * AH, VCK = VB - 0.333 * AH - GK - CK / 2;
const CHECK = [[-0.5, 0.02], [-0.16, -0.5], [0.5, 0.5]].map(([u, v]) => [u * CK, VCK + v * CK]); // a short stroke down to the foot, a long one up to the right
/** Unit-square path data, M L Q C Z only (anything else is skipped), each point mapped through f(x, y). */
const unit = (d, f) => (String(d).match(/[A-Za-z][^A-Za-z]*/g) || []).map((s) => {
  const c = s[0], n = ARGS[c], v = (s.slice(1).match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map((x) => clamp(+x, 0, 1)); let o = n === 0 ? "Z" : "";
  for (let i = 0; n && i + n <= v.length; i += n) o += (i && c === "M" ? "L" : c) + [0, 2, 4].slice(0, n / 2).map((j) => f(v[i + j], v[i + j + 1])).join(" ");
  return o; }).join("").replace(/^[^M]*/, "");
/** A rounded outline, symmetric about u = 0, wb wide each side at v0 and wt at v1, corners r: its corner centres and the outward-normal angle each starts at. */
function shape(wb, wt, v0, v1, r) {
  const a = Math.atan2(wb - wt, v1 - v0), u = (v) => (Math.cos(a) * wb + Math.sin(a) * (v0 - v) - r) / Math.cos(a);
  return { r, b: [-Q, a, Q, 2 * Q - a, 3 * Q], c: [[u(v0 + r), v0 + r], [u(v1 - r), v1 - r], [-u(v1 - r), v1 - r], [-u(v0 + r), v0 + r]] }; }
const CARD = shape(CW, CW, -CH, CH, 0.18 * 2 * CH), CHIP = shape(CU, CU, -CV, CV, 0.4);
function mount({ stage, svg, read }, value) {
  const bag = disposer(), near = F(0, VK, ZK); let iv = value;
  const cardFrame = (th) => [[-Math.cos(th), 0, Math.sin(th)], U, [Math.sin(th), 0, Math.cos(th)]]; // e1 along it (far end up by th), e2 across, its face's normal
  /** The card's face centre and tilt for move m (along a quadratic Bézier, rest to the face) and dip q, both 0 to 1. */
  const pose = (m, q) => [REST.map((x, i) => (1 - m) ** 2 * x + 2 * m * (1 - m) * CTRL[i] + m * m * near[i] - DP * q * cardFrame(TH)[2][i]), TH * Math.min(1, 1.15 * m)];
  // a ring is a shape in the plane (o; e1, e2); its samples [ring, corner, angle] go NS + 1 round each corner
  const Rg = (o, e1, e2, sh) => ({ o, e1, e2, sh }), flat = (o, sh) => Rg(o, U, D, sh), cen = (R, k) => add(add(R.o, R.e1, R.sh.c[k][0]), R.e2, R.sh.c[k][1]);
  const at3 = (c, e1, e2, r, f) => c.map((x, i) => x + r * (Math.cos(f) * e1[i] + Math.sin(f) * e2[i])), wpt = ([R, k, f]) => at3(cen(R, k), R.e1, R.e2, R.sh.r, f);
  const samp = (R) => R.sh.c.flatMap((_, k) => Array.from({ length: NS + 1 }, (_, j) => [R, k, R.sh.b[k] + ((R.sh.b[k + 1] - R.sh.b[k]) * j) / NS]));
  const cardR = ([p, th]) => { const [e1, e2, n] = cardFrame(th); return [Rg(p, e1, e2, CARD), Rg(add(p, n, -CT), e1, e2, CARD)]; };
  const BS = shape(W, W, 0, L, BR), machine = [0, T].map((z) => flat(F(0, 0, z), BS)).concat(flat(F(0, 0, ZH), shape(W, W, VH, L, BR))).flatMap(samp).map(wpt);
  const C = Cam(45, 1 / Math.sqrt(3), 6.3), path11 = Array.from({ length: 11 }, (_, i) => cardR(pose(i / 10, 0)).flatMap(samp).map(wpt)).flat();
  fit(C, machine.concat(RB.flatMap((p) => [add(p, U, -RW), add(p, U, RW)]), path11, [add(near, U, CH + ARCS[2] + 1)]), 200, 166);
  const P = proj(C), pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  // every curve is a cubic Bézier of a world arc: the camera is affine, so the projection is exact
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4), tan = (f) => e1.map((x, i) => r * (-Math.sin(f) * x + Math.cos(f) * e2[i]));
    let d = `${move ? "M" : "L"}${pt(at3(c, e1, e2, r, f0))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b), t0 = tan(a), t3 = tan(b);
      d += `C${pt(p0.map((x, j) => x + k * t0[j]))} ${pt(p3.map((x, j) => x - k * t3[j]))} ${pt(p3)}`; }
    return d; }
  /** A run of samples as a path: one arc per stretch on the same corner of the same ring, straight between. */
  function trace(seq, close, d = "") {
    for (let a = 0, b; a < seq.length; a = b + 1) {
      for (b = a; b + 1 < seq.length && seq[b + 1][0] === seq[a][0] && seq[b + 1][1] === seq[a][1]; ) b++;
      const [R, k, f0] = seq[a]; d += arc(cen(R, k), R.e1, R.e2, R.sh.r, f0, seq[b][2], !a); }
    return d + (close ? "Z" : ""); }
  const ring = (R) => trace(samp(R), true);
  /** A solid: the hull of its rings on screen as its silhouette, and the run of the first ring that falls inside it (or from sample s1) as its one crease. */
  function sol(rings, s1) {
    const all = rings.flatMap(samp), at = new Map(all.map((s) => [P(...wpt(s)).join(), s])), n = 4 * (NS + 1), S = all.slice(0, n);
    const H = hull([...at.keys()].map((k) => k.split(",").map(Number))).map((p) => at.get(p.join())), on = new Set(H);
    const i0 = Math.max(0, H.findIndex((s, i) => { const p = H[(i + H.length - 1) % H.length]; return p[0] !== s[0] || p[1] !== s[1]; }));
    const s0 = s1 ?? S.findIndex((s, i) => on.has(s) && !on.has(S[(i + 1) % n])), run = [S[s0]];
    for (let i = s0 + 1; s0 >= 0; i++) { run.push(S[i % n]); if (on.has(S[i % n])) break; }
    return { sil: trace(H.slice(i0).concat(H.slice(0, i0)), true), cr: s0 >= 0 ? trace(run, false) : "" }; }
  const drawn = new Map(), setD = (el, d) => { if (drawn.get(el) !== d) { drawn.set(el, d); el.setAttribute("d", d); } };
  const g = mk("g", {}, svg), path = (cls, parent = g, d = "") => { const el = mk("path", { class: cls, d }, parent); el.base = cls; return el; };
  const lines = (ps, z = T) => ps.filter((p) => p.length > 1).map((p) => "M" + p.map(([u, v]) => pt(F(u, v, z))).join("L")).join("");
  const word = (s, h, uc, vb) => { const { ps, lo, hi } = type(s); return ps.map((p) => p.map(([x, y]) => [uc + (x - (lo + hi) / 2) * h, vb - y * h])); };
  /** Polylines written in, in order, to k of their whole length (0 to 1): how the amount and the check are drawn, and undrawn. */
  const part = (ps, k) => { const sg = (p, i) => Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); let s = k * ps.reduce((a, p) => p.reduce((b, _, i) => b + (i && sg(p, i)), a), 0);
    return ps.map((p) => p.reduce((q, x, i) => { if (i && s > 0) { const t = Math.min(1, s / sg(p, i)); s -= sg(p, i); q.push([p[i - 1][0] + (x[0] - p[i - 1][0]) * t, p[i - 1][1] + (x[1] - p[i - 1][1]) * t]); } return q; }, [p[0]])); };
  const solid = (s) => [path("sil", g, s.sil), path("nf lo", g, s.cr)];
  // back to front, and it never changes: the body and the swipe groove on its near side; the hump's cover, hinge, tear bar and logo, the receipt over
  // them; then the face, far to near: the screen and what it shows, the contactless mark, the keys row by row, the function keys, the chip slot;
  // then the card, which only ever moves above the face or beside it, so nothing of the machine is ever in front of it, and its arcs
  // the body and its hump, one solid, traced corner by corner: the outline (each vertical corner's silhouette where the view grazes it, at ±45°), filled;
  // then its creases: the top's near edges, the hump's front and its near top edge. Its near side and foot end show their thickness
  const bc = (k, z) => F(BS.c[k][0], BS.c[k][1], z), ba = (k, z, f0, f1, mv) => arc(bc(k, z), U, D, BR, f0, f1, mv), Lp = (u, v, z) => `L${pt(F(u, v, z))}`;
  path("sil", g, ba(0, 0, -Q / 2, -Q, 1) + ba(3, 0, 3 * Q, 2 * Q) + ba(2, 0, 2 * Q, 1.5 * Q) + ba(2, ZH, 1.5 * Q, Q) + ba(1, ZH, Q, 0) + Lp(W, VH, ZH) + Lp(W, VH, T) + ba(0, T, 0, -Q / 2) + "Z");
  path("nf lo", g, ba(0, T, -Q / 2, -Q, 1) + ba(3, T, 3 * Q, 2 * Q) + Lp(-W, VH, T) + Lp(W, VH, T) + `M${pt(F(-W, VH, T))}` + Lp(-W, VH, ZH) + Lp(W, VH, ZH) + `M${pt(F(-W, VH, ZH))}` + ba(2, ZH, 2 * Q, 1.5 * Q));
  // the swipe groove, the middle half of the near side; the card slot, across the foot end
  path("nf lo", g, ring(Rg(F(-W, L / 2, T / 2), D, Z, shape(L / 4, L / 4, -0.4, 0.4, 0.4))) + ring(Rg(F(0, 0, T / 2), U, Z, shape(SLOT[0], SLOT[0], -SLOT[1], SLOT[1], SLOT[1]))));
  path("nf lo", g, ring(flat(F(0, 0, ZH), shape(W - 1.6, W - 1.6, VE + 1.5, L - 1.2, 1.2))) + lines([[[1.6 - W, HG], [W - 1.6, HG]]], ZH));
  const TB = W - 1.3, teeth = Array.from({ length: 61 }, (_, i) => [TB - (2 * TB * i) / 60, VE + (i % 2) * 0.15]);
  path("nf sil", g, lines([[[-TB, VE + 0.8], [TB, VE + 0.8], ...teeth, [-TB, VE + 0.8]]], ZH));
  const logo = path("nf sil"), paper = path("sil"), bars = path("nf lo");
  path("nf sil", g, ring(flat(F(0, 0), shape(SCR[2], SCR[2], SCR[0], SCR[1], 1.6)))); path("nf lo", g, ring(flat(F(0, 0), shape(DW, DW, SCR[0] + BZ, SCR[1] - BZ, 0.9))));
  const amount = path("nf sil"), check = path("nf sil");
  path("nf lo", g, [0.4, 0.72, 1.04].map((r) => arc(F(-0.68, VM), U, D, r, -0.75, 0.75, true)).join("")); // centred: its arcs span u −0.4 to 0.36
  const key = (uc, vc, z) => sol([T + KT * z, T].map((h) => flat(F(uc, 0, h), shape(KW, KW, vc - KH, vc + KH, KR))));
  [...KEYS].forEach((c, i) => { const uc = ((i % 3) - 1) * KP, vc = FV + (4 - Math.floor(i / 3)) * PV; solid(key(uc, vc, 1)); path("nf sil", g, lines(word(c, KG, uc, vc - KG / 2), T + KT)); });
  // a function key, its top z of the way up (the ✓ key dips), and its symbol on it
  const fkey = (j, z) => [key((j - 1) * KP, FV, z), lines(SYM[j].map((p) => p.map(([u, v]) => [(j - 1) * KP + 0.5 * u, FV + 0.5 * v])), T + KT * z)];
  const fk = [0, 1, 2].map((j) => { const [s, m] = fkey(j, 1); return solid(s).concat(path("nf sil", g, m)); });
  const cardG = mk("g", {}, g), card = path("sil", cardG), cardCr = path("nf lo", cardG), marks = path("nf sil", cardG);
  const arcs = ARCS.map(() => path("nf sil")); let amtPs = [];
  // the amount, read live: up to 10 of [0-9 A-Z a-z . , $ space], its case kept; only an amount wider than 94% of the display is drawn smaller
  const readAttrs = () => {
    const amt = [...(stage.getAttribute("data-amount") ?? "$24.00")].filter((c) => /[0-9A-Za-z.,$ ]/.test(c)).join("").slice(0, 10).trim() || "$24.00", lg = stage.getAttribute("data-logo") || "";
    const { lo, hi } = type(amt); amtPs = word(amt, Math.min(AH, (0.94 * 2 * DW) / Math.max(hi - lo, 1e-6)), 0, VB);
    setD(logo, lg ? unit(lg, (x, y) => pt(add(add(F(0, VH, T + HH / 2), U, (x - 0.5) * LS), Z, (0.5 - y) * LS))) : ""); };
  function drawCard([p, th], w, [ap, ath]) { // its arcs stay where it tapped, at ap
    const [e1, e2] = cardFrame(th), on = (u, v) => add(add(p, e1, u), e2, v), q = (u, v) => pt(on(u, v)), s = sol(cardR([p, th])); setD(card, s.sil); setD(cardCr, s.cr);
    setD(marks, ring(Rg(on(CX, CY), e1, e2, CHIP)) + `M${q(CX - CU, CY)}L${q(CX + CU, CY)}` + [-0.4, 0.4].map((x) => `M${q(CX + x * CU, CY - CV)}L${q(CX + x * CU, CY + CV)}`).join("")
      + [0.35, 0.62, 0.89].map((r) => arc(on(CX + 1.9, CY), e1, e2, r, -0.75, 0.75, true)).join("")
      + Array.from({ length: 16 }, (_, i) => { const u = 1.3 - CW + Math.floor(i / 4) * 3.05 + (i % 4) * 0.66; return `M${q(u, DY)}L${q(u + 0.4, DY)}`; }).join(""));
    const [a1, a2] = cardFrame(ath); ARCS.forEach((r, i) => { // three arcs off the card's right edge, in its plane: each grows out both ways as it swells, then draws back in, the next a beat later
      const k = clamp((w - 0.2 * i) / 0.6, 0, 1), sp = SPAN * Math.sin(Math.PI * k);
      setD(arcs[i], sp > 0.02 ? arc(add(ap, a2, CH - 0.5), a2, a1, r + 0.7 * k, -sp, sp, true) : ""); }); }
  const sub = (B, t) => { const l = (a, b) => a.map((x, i) => x + (b[i] - x) * t), a = l(B[0], B[1]), b = l(B[1], B[2]), d = l(a, b); return [B[0], a, d, l(d, l(b, l(B[2], B[3])))]; }; // a cubic's first t
  /** The receipt out to t of its curve: its two edges, open at the slot, and its top with rounded corners; each bar once clear of the slot. */
  function drawPaper(t) {
    if (t < 0.01) return setD(paper, "") || setD(bars, "");
    const B = sub(RB, Math.max(0, t - 0.05)), T = sub(RB, t)[3], e = (u) => B.map((p) => pt(add(p, U, u))), l = e(-RW), r = e(RW), c = (u) => pt(add(T, U, u));
    setD(paper, `M${l[0]}C${l[1]} ${l[2]} ${l[3]}C${c(-RW)} ${c(-RW)} ${c(0.5 - RW)}L${c(RW - 0.5)}C${c(RW)} ${c(RW)} ${r[3]}C${r[2]} ${r[1]} ${r[0]}`);
    setD(bars, BARS.filter(([lag]) => t - lag > 0.1).map(([lag, len]) => { const m = sub(RB, t - lag)[3]; return `M${pt(add(m, U, 1 - RW))}L${pt(add(m, U, 1 - RW + len))}`; }).join("")); }

  // eight channels, each eased from where it is to its target: the card's move m, its dip d, the arcs w, its way home a (the card sits at m·(1 − a)),
  // the amount written in A, the check k, the ✓ key's press p, the receipt R. Nothing fades: everything moves, or is drawn and undrawn along its strokes.
  // In, one after another (ms, scaled to the slider's total), the way home under the amount, the press as the check is drawn; out, all at once, in 600 ms
  const IO = bezier(0.42, 0, 0.58, 1), LIN = (x) => x, Ch = Object.fromEntries([..."mdwaAkpR"].map((n) => [n, { from: 0, to: 0, t0: 0, dur: 1, e: LIN }]));
  const tv = (w, now) => (reducedMotion() ? w.to : w.from + (w.to - w.from) * w.e(clamp((now - w.t0) / w.dur, 0, 1)));
  const done = (w, now) => reducedMotion() || now >= w.t0 + w.dur;
  const go = (w, to, now, delay, dur, e, from = tv(w, now)) => Object.assign(w, { from, to, t0: now + delay, dur: Math.max(1, dur), e });
  let on = false, lit = -1, seen = null;
  function enter(now) {
    const v = (n) => tv(Ch[n], now), s = iv / 2300; let t = 0;
    const seq = (n, ms, e = IO) => { const dur = ms * s * (1 - v(n)); go(Ch[n], 1, now, t, dur, e); t += dur; };
    on = true; seq("m", 600);
    if (v("A") < 0.01) { go(Ch.d, 1, now, t, 150 * s, LIN, 0); go(Ch.w, 1, now, t + 75 * s, 400 * s, LIN, 0); t += 150 * s; } // the tap, and its arcs
    go(Ch.a, 1, now, t, 500 * s, IO); t += 350 * s; seq("A", 400, LIN); go(Ch.p, 1, now, t, 280 * s * (1 - v("p")), LIN);
    seq("k", 300); t += 100 * s; seq("R", 500); B.wake(); }
  function leave(now) {
    const v = (n) => tv(Ch[n], now), q = v("d") >= 1 ? 0 : Math.min(v("d"), 1 - v("d")), w = v("w"), e = v("m") * (1 - v("a")), p = v("p") < 1 ? v("p") : 0;
    on = false; // a card still out goes home from where it is; a key still down comes back up
    go(Ch.m, 0, now, 0, 600 * e, IO, e); go(Ch.a, 0, now, 0, 1, LIN, 0); go(Ch.d, 0, now, 0, 150 * q, LIN, q); go(Ch.p, 0, now, 0, 150 * p, LIN, p); go(Ch.w, w > 0 && w < 1 ? 1 : w, now, 0, 150 * (1 - w), LIN);
    go(Ch.R, 0, now, 0, 400 * v("R"), IO); go(Ch.A, 0, now, 0, 400 * v("A"), IO); go(Ch.k, 0, now, 0, 300 * v("k"), IO); B.wake(); }
  const light = (els, v) => els.forEach((el) => el.setAttribute("class", v ? el.base.replace(/\b(sil|lo)\b/, "").trim() + " hi" : el.base));
  const B = register(stage, (_dt, now) => {
    const at = ["data-amount", "data-logo"].map((k) => stage.getAttribute(k)).join("\n");
    if (at !== seen) { seen = at; readAttrs(); } // read live, on every frame the loop runs (an observer wakes it): no replay, the next frame shows it
    const v = (n) => tv(Ch[n], now);
    const dip = Math.sin(Math.PI * v("d")); drawCard(pose(v("m") * (1 - v("a")), dip), v("w"), pose(1, dip));
    setD(amount, lines(part(amtPs, v("A")))); setD(check, lines(part([CHECK], v("k")))); drawPaper(v("R"));
    const [k, m] = fkey(2, 1 - 0.7 * Math.sin(Math.PI * v("p"))); setD(fk[2][0], k.sil); setD(fk[2][1], k.cr); setD(fk[2][2], m);
    // grey at rest and on the way back; bright, only what changes: the card on its way in, the arcs, the amount and check (the ✓ key while down), the receipt
    const ph = !on ? 0 : v("R") > 0 ? 4 : v("A") > 0 ? 3 : v("d") > 0 || v("w") > 0 ? 2 : 1, kd = on && v("p") > 0 && v("p") < 1;
    if (ph * 2 + kd !== lit) { lit = ph * 2 + kd; read.textContent = ["rest", "tap", "tap", "paid", "paid"][ph];
      light([card, cardCr, marks], ph === 1); light(arcs, ph === 2); light([amount, check], ph > 2); light([paper, bars], ph === 4); light(fk[2], kd); }
    return Object.values(Ch).some((w) => !done(w, now));
  });
  bag.add(B.unregister);
  const mo = new MutationObserver(() => B.wake()); mo.observe(stage, { attributes: true, attributeFilter: ["data-amount", "data-logo"] }); bag.add(() => mo.disconnect());
  // the hit area: the machine and the card where they rest, each the hull of its samples on screen. Nothing in it ever moves
  const HITS = [hull(machine.map((p) => P(...p))), hull(cardR(pose(0, 0)).flatMap(samp).map((s) => P(...wpt(s))))];
  const side2 = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inHit = (p) => HITS.some((H) => new Set(H.map((a, i) => side2(p, a, H[(i + 1) % H.length])).filter((s) => s)).size < 2);
  const hover = (v) => { if (v !== on) (v ? enter : leave)(performance.now()); };
  bag.add(pointer(stage, { move: (p) => hover(inHit(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren()); read.textContent = "rest"; B.wake();
  return { set: (v) => { iv = v; }, destroy: bag.dispose };
}

hairline({
  name: "edc",
  means: "Hover and the card taps the EDC, the amount appears, and the receipt prints.",
  rules: [1, 4, 5, 6, 8],
  // ms the whole payment takes, from the pointer's arrival to the receipt's last row
  range: [1900, 2300, 2700],
  mount,
});
