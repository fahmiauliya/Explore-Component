import { useEffect, useRef } from 'react';
import type { SkyValues } from './dial';

/*
 * The Sky Dots' opacity variants: presets of the three tones' opacity, light / mid / dark, in %. Choosing one sets
 * the three sliders; moving a slider makes the select "Custom".
 */
export const VARIANTS: Record<string, readonly [number, number, number]> = {
  Depth: [30, 65, 100],           // shadows become the brightest white lines
  Soft: [20, 45, 80],             // calmer, blends more with the sky
  'Glow edges': [100, 60, 35],    // inverted: the outline glows, the inside is quieter
  'High contrast': [10, 55, 100], // the strongest separation between tones
};
export const VARIANT_NAMES = [...Object.keys(VARIANTS), 'Custom'];

type Dial = { values: SkyValues; setValues: (values: Record<string, unknown>) => void };

/** Keeps the select and the sliders consistent, both ways. */
export function useOpacityVariant(dial: Dial) {
  const { variant, light, mid, dark } = dial.values['Sky Dots'];
  const applying = useRef(false);
  const matches = (preset: readonly [number, number, number]) => preset[0] === light && preset[1] === mid && preset[2] === dark;
  useEffect(() => {
    const preset = VARIANTS[variant];
    if (!preset || matches(preset)) return;
    applying.current = true;                                 // the sliders are about to change because of the select
    dial.setValues({ 'Sky Dots': { light: preset[0], mid: preset[1], dark: preset[2] } });
  }, [variant]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (applying.current) { applying.current = false; return; }
    const preset = VARIANTS[variant];
    if (preset && !matches(preset)) dial.setValues({ 'Sky Dots': { variant: 'Custom' } });
  }, [light, mid, dark]); // eslint-disable-line react-hooks/exhaustive-deps
}
