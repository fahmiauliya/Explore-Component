/* The site's small icons: 14px line icons in the current colour (the nav, the pills, the card captions, the footer). */

type P = { className?: string };
const Svg = ({ className, children, fill }: P & { children: React.ReactNode; fill?: boolean }) => (
  <svg className={`icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" width="14" height="14" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);

/** Compo's mark: the isometric cube (public/favicon.svg). */
export const Logo = ({ className, size = 14 }: P & { size?: number }) => (
  <svg className={`icon${className ? ` ${className}` : ''}`} viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M16 3.5 27.5 10v12L16 28.5 4.5 22V10Z M4.5 10 16 16.5 27.5 10 M16 16.5v12" />
  </svg>
);
export const Shapes = (p: P) => <Svg {...p}><path d="M12 3 21 8 12 13 3 8Z" /><path d="m3 13 9 5 9-5" /><path d="m3 17.5 9 5 9-5" /></Svg>;
export const Send = (p: P) => <Svg {...p}><path d="M14.5 21.7a.5.5 0 0 0 .9 0l6.5-19a.5.5 0 0 0-.6-.6l-19 6.5a.5.5 0 0 0 0 .9l7.9 3.2a2 2 0 0 1 1.1 1.1z" /><path d="m21.9 2.1-10.9 11" /></Svg>;
export const ArrowDown = (p: P) => <Svg {...p}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></Svg>;
export const ArrowRight = (p: P) => <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>;
export const ArrowLeft = (p: P) => <Svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Svg>;
export const ChevronLeft = (p: P) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const Sun = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></Svg>;
export const Moon = (p: P) => <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>;
export const Sliders = (p: P) => <Svg {...p}><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" /></Svg>;
export const Download = (p: P) => <Svg {...p}><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></Svg>;
export const GitHub = (p: P) => <Svg {...p}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5a10.6 10.6 0 0 0-8 0C6 2 5 2 5 2c-.3 1.2-.3 2.4 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.8 1.7-.2.6-.2 1.2-.2 1.8v4" /><path d="M9 18c-4.5 2-5-2-7-2" /></Svg>;
export const LinkedIn = (p: P) => <Svg {...p}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></Svg>;
export const X = (p: P) => <Svg {...p}><path d="M4 4l11.7 16H20L8.3 4z" /><path d="M4 20l6.8-6.8M13.2 10.8 20 4" /></Svg>;
export const Dribbble = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M19.1 5.1C15.2 9.1 10 10.4 2.3 10.9M21.8 12.8c-6.6-1.4-12.1 1-16.4 6.3M8.6 2.8c4.4 6 6 9.4 8 17.7" /></Svg>;

/** Fahmi's links, as on fahmiauliya.com. */
export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/fahmiauliya', Icon: GitHub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/fahmiauliya/', Icon: LinkedIn },
  { label: 'X', href: 'https://x.com/fahmiauliyaa', Icon: X },
  { label: 'Dribbble', href: 'https://dribbble.com/FahmiAuliya', Icon: Dribbble },
] as const;

export function Socials({ className }: P) {
  return (
    <div className={`socials${className ? ` ${className}` : ''}`}>
      {SOCIALS.map(({ label, href, Icon }) => (
        <a key={label} className="social" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}><Icon /></a>
      ))}
    </div>
  );
}
