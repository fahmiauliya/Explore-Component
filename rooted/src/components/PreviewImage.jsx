import { useEffect, useState } from 'react';
import { getSlug, githubPreview } from '../lib/references.js';
import SiteIcon from './SiteIcon.jsx';

// ------------------------------------------------------------
// Screenshot for one reference. Sources are tried in this order:
//   1. item.image (manual override in the data file)
//   2. GitHub's social preview, for github.com/{owner}/{repo} links only
//   3. /previews/<slug>.webp (made by `npm run previews`)
//   4. thum.io screenshot service (backup only, limited free quota)
//   5. nothing -> the placeholder (favicon + domain)
// The step that worked (or that everything failed) is remembered per item,
// so failed URLs are never requested twice.
// ------------------------------------------------------------
const stepCache = new Map(); // item.key -> index of the working source, or -1

// public/previews/manifest.json: which GitHub images came from a README
// (shown with cover) and which are social cards (shown with contain).
let manifest = null;
let manifestPromise = null;
const manifestWaiters = new Set();
function loadManifest() {
  if (manifest || typeof fetch === 'undefined') return;
  manifestPromise =
    manifestPromise ||
    fetch('/previews/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((data) => {
        manifest = data;
        for (const fn of manifestWaiters) fn(data);
        manifestWaiters.clear();
      });
}
function useManifest() {
  const [data, setData] = useState(manifest);
  useEffect(() => {
    if (manifest) return undefined;
    loadManifest();
    manifestWaiters.add(setData);
    return () => manifestWaiters.delete(setData);
  }, []);
  return data || {};
}

// Each candidate carries how it should fit the 16:10 box.
function candidatesFor(item, manifest) {
  const slug = getSlug(item.url);
  const local = manifest[slug];
  return [
    item.image && { src: item.image, fit: 'cover' },
    { src: `/previews/${slug}.webp`, fit: local?.source === 'social' ? 'contain' : 'cover' },
    githubPreview(item.url) && { src: githubPreview(item.url), fit: 'contain' },
    { src: `https://image.thum.io/get/width/640/crop/750/${item.url}`, fit: 'cover' },
  ].filter(Boolean);
}

// The gray box shown when there is no image.
export function PreviewPlaceholder({ item, iconSize = 32 }) {
  return (
    <div className="preview-placeholder">
      <SiteIcon name={item.name} domain={item.domain} size={iconSize} />
      <span className="preview-placeholder__domain">{item.domain}</span>
    </div>
  );
}

export default function PreviewImage({ item, className = '', lazy = true, iconSize = 32 }) {
  const manifest = useManifest();
  const candidates = candidatesFor(item, manifest);
  const [step, setStep] = useState(() => stepCache.get(item.key) ?? 0);
  const [loaded, setLoaded] = useState(false);

  if (step < 0 || step >= candidates.length) {
    return <PreviewPlaceholder item={item} iconSize={iconSize} />;
  }
  const { src, fit } = candidates[step];

  // The box shimmers until the image has loaded, then the image fades in.
  return (
    <span className={`shot shot--${fit}${loaded ? ' is-loaded' : ''}`}>
      <img
        key={src}
        className={className}
        src={src}
        alt=""
        width={640}
        height={400}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={() => {
          stepCache.set(item.key, step);
          setLoaded(true);
        }}
        onError={() => {
          const next = step + 1 < candidates.length ? step + 1 : -1;
          stepCache.set(item.key, next);
          setStep(next);
        }}
      />
    </span>
  );
}
