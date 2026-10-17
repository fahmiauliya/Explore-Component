// Mac shows ⌘ in hints; Windows and Linux show Ctrl.
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export const modKey = isMac ? '⌘' : 'Ctrl';

// "⌘K" on Mac, "Ctrl K" elsewhere.
export const modLabel = (key) => (isMac ? `⌘${key}` : `Ctrl ${key}`);
