import { useLayoutEffect, useState } from 'react';

// Critical damping preserves velocity on reversal without adding a bounce.
export function useNavigationProgress() {
  const [progress, setProgress] = useState(0);
  useLayoutEffect(() => {
    const trigger = document.getElementById('works-navigation-trigger');
    if (!trigger) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const boundary = 61;
    let target = trigger.getBoundingClientRect().top < boundary ? 1 : 0;
    let position = target;
    let velocity = 0;
    let frame = 0;
    let previousTime = 0;
    setProgress(position);

    const tick = (time: number) => {
      const dt = Math.min((time - previousTime) / 1000, 0.032);
      previousTime = time;
      const frequency = 14;
      const offset = position - target;
      const impulse = velocity + frequency * offset;
      const decay = Math.exp(-frequency * dt);
      position = target + (offset + impulse * dt) * decay;
      velocity = (velocity - frequency * impulse * dt) * decay;
      if (Math.abs(position - target) < 0.0001 && Math.abs(velocity) < 0.002) {
        position = target;
        velocity = 0;
        frame = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      setProgress(position);
    };
    const animate = () => {
      if (reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        position = target;
        velocity = 0;
        setProgress(target);
      } else if (!frame && position !== target) {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      target = !entry.isIntersecting && entry.boundingClientRect.top < boundary ? 1 : 0;
      animate();
    }, { rootMargin: `-${boundary}px 0px 0px 0px`, threshold: 0 });
    observer.observe(trigger);
    reducedMotion.addEventListener('change', animate);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', animate);
      cancelAnimationFrame(frame);
    };
  }, []);
  return progress;
}

export function capsulePath(left: number, width: number, radius: number) {
  const top = 16 - radius;
  const bottom = 16 + radius;
  const right = left + width;
  return `M${left + radius},${top}H${right - radius}A${radius},${radius} 0 0 1 ${right},16A${radius},${radius} 0 0 1 ${right - radius},${bottom}H${left + radius}A${radius},${radius} 0 0 1 ${left},16A${radius},${radius} 0 0 1 ${left + radius},${top}Z`;
}

// Only the material silhouette is sampled. The actual link/icon never blurs.
// A smooth union thins to zero at separation; the same geometry runs in reverse.
export function materialPath(left: number, width: number, aboutCenter: number, progress: number, pillRadius = 16) {
  const pill = capsulePath(left, width, pillRadius);
  const circle = capsulePath(aboutCenter - 14, 28, 14);
  const right = left + width;
  if (progress === 0 || aboutCenter + 14 <= right - 1) return pill;
  if (progress === 1) return `${pill}${circle}`;
  const blend = 6 * Math.sin(Math.PI * Math.max(0, (progress - 0.55) / 0.45));
  const distance = (x: number, y: number) => {
    const dx = Math.max(left + pillRadius - x, 0, x - (right - pillRadius));
    const a = Math.hypot(dx, y) - pillRadius;
    const b = Math.hypot(x - aboutCenter, y) - 14;
    const overlap = Math.max(blend - Math.abs(a - b), 0);
    return Math.min(a, b) - overlap * overlap / (4 * Math.max(blend, 0.00001));
  };
  const contours: Array<Array<[number, number]>> = [];
  let contour: Array<[number, number]> = [];
  const end = Math.max(right, aboutCenter + 14) + 3;
  let previousX = left - 3;
  for (let x = left - 3; x <= end; x += 0.4) {
    const inside = distance(x, 0) < 0;
    if (inside !== (contour.length > 0)) {
      let low = previousX;
      let high = x;
      for (let i = 0; i < 10; i++) {
        const mid = (low + high) / 2;
        if ((distance(mid, 0) < 0) === inside) high = mid;
        else low = mid;
      }
      contour.push([(low + high) / 2, 0]);
      if (!inside) {
        contours.push(contour);
        contour = [];
      }
    }
    if (inside) {
      let low = 0;
      let high = 20;
      for (let i = 0; i < 10; i++) {
        const mid = (low + high) / 2;
        if (distance(x, mid) < 0) low = mid;
        else high = mid;
      }
      contour.push([x, (low + high) / 2]);
    }
    previousX = x;
  }
  return contours.map((points) => {
    const top = points.map(([x, y]) => `${x.toFixed(2)},${(16 - y).toFixed(2)}`);
    const bottom = [...points].reverse().map(([x, y]) => `${x.toFixed(2)},${(16 + y).toFixed(2)}`);
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  }).join('');
}
