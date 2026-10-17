import * as THREE from 'three';
import type { Studio } from './studio';
import type { Tracker } from '../tracking/points';

/*
 * The dot matrix's source: a subject, lit, rendered into a small hidden target of 4 × 4 pixels per cell, read back
 * and averaged into coverage and brightness per cell. The animal is the cells covered past a threshold; its tones
 * are dealt by brightness percentile inside it, so every animal shows all three: the darkest share navy, the
 * middle share bright, the brightest share light, and the silhouette's edge cells light whatever their brightness.
 * The visible canvas never sees the 3D scene, only these cells. Materials put brightness in the red channel; blue
 * is a mark for parts that are always navy (a thin tail), and a subject's highlights are points put on exactly one
 * light cell each.
 */
export const SUPERSAMPLE = 4;                       // target pixels per cell, each way
export const NAVY_MARK = .15;                       // a cell this much covered by a blue-marked part is navy whatever its ink
export const EDGE_COVERAGE = .6;                    // a cell covered less than this is on the silhouette

export type Tones = { empty: number; light: number; mid: number; dark: number };  // the coverage a cell needs to count, and the three shares (any scale)
export const enum Cell { Empty, Light, Mid, Dark }
export type Subject = { studio: Studio; highlights?: THREE.Object3D[]; trackers?: Tracker[] };

export class DotRenderer {
  cols = 0; rows = 0;
  private gl = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  private target: THREE.WebGLRenderTarget | null = null;
  private pixels = new Uint8Array(0);
  private cells = new Uint8Array(0);
  private coverage = new Float32Array(0);
  private brightness = new Float32Array(0);

  constructor() {
    this.gl.setPixelRatio(1);
    this.gl.setSize(SUPERSAMPLE, SUPERSAMPLE, false);
    this.gl.setClearColor(0x000000, 0);
  }

  /** The target for a grid; subjects frame their cameras to its aspect when rendered. */
  grid(cols: number, rows: number) {
    this.cols = cols; this.rows = rows;
    const width = cols * SUPERSAMPLE, height = rows * SUPERSAMPLE;
    this.target?.dispose();
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: true, stencilBuffer: false });
    this.pixels = new Uint8Array(width * height * 4);
    this.cells = new Uint8Array(cols * rows);
    this.coverage = new Float32Array(cols * rows);
    this.brightness = new Float32Array(cols * rows);
  }

  /** One update of a subject (already posed): render, read back and classify every cell. Row-major from the top-left. */
  render(subject: Subject, tones: Tones, lightAngle: number) {
    const { scene, camera } = subject.studio, target = this.target!, cols = this.cols, rows = this.rows, width = cols * SUPERSAMPLE, height = rows * SUPERSAMPLE, px = this.pixels;
    subject.studio.frame(cols / rows);
    subject.studio.lightAngle(lightAngle);
    this.gl.setRenderTarget(target);
    this.gl.render(scene, camera);
    this.gl.readRenderTargetPixels(target, 0, 0, width, height, px);
    this.gl.setRenderTarget(null);
    // Rows read bottom-up. Uncovered pixels are clear black, so the block's mean alpha is its coverage and its mean
    // red over that its brightness.
    const block = SUPERSAMPLE * SUPERSAMPLE * 255, cells = this.cells, marked: number[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let red = 0, blue = 0, alpha = 0;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        let i = ((height - 1 - (r * SUPERSAMPLE + dy)) * width + c * SUPERSAMPLE) * 4;
        for (let dx = 0; dx < SUPERSAMPLE; dx++, i += 4) { red += px[i]; blue += px[i + 2]; alpha += px[i + 3]; }
      }
      const k = r * cols + c;
      this.coverage[k] = alpha / block;
      this.brightness[k] = alpha ? red / alpha : 0;
      cells[k] = this.coverage[k] >= tones.empty ? Cell.Mid : Cell.Empty;
      if (blue / block >= NAVY_MARK) marked.push(k);
    }
    // The animal's cells by brightness: the darkest share navy, then the middle share bright, the rest light.
    const inside: number[] = [];
    for (let k = 0; k < cells.length; k++) if (cells[k] !== Cell.Empty) inside.push(k);
    inside.sort((a, b) => this.brightness[a] - this.brightness[b]);
    const total = Math.max(1e-6, tones.light + tones.mid + tones.dark), navy = Math.round(inside.length * tones.dark / total), bright = Math.round(inside.length * tones.mid / total);
    inside.forEach((k, i) => { cells[k] = i < navy ? Cell.Dark : i < navy + bright ? Cell.Mid : Cell.Light; });
    // The silhouette: a cell on the edge, or only partly covered, is light.
    for (const k of inside) {
      const c = k % cols, r = (k - c) / cols;
      const edge = this.coverage[k] < EDGE_COVERAGE || c === 0 || r === 0 || c === cols - 1 || r === rows - 1 || cells[k - 1] === Cell.Empty || cells[k + 1] === Cell.Empty || cells[k - cols] === Cell.Empty || cells[k + cols] === Cell.Empty;
      if (edge) cells[k] = Cell.Light;
    }
    for (const k of marked) cells[k] = Cell.Dark;
    // A highlight is one light dot on the cell its point falls in, unless the subject is there.
    for (const point of subject.highlights ?? []) {
      const p = point.getWorldPosition(new THREE.Vector3()).project(camera);
      const c = Math.floor((p.x + 1) / 2 * cols), r = Math.floor((1 - p.y) / 2 * rows);
      if (c >= 0 && c < cols && r >= 0 && r < rows && cells[r * cols + c] === Cell.Empty) cells[r * cols + c] = Cell.Light;
    }
    return cells;
  }

  dispose() { this.target?.dispose(); this.gl.dispose(); }
}
