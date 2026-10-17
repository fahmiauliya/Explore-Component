// A small key hint like ⌘K or Esc. Shows ⌘ on Mac and Ctrl elsewhere.
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

// The modifier key name used in all hints and tooltips.
export const modKey = isMac ? '⌘' : 'Ctrl';

export default function Kbd({ children, className = '' }) {
  return <kbd className={`kbd ${className}`.trim()}>{children}</kbd>;
}

// "⌘K" on Mac, "Ctrl K" on Windows/Linux, as one hint.
export function ModKbd({ k }) {
  return (
    <Kbd>
      {modKey}
      {isMac ? '' : ' '}
      {k}
    </Kbd>
  );
}
