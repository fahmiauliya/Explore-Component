// Inline stroke icons. They use `currentColor`, so they take the text color
// of whatever they sit in. All are drawn on a 24 x 24 grid.
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ShuffleIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="m4 4 5 5" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function ArrowUpRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

// ---- Social icons (footer only) ----

export function XIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4l16 16" />
      <path d="M20 4 4 20" />
    </svg>
  );
}

export function LinkedInIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7" />
      <path d="M8 7v.01" />
      <path d="M12 17v-4a2.5 2.5 0 0 1 5 0v4" />
      <path d="M12 10v7" />
    </svg>
  );
}

export function InstagramIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5v.01" />
    </svg>
  );
}

export function ThreadsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3C7 3 4.5 6.5 4.5 12s2.5 9 7.5 9c4 0 6.5-2 7-5.5" />
      <path d="M8.5 9.5C9.5 7.5 11 7 12.5 7c2.5 0 4 1.5 4 5 0 2.5-1.5 4-3.5 4s-3-1-3-2.5 1.5-2.5 3.5-2.5c1.5 0 3 .5 4.5 1.5" />
    </svg>
  );
}

export function GlobeIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

// Map a social id from the data file to its icon.
export const socialIcons = {
  x: XIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  website: GlobeIcon,
};
