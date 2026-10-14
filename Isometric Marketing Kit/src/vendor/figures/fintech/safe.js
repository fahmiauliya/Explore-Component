/**
 * Safe: a hollow cube safe, its door a rounded slab proud of the face toward the lower left (y = +BY), hung on its
 * front-left edge so it swings out to the left and never enters the body. On it: a large code window (four dashes), a
 * small lever on a hub by the free edge, two hinge marks off its left edge. Behind it a deep open hollow, only its
 * rim line drawn, and on its floor, well back, one object (data-inside: box, coins, or a cube with a Geist letter,
 * data-mark). Hover: the code fills in, the lever turns down, the door swings to 100° and the object lifts and lights;
 * leave and it all runs back from where it is. Every curve is a true Bézier of a world arc (the camera is affine).
 */
const DIGITS = {"0":"M0.429 -1 L0.286 -0.952 0.19 -0.81 0.143 -0.571 0.143 -0.429 0.19 -0.19 0.286 -0.048 0.429 0 0.524 0 0.667 -0.048 0.762 -0.19 0.81 -0.429 0.81 -0.571 0.762 -0.81 0.667 -0.952 0.524 -1 0.429 -1","1":"M0.286 -0.81 L0.381 -0.857 0.524 -1 0.524 0","2":"M0.19 -0.762 L0.19 -0.81 0.238 -0.905 0.286 -0.952 0.381 -1 0.571 -1 0.667 -0.952 0.714 -0.905 0.762 -0.81 0.762 -0.714 0.714 -0.619 0.619 -0.476 0.143 0 0.81 0","3":"M0.238 -1 L0.762 -1 0.476 -0.619 0.619 -0.619 0.714 -0.571 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19","4":"M0.619 -1 L0.143 -0.333 0.857 -0.333 M0.619 -1 L0.619 0","5":"M0.714 -1 L0.238 -1 0.19 -0.571 0.238 -0.619 0.381 -0.667 0.524 -0.667 0.667 -0.619 0.762 -0.524 0.81 -0.381 0.81 -0.286 0.762 -0.143 0.667 -0.048 0.524 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19","6":"M0.762 -0.857 L0.714 -0.952 0.571 -1 0.476 -1 0.333 -0.952 0.238 -0.81 0.19 -0.571 0.19 -0.333 0.238 -0.143 0.333 -0.048 0.476 0 0.524 0 0.667 -0.048 0.762 -0.143 0.81 -0.286 0.81 -0.333 0.762 -0.476 0.667 -0.571 0.524 -0.619 0.476 -0.619 0.333 -0.571 0.238 -0.476 0.19 -0.333","7":"M0.81 -1 L0.333 0 M0.143 -1 L0.81 -1","8":"M0.381 -1 L0.238 -0.952 0.19 -0.857 0.19 -0.762 0.238 -0.667 0.333 -0.619 0.524 -0.571 0.667 -0.524 0.762 -0.429 0.81 -0.333 0.81 -0.19 0.762 -0.095 0.714 -0.048 0.571 0 0.381 0 0.238 -0.048 0.19 -0.095 0.143 -0.19 0.143 -0.333 0.19 -0.429 0.286 -0.524 0.429 -0.571 0.619 -0.619 0.714 -0.667 0.762 -0.762 0.762 -0.857 0.714 -0.952 0.571 -1 0.381 -1","9":"M0.762 -0.667 L0.714 -0.524 0.619 -0.429 0.476 -0.381 0.429 -0.381 0.286 -0.429 0.19 -0.524 0.143 -0.667 0.143 -0.714 0.19 -0.857 0.286 -0.952 0.429 -1 0.476 -1 0.619 -0.952 0.714 -0.857 0.762 -0.667 0.762 -0.429 0.714 -0.19 0.619 -0.048 0.476 0 0.381 0 0.238 -0.048 0.19 -0.143"};
const GLYPHS = {"0":"M-0.001 0.523Q-0.125 0.523 -0.216 0.459Q-0.308 0.396 -0.357 0.278Q-0.406 0.161 -0.406 0.001L-0.406 0.001Q-0.406 -0.158 -0.356 -0.276Q-0.306 -0.394 -0.215 -0.458Q-0.123 -0.523 -0.001 -0.523L-0.001 -0.523Q0.123 -0.523 0.215 -0.459Q0.308 -0.396 0.357 -0.277Q0.406 -0.159 0.406 0.001L0.406 0.001Q0.406 0.161 0.357 0.278Q0.308 0.396 0.215 0.459Q0.123 0.523 -0.001 0.523L-0.001 0.523ZM-0.001 0.383Q0.12 0.383 0.185 0.285Q0.249 0.186 0.249 0.001L0.249 0.001Q0.249 -0.185 0.185 -0.284Q0.12 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.119 -0.383 -0.184 -0.284Q-0.249 -0.185 -0.249 0.001L-0.249 0.001Q-0.249 0.186 -0.184 0.285Q-0.119 0.383 -0.001 0.383L-0.001 0.383Z","1":"M0.03 0.5L0.03 -0.213L-0.182 -0.213L-0.182 -0.335L-0.096 -0.335Q-0.008 -0.335 0.027 -0.371Q0.062 -0.407 0.062 -0.5L0.062 -0.5L0.182 -0.5L0.182 0.5L0.03 0.5Z","2":"M-0.361 0.5Q-0.361 0.383 -0.326 0.296Q-0.292 0.208 -0.211 0.133Q-0.13 0.058 0.014 -0.018L0.014 -0.018Q0.087 -0.056 0.127 -0.085Q0.166 -0.114 0.185 -0.146Q0.203 -0.179 0.203 -0.225L0.203 -0.225Q0.203 -0.297 0.156 -0.34Q0.11 -0.383 0.023 -0.383L0.023 -0.383Q-0.073 -0.383 -0.128 -0.332Q-0.183 -0.282 -0.199 -0.185L-0.199 -0.185L-0.356 -0.194Q-0.341 -0.348 -0.242 -0.435Q-0.142 -0.523 0.023 -0.523L0.023 -0.523Q0.127 -0.523 0.204 -0.486Q0.28 -0.449 0.32 -0.382Q0.361 -0.315 0.361 -0.228L0.361 -0.228Q0.361 -0.151 0.335 -0.096Q0.31 -0.042 0.252 0.004Q0.194 0.049 0.09 0.106L0.09 0.106Q-0.035 0.173 -0.104 0.24Q-0.172 0.307 -0.176 0.361L-0.176 0.361L0.361 0.361L0.361 0.5L-0.361 0.5Z","3":"M-0.006 0.523Q-0.175 0.523 -0.27 0.444Q-0.365 0.365 -0.373 0.231L-0.373 0.231L-0.216 0.223Q-0.209 0.304 -0.154 0.344Q-0.098 0.383 -0.006 0.383L-0.006 0.383Q0.091 0.383 0.153 0.342Q0.215 0.301 0.215 0.215L0.215 0.215Q0.215 0.128 0.156 0.084Q0.096 0.039 -0.008 0.039L-0.008 0.039L-0.089 0.039L-0.089 -0.093L-0.008 -0.093Q0.08 -0.093 0.13 -0.127Q0.18 -0.162 0.18 -0.238L0.18 -0.238Q0.18 -0.308 0.134 -0.346Q0.088 -0.383 -0.002 -0.383L-0.002 -0.383Q-0.174 -0.383 -0.195 -0.252L-0.195 -0.252L-0.351 -0.261Q-0.337 -0.38 -0.246 -0.451Q-0.154 -0.523 -0.002 -0.523L-0.002 -0.523Q0.157 -0.523 0.247 -0.449Q0.337 -0.376 0.337 -0.249L0.337 -0.249Q0.337 -0.17 0.294 -0.116Q0.25 -0.062 0.165 -0.035L0.165 -0.035Q0.263 -0.008 0.318 0.059Q0.373 0.127 0.373 0.221L0.373 0.221Q0.373 0.314 0.325 0.382Q0.278 0.451 0.192 0.487Q0.106 0.523 -0.006 0.523L-0.006 0.523Z","4":"M0.115 0.5L0.115 0.292L-0.389 0.292L-0.389 0.162L0.096 -0.5L0.268 -0.5L0.268 0.154L0.389 0.154L0.389 0.292L0.268 0.292L0.268 0.5L0.115 0.5ZM-0.215 0.154L0.115 0.154L0.115 -0.289L-0.215 0.154Z","5":"M-0.002 0.523Q-0.165 0.523 -0.261 0.445Q-0.357 0.368 -0.368 0.237L-0.368 0.237L-0.212 0.227Q-0.202 0.304 -0.146 0.344Q-0.091 0.383 -0.002 0.383L-0.002 0.383Q0.096 0.383 0.154 0.327Q0.211 0.272 0.211 0.175L0.211 0.175Q0.211 0.077 0.154 0.02Q0.096 -0.037 -0.004 -0.037L-0.004 -0.037Q-0.071 -0.037 -0.123 -0.008Q-0.174 0.02 -0.196 0.069L-0.196 0.069L-0.354 0.069L-0.287 -0.5L0.299 -0.5L0.299 -0.361L-0.151 -0.361L-0.185 -0.083Q-0.147 -0.123 -0.091 -0.144Q-0.035 -0.166 0.032 -0.166L0.032 -0.166Q0.13 -0.166 0.207 -0.123Q0.284 -0.079 0.326 -0.001Q0.368 0.076 0.368 0.175L0.368 0.175Q0.368 0.277 0.322 0.356Q0.275 0.435 0.191 0.479Q0.106 0.523 -0.002 0.523L-0.002 0.523Z","6":"M0.001 0.523Q-0.176 0.523 -0.27 0.406Q-0.365 0.289 -0.365 0.072L-0.365 0.072Q-0.365 -0.196 -0.268 -0.359Q-0.17 -0.523 0.038 -0.523L0.038 -0.523Q0.17 -0.523 0.25 -0.458Q0.33 -0.393 0.361 -0.277L0.361 -0.277L0.21 -0.265Q0.192 -0.324 0.151 -0.354Q0.111 -0.385 0.038 -0.385L0.038 -0.385Q-0.069 -0.385 -0.133 -0.301Q-0.197 -0.217 -0.211 -0.051L-0.211 -0.051Q-0.175 -0.104 -0.112 -0.136Q-0.049 -0.168 0.031 -0.168L0.031 -0.168Q0.13 -0.168 0.206 -0.126Q0.282 -0.085 0.323 -0.008Q0.365 0.069 0.365 0.169L0.365 0.169Q0.365 0.277 0.319 0.358Q0.273 0.438 0.191 0.48Q0.108 0.523 0.001 0.523L0.001 0.523ZM0.003 0.387Q0.094 0.387 0.151 0.329Q0.208 0.27 0.208 0.169L0.208 0.169Q0.208 0.075 0.154 0.018Q0.1 -0.039 0.013 -0.039L0.013 -0.039Q-0.083 -0.039 -0.144 0.018Q-0.206 0.075 -0.206 0.169L-0.206 0.169Q-0.206 0.266 -0.149 0.327Q-0.092 0.387 0.003 0.387L0.003 0.387Z","7":"M-0.144 0.5Q-0.144 0.272 -0.054 0.049Q0.037 -0.173 0.199 -0.361L0.199 -0.361L-0.359 -0.361L-0.359 -0.5L0.359 -0.5L0.359 -0.37Q0.177 -0.165 0.094 0.04Q0.011 0.245 0.011 0.5L0.011 0.5L-0.144 0.5Z","8":"M0 0.523Q-0.176 0.523 -0.281 0.446Q-0.386 0.369 -0.386 0.227L-0.386 0.227Q-0.386 0.13 -0.334 0.062Q-0.282 -0.006 -0.189 -0.038L-0.189 -0.038Q-0.261 -0.065 -0.299 -0.118Q-0.338 -0.172 -0.338 -0.248L-0.338 -0.248Q-0.338 -0.328 -0.297 -0.39Q-0.256 -0.452 -0.18 -0.487Q-0.103 -0.523 0 -0.523L0 -0.523Q0.103 -0.523 0.179 -0.487Q0.255 -0.452 0.296 -0.389Q0.337 -0.327 0.337 -0.248L0.337 -0.248Q0.337 -0.097 0.187 -0.038L0.187 -0.038Q0.28 -0.007 0.333 0.061Q0.386 0.13 0.386 0.227L0.386 0.227Q0.386 0.368 0.281 0.445Q0.176 0.523 0 0.523L0 0.523ZM0 0.383Q0.106 0.383 0.166 0.339Q0.227 0.296 0.227 0.211L0.227 0.211Q0.227 0.128 0.169 0.08Q0.111 0.031 0 0.031L0 0.031Q-0.113 0.031 -0.17 0.08Q-0.228 0.128 -0.228 0.211L-0.228 0.211Q-0.228 0.296 -0.168 0.339Q-0.107 0.383 0 0.383L0 0.383ZM0 -0.094Q0.087 -0.094 0.134 -0.131Q0.18 -0.168 0.18 -0.241L0.18 -0.241Q0.18 -0.307 0.133 -0.346Q0.086 -0.385 0 -0.385L0 -0.385Q-0.087 -0.385 -0.135 -0.346Q-0.182 -0.307 -0.182 -0.241L-0.182 -0.241Q-0.182 -0.168 -0.135 -0.131Q-0.087 -0.094 0 -0.094L0 -0.094Z","9":"M-0.03 0.523Q-0.157 0.523 -0.239 0.462Q-0.32 0.401 -0.351 0.296L-0.351 0.296L-0.198 0.286Q-0.165 0.385 -0.03 0.385L-0.03 0.385Q0.081 0.385 0.14 0.306Q0.199 0.227 0.209 0.055L0.209 0.055Q0.17 0.115 0.108 0.147Q0.046 0.179 -0.033 0.179L-0.033 0.179Q-0.13 0.179 -0.206 0.136Q-0.281 0.093 -0.323 0.015Q-0.365 -0.063 -0.365 -0.165L-0.365 -0.165Q-0.365 -0.273 -0.32 -0.354Q-0.275 -0.435 -0.194 -0.479Q-0.113 -0.523 -0.009 -0.523L-0.009 -0.523Q0.18 -0.523 0.273 -0.399Q0.365 -0.276 0.365 -0.051L0.365 -0.051Q0.365 0.22 0.271 0.371Q0.177 0.523 -0.03 0.523L-0.03 0.523ZM-0.012 0.048Q0.084 0.048 0.142 -0.008Q0.201 -0.065 0.201 -0.165L0.201 -0.165Q0.201 -0.263 0.145 -0.325Q0.089 -0.387 -0.006 -0.387L-0.006 -0.387Q-0.101 -0.387 -0.156 -0.327Q-0.211 -0.266 -0.211 -0.166L-0.211 -0.166Q-0.211 -0.069 -0.156 -0.011Q-0.101 0.048 -0.012 0.048L-0.012 0.048Z","A":"M-0.458 0.5L-0.097 -0.5L0.097 -0.5L0.458 0.5L0.294 0.5L0.204 0.239L-0.204 0.239L-0.296 0.5L-0.458 0.5ZM-0.156 0.101L0.156 0.101L0 -0.355L-0.156 0.101Z","B":"M-0.382 0.5L-0.382 -0.5L-0.023 -0.5Q0.158 -0.5 0.249 -0.435Q0.34 -0.369 0.34 -0.23L0.34 -0.23Q0.34 -0.144 0.291 -0.087Q0.242 -0.03 0.153 -0.017L0.153 -0.017Q0.261 -0.004 0.322 0.06Q0.382 0.124 0.382 0.225L0.382 0.225Q0.382 0.362 0.292 0.431Q0.201 0.5 0.03 0.5L0.03 0.5L-0.382 0.5ZM0.026 0.363Q0.122 0.363 0.174 0.325Q0.226 0.286 0.226 0.211L0.226 0.211Q0.226 0.138 0.173 0.097Q0.12 0.056 0.026 0.056L0.026 0.056L-0.23 0.056L-0.23 0.363L0.026 0.363ZM-0.026 -0.073Q0.074 -0.073 0.129 -0.111Q0.184 -0.149 0.184 -0.218L0.184 -0.218Q0.184 -0.363 -0.026 -0.363L-0.026 -0.363L-0.23 -0.363L-0.23 -0.073L-0.026 -0.073Z","C":"M0.012 0.523Q-0.123 0.523 -0.227 0.46Q-0.33 0.397 -0.387 0.28Q-0.444 0.162 -0.444 0.001L-0.444 0.001Q-0.444 -0.158 -0.387 -0.276Q-0.33 -0.394 -0.227 -0.458Q-0.123 -0.523 0.013 -0.523L0.013 -0.523Q0.194 -0.523 0.299 -0.432Q0.404 -0.341 0.437 -0.172L0.437 -0.172L0.277 -0.163Q0.256 -0.269 0.19 -0.326Q0.125 -0.383 0.013 -0.383L0.013 -0.383Q-0.077 -0.383 -0.144 -0.337Q-0.212 -0.29 -0.249 -0.204Q-0.287 -0.117 -0.287 0.001L-0.287 0.001Q-0.287 0.12 -0.249 0.206Q-0.212 0.292 -0.144 0.337Q-0.077 0.383 0.012 0.383L0.012 0.383Q0.13 0.383 0.198 0.32Q0.265 0.258 0.284 0.142L0.284 0.142L0.444 0.151Q0.415 0.325 0.304 0.424Q0.194 0.523 0.012 0.523L0.012 0.523Z","D":"M-0.405 0.5L-0.405 -0.5L-0.084 -0.5Q0.151 -0.5 0.278 -0.37Q0.405 -0.239 0.405 0.001L0.405 0.001Q0.405 0.241 0.28 0.37Q0.156 0.5 -0.075 0.5L-0.075 0.5L-0.405 0.5ZM-0.084 0.361Q0.247 0.361 0.247 0.001L0.247 0.001Q0.247 -0.182 0.165 -0.271Q0.082 -0.361 -0.084 -0.361L-0.084 -0.361L-0.253 -0.361L-0.253 0.361L-0.084 0.361Z","E":"M-0.331 0.5L-0.331 -0.5L0.32 -0.5L0.32 -0.361L-0.179 -0.361L-0.179 -0.069L0.303 -0.069L0.303 0.066L-0.179 0.066L-0.179 0.361L0.331 0.361L0.331 0.5L-0.331 0.5Z","F":"M-0.325 0.5L-0.325 -0.5L0.325 -0.5L0.325 -0.361L-0.173 -0.361L-0.173 -0.056L0.299 -0.056L0.299 0.079L-0.173 0.079L-0.173 0.5L-0.325 0.5Z","G":"M0.015 0.523Q-0.124 0.523 -0.226 0.456Q-0.328 0.39 -0.382 0.272Q-0.437 0.154 -0.437 0.001L-0.437 0.001Q-0.437 -0.149 -0.382 -0.268Q-0.327 -0.387 -0.223 -0.455Q-0.12 -0.523 0.021 -0.523L0.021 -0.523Q0.197 -0.523 0.3 -0.432Q0.403 -0.341 0.434 -0.186L0.434 -0.186L0.275 -0.177Q0.237 -0.383 0.023 -0.383L0.023 -0.383Q-0.127 -0.383 -0.203 -0.275Q-0.279 -0.168 -0.279 0.001L-0.279 0.001Q-0.279 0.173 -0.204 0.278Q-0.128 0.383 0.023 0.383L0.023 0.383Q0.101 0.383 0.162 0.348Q0.223 0.313 0.256 0.252Q0.289 0.192 0.292 0.118L0.292 0.118L0.024 0.118L0.024 -0.01L0.437 -0.01L0.437 0.5L0.332 0.5L0.325 0.341Q0.289 0.423 0.204 0.473Q0.118 0.523 0.015 0.523L0.015 0.523Z","H":"M-0.383 0.5L-0.383 -0.5L-0.231 -0.5L-0.231 -0.072L0.231 -0.072L0.231 -0.5L0.383 -0.5L0.383 0.5L0.231 0.5L0.231 0.066L-0.231 0.066L-0.231 0.5L-0.383 0.5Z","I":"M-0.076 0.5L-0.076 -0.5L0.076 -0.5L0.076 0.5L-0.076 0.5Z","J":"M-0.001 0.523Q-0.099 0.523 -0.175 0.477Q-0.251 0.431 -0.293 0.349Q-0.335 0.268 -0.335 0.163L-0.335 0.163L-0.18 0.155Q-0.178 0.266 -0.132 0.325Q-0.085 0.383 -0.001 0.383L-0.001 0.383Q0.088 0.383 0.135 0.323Q0.182 0.262 0.182 0.148L0.182 0.148L0.182 -0.5L0.335 -0.5L0.335 0.148Q0.335 0.262 0.294 0.346Q0.253 0.431 0.177 0.477Q0.101 0.523 -0.001 0.523L-0.001 0.523Z","K":"M-0.392 0.5L-0.392 -0.5L-0.239 -0.5L-0.239 -0.023L0.182 -0.5L0.366 -0.5L-0.017 -0.063L0.392 0.5L0.213 0.5L-0.118 0.044L-0.239 0.179L-0.239 0.5L-0.392 0.5Z","L":"M-0.32 0.5L-0.32 -0.5L-0.168 -0.5L-0.168 0.361L0.32 0.361L0.32 0.5L-0.32 0.5Z","M":"M-0.506 0.5L-0.506 -0.5L-0.297 -0.5L0 0.321L0.297 -0.5L0.506 -0.5L0.506 0.5L0.354 0.5L0.354 -0.232L0.085 0.499L-0.085 0.499L-0.354 -0.232L-0.354 0.5L-0.506 0.5Z","N":"M-0.404 0.5L-0.404 -0.5L-0.211 -0.5L0.251 0.315L0.251 -0.5L0.404 -0.5L0.404 0.5L0.204 0.5L-0.251 -0.297L-0.251 0.5L-0.404 0.5Z","O":"M-0.001 0.523Q-0.144 0.523 -0.249 0.46Q-0.354 0.397 -0.411 0.28Q-0.467 0.162 -0.467 0.001L-0.467 0.001Q-0.467 -0.159 -0.411 -0.277Q-0.354 -0.396 -0.249 -0.459Q-0.144 -0.523 -0.001 -0.523L-0.001 -0.523Q0.144 -0.523 0.25 -0.459Q0.356 -0.396 0.411 -0.277Q0.467 -0.159 0.467 0.001L0.467 0.001Q0.467 0.162 0.411 0.28Q0.356 0.397 0.25 0.46Q0.144 0.523 -0.001 0.523L-0.001 0.523ZM-0.001 0.383Q0.146 0.383 0.227 0.282Q0.309 0.182 0.309 0.001L0.309 0.001Q0.309 -0.179 0.227 -0.281Q0.144 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.144 -0.383 -0.227 -0.281Q-0.309 -0.179 -0.309 0.001L-0.309 0.001Q-0.309 0.182 -0.227 0.282Q-0.144 0.383 -0.001 0.383L-0.001 0.383Z","P":"M-0.368 0.5L-0.368 -0.5L0.005 -0.5Q0.175 -0.5 0.272 -0.418Q0.368 -0.335 0.368 -0.189L0.368 -0.189Q0.368 -0.042 0.272 0.042Q0.175 0.125 0.005 0.125L0.005 0.125L-0.216 0.125L-0.216 0.5L-0.368 0.5ZM0.001 -0.013Q0.104 -0.013 0.157 -0.057Q0.211 -0.101 0.211 -0.189L0.211 -0.189Q0.211 -0.275 0.158 -0.318Q0.105 -0.361 0.001 -0.361L0.001 -0.361L-0.216 -0.361L-0.216 -0.013L0.001 -0.013Z","Q":"M0.175 0.49Q0.101 0.523 -0.001 0.523L-0.001 0.523Q-0.142 0.523 -0.246 0.454Q-0.351 0.386 -0.407 0.268Q-0.463 0.149 -0.463 0.001L-0.463 0.001Q-0.463 -0.146 -0.408 -0.265Q-0.353 -0.385 -0.249 -0.454Q-0.144 -0.523 -0.001 -0.523L-0.001 -0.523Q0.144 -0.523 0.249 -0.454Q0.354 -0.385 0.408 -0.265Q0.463 -0.146 0.463 0.001L0.463 0.001Q0.463 0.141 0.414 0.254Q0.365 0.366 0.275 0.435L0.275 0.435L0.402 0.594L0.256 0.594L0.175 0.49ZM-0.001 0.383Q0.058 0.383 0.085 0.37L0.085 0.37L-0.057 0.192L0.088 0.192L0.184 0.318Q0.305 0.218 0.305 0.001L0.305 0.001Q0.305 -0.106 0.271 -0.193Q0.237 -0.28 0.168 -0.332Q0.099 -0.383 -0.001 -0.383L-0.001 -0.383Q-0.101 -0.383 -0.169 -0.332Q-0.237 -0.28 -0.271 -0.193Q-0.305 -0.106 -0.305 0.001L-0.305 0.001Q-0.305 0.108 -0.27 0.195Q-0.236 0.282 -0.168 0.332Q-0.099 0.383 -0.001 0.383L-0.001 0.383Z","R":"M-0.377 0.5L-0.377 -0.5L0.021 -0.5Q0.18 -0.5 0.274 -0.418Q0.368 -0.337 0.368 -0.199L0.368 -0.199Q0.368 -0.114 0.319 -0.051Q0.27 0.013 0.197 0.035L0.197 0.035Q0.337 0.056 0.351 0.208L0.351 0.208L0.377 0.5L0.224 0.5L0.2 0.228Q0.196 0.166 0.158 0.138Q0.121 0.11 0.039 0.11L0.039 0.11L-0.225 0.11L-0.225 0.5L-0.377 0.5ZM0.024 -0.03Q0.11 -0.03 0.16 -0.073Q0.21 -0.115 0.21 -0.194L0.21 -0.194Q0.21 -0.275 0.158 -0.318Q0.107 -0.361 0.011 -0.361L0.011 -0.361L-0.225 -0.361L-0.225 -0.03L0.024 -0.03Z","S":"M0.021 0.523Q-0.097 0.523 -0.185 0.48Q-0.273 0.437 -0.325 0.358Q-0.376 0.28 -0.385 0.177L-0.385 0.177L-0.228 0.168Q-0.214 0.273 -0.151 0.329Q-0.087 0.385 0.024 0.385L0.024 0.385Q0.123 0.385 0.175 0.348Q0.228 0.311 0.228 0.241L0.228 0.241Q0.228 0.196 0.207 0.164Q0.186 0.132 0.129 0.105Q0.072 0.077 -0.037 0.051L-0.037 0.051Q-0.159 0.021 -0.23 -0.015Q-0.3 -0.051 -0.332 -0.102Q-0.363 -0.154 -0.363 -0.232L-0.363 -0.232Q-0.363 -0.318 -0.322 -0.384Q-0.28 -0.449 -0.201 -0.486Q-0.123 -0.523 -0.017 -0.523L-0.017 -0.523Q0.149 -0.523 0.249 -0.433Q0.348 -0.344 0.365 -0.197L0.365 -0.197L0.21 -0.189Q0.197 -0.279 0.139 -0.332Q0.08 -0.385 -0.02 -0.385L-0.02 -0.385Q-0.106 -0.385 -0.156 -0.344Q-0.207 -0.304 -0.207 -0.238L-0.207 -0.238Q-0.207 -0.193 -0.187 -0.165Q-0.166 -0.138 -0.115 -0.117Q-0.063 -0.096 0.037 -0.072L0.037 -0.072Q0.225 -0.028 0.305 0.045Q0.385 0.118 0.385 0.232L0.385 0.232Q0.385 0.321 0.339 0.387Q0.293 0.452 0.211 0.487Q0.128 0.523 0.021 0.523L0.021 0.523Z","T":"M-0.076 0.5L-0.076 -0.361L-0.383 -0.361L-0.383 -0.5L0.383 -0.5L0.383 -0.361L0.076 -0.361L0.076 0.5L-0.076 0.5Z","U":"M0 0.523Q-0.118 0.523 -0.206 0.477Q-0.294 0.431 -0.342 0.346Q-0.389 0.261 -0.389 0.146L-0.389 0.146L-0.389 -0.501L-0.237 -0.501L-0.237 0.146Q-0.237 0.261 -0.175 0.322Q-0.113 0.383 0 0.383L0 0.383Q0.113 0.383 0.175 0.322Q0.237 0.261 0.237 0.146L0.237 0.146L0.237 -0.501L0.389 -0.501L0.389 0.146Q0.389 0.261 0.342 0.346Q0.294 0.431 0.206 0.477Q0.118 0.523 0 0.523L0 0.523Z","V":"M-0.095 0.5L-0.457 -0.5L-0.295 -0.5L0.001 0.331L0.295 -0.5L0.457 -0.5L0.095 0.5L-0.095 0.5Z","W":"M-0.363 0.5L-0.629 -0.5L-0.465 -0.5L-0.271 0.29L-0.077 -0.5L0.077 -0.5L0.273 0.29L0.465 -0.5L0.629 -0.5L0.364 0.5L0.185 0.5L-0.001 -0.23L-0.187 0.5L-0.363 0.5Z","X":"M-0.427 0.5L-0.094 -0.001L-0.424 -0.5L-0.245 -0.5L0.001 -0.12L0.244 -0.5L0.421 -0.5L0.092 -0.004L0.427 0.5L0.248 0.5L-0.001 0.114L-0.249 0.5L-0.427 0.5Z","Y":"M-0.075 0.5L-0.075 0.099L-0.427 -0.5L-0.253 -0.5L0.001 -0.054L0.253 -0.5L0.427 -0.5L0.077 0.099L0.077 0.5L-0.075 0.5Z","Z":"M-0.356 0.5L-0.356 0.359L0.161 -0.361L-0.337 -0.361L-0.337 -0.5L0.341 -0.5L0.341 -0.359L-0.177 0.361L0.356 0.361L0.356 0.5L-0.356 0.5Z"};
const { Cam, fit, proj, facing, hull, seg, clamp, EASE_LIFT, bezier, reducedMotion, disposer, mk, pointer, register, solid } = HL;

const Q = Math.PI / 2, EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
// the body: 2·BX wide (x), 2·BY deep (y), BH high, corners BR; the camera's scale SC, fitted about (FX, 166)
const BX = 19, BY = 16, BR = 3, BH = 32, SC = 4, FX = 212;
// the door: inset DI from the face's sides, top and bottom, DT thick, proud of the face; it turns on its front-left edge to OPEN
const DI = 3.2, DU = BX - DI, DV0 = DI, DV1 = BH - DI, DT = 1.8, OPEN = (100 * Math.PI) / 180;
// hinge marks: HG left of the door's front-left edge, HLN long, centred HV in from its top and bottom
const HG = 0.9, HLN = 3.2, HV = 4.6;
// the code window: 3/4 of the door's width, WH tall, centred at CV (its foot just above the lever), corners WR; digits H tall
const WU = 0.75 * DU, WH = 8, CV = 21.4, WR = 1.6, H = 4.8, PITCH = (2 * WU) / 4;
// the handle: a hub KB round, KT proud, at (KU, KV) by the free edge; a lever LL long from its centre, 2·LW wide, LT proud
const KU = DU - 3, KV = BH / 2, KB = 1.25, KT = 1.6, LL = 3.7, LW = 0.55, LT = 1;
// the hollow: a rim line RT in; on its floor at (OX, OY), as deep as it stays wholly in view through the opening, a cube 2·OC across (30%), corners OR, lid line LID down, letter CAP high; or three coins CN thick
const RT = 1.4, OC = 0.3 * DU, OX = -4.7, OY = BY - 8.5, OR = 1.4, LID = 2, CAP = 4.8, CN = 1.3, COINS = [[0.5, -0.4], [-0.5, 0.3], [0.3, 0.4]];
// timing, ms: a digit is the slider's step; in, the lever HAND, the door DOOR, the lift LIFT; out, SET, SHUT, HAND, CLR
const HAND = 200, DOOR = 700, LIFT = 300, SET = 200, SHUT = 500, CLR = 300, HOLD = 700, ATTRS = ["data-code", "data-hide-code", "data-inside", "data-mark"];
const GL = Object.fromEntries(Object.entries(DIGITS).map(([c, d]) => {
  const ps = d.split("M").filter(Boolean).map((p) => p.replace("L", "").trim().split(/\s+/).reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(+x) : o.push([+x]), o), [])), xs = ps.flat().map(([x]) => x);
  return [c, { ps, xm: (Math.min(...xs) + Math.max(...xs)) / 2 }];
}));

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, SC), cube8 = (x0, x1, y0, y1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [[x, y, 0], [x, y, BH]]));
  fit(C, cube8(-BX, BX, -BY, BY + DT), FX, 166);
  const P = proj(C), O = P(0, 0, 0), J = (v) => { const q = P(...v); return [q[0] - O[0], q[1] - O[1]]; }, front = facing(C), pt = (v) => P(...v).map((x) => x.toFixed(2)).join(",");
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], add = (a, b, s = 1) => a.map((x, i) => x + s * b[i]), mul = (a, s) => a.map((x) => x * s);
  const ZL = 4 / (O[1] - P(0, 0, 1)[1]); // the lift: 4 viewBox units on screen, as a height
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
  function rr(o, e1, e2, [u0, v0, u1, v1], r, f0 = 0, f1 = 4 * Q, move = true) {
    const cs = [[u1 - r, v0 + r], [u1 - r, v1 - r], [u0 + r, v1 - r], [u0 + r, v0 + r]].map(([u, v]) => add(add(o, e1, u), e2, v));
    let d = "", f = f0, first = move;
    while (f < f1 - 1e-9) {
      const i = Math.floor((f + Q) / Q + 1e-9), stop = Math.min(f1, -Q + Q * (i + 1));
      d += arc(cs[((i % 4) + 4) % 4], e1, e2, r, f, stop, first); first = false; f = stop;
    }
    return d;
  }
  /** A rounded outline on a visible face at o, run back by n: the silhouette, split where the tangent runs along n on screen, and the face's inner half as crease. */
  function slab(o, e1, e2, rect, r, n) {
    const Tv = J(n), fs = Math.atan2(cross(J(e2), Tv), cross(J(e1), Tv)), m = J(add(e1.map((x) => x * Math.cos(fs + Q)), e2, Math.sin(fs + Q)));
    const a = (m[0] * Tv[0] + m[1] * Tv[1] < 0 ? fs : fs + 2 * Q) + 4 * Q;
    return { sil: rr(o, e1, e2, rect, r, a, a + 2 * Q) + rr(add(o, n), e1, e2, rect, r, a + 2 * Q, a + 4 * Q, false) + "Z", crease: rr(o, e1, e2, rect, r, a + 2 * Q, a + 4 * Q) };
  }
  const whole = (q) => ({ sil: q.sil + q.crease, crease: "" }), line = (a, b) => seg(P(...a), P(...b)), ring = (o, e1, e2, rect, r) => rr(o, e1, e2, rect, r) + "Z";
  const drawn = new Map(), setD = (el, d) => { if (drawn.get(el) !== d) { drawn.set(el, d); el.setAttribute("d", d); } };
  const put2 = (s, q) => { setD(s.sil, q.sil); setD(s.cr, q.crease); };

  // back to front: the hollow's rim line (nothing else inside is drawn), the object on its floor, the body with
  // the opening cut out of it (nonzero fill, the opening wound the other way), the hinge marks, then the door
  const g = mk("g", {}, svg), path = (cls, parent = g, d = "") => mk("path", { class: cls, d }, parent);
  const HO = [-DU, DV0, DU, DV1], mouth = [0, BY, 0];
  path("nf lo", g, ring([0, BY - RT, 0], EX, EZ, HO, BR));
  const objG = mk("g", {}, g), objs = [0, 1, 2].map(() => { const s = solid(objG); return { s, mark: path("nf sil", s.g) }; });
  const body = solid(g), top = slab([0, 0, BH], EX, EY, [-BX, -BY, BX, BY], BR, [0, 0, -BH]);
  const flip = Math.sign(cross(J(EX), J(EY))) === Math.sign(cross(J(EX), J(EZ))) ? -1 : 1;
  put2(body, { sil: top.sil + ring(mouth, mul(EX, flip), EZ, HO, BR), crease: top.crease });
  path("nf sil", g, [DV0 + HV, DV1 - HV].map((v) => line([-DU - HG, BY + DT, v - HLN / 2], [-DU - HG, BY + DT, v + HLN / 2])).join(""));
  const doorG = mk("g", {}, g), door = solid(doorG), panel = path("nf lo", doorG), frontG = mk("g", {}, doorG);
  const win = path("nf sil", frontG), marks = [0, 1, 2, 3].map(() => path("nf sil", frontG)), bar = solid(frontG), hub = solid(frontG);
  /** The door at th: a runs hinge to free edge, n out of its front; F(u, v, f) is u across it (−DU at the hinge), v up, f out. */
  const frame = (th) => {
    const a = [Math.cos(th), Math.sin(th), 0], n = [-Math.sin(th), Math.cos(th), 0];
    return { a, n, F: (u, v, f) => [-DU + (u + DU) * a[0] + f * n[0], BY + DT + (u + DU) * a[1] + f * n[1], v] };
  };
  const cu = (j) => (j - 1.5) * PITCH, ease = (x) => EASE_LIFT(clamp(x, 0, 1));
  let shownFront = true;
  /** The door at th, its lever at h (0 left, 1 down), the code c digits in (each grows in over its own step). */
  function drawDoor(th, h, c) {
    const { a, n, F } = frame(th), fr = front({ nu: n[0], nv: n[1] }), Fo = F(0, 0, 0);
    put2(door, fr ? slab(Fo, a, EZ, HO, BR, mul(n, -DT)) : slab(F(0, 0, -DT), a, EZ, HO, BR, mul(n, DT)));
    setD(panel, fr ? "" : ring(F(0, 0, -DT), a, EZ, [-DU + 3, DV0 + 3, DU - 3, DV1 - 3], BR - 1));
    setD(win, ring(Fo, a, EZ, [-WU, CV - WH / 2, WU, CV + WH / 2], WR));
    marks.forEach((m, j) => {
      const s = 0.9 + 0.1 * ease(c - j), d = code[j];
      setD(m, c <= j ? line(F(cu(j) - 0.3 * H, CV, 0), F(cu(j) + 0.3 * H, CV, 0))
        : hide ? arc(F(cu(j), CV, 0), a, EZ, 1.05 * s, 0, 4 * Q, true) + "Z"
        : GL[d].ps.map((p) => "M" + p.map(([x, y]) => pt(F(cu(j) + s * (x - GL[d].xm) * H, CV - s * (y + 0.5) * H, 0))).join("L")).join(""));
    });
    // the hub and the lever: from their outer faces while the front is seen, from their feet once it turns away
    const ang = Math.PI + Q * h, dir = add(mul(a, Math.cos(ang)), EZ, Math.sin(ang)), nrm = add(mul(a, -Math.sin(ang)), EZ, Math.cos(ang));
    const knob = (f, rect, e1, e2, r) => whole(fr ? slab(F(KU, KV, f), e1, e2, rect, r, mul(n, -f)) : slab(F(KU, KV, 0), e1, e2, rect, r, mul(n, f)));
    put2(hub, knob(KT, [-KB, -KB, KB, KB], a, EZ, KB));
    put2(bar, knob(LT, [0, -LW, LL, LW], dir, nrm, LW));
    if (fr !== shownFront) { shownFront = fr; if (fr) doorG.append(frontG); else doorG.insertBefore(frontG, door.g); }
  }
  /** The object standing at height z: its solids, bottom first, each with its marks (the lid line, or the letter). */
  const letter = (ch, z) => GLYPHS[ch].replace(/([MLQ])([^MLQZ]+)/g, (_, k, ns) => {
    const v = ns.trim().split(" ").map(Number), ps = [];
    for (let i = 0; i < v.length; i += 2) ps.push(P(OX + v[i] * CAP, OY + v[i + 1] * CAP, z).map((x) => x.toFixed(2)).join(" "));
    return k + ps.join(" ");
  });
  function drawObject(kind, ch, z) {
    const sq = [-OC, -OC, OC, OC], parts = kind === "coin"
      ? COINS.map(([dx, dy], i) => ({ ...slab([OX + dx, OY + dy, z + (i + 1) * CN], EX, EY, sq, OC, [0, 0, -CN]), mark: "" }))
      : [{ ...slab([OX, OY, z + 2 * OC], EX, EY, sq, OR, [0, 0, -2 * OC]),
        mark: kind === "box" ? slab([OX, OY, z + 2 * OC - LID], EX, EY, sq, OR, [0, 0, -1]).crease : letter(ch, z + 2 * OC) }];
    objs.forEach((o, i) => { const q = parts[i] || { sil: "", crease: "", mark: "" }; put2(o.s, q); setD(o.mark, q.mark); });
  }

  // four channels eased from where they are: code c (0–4), lever h, door d, lift l. In, one after another; out, the other way
  const LIN = (x) => x, SMOOTH = bezier(0.42, 0, 0.58, 1), W = Object.fromEntries(["c", "h", "d", "l"].map((k) => [k, { from: 0, to: 0, t0: 0, dur: 1, e: LIN }]));
  const tv = (w, now) => (reducedMotion() ? w.to : w.from + (w.to - w.from) * w.e(clamp((now - w.t0) / w.dur, 0, 1)));
  const done = (w, now) => reducedMotion() || now >= w.t0 + w.dur;
  const go = (w, to, now, delay, dur, e) => Object.assign(w, { from: tv(w, now), to, t0: now + delay, dur: Math.max(1, dur), e });
  let on = false, hovered = false, demo = false, demoEnd = 0, seen = null, code = "2580", hide = false, inside = "box", mark = "C", lit = "";
  function enter(now) {
    const [c, h, d, l] = ["c", "h", "d", "l"].map((k) => tv(W[k], now)), tc = (4 - c) * step, th = HAND * (1 - h), td = DOOR * (1 - d);
    on = true;
    go(W.c, 4, now, 0, tc, LIN); go(W.h, 1, now, tc, th, SMOOTH); go(W.d, 1, now, tc + th, td, EASE_LIFT);
    go(W.l, 1, now, tc + th + 0.75 * td, LIFT * (1 - l), SMOOTH);
    B.wake();
    return tc + th + 0.75 * td + LIFT * (1 - l);
  }
  function leave(now) {
    const [c, h, d, l] = ["c", "h", "d", "l"].map((k) => tv(W[k], now)), tl = SET * l, td = SHUT * d, th = HAND * h;
    on = false;
    go(W.l, 0, now, 0, tl, SMOOTH); go(W.d, 0, now, tl, td, SMOOTH); go(W.h, 0, now, tl + td, th, SMOOTH);
    go(W.c, 0, now, tl + td + th, (CLR * c) / 4, LIN);
    B.wake();
  }
  const B = register(stage, (_dt, now) => {
    const at = ATTRS.map((k) => stage.getAttribute(k) || "");
    if (at.join("|") !== seen) {
      const first = seen === null, m = (Array.from(at[3].trim())[0] || "").toUpperCase();
      seen = at.join("|"); code = /^\d{4}$/.test(at[0]) ? at[0] : "2580"; hide = at[1] === "true";
      inside = ["box", "coin", "letter"].includes(at[2]) ? at[2] : "box"; mark = /^[A-Z0-9]$/.test(m) ? m : "C";
      if (!first && !hovered) { demo = true; demoEnd = now + enter(now) + HOLD; }
    }
    if (demo && now >= demoEnd) { demo = false; if (!hovered) leave(now); }
    const [c, h, d, l] = ["c", "h", "d", "l"].map((k) => tv(W[k], now));
    drawDoor(OPEN * d, h, c);
    drawObject(inside, mark, DV0 + ZL * l);
    // grey at rest and closing; entering: the digit coming in (all four as the last comes in); opening: the lever; open: the object
    const st = on ? (c < 4 ? "entering" : l > 0 ? "open" : "opening") : c + h + d + l > 0 ? "closing" : "rest", nIn = Math.ceil(c - 1e-9);
    if (`${st}|${nIn}` !== lit) {
      lit = `${st}|${nIn}`;
      marks.forEach((el, j) => el.classList.toggle("hi", st === "entering" && (nIn === 4 || j === nIn - 1)));
      [hub.sil, bar.sil].forEach((el) => el.classList.toggle("hi", st === "opening"));
      objs.forEach((o) => { [o.s.sil, o.s.cr, o.mark].forEach((el) => el.classList.toggle("hi", st === "open")); o.s.cr.classList.toggle("lo", st !== "open"); });
      if (read.textContent !== st) read.textContent = st;
    }
    return demo || !Object.values(W).every((w) => done(w, now));
  });
  bag.add(B.unregister);
  const mo = new MutationObserver(() => B.wake());
  mo.observe(stage, { attributes: true, attributeFilter: ATTRS }); bag.add(() => mo.disconnect());

  // the hit area: the closed safe, as the hull of its box (door included) on screen. Nothing in it ever moves
  const HIT = hull(cube8(-BX, BX, -BY, BY + DT).map((v) => P(...v)));
  const side = (p, a, b) => Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const inHit = (p) => new Set(HIT.map((a, i) => side(p, a, HIT[(i + 1) % HIT.length])).filter((s) => s)).size < 2;
  function hover(v) {
    if (v === hovered) return;
    const now = performance.now();
    hovered = v;
    if (v) { demo = false; enter(now); } else if (!demo) leave(now);
  }
  bag.add(pointer(stage, { move: (p) => hover(inHit(p)), leave: () => hover(false) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  B.wake();

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "safe",
  means: "A safe: hover and the code fills in, then the door swings open to show what's inside.",
  rules: [1, 4, 6, 8],
  // ms per digit; at 250 the code takes 1 s, the lever 0.2 s, the door 0.7 s and the lift ends 0.1 s later: 2 s in all
  range: [200, 250, 300],
  mount,
});
