import { useState } from 'react';

// A site's favicon from Google's favicon service. If the image can't load,
// the first letter of the name is shown instead.
export default function SiteIcon({ name, domain, size = 20 }) {
  const [failed, setFailed] = useState(false);
  const letter = (name || '?').trim().charAt(0).toUpperCase();

  if (failed) {
    return (
      <span className="site-icon site-icon--letter" style={{ width: size, height: size }} aria-hidden="true">
        {letter}
      </span>
    );
  }

  return (
    <img
      className="site-icon"
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
