import * as THREE from 'three';
import type { Grid } from '../dot/dots';

/*
 * Tracked points: places on an animal's 3D model, a point in some part's own space (a joint, a tip, a spot on
 * the body), a vertex of a sheet that is placed every update, or a vertex of a loaded mesh read through
 * `getVertexPosition`, so morph targets and skinning count. They are projected to frame pixels from the same
 * posed frame that makes the dots, at the dot update. A point behind the animal's surfaces is hidden: a ray from
 * the camera that hits something well in front of it.
 */
export type Tracker = { key?: string } & (
  | { object: THREE.Object3D; local: THREE.Vector3 }
  | { object: THREE.Object3D; vertex: { attribute: THREE.BufferAttribute; index: number } }
  | { mesh: THREE.Mesh; index: number }
);
export type Projected = { x: number; y: number; visible: boolean; key?: string };
export const SLACK = .15;                           // a point may sit this far inside a surface and still show: joints are inside limbs

const point = new THREE.Vector3(), direction = new THREE.Vector3(), ray = new THREE.Raycaster();

/** A tracker's world position. */
export function worldOf(tracker: Tracker, out: THREE.Vector3) {
  if ('mesh' in tracker) { tracker.mesh.getVertexPosition(tracker.index, out); return tracker.mesh.localToWorld(out); }
  if ('vertex' in tracker) out.fromBufferAttribute(tracker.vertex.attribute, tracker.vertex.index); else out.copy(tracker.local);
  return tracker.object.localToWorld(out);
}

/** The trackers in frame pixels, with visibility tested against the occluders. */
export function project(trackers: Tracker[], camera: THREE.Camera, grid: Grid, occluders: THREE.Object3D[]): Projected[] {
  return trackers.map(tracker => {
    worldOf(tracker, point);
    direction.copy(point).sub(camera.position);
    const distance = direction.length();
    ray.set(camera.position, direction.normalize());
    ray.far = distance;
    const hit = ray.intersectObjects(occluders, true)[0];
    const visible = !hit || hit.distance > distance - SLACK;
    point.project(camera);
    return { x: grid.ox + (point.x + 1) / 2 * grid.cols * grid.cell, y: grid.oy + (1 - point.y) / 2 * grid.rows * grid.cell, visible: visible && point.z < 1, key: tracker.key };
  });
}
