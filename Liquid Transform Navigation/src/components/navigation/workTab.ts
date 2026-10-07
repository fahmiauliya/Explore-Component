import { useSyncExternalStore } from 'react';

// The Works category chosen in the navigation tabs (Header.tsx), read by the Works grid
// (Works.tsx) to show that category's cards. The two live in separate trees, so they
// share this small store rather than lifting state through App.
export type WorkTab = 'selected' | 'recent';

let current: WorkTab = 'selected';
const listeners = new Set<() => void>();

export function setWorkTab(tab: WorkTab) {
  if (tab === current) return;
  current = tab;
  listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function useWorkTab() {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
