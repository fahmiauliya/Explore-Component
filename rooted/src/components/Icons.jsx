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

// ---- Canvas icons ----

export function PlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function GridIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 12h16" />
      <path d="M12 4v16" />
    </svg>
  );
}

export function FrameIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M15 4h4a1 1 0 0 1 1 1v4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
      <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function UnlockIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export function PencilIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

export function CopyIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function ClipboardIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export function ExternalLinkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export function BringFrontIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="4" width="12" height="12" rx="2" />
      <path d="M4 10v8a2 2 0 0 0 2 2h8" />
    </svg>
  );
}

export function SendBackIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="8" width="12" height="12" rx="2" />
      <path d="M10 4h8a2 2 0 0 1 2 2v8" />
    </svg>
  );
}

export function ImageIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m20 15-4.5-4.5L8 18" />
    </svg>
  );
}

export function TagIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M8 12h8" />
      <path d="M11 17h2" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ResetIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v5h5" />
    </svg>
  );
}

export function ZoomInIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

const alignBase = (children) => (props) => (
  <svg {...base} {...props}>
    {children}
  </svg>
);

export const AlignLeftIcon = alignBase(
  <>
    <path d="M4 4v16" />
    <rect x="7" y="7" width="12" height="4" rx="1" />
    <rect x="7" y="13" width="8" height="4" rx="1" />
  </>
);
export const AlignCenterHIcon = alignBase(
  <>
    <path d="M12 4v16" />
    <rect x="5" y="7" width="14" height="4" rx="1" />
    <rect x="8" y="13" width="8" height="4" rx="1" />
  </>
);
export const AlignRightIcon = alignBase(
  <>
    <path d="M20 4v16" />
    <rect x="5" y="7" width="12" height="4" rx="1" />
    <rect x="9" y="13" width="8" height="4" rx="1" />
  </>
);
export const AlignTopIcon = alignBase(
  <>
    <path d="M4 4h16" />
    <rect x="7" y="7" width="4" height="12" rx="1" />
    <rect x="13" y="7" width="4" height="8" rx="1" />
  </>
);
export const AlignCenterVIcon = alignBase(
  <>
    <path d="M4 12h16" />
    <rect x="7" y="5" width="4" height="14" rx="1" />
    <rect x="13" y="8" width="4" height="8" rx="1" />
  </>
);
export const AlignBottomIcon = alignBase(
  <>
    <path d="M4 20h16" />
    <rect x="7" y="5" width="4" height="12" rx="1" />
    <rect x="13" y="9" width="4" height="8" rx="1" />
  </>
);
export const DistributeHIcon = alignBase(
  <>
    <path d="M4 4v16" />
    <path d="M20 4v16" />
    <rect x="9" y="8" width="6" height="8" rx="1" />
  </>
);
export const DistributeVIcon = alignBase(
  <>
    <path d="M4 4h16" />
    <path d="M4 20h16" />
    <rect x="8" y="9" width="8" height="6" rx="1" />
  </>
);

export function PaletteIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.5-1-2.5S14 15 15.5 15H17a4 4 0 0 0 4-4c0-4.5-4-8-9-8Z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="10.5" cy="7.5" r="1" />
      <circle cx="15" cy="8" r="1" />
    </svg>
  );
}

export function InfoIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8v.01" />
    </svg>
  );
}

export function TextSizeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7V5h10v2" />
      <path d="M9 5v14" />
      <path d="M14 13v-1.5h6V13" />
      <path d="M17 11.5V19" />
    </svg>
  );
}

export function BackIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}

export function SectionIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9V7a2 2 0 0 1 2-2h5l1 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function TidyIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function CollapseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m7 10 5 5 5-5" />
      <path d="M5 5h14" />
    </svg>
  );
}

export function ExpandIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m7 14 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function TabSideIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9h5V5h6v4h5v10H4V9Z" />
    </svg>
  );
}

export function RibbonIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h10v18l-5-4-5 4V3Z" />
    </svg>
  );
}

export function TextIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6V4h14v2" />
      <path d="M12 4v16" />
      <path d="M9 20h6" />
    </svg>
  );
}

export function ListIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

export function ArrowUpToLineIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h14" />
      <path d="M12 20V8" />
      <path d="m7 13 5-5 5 5" />
    </svg>
  );
}

export function ArrowDownToLineIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 20h14" />
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
    </svg>
  );
}

export function PanelLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  );
}

export function PanelRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </svg>
  );
}

export function ChevronsUpIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m7 15 5-5 5 5" />
      <path d="m7 20 5-5 5 5" />
    </svg>
  );
}

export function ChevronsDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m7 4 5 5 5-5" />
      <path d="m7 9 5 5 5-5" />
    </svg>
  );
}

export function ScanIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}

export function FillIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function TransparentIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" strokeDasharray="3 3" />
    </svg>
  );
}

export function BoldIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h7a4 4 0 0 1 0 8H7z" />
      <path d="M7 12h8a4 4 0 0 1 0 8H7z" />
    </svg>
  );
}

export function AlignTextLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h14" />
    </svg>
  );
}

export function AlignTextCenterIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M5 18h14" />
    </svg>
  );
}

export function AlignTextRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16" />
      <path d="M10 12h10" />
      <path d="M6 18h14" />
    </svg>
  );
}

export function AutoWidthIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16" />
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 4h14" />
    </svg>
  );
}
