import * as THREE from 'three';

/*
 * A subject's studio: its own scene, the shared lighting and a camera that frames it. Every subject is lit the
 * same way, a white key light from the top left and the front with a soft fill, so tops are lit, sides mid and
 * undersides and far sides in shadow. The camera frames `view.width` units across, then the calibration found
 * from the subject's whole loop (its zoom and where its box sits) and the panel's size dial refine that.
 */
export const LIGHT = { ambient: .4, direct: .6, toward: .6 }; // the soft fill, the key light, and how much the key leans toward the camera (the front)
export const SUBJECT_SCALE = .7;                      // every animal's size in the frame, × its view's framing: room around it for the grid and the texts
export type View = { from: THREE.Vector3; at: THREE.Vector3; fov: number; width: number }; // the camera's direction and target, and the units across the frame
export type Calibration = { zoom: number; ndcX: number; ndcY: number; width: number; height: number };  // how much bigger the subject may show, where its loop's box centre sat (−1 … 1), and the box's size as fractions of the frame before zooming
export type Studio = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; frame: (aspect: number) => void; lightAngle: (degrees: number) => void; calibrate: (c: Calibration | null) => void; size: (factor: number) => void; loopBox: () => { width: number; height: number } | null };

const UP = new THREE.Vector3(0, 1, 0);

export function makeStudio(view: View): Studio {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(view.fov, 1, .1, 50);
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI * LIGHT.direct);
  // Lambert reflects irradiance / π, so intensities of π × value light a white surface to exactly that value.
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * LIGHT.ambient), sun, sun.target);
  let aspect = 0, angle = NaN, calibration: Calibration | null = null, size = 1;
  const place = () => {
    if (!aspect) return;
    camera.aspect = aspect;
    const width = view.width / SUBJECT_SCALE / ((calibration?.zoom ?? 1) * size);
    const distance = width / (2 * Math.tan(camera.fov * Math.PI / 360) * aspect);
    // The loop box's centre, found in the frame before zooming, moves to the frame's centre: the shift it needs is the
    // same in world units whatever the zoom, half the unzoomed width (or height) per unit of NDC.
    const forward = view.at.clone().sub(view.from).normalize(), right = new THREE.Vector3().crossVectors(forward, UP).normalize(), up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const base = view.width / SUBJECT_SCALE / size, at = view.at.clone();
    if (calibration) at.addScaledVector(right, calibration.ndcX * base / 2).addScaledVector(up, calibration.ndcY * base / aspect / 2);
    camera.position.copy(view.from).sub(view.at).normalize().multiplyScalar(distance).add(at);
    camera.lookAt(at);
    camera.updateProjectionMatrix();
    angle = NaN;
  };
  return {
    scene, camera,
    /** The camera for a frame's aspect. */
    frame(a) { if (a === aspect) return; aspect = a; place(); },
    /** The sun's direction as seen on screen: 0 from the top, positive from the right, leaning toward the camera. */
    lightAngle(degrees) {
      if (degrees === angle) return;
      angle = degrees;
      const forward = camera.getWorldDirection(new THREE.Vector3());
      const right = new THREE.Vector3().crossVectors(forward, UP).normalize(), up = new THREE.Vector3().crossVectors(right, forward).normalize();
      const a = degrees * Math.PI / 180;
      const direction = right.multiplyScalar(Math.sin(a)).add(up.multiplyScalar(Math.cos(a))).addScaledVector(forward, -LIGHT.toward).normalize();
      sun.position.copy(direction.multiplyScalar(10));
      sun.target.position.set(0, 0, 0);
    },
    /** The loop's calibration (null: none yet). */
    calibrate(c) { calibration = c; place(); },
    /** The size dial: × the calibrated size. */
    size(factor) { if (factor === size) return; size = factor; place(); },
    /** The loop's box as the frame shows it now: centred, its fractions of the frame after the zoom and the size dial. */
    loopBox() { return calibration ? { width: calibration.width * calibration.zoom * size, height: calibration.height * calibration.zoom * size } : null; },
  };
}
