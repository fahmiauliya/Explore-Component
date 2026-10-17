import * as THREE from 'three';

/*
 * A subject's studio: its own scene, the shared lighting and a camera that frames it. Every subject is lit the
 * same way, a white sun from the top right of the screen with a soft fill, so the two animals shade alike and the
 * same tone thresholds suit both.
 */
export const LIGHT = { ambient: .4, direct: .6, toward: .2 }; // the soft fill, the sun, and how little the sun leans toward the camera: surfaces turned to the camera fall into shadow
export const SUBJECT_SCALE = .7;                      // every animal's size in the frame, × its view's framing: room around it for the grid and the texts
export type View = { from: THREE.Vector3; at: THREE.Vector3; fov: number; width: number }; // the camera's direction and target, and the units across the frame
export type Studio = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; frame: (aspect: number) => void; lightAngle: (degrees: number) => void };

const UP = new THREE.Vector3(0, 1, 0);

export function makeStudio(view: View): Studio {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(view.fov, 1, .1, 50);
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI * LIGHT.direct);
  // Lambert reflects irradiance / π, so intensities of π × value light a white surface to exactly that value.
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * LIGHT.ambient), sun, sun.target);
  let aspect = 0, angle = NaN;
  return {
    scene, camera,
    /** The camera for a frame's aspect: `view.width` units across, whatever the aspect. */
    frame(a) {
      if (a === aspect) return;
      aspect = a;
      camera.aspect = a;
      const distance = view.width / SUBJECT_SCALE / (2 * Math.tan(camera.fov * Math.PI / 360) * a);
      camera.position.copy(view.from).sub(view.at).normalize().multiplyScalar(distance).add(view.at);
      camera.lookAt(view.at);
      camera.updateProjectionMatrix();
      angle = NaN;
    },
    /** The sun's direction as seen on screen: 0 from the top, positive from the right, leaning a little toward the camera. */
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
  };
}
