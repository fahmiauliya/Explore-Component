// Screen-space overlay: red smart guides, spacing pills, the box-select
// rectangle and the corner resize handles. Everything here is drawn in
// screen pixels so lines stay 1px at any zoom.
const CORNERS = ['nw', 'ne', 'sw', 'se'];
const SIDES = ['w', 'e'];

// Selection outline: a 4px gap between the item and a 1.5px stroke, so the
// stroke's centre line runs 4.75px outside the item. Handles sit on that line.
const GAP = 4;
const STROKE = 1.5;
const MID = GAP + STROKE / 2;

export default function Guides({ guides, spacings, box, handles, sideHandles = false, sidesOnly = false, tip, sizeLabel, groupBox, outlines = [], toScreen, zoom, onHandlePointerDown }) {
  // Sections carry their stroke on their own shape, so their handles sit on the frame itself.
  const off = handles?.section ? 0 : MID;
  return (
    <div className="canvas__overlay" aria-hidden="true">
      {outlines.map((o) => {
        const p = toScreen(o.x, o.y);
        return <div key={o.id} className="sel-outline" style={{ left: p.x - GAP - STROKE, top: p.y - GAP - STROKE, width: o.w * zoom + 2 * (GAP + STROKE), height: o.h * zoom + 2 * (GAP + STROKE), borderRadius: o.radius * zoom + GAP + STROKE }} />;
      })}
      {guides.map((g, i) =>
        g.axis === 'x' ? (
          <div
            key={`g${i}`}
            className="guide guide--v"
            style={{ left: toScreen(g.pos, 0).x, top: toScreen(0, g.from).y, height: (g.to - g.from) * zoom }}
          />
        ) : (
          <div
            key={`g${i}`}
            className="guide guide--h"
            style={{ top: toScreen(0, g.pos).y, left: toScreen(g.from, 0).x, width: (g.to - g.from) * zoom }}
          />
        )
      )}

      {spacings.map((s, i) => {
        const len = (s.to - s.from) * zoom;
        if (len < 2) return null;
        if (s.axis === 'x') {
          const p = toScreen(s.from, s.at);
          return (
            <div key={`s${i}`} className="spacing spacing--h" style={{ left: p.x, top: p.y, width: len }}>
              <span className="spacing__pill">{s.gap}</span>
            </div>
          );
        }
        const p = toScreen(s.at, s.from);
        return (
          <div key={`s${i}`} className="spacing spacing--v" style={{ left: p.x, top: p.y, height: len }}>
            <span className="spacing__pill">{s.gap}</span>
          </div>
        );
      })}

      {box && (
        <div
          className="box-select"
          style={{ left: Math.min(box.x1, box.x2), top: Math.min(box.y1, box.y2), width: Math.abs(box.x2 - box.x1), height: Math.abs(box.y2 - box.y1) }}
        />
      )}

      {handles &&
        sideHandles &&
        SIDES.map((c) => {
          const x = c === 'e' ? handles.x + handles.w : handles.x;
          const p = toScreen(x, handles.y + handles.h / 2);
          return <div key={c} className={`handle handle--${c}`} style={{ left: p.x + (c === 'e' ? off : -off), top: p.y }} onPointerDown={(e) => onHandlePointerDown(e, c)} />;
        })}

      {tip && (
        <div className="resize-tip floating num" style={{ left: tip.x + 12, top: tip.y + 12 }}>
          {tip.text}
        </div>
      )}

      {sizeLabel && (
        <div className="size-label floating num" style={{ left: toScreen(sizeLabel.x, 0).x, top: toScreen(0, sizeLabel.y).y + 8 }}>
          {sizeLabel.text}
        </div>
      )}

      {groupBox && (
        <div
          className="group-box"
          style={{ left: toScreen(groupBox.x, 0).x - 8, top: toScreen(0, groupBox.y).y - 8, width: groupBox.w * zoom + 16, height: groupBox.h * zoom + 16 }}
        />
      )}

      {handles &&
        !sidesOnly &&
        CORNERS.map((c) => {
          const x = c.includes('e') ? handles.x + handles.w : handles.x;
          const y = c.includes('s') ? handles.y + handles.h : handles.y;
          const p = toScreen(x, y);
          return (
            <div
              key={c}
              className={`handle handle--${c}`}
              style={{ left: p.x + (c.includes('e') ? off : -off), top: p.y + (c.includes('s') ? off : -off) }}
              onPointerDown={(e) => onHandlePointerDown(e, c)}
            />
          );
        })}
    </div>
  );
}
