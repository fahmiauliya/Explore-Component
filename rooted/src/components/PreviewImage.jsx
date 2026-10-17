import { useState } from 'react';
import { getSlug } from '../lib/references.js';
import SiteIcon from './SiteIcon.jsx';

// ------------------------------------------------------------
// Screenshot for one reference. Sources are tried in this order:
//   1. item.image (manual override in the data file)
//   2. /previews/<slug>.webp (made by `npm run previews`)
//   3. thum.io screenshot service (backup only, limited free quota)
//   4. nothing -> the placeholder (favicon + domain)
// The step that worked (or that everything failed) is remembered per item,
// so failed URLs are never requested twice.
// ------------------------------------------------------------
const stepCache = new Map(); // item.key -> index of the working source, or -1

function candidatesFor(item) {
  return [
    item.image,
    `/previews/${getSlug(item.url)}.webp`,
    `https://image.thum.io/get/width/640/crop/750/${item.url}`,
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
  const candidates = candidatesFor(item);
  const [step, setStep] = useState(() => stepCache.get(item.key) ?? 0);

  if (step < 0 || step >= candidates.length) {
    return <PreviewPlaceholder item={item} iconSize={iconSize} />;
  }

  return (
    <img
      key={candidates[step]}
      className={className}
      src={candidates[step]}
      alt=""
      width={640}
      height={400}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      onLoad={() => stepCache.set(item.key, step)}
      onError={() => {
        const next = step + 1 < candidates.length ? step + 1 : -1;
        stepCache.set(item.key, next);
        setStep(next);
      }}
    />
  );
}
