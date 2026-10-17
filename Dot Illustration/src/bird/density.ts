import { useEffect, useRef } from 'react';

/*
 * The dot density: columns across the frame, with quick presets. Rows follow to keep the frame's ratio, and the
 * cell, the dot and pill sizes and the hidden render target all follow the cell, so the drawing looks the same at
 * any density, only with more, smaller dots or fewer, bigger ones. Choosing a preset sets the columns; moving
 * the slider makes the select "Custom". Both tabs and both animals share it through the Dot Bird panel.
 */
export const DENSITIES: Record<string, number> = { Chunky: 30, Default: 54, Fine: 80, Ultra: 110 };
export const DENSITY_NAMES = [...Object.keys(DENSITIES), 'Custom'];

type Dial = { values: { Density: { preset: string; columns: number } }; setValues: (values: Record<string, unknown>) => void };

/** Keeps the preset select and the columns slider consistent, both ways. */
export function useDensityPreset(dial: Dial) {
  const { preset, columns } = dial.values.Density;
  const applying = useRef(false);
  useEffect(() => {
    const value = DENSITIES[preset];
    if (value === undefined || value === columns) return;
    applying.current = true;                                 // the slider is about to change because of the select
    dial.setValues({ Density: { columns: value } });
  }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (applying.current) { applying.current = false; return; }
    const value = DENSITIES[preset];
    if (value !== undefined && value !== columns) dial.setValues({ Density: { preset: 'Custom' } });
  }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps
}
