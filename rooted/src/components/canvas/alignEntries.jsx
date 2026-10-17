import {
  AlignBottomIcon,
  AlignCenterHIcon,
  AlignCenterVIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  DistributeHIcon,
  DistributeVIcon,
} from '../Icons.jsx';

// Shared by the bottom toolbar and the right-click menu.
export function alignEntries(count, onAlign) {
  const few = count < 2;
  const entries = [
    { label: 'Align left', icon: AlignLeftIcon, disabled: few, onSelect: () => onAlign('left') },
    { label: 'Align center', icon: AlignCenterHIcon, disabled: few, onSelect: () => onAlign('center') },
    { label: 'Align right', icon: AlignRightIcon, disabled: few, onSelect: () => onAlign('right') },
    { label: 'Align top', icon: AlignTopIcon, disabled: few, onSelect: () => onAlign('top') },
    { label: 'Align middle', icon: AlignCenterVIcon, disabled: few, onSelect: () => onAlign('middle') },
    { label: 'Align bottom', icon: AlignBottomIcon, disabled: few, onSelect: () => onAlign('bottom') },
  ];
  if (count >= 3) {
    entries.push('divider');
    entries.push({ label: 'Distribute horizontally', icon: DistributeHIcon, onSelect: () => onAlign('distribute-h') });
    entries.push({ label: 'Distribute vertically', icon: DistributeVIcon, onSelect: () => onAlign('distribute-v') });
  }
  return entries;
}
