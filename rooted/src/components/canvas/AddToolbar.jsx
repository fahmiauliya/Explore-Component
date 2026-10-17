import { useRef, useState } from 'react';
import { ImageIcon, PlusIcon } from '../Icons.jsx';
import ContextMenu from './ContextMenu.jsx';

export const LABEL_PRESETS = ['Font', 'Color', 'Image style', 'Illustration style', 'Texture', 'Icon'];

// Top-left pill: "+ Label" (preset menu) and "Upload image" (file picker).
export default function AddToolbar({ onAddLabel, onUploadFiles }) {
  const [menu, setMenu] = useState(null);
  const fileRef = useRef(null);
  const labelBtn = useRef(null);

  function openMenu() {
    const r = labelBtn.current.getBoundingClientRect();
    setMenu({ x: r.left, y: r.bottom + 4 });
  }

  const entries = [
    ...LABEL_PRESETS.map((text) => ({ label: text, onSelect: () => onAddLabel(text) })),
    'divider',
    { label: 'Custom…', onSelect: () => onAddLabel(null) },
  ];

  return (
    <div className="cbar cbar--add" role="toolbar" aria-label="Add">
      <button ref={labelBtn} type="button" className="cbar__text" onClick={openMenu} aria-haspopup="menu" aria-expanded={!!menu}>
        <PlusIcon />
        Label
      </button>
      <span className="cbar__divider" />
      <button type="button" className="cbar__text" onClick={() => fileRef.current?.click()}>
        <ImageIcon />
        Upload image
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onUploadFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
      {menu && <ContextMenu x={menu.x} y={menu.y} entries={entries} onClose={() => setMenu(null)} label="Add label" />}
    </div>
  );
}
