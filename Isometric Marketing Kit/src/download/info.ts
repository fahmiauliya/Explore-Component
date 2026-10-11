// The download sizes the panel shows, kept apart from the encoders so the page loads without them.
export const FORMAT_INFO = {
  /** The PNG's longer side, and its strokes at that size. */
  png: { side: 2000, stroke: 4 },
  /** The GIF: square, frames a second. */
  gif: { size: 600, fps: 25 },
  /** The transparent WebM and PNG sequence: square size, and each one's frames a second. */
  alpha: { size: 1080, webmFps: 60, sequenceFps: 30 },
};
