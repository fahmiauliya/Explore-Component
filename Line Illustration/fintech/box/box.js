/**
 * Box: a closed cardboard subscription box on a low plate, its long side along x, so its front (+x) faces the lower
 * right. Its top is four flaps that tile it: two main flaps hinged on the long edges meet along the centre seam, and two
 * short side flaps hinged on the ends meet them along two cross seams. A strip of clear tape runs along the centre seam,
 * over both side flaps and down the front. Hover the box: the far pair swings out about its hinges, then the near pair,
 * each to 110°, the tape parting along the seams with its flaps, and the open top shows its rim and the two far inner
 * walls. Then a small cube rises out, a letter on its top, and lights. Leave and the cube sinks back, the flaps close in
 * exactly the reverse order and the tape is whole again: the box that arrives every month.
 *
 * Every flap is a rounded rectangle in its own rotated plane, so its corners are true arcs, and the camera is affine, so
 * each arc is a cubic Bézier projected control point by control point. The flaps tile the top, so the planes x = ±SX and
 * y = 0 separate every pair at any angle: back to front they are always far side, far main, near main, near side. The
 * hit area is the open pose, never moved.
 */
const { Cam, fit, proj, hull, tween, bezier, clamp, reducedMotion, disposer, mk, pointer, register } = HL;

const Q = Math.PI / 2, deg = (d) => (d * Math.PI) / 180;
// plate PX × PY half, Z0 high; the box BX deep (x), BY wide (y), corners BR, standing from Z0 to ZT
const PX = 24, PY = 20, PR = 5, Z0 = 3, BX = 18, BY = 14, BR = 2.5, ZT = Z0 + 24;
// every flap opens to OPEN; side flaps SD deep, so the main ones span ±SX; tiling corners round RS. Tape TW either side
// of the seam, running TD down the front
const OPEN = deg(110), SD = 7, SX = BX - SD, RS = 0.6, TW = 3, TD = 5.5;
// the item: a rounded cube 2·IC on a side, corners IR, on the floor at Z0; it rises LIFT, its top 9 above the rim, clear of the open flaps.
// Its letter, on its top: a Geist Medium glyph, outline only, its cap height CAP (about half the top across)
const IC = 7.5, IR = 2, LIFT = 18, CAP = 7.2;
// The letters the item can carry, A–Z and 0–9: Geist Medium's outlines (opentype.js), cap height 1, centred, y down; each is drawn as its outline only, counters included, so the figure needs no font.
const GLYPHS = {"0":"M-0.001 0.523Q-0.125 0.523 -0.216 0.459Q-0.308 0.396 -0.357 0.278Q-0.406 0.161 -0.406 0.001L-0.406 0.001Q-0.406 -0.158 -0.356 -0.276Q-0.306 -0.394 -0.215 -0.458Q-0.123 -0.523 -0.001 -0.523L-0.001 -0.523Q0.123 -0.523 0.215 -0.459Q0.308 -0.396 0.357 -0.277Q0.406 -0.159 0.406 0.001L0.406 0.001Q0.406 0.161 0.357 0.278Q0.308 0.396 0.215 0.459Q0.123 0.523 -0.001 0.523L-0.001 0.523ZM-0.001 0.383Q0.12 0.383 0.185 0.285Q0.249 0.186 0.249 0.001L0.249 0.001Q0.249 -0.185 0.185 -0.284Q0.12 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.119 -0.383 -0.184 -0.284Q-0.249 -0.185 -0.249 0.001L-0.249 0.001Q-0.249 0.186 -0.184 0.285Q-0.119 0.383 -0.001 0.383L-0.001 0.383Z","1":"M0.03 0.5L0.03 -0.213L-0.182 -0.213L-0.182 -0.335L-0.096 -0.335Q-0.008 -0.335 0.027 -0.371Q0.062 -0.407 0.062 -0.5L0.062 -0.5L0.182 -0.5L0.182 0.5L0.03 0.5Z","2":"M-0.361 0.5Q-0.361 0.383 -0.326 0.296Q-0.292 0.208 -0.211 0.133Q-0.13 0.058 0.014 -0.018L0.014 -0.018Q0.087 -0.056 0.127 -0.085Q0.166 -0.114 0.185 -0.146Q0.203 -0.179 0.203 -0.225L0.203 -0.225Q0.203 -0.297 0.156 -0.34Q0.11 -0.383 0.023 -0.383L0.023 -0.383Q-0.073 -0.383 -0.128 -0.332Q-0.183 -0.282 -0.199 -0.185L-0.199 -0.185L-0.356 -0.194Q-0.341 -0.348 -0.242 -0.435Q-0.142 -0.523 0.023 -0.523L0.023 -0.523Q0.127 -0.523 0.204 -0.486Q0.28 -0.449 0.32 -0.382Q0.361 -0.315 0.361 -0.228L0.361 -0.228Q0.361 -0.151 0.335 -0.096Q0.31 -0.042 0.252 0.004Q0.194 0.049 0.09 0.106L0.09 0.106Q-0.035 0.173 -0.104 0.24Q-0.172 0.307 -0.176 0.361L-0.176 0.361L0.361 0.361L0.361 0.5L-0.361 0.5Z","3":"M-0.006 0.523Q-0.175 0.523 -0.27 0.444Q-0.365 0.365 -0.373 0.231L-0.373 0.231L-0.216 0.223Q-0.209 0.304 -0.154 0.344Q-0.098 0.383 -0.006 0.383L-0.006 0.383Q0.091 0.383 0.153 0.342Q0.215 0.301 0.215 0.215L0.215 0.215Q0.215 0.128 0.156 0.084Q0.096 0.039 -0.008 0.039L-0.008 0.039L-0.089 0.039L-0.089 -0.093L-0.008 -0.093Q0.08 -0.093 0.13 -0.127Q0.18 -0.162 0.18 -0.238L0.18 -0.238Q0.18 -0.308 0.134 -0.346Q0.088 -0.383 -0.002 -0.383L-0.002 -0.383Q-0.174 -0.383 -0.195 -0.252L-0.195 -0.252L-0.351 -0.261Q-0.337 -0.38 -0.246 -0.451Q-0.154 -0.523 -0.002 -0.523L-0.002 -0.523Q0.157 -0.523 0.247 -0.449Q0.337 -0.376 0.337 -0.249L0.337 -0.249Q0.337 -0.17 0.294 -0.116Q0.25 -0.062 0.165 -0.035L0.165 -0.035Q0.263 -0.008 0.318 0.059Q0.373 0.127 0.373 0.221L0.373 0.221Q0.373 0.314 0.325 0.382Q0.278 0.451 0.192 0.487Q0.106 0.523 -0.006 0.523L-0.006 0.523Z","4":"M0.115 0.5L0.115 0.292L-0.389 0.292L-0.389 0.162L0.096 -0.5L0.268 -0.5L0.268 0.154L0.389 0.154L0.389 0.292L0.268 0.292L0.268 0.5L0.115 0.5ZM-0.215 0.154L0.115 0.154L0.115 -0.289L-0.215 0.154Z","5":"M-0.002 0.523Q-0.165 0.523 -0.261 0.445Q-0.357 0.368 -0.368 0.237L-0.368 0.237L-0.212 0.227Q-0.202 0.304 -0.146 0.344Q-0.091 0.383 -0.002 0.383L-0.002 0.383Q0.096 0.383 0.154 0.327Q0.211 0.272 0.211 0.175L0.211 0.175Q0.211 0.077 0.154 0.02Q0.096 -0.037 -0.004 -0.037L-0.004 -0.037Q-0.071 -0.037 -0.123 -0.008Q-0.174 0.02 -0.196 0.069L-0.196 0.069L-0.354 0.069L-0.287 -0.5L0.299 -0.5L0.299 -0.361L-0.151 -0.361L-0.185 -0.083Q-0.147 -0.123 -0.091 -0.144Q-0.035 -0.166 0.032 -0.166L0.032 -0.166Q0.13 -0.166 0.207 -0.123Q0.284 -0.079 0.326 -0.001Q0.368 0.076 0.368 0.175L0.368 0.175Q0.368 0.277 0.322 0.356Q0.275 0.435 0.191 0.479Q0.106 0.523 -0.002 0.523L-0.002 0.523Z","6":"M0.001 0.523Q-0.176 0.523 -0.27 0.406Q-0.365 0.289 -0.365 0.072L-0.365 0.072Q-0.365 -0.196 -0.268 -0.359Q-0.17 -0.523 0.038 -0.523L0.038 -0.523Q0.17 -0.523 0.25 -0.458Q0.33 -0.393 0.361 -0.277L0.361 -0.277L0.21 -0.265Q0.192 -0.324 0.151 -0.354Q0.111 -0.385 0.038 -0.385L0.038 -0.385Q-0.069 -0.385 -0.133 -0.301Q-0.197 -0.217 -0.211 -0.051L-0.211 -0.051Q-0.175 -0.104 -0.112 -0.136Q-0.049 -0.168 0.031 -0.168L0.031 -0.168Q0.13 -0.168 0.206 -0.126Q0.282 -0.085 0.323 -0.008Q0.365 0.069 0.365 0.169L0.365 0.169Q0.365 0.277 0.319 0.358Q0.273 0.438 0.191 0.48Q0.108 0.523 0.001 0.523L0.001 0.523ZM0.003 0.387Q0.094 0.387 0.151 0.329Q0.208 0.27 0.208 0.169L0.208 0.169Q0.208 0.075 0.154 0.018Q0.1 -0.039 0.013 -0.039L0.013 -0.039Q-0.083 -0.039 -0.144 0.018Q-0.206 0.075 -0.206 0.169L-0.206 0.169Q-0.206 0.266 -0.149 0.327Q-0.092 0.387 0.003 0.387L0.003 0.387Z","7":"M-0.144 0.5Q-0.144 0.272 -0.054 0.049Q0.037 -0.173 0.199 -0.361L0.199 -0.361L-0.359 -0.361L-0.359 -0.5L0.359 -0.5L0.359 -0.37Q0.177 -0.165 0.094 0.04Q0.011 0.245 0.011 0.5L0.011 0.5L-0.144 0.5Z","8":"M0 0.523Q-0.176 0.523 -0.281 0.446Q-0.386 0.369 -0.386 0.227L-0.386 0.227Q-0.386 0.13 -0.334 0.062Q-0.282 -0.006 -0.189 -0.038L-0.189 -0.038Q-0.261 -0.065 -0.299 -0.118Q-0.338 -0.172 -0.338 -0.248L-0.338 -0.248Q-0.338 -0.328 -0.297 -0.39Q-0.256 -0.452 -0.18 -0.487Q-0.103 -0.523 0 -0.523L0 -0.523Q0.103 -0.523 0.179 -0.487Q0.255 -0.452 0.296 -0.389Q0.337 -0.327 0.337 -0.248L0.337 -0.248Q0.337 -0.097 0.187 -0.038L0.187 -0.038Q0.28 -0.007 0.333 0.061Q0.386 0.13 0.386 0.227L0.386 0.227Q0.386 0.368 0.281 0.445Q0.176 0.523 0 0.523L0 0.523ZM0 0.383Q0.106 0.383 0.166 0.339Q0.227 0.296 0.227 0.211L0.227 0.211Q0.227 0.128 0.169 0.08Q0.111 0.031 0 0.031L0 0.031Q-0.113 0.031 -0.17 0.08Q-0.228 0.128 -0.228 0.211L-0.228 0.211Q-0.228 0.296 -0.168 0.339Q-0.107 0.383 0 0.383L0 0.383ZM0 -0.094Q0.087 -0.094 0.134 -0.131Q0.18 -0.168 0.18 -0.241L0.18 -0.241Q0.18 -0.307 0.133 -0.346Q0.086 -0.385 0 -0.385L0 -0.385Q-0.087 -0.385 -0.135 -0.346Q-0.182 -0.307 -0.182 -0.241L-0.182 -0.241Q-0.182 -0.168 -0.135 -0.131Q-0.087 -0.094 0 -0.094L0 -0.094Z","9":"M-0.03 0.523Q-0.157 0.523 -0.239 0.462Q-0.32 0.401 -0.351 0.296L-0.351 0.296L-0.198 0.286Q-0.165 0.385 -0.03 0.385L-0.03 0.385Q0.081 0.385 0.14 0.306Q0.199 0.227 0.209 0.055L0.209 0.055Q0.17 0.115 0.108 0.147Q0.046 0.179 -0.033 0.179L-0.033 0.179Q-0.13 0.179 -0.206 0.136Q-0.281 0.093 -0.323 0.015Q-0.365 -0.063 -0.365 -0.165L-0.365 -0.165Q-0.365 -0.273 -0.32 -0.354Q-0.275 -0.435 -0.194 -0.479Q-0.113 -0.523 -0.009 -0.523L-0.009 -0.523Q0.18 -0.523 0.273 -0.399Q0.365 -0.276 0.365 -0.051L0.365 -0.051Q0.365 0.22 0.271 0.371Q0.177 0.523 -0.03 0.523L-0.03 0.523ZM-0.012 0.048Q0.084 0.048 0.142 -0.008Q0.201 -0.065 0.201 -0.165L0.201 -0.165Q0.201 -0.263 0.145 -0.325Q0.089 -0.387 -0.006 -0.387L-0.006 -0.387Q-0.101 -0.387 -0.156 -0.327Q-0.211 -0.266 -0.211 -0.166L-0.211 -0.166Q-0.211 -0.069 -0.156 -0.011Q-0.101 0.048 -0.012 0.048L-0.012 0.048Z","A":"M-0.458 0.5L-0.097 -0.5L0.097 -0.5L0.458 0.5L0.294 0.5L0.204 0.239L-0.204 0.239L-0.296 0.5L-0.458 0.5ZM-0.156 0.101L0.156 0.101L0 -0.355L-0.156 0.101Z","B":"M-0.382 0.5L-0.382 -0.5L-0.023 -0.5Q0.158 -0.5 0.249 -0.435Q0.34 -0.369 0.34 -0.23L0.34 -0.23Q0.34 -0.144 0.291 -0.087Q0.242 -0.03 0.153 -0.017L0.153 -0.017Q0.261 -0.004 0.322 0.06Q0.382 0.124 0.382 0.225L0.382 0.225Q0.382 0.362 0.292 0.431Q0.201 0.5 0.03 0.5L0.03 0.5L-0.382 0.5ZM0.026 0.363Q0.122 0.363 0.174 0.325Q0.226 0.286 0.226 0.211L0.226 0.211Q0.226 0.138 0.173 0.097Q0.12 0.056 0.026 0.056L0.026 0.056L-0.23 0.056L-0.23 0.363L0.026 0.363ZM-0.026 -0.073Q0.074 -0.073 0.129 -0.111Q0.184 -0.149 0.184 -0.218L0.184 -0.218Q0.184 -0.363 -0.026 -0.363L-0.026 -0.363L-0.23 -0.363L-0.23 -0.073L-0.026 -0.073Z","C":"M0.012 0.523Q-0.123 0.523 -0.227 0.46Q-0.33 0.397 -0.387 0.28Q-0.444 0.162 -0.444 0.001L-0.444 0.001Q-0.444 -0.158 -0.387 -0.276Q-0.33 -0.394 -0.227 -0.458Q-0.123 -0.523 0.013 -0.523L0.013 -0.523Q0.194 -0.523 0.299 -0.432Q0.404 -0.341 0.437 -0.172L0.437 -0.172L0.277 -0.163Q0.256 -0.269 0.19 -0.326Q0.125 -0.383 0.013 -0.383L0.013 -0.383Q-0.077 -0.383 -0.144 -0.337Q-0.212 -0.29 -0.249 -0.204Q-0.287 -0.117 -0.287 0.001L-0.287 0.001Q-0.287 0.12 -0.249 0.206Q-0.212 0.292 -0.144 0.337Q-0.077 0.383 0.012 0.383L0.012 0.383Q0.13 0.383 0.198 0.32Q0.265 0.258 0.284 0.142L0.284 0.142L0.444 0.151Q0.415 0.325 0.304 0.424Q0.194 0.523 0.012 0.523L0.012 0.523Z","D":"M-0.405 0.5L-0.405 -0.5L-0.084 -0.5Q0.151 -0.5 0.278 -0.37Q0.405 -0.239 0.405 0.001L0.405 0.001Q0.405 0.241 0.28 0.37Q0.156 0.5 -0.075 0.5L-0.075 0.5L-0.405 0.5ZM-0.084 0.361Q0.247 0.361 0.247 0.001L0.247 0.001Q0.247 -0.182 0.165 -0.271Q0.082 -0.361 -0.084 -0.361L-0.084 -0.361L-0.253 -0.361L-0.253 0.361L-0.084 0.361Z","E":"M-0.331 0.5L-0.331 -0.5L0.32 -0.5L0.32 -0.361L-0.179 -0.361L-0.179 -0.069L0.303 -0.069L0.303 0.066L-0.179 0.066L-0.179 0.361L0.331 0.361L0.331 0.5L-0.331 0.5Z","F":"M-0.325 0.5L-0.325 -0.5L0.325 -0.5L0.325 -0.361L-0.173 -0.361L-0.173 -0.056L0.299 -0.056L0.299 0.079L-0.173 0.079L-0.173 0.5L-0.325 0.5Z","G":"M0.015 0.523Q-0.124 0.523 -0.226 0.456Q-0.328 0.39 -0.382 0.272Q-0.437 0.154 -0.437 0.001L-0.437 0.001Q-0.437 -0.149 -0.382 -0.268Q-0.327 -0.387 -0.223 -0.455Q-0.12 -0.523 0.021 -0.523L0.021 -0.523Q0.197 -0.523 0.3 -0.432Q0.403 -0.341 0.434 -0.186L0.434 -0.186L0.275 -0.177Q0.237 -0.383 0.023 -0.383L0.023 -0.383Q-0.127 -0.383 -0.203 -0.275Q-0.279 -0.168 -0.279 0.001L-0.279 0.001Q-0.279 0.173 -0.204 0.278Q-0.128 0.383 0.023 0.383L0.023 0.383Q0.101 0.383 0.162 0.348Q0.223 0.313 0.256 0.252Q0.289 0.192 0.292 0.118L0.292 0.118L0.024 0.118L0.024 -0.01L0.437 -0.01L0.437 0.5L0.332 0.5L0.325 0.341Q0.289 0.423 0.204 0.473Q0.118 0.523 0.015 0.523L0.015 0.523Z","H":"M-0.383 0.5L-0.383 -0.5L-0.231 -0.5L-0.231 -0.072L0.231 -0.072L0.231 -0.5L0.383 -0.5L0.383 0.5L0.231 0.5L0.231 0.066L-0.231 0.066L-0.231 0.5L-0.383 0.5Z","I":"M-0.076 0.5L-0.076 -0.5L0.076 -0.5L0.076 0.5L-0.076 0.5Z","J":"M-0.001 0.523Q-0.099 0.523 -0.175 0.477Q-0.251 0.431 -0.293 0.349Q-0.335 0.268 -0.335 0.163L-0.335 0.163L-0.18 0.155Q-0.178 0.266 -0.132 0.325Q-0.085 0.383 -0.001 0.383L-0.001 0.383Q0.088 0.383 0.135 0.323Q0.182 0.262 0.182 0.148L0.182 0.148L0.182 -0.5L0.335 -0.5L0.335 0.148Q0.335 0.262 0.294 0.346Q0.253 0.431 0.177 0.477Q0.101 0.523 -0.001 0.523L-0.001 0.523Z","K":"M-0.392 0.5L-0.392 -0.5L-0.239 -0.5L-0.239 -0.023L0.182 -0.5L0.366 -0.5L-0.017 -0.063L0.392 0.5L0.213 0.5L-0.118 0.044L-0.239 0.179L-0.239 0.5L-0.392 0.5Z","L":"M-0.32 0.5L-0.32 -0.5L-0.168 -0.5L-0.168 0.361L0.32 0.361L0.32 0.5L-0.32 0.5Z","M":"M-0.506 0.5L-0.506 -0.5L-0.297 -0.5L0 0.321L0.297 -0.5L0.506 -0.5L0.506 0.5L0.354 0.5L0.354 -0.232L0.085 0.499L-0.085 0.499L-0.354 -0.232L-0.354 0.5L-0.506 0.5Z","N":"M-0.404 0.5L-0.404 -0.5L-0.211 -0.5L0.251 0.315L0.251 -0.5L0.404 -0.5L0.404 0.5L0.204 0.5L-0.251 -0.297L-0.251 0.5L-0.404 0.5Z","O":"M-0.001 0.523Q-0.144 0.523 -0.249 0.46Q-0.354 0.397 -0.411 0.28Q-0.467 0.162 -0.467 0.001L-0.467 0.001Q-0.467 -0.159 -0.411 -0.277Q-0.354 -0.396 -0.249 -0.459Q-0.144 -0.523 -0.001 -0.523L-0.001 -0.523Q0.144 -0.523 0.25 -0.459Q0.356 -0.396 0.411 -0.277Q0.467 -0.159 0.467 0.001L0.467 0.001Q0.467 0.162 0.411 0.28Q0.356 0.397 0.25 0.46Q0.144 0.523 -0.001 0.523L-0.001 0.523ZM-0.001 0.383Q0.146 0.383 0.227 0.282Q0.309 0.182 0.309 0.001L0.309 0.001Q0.309 -0.179 0.227 -0.281Q0.144 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.144 -0.383 -0.227 -0.281Q-0.309 -0.179 -0.309 0.001L-0.309 0.001Q-0.309 0.182 -0.227 0.282Q-0.144 0.383 -0.001 0.383L-0.001 0.383Z","P":"M-0.368 0.5L-0.368 -0.5L0.005 -0.5Q0.175 -0.5 0.272 -0.418Q0.368 -0.335 0.368 -0.189L0.368 -0.189Q0.368 -0.042 0.272 0.042Q0.175 0.125 0.005 0.125L0.005 0.125L-0.216 0.125L-0.216 0.5L-0.368 0.5ZM0.001 -0.013Q0.104 -0.013 0.157 -0.057Q0.211 -0.101 0.211 -0.189L0.211 -0.189Q0.211 -0.275 0.158 -0.318Q0.105 -0.361 0.001 -0.361L0.001 -0.361L-0.216 -0.361L-0.216 -0.013L0.001 -0.013Z","Q":"M0.175 0.49Q0.101 0.523 -0.001 0.523L-0.001 0.523Q-0.142 0.523 -0.246 0.454Q-0.351 0.386 -0.407 0.268Q-0.463 0.149 -0.463 0.001L-0.463 0.001Q-0.463 -0.146 -0.408 -0.265Q-0.353 -0.385 -0.249 -0.454Q-0.144 -0.523 -0.001 -0.523L-0.001 -0.523Q0.144 -0.523 0.249 -0.454Q0.354 -0.385 0.408 -0.265Q0.463 -0.146 0.463 0.001L0.463 0.001Q0.463 0.141 0.414 0.254Q0.365 0.366 0.275 0.435L0.275 0.435L0.402 0.594L0.256 0.594L0.175 0.49ZM-0.001 0.383Q0.058 0.383 0.085 0.37L0.085 0.37L-0.057 0.192L0.088 0.192L0.184 0.318Q0.305 0.218 0.305 0.001L0.305 0.001Q0.305 -0.106 0.271 -0.193Q0.237 -0.28 0.168 -0.332Q0.099 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.101 -0.383 -0.169 -0.332Q-0.237 -0.28 -0.271 -0.193Q-0.305 -0.106 -0.305 0.001L-0.305 0.001Q-0.305 0.108 -0.27 0.195Q-0.236 0.282 -0.168 0.332Q-0.099 0.383 -0.001 0.383L-0.001 0.383Z","R":"M-0.377 0.5L-0.377 -0.5L0.021 -0.5Q0.18 -0.5 0.274 -0.418Q0.368 -0.337 0.368 -0.199L0.368 -0.199Q0.368 -0.114 0.319 -0.051Q0.27 0.013 0.197 0.035L0.197 0.035Q0.337 0.056 0.351 0.208L0.351 0.208L0.377 0.5L0.224 0.5L0.2 0.228Q0.196 0.166 0.158 0.138Q0.121 0.11 0.039 0.11L0.039 0.11L-0.225 0.11L-0.225 0.5L-0.377 0.5ZM0.024 -0.03Q0.11 -0.03 0.16 -0.073Q0.21 -0.115 0.21 -0.194L0.21 -0.194Q0.21 -0.275 0.158 -0.318Q0.107 -0.361 0.011 -0.361L0.011 -0.361L-0.225 -0.361L-0.225 -0.03L0.024 -0.03Z","S":"M0.021 0.523Q-0.097 0.523 -0.185 0.48Q-0.273 0.437 -0.325 0.358Q-0.376 0.28 -0.385 0.177L-0.385 0.177L-0.228 0.168Q-0.214 0.273 -0.151 0.329Q-0.087 0.385 0.024 0.385L0.024 0.385Q0.123 0.385 0.175 0.348Q0.228 0.311 0.228 0.241L0.228 0.241Q0.228 0.196 0.207 0.164Q0.186 0.132 0.129 0.105Q0.072 0.077 -0.037 0.051L-0.037 0.051Q-0.159 0.021 -0.23 -0.015Q-0.3 -0.051 -0.332 -0.102Q-0.363 -0.154 -0.363 -0.232L-0.363 -0.232Q-0.363 -0.318 -0.322 -0.384Q-0.28 -0.449 -0.201 -0.486Q-0.123 -0.523 -0.017 -0.523L-0.017 -0.523Q0.149 -0.523 0.249 -0.433Q0.348 -0.344 0.365 -0.197L0.365 -0.197L0.21 -0.189Q0.197 -0.279 0.139 -0.332Q0.08 -0.385 -0.02 -0.385L-0.02 -0.385Q-0.106 -0.385 -0.156 -0.344Q-0.207 -0.304 -0.207 -0.238L-0.207 -0.238Q-0.207 -0.193 -0.187 -0.165Q-0.166 -0.138 -0.115 -0.117Q-0.063 -0.096 0.037 -0.072L0.037 -0.072Q0.225 -0.028 0.305 0.045Q0.385 0.118 0.385 0.232L0.385 0.232Q0.385 0.321 0.339 0.387Q0.293 0.452 0.211 0.487Q0.128 0.523 0.021 0.523L0.021 0.523Z","T":"M-0.076 0.5L-0.076 -0.361L-0.383 -0.361L-0.383 -0.5L0.383 -0.5L0.383 -0.361L0.076 -0.361L0.076 0.5L-0.076 0.5Z","U":"M0 0.523Q-0.118 0.523 -0.206 0.477Q-0.294 0.431 -0.342 0.346Q-0.389 0.261 -0.389 0.146L-0.389 0.146L-0.389 -0.501L-0.237 -0.501L-0.237 0.146Q-0.237 0.261 -0.175 0.322Q-0.113 0.383 0 0.383L0 0.383Q0.113 0.383 0.175 0.322Q0.237 0.261 0.237 0.146L0.237 0.146L0.237 -0.501L0.389 -0.501L0.389 0.146Q0.389 0.261 0.342 0.346Q0.294 0.431 0.206 0.477Q0.118 0.523 0 0.523L0 0.523Z","V":"M-0.095 0.5L-0.457 -0.5L-0.295 -0.5L0.001 0.331L0.295 -0.5L0.457 -0.5L0.095 0.5L-0.095 0.5Z","W":"M-0.363 0.5L-0.629 -0.5L-0.465 -0.5L-0.271 0.29L-0.077 -0.5L0.077 -0.5L0.273 0.29L0.465 -0.5L0.629 -0.5L0.364 0.5L0.185 0.5L-0.001 -0.23L-0.187 0.5L-0.363 0.5Z","X":"M-0.427 0.5L-0.094 -0.001L-0.424 -0.5L-0.245 -0.5L0.001 -0.12L0.244 -0.5L0.421 -0.5L0.092 -0.004L0.427 0.5L0.248 0.5L-0.001 0.114L-0.249 0.5L-0.427 0.5Z","Y":"M-0.075 0.5L-0.075 0.099L-0.427 -0.5L-0.253 -0.5L0.001 -0.054L0.253 -0.5L0.427 -0.5L0.077 0.099L0.077 0.5L-0.075 0.5Z","Z":"M-0.356 0.5L-0.356 0.359L0.161 -0.361L-0.337 -0.361L-0.337 -0.5L0.341 -0.5L0.341 -0.359L-0.177 0.361L0.356 0.361L0.356 0.5L-0.356 0.5Z"};
// a gentle ease-in-out, no overshoot: each flap takes FL ms, the next starting one stagger (the slider) later; the item
// rises in IU ms once the flaps are open, and sinks in ID ms before they close
const EASE = bezier(0.42, 0, 0.58, 1), FL = 500, IU = 600, ID = 500, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
// the flaps in opening order: far main (back right), far side (back left), near main (front left), near side (front
// right). h: hinge middle, e: along the hinge, n: inward (the closed flap's direction), a: half its hinge length, l: its
// length, r: its hinge corners' radius (a side flap's follow the box's corners)
const FLAPS = [{ h: [0, -BY, ZT], e: EX, n: [0, 1, 0], a: SX, l: BY, r: RS }, { h: [-BX, 0, ZT], e: EY, n: [1, 0, 0], a: BY, l: SD, r: BR },
  { h: [0, BY, ZT], e: EX, n: [0, -1, 0], a: SX, l: BY, r: RS }, { h: [BX, 0, ZT], e: EY, n: [-1, 0, 0], a: BY, l: SD, r: BR }];
const DEPTH = [1, 0, 2, 3]; // back to front, at every angle
const add = (...ts) => [0, 1, 2].map((i) => ts.reduce((s, [k, u]) => s + k * u[i], 0));
const dirOf = (f, th) => add([Math.cos(th), f.n], [Math.sin(th), EZ]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;
  const C = Cam(45, 0.5, 3.85);
  const free = (f, th, u) => add([1, f.h], [u, f.e], [f.l, dirOf(f, th)]);
  const reach = FLAPS.flatMap((f) => [free(f, OPEN, -f.a), free(f, OPEN, f.a)]);
  const cube = (z) => [-1, 1].flatMap((a) => [-1, 1].map((b) => [a * IC, b * IC, z]));
  const plate = [-1, 1].flatMap((a) => [-1, 1].map((b) => [a * PX, b * PY, 0]));
  // fitted to the pose the box was first drawn with (flaps the full rim edges, far ones at 128°, the item's top at 33), so it keeps its place
  const first = [[[0, -BY, ZT], EX, [0, 1, 0], BX, BY, 128], [[-BX, 0, ZT], EY, [1, 0, 0], BY, BY - 1, 128], [[0, BY, ZT], EX, [0, -1, 0], BX, BY, 110], [[BX, 0, ZT], EY, [-1, 0, 0], BY, BY - 1, 110]];
  fit(C, plate.concat(first.flatMap(([h, e, n, a, l, o]) => [-1, 1].map((s) => free({ h, e, n, l }, deg(o), s * a))), cube(33)), 200, 160);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; };
  const pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  const FR = Math.atan2(J(EY)[0], J(EX)[0]); // the plan angle of a horizontal ring's right extreme on screen

  // every curve is a cubic Bézier of a world arc (≤ 90°, k = 4/3·tan(Δ/4)): the camera is affine, so it projects exactly
  const at3 = (c, e1, e2, r, f) => add([1, c], [r * Math.cos(f), e1], [r * Math.sin(f), e2]);
  function arc(c, e1, e2, r, f0, f1, move) {
    const n = Math.max(1, Math.ceil(Math.abs(f1 - f0) / Q - 1e-9)), h = (f1 - f0) / n, k = (4 / 3) * Math.tan(h / 4);
    const tan = (f) => add([-r * Math.sin(f), e1], [r * Math.cos(f), e2]);
    let d = `${move ? "M" : "L"}${pt(at3(c, e1, e2, r, f0))}`;
    for (let i = 0; i < n; i++) {
      const a = f0 + i * h, b = a + h, p0 = at3(c, e1, e2, r, a), p3 = at3(c, e1, e2, r, b);
      d += `C${pt(add([1, p0], [k, tan(a)]))} ${pt(add([1, p3], [-k, tan(b)]))} ${pt(p3)}`;
    }
    return d;
  }
  /** Part of a rounded rectangle's outline in plan (centre 0, half sizes hx, hy, corner r) at height z, from plan angle
   * f0 to f1, either way round: a quarter arc per corner, joined by its straight sides. */
  function rrun(hx, hy, r, z, f0, f1, move) {
    const s = Math.sign(f1 - f0);
    let d = "", f = f0, first = move;
    while ((f1 - f) * s > 1e-9) {
      const nb = s > 0 ? (Math.floor(f / Q + 1e-9) + 1) * Q : (Math.ceil(f / Q - 1e-9) - 1) * Q;
      const stop = s > 0 ? Math.min(f1, nb) : Math.max(f1, nb), m = (f + stop) / 2;
      const c = [Math.sign(Math.cos(m)) * (hx - r), Math.sign(Math.sin(m)) * (hy - r), z];
      d += arc(c, EX, EY, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  // a rounded solid: its silhouette (top's far half, bottom's near half), its crease (top's near half), and its front
  // walls (top's near half down to the bottom's near half), the part that hides what stands inside it
  const sil = (hx, hy, r, z0, z1) => rrun(hx, hy, r, z1, FR + 2 * Q, FR + 4 * Q, true) + rrun(hx, hy, r, z0, FR, FR + 2 * Q, false) + "Z";
  const crease = (hx, hy, r, z) => rrun(hx, hy, r, z, FR, FR + 2 * Q, true);
  const walls = (hx, hy, r, z0, z1) => rrun(hx, hy, r, z1, FR + 2 * Q, FR, true) + rrun(hx, hy, r, z0, FR, FR + 2 * Q, false) + "Z";
  /** A rounded rectangle in the plane (o; e1, e2), u0..u1 by v0..v1, each corner its own radius, closed. */
  function rr(o, e1, e2, [u0, v0, u1, v1], rs) {
    const cs = [[u1 - rs[0], v0 + rs[0]], [u1 - rs[1], v1 - rs[1]], [u0 + rs[2], v1 - rs[2]], [u0 + rs[3], v0 + rs[3]]];
    return cs.map(([u, v], i) => arc(add([1, o], [u, e1], [v, e2]), e1, e2, rs[i], (i - 1) * Q, i * Q, i === 0)).join("") + "Z";
  }
  const line = (a, b) => `M${pt(a)}L${pt(b)}`;
  /** A flap at angle th: its outline, and its piece of the tape, fixed to its outer face (so drawn only while that face
   * is the one seen): on a main flap one line TW in from the free edge (the seam is the tape's other side), on a side
   * flap the two lines TW either side of its middle, hinge to free edge. */
  function flap(f, th) {
    const d = dirOf(f, th), o = f.h, at = (u, v) => add([1, o], [u, f.e], [v, d]);
    const out = rr(o, f.e, d, [-f.a, 0, f.a, f.l], [f.r, RS, RS, f.r]);
    if (behind(f, th)) return out;
    return out + (f.l === SD ? line(at(-TW, 0), at(-TW, f.l)) + line(at(TW, 0), at(TW, f.l)) : line(at(-f.a, f.l - TW), at(f.a, f.l - TW)));
  }
  /** Whether a flap at th has turned past edge-on on screen, out beyond its rim: then its inner face is the one seen. */
  const cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  const behind = (f, th) => Math.sign(cr(J(f.e), J(dirOf(f, th)))) !== Math.sign(cr(J(f.e), J(f.n)));

  // back to front: plate; the box (its far rim); the far inner corner; the far flaps once the item is up; the item and its
  // letter; the near walls (the near rim) and the tape's drop on them; the flaps. The far flaps move only while the item is
  // down inside the box, and stand out beyond the far rim behind it while it is up
  const g = mk("g", {}, svg), path = (d, cls, parent = g) => mk("path", { d, class: cls }, parent);
  path(sil(PX, PY, PR, 0, Z0), "sil"); path(crease(PX, PY, PR, Z0), "nf sil");
  const q = BR * (1 - Math.SQRT1_2);
  path(sil(BX, BY, BR, Z0, ZT), "sil");
  path(line([-BX + q, -BY + q, ZT], [-BX + q, -BY + q, Z0]), "nf sil"); // where the two far inner walls meet
  const back = mk("g", {}, g);
  const ig = mk("g", {}, g), item = path("", "sil", ig), mark = path("", "nf sil", ig);
  path(walls(BX, BY, BR, Z0, ZT), "sil");
  path(rr([BX, 0, ZT], EY, [0, 0, -1], [-TW, 0, TW, TD], [0, RS, RS, 0]), "sil"); // the drop: on the wall, cut at the rim
  const front = mk("g", {}, g), flaps = FLAPS.map(() => path("", "sil", front));

  // the letter on the item's top, read from the box's front (+x, lower right): the glyph's x runs along −y (left to
  // right on screen) and its y (down) along +x (toward the viewer). The camera is affine, so projecting each point and
  // control point lays the outline flat on the top exactly
  const glyph = () => { const ch = (Array.from((stage.getAttribute("data-mark") || "").trim())[0] || "C").toUpperCase(); return GLYPHS[ch] ? ch : "C"; };
  const n2 = (v) => Math.round(v * 100) / 100, at = (u, v, z) => P(u * CAP, -v * CAP, z).map(n2).join(" ");
  const letter = (ch, z) => mark.setAttribute("d", GLYPHS[ch].replace(/([MLQ])([^MLQZ]+)/g, (_, c, ns) => {
    const n = ns.trim().split(" ").map(Number), pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push(at(n[i + 1], n[i], z + 2 * IC));
    return c + pts.join(" ");
  }));
  const watch = new MutationObserver(() => B.wake());
  watch.observe(stage, { attributes: true, attributeFilter: ["data-mark"] });
  bag.add(() => watch.disconnect());

  // a tween read on EASE; retargeted from where it is, so an interrupted move carries on with no jump
  const fw = FLAPS.map(() => tween(0)), iw = tween(0);
  const tv = (tw, now) => (reducedMotion() ? tw.to : tw.from + (tw.to - tw.from) * EASE(clamp((now - tw.t0) / tw.dur, 0, 1)));
  const tdone = (tw, now) => reducedMotion() || now >= tw.t0 + tw.dur;
  let on = false, last = [], lastI = NaN, lastC = "", order = "", state = "";
  function draw(now) {
    const ths = fw.map((t) => OPEN * tv(t, now)), z = Z0 + LIFT * tv(iw, now), ch = glyph();
    ths.forEach((th, i) => { if (th !== last[i]) flaps[i].setAttribute("d", flap(FLAPS[i], th)); });
    last = ths;
    if (z !== lastI || ch !== lastC) {
      lastI = z; lastC = ch;
      item.setAttribute("d", sil(IC, IC, IR, z, z + 2 * IC) + crease(IC, IC, IR, z + 2 * IC));
      letter(ch, z);
    }
    const key = z > Z0 ? "up" : "down";
    if (key !== order) { order = key; DEPTH.forEach((i) => (key === "up" && i < 2 ? back : front).append(flaps[i])); }
  }

  const B = register(stage, (_dt, now) => {
    draw(now);
    // grey at rest and while the flaps open; once the box is open only the item and its letter are bright
    const s = !on ? "rest" : iw.to === 1 && tv(iw, now) > 0 ? "open" : "opening";
    if (s !== state) { state = s; [item, mark].forEach((el) => el.classList.toggle("hi", s === "open")); read.textContent = s; }
    return !(fw.every((t) => tdone(t, now)) && tdone(iw, now));
  });
  bag.add(B.unregister);

  // the hit area: the box from its foot to its open flaps and the risen item, as one hull on screen. It never moves
  const foot = [-1, 1].flatMap((u) => [-1, 1].map((v) => P(u * BX, v * BY, Z0)));
  const HIT = hull(foot.concat(reach.map((v) => P(...v)), cube(Z0 + LIFT + 2 * IC).map((v) => P(...v))));
  const side = (p, u, v) => Math.sign((v[0] - u[0]) * (p[1] - u[1]) - (v[1] - u[1]) * (p[0] - u[0]));
  const inside = (p) => new Set(HIT.map((u, i) => side(p, u, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  const go = (tw, to, now, delay, dur) => { if (tw.to !== to) Object.assign(tw, { from: tv(tw, now), to, t0: now + delay, dur: Math.max(60, dur) }); };
  /** Open: the flaps one stagger apart, far pair first, then the item. Close: the item, then the flaps in exactly the
   * reverse order. Flaps already where they are going are skipped, so the sequence picks up at the first still to move. */
  function hover(want) {
    if (want === on) return;
    on = want;
    const now = performance.now(), v = fw.map((t) => tv(t, now)), iv = tv(iw, now);
    if (on) {
      const k = v.findIndex((x) => x < 1), base = k < 0 ? 1e9 : k;
      let end = 0;
      fw.forEach((t, i) => { const dl = Math.max(0, i - base) * step, du = FL * (1 - v[i]); go(t, 1, now, dl, du); if (v[i] < 1) end = Math.max(end, dl + du); });
      go(iw, 1, now, end, IU * (1 - iv));
    } else {
      const k = [3, 2, 1, 0].find((i) => v[i] > 0), base = k === undefined ? 0 : 3 - k, lo = iv > 0 ? ID * iv : 0;
      go(iw, 0, now, 0, lo);
      fw.forEach((t, i) => go(t, 0, now, lo + Math.max(0, 3 - i - base) * step, FL * v[i]));
    }
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => hover(inside(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  B.wake();

  return { set: (val) => { step = val; }, destroy: bag.dispose };
}

hairline({
  name: "box",
  means: "A subscription box: hover it and its four flaps open, far pair then near pair, and this month's item rises out.",
  rules: [1, 4, 6, 8],
  // ms between one flap starting and the next; at 150 the box opens in 1.55 s and closes in 1.45 s
  range: [120, 150, 180],
  mount,
});
