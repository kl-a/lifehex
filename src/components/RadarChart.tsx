import { useRef, useState } from 'react';
import { DIMENSIONS } from '../data/constants';
import type { DimensionScores } from '../types';

interface Props {
  values: DimensionScores;
  locked: boolean;
  onAxisTap?: (key: keyof DimensionScores) => void;
  onAxisHover?: (key: keyof DimensionScores | null) => void;
  onChange?: (key: keyof DimensionScores, value: number) => void;
  activeKey?: keyof DimensionScores | null;
}

const V = 320;          // viewBox size (SVG units)
const CX = V / 2;
const CY = V / 2;
const R = 104;          // outer radius of the plot
const LABEL_R = R + 22; // radius at which labels are drawn
const MAX = 10;
const N = DIMENSIONS.length;
const HIT_R = 22;       // pointer hit radius for handles (SVG units)
const DRAG_THRESHOLD = 5;

function axisAngle(i: number) {
  return -Math.PI / 2 + (i / N) * 2 * Math.PI;
}

function spokePt(i: number, val: number): [number, number] {
  const a = axisAngle(i);
  const r = (val / MAX) * R;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
}

function gridPoly(level: number) {
  return DIMENSIONS.map((_, i) => {
    const a = axisAngle(i);
    const r = (level / MAX) * R;
    return `${CX + Math.cos(a) * r},${CY + Math.sin(a) * r}`;
  }).join(' ');
}

function valFromPos(svgX: number, svgY: number, dimIdx: number) {
  const a = axisAngle(dimIdx);
  const proj = (svgX - CX) * Math.cos(a) + (svgY - CY) * Math.sin(a);
  return Math.min(MAX, Math.max(1, Math.round((proj / R) * MAX)));
}

export function RadarChart({ values, locked, onAxisTap, onAxisHover, onChange, activeKey }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // track whether the pointer moved enough to count as a drag vs a tap
  const ptrInfo = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  function toSVG(clientX: number, clientY: number) {
    const el = svgRef.current;
    if (!el) return { x: CX, y: CY };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * V,
      y: ((clientY - rect.top) / rect.height) * V,
    };
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (locked && !onAxisTap) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = toSVG(e.clientX, e.clientY);
    ptrInfo.current = { x: p.x, y: p.y, moved: false };

    // Find the nearest handle within HIT_R
    let best = -1, bestDist = HIT_R;
    DIMENSIONS.forEach((d, i) => {
      const [hx, hy] = spokePt(i, values[d.key]);
      const dist = Math.hypot(p.x - hx, p.y - hy);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setDragIdx(best);
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (locked || dragIdx === null || dragIdx === -1 || !onChange || !ptrInfo.current) return;
    const p = toSVG(e.clientX, e.clientY);
    if (!ptrInfo.current.moved && Math.hypot(p.x - ptrInfo.current.x, p.y - ptrInfo.current.y) > DRAG_THRESHOLD) {
      ptrInfo.current.moved = true;
    }
    if (ptrInfo.current.moved) {
      onChange(DIMENSIONS[dragIdx].key, valFromPos(p.x, p.y, dragIdx));
    }
  }

  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    const info = ptrInfo.current;
    if (info && !info.moved && onAxisTap) {
      // Short tap — toggle axis panel
      if (dragIdx !== null && dragIdx >= 0) {
        // tapped a handle
        onAxisTap(DIMENSIONS[dragIdx].key);
      } else {
        // tapped background — find nearest axis by angle
        const p = toSVG(e.clientX, e.clientY);
        const a = ((Math.atan2(p.y - CY, p.x - CX) + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.round((a / (2 * Math.PI)) * N) % N;
        onAxisTap(DIMENSIONS[idx].key);
      }
    }
    ptrInfo.current = null;
    setDragIdx(null);
  }

  const stroke = locked ? '#9b89c4' : '#ffe066';
  const polyFill = locked ? 'rgba(201,184,240,0.3)' : 'rgba(181,234,215,0.35)';
  const polyPoints = DIMENSIONS.map((d, i) => spokePt(i, values[d.key]).join(',')).join(' ');

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${V} ${V}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', touchAction: 'none', overflow: 'visible', cursor: locked ? 'default' : 'pointer' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Background grid rings */}
      {[2, 4, 6, 8, 10].map((lv) => (
        <polygon key={lv} points={gridPoly(lv)}
          fill="none" stroke="#7a6fa0" strokeOpacity={0.3} strokeWidth="1" />
      ))}

      {/* Spoke lines from center to outer ring */}
      {DIMENSIONS.map((_, i) => {
        const a = axisAngle(i);
        return (
          <line key={i}
            x1={CX} y1={CY}
            x2={CX + Math.cos(a) * R} y2={CY + Math.sin(a) * R}
            stroke="#7a6fa0" strokeOpacity={0.3} strokeWidth="1"
          />
        );
      })}

      {/* Value polygon */}
      <polygon points={polyPoints} fill={polyFill} stroke={stroke} strokeWidth="2" />

      {/* Draggable handle dots */}
      {DIMENSIONS.map((d, i) => {
        const [px, py] = spokePt(i, values[d.key]);
        const isActive = d.key === activeKey;
        const isDragging = dragIdx === i;
        return (
          <circle key={d.key}
            cx={px} cy={py}
            r={isDragging ? 11 : isActive ? 8 : 6}
            fill={isActive || isDragging ? '#ffe066' : stroke}
            stroke="#16213e"
            strokeWidth="2"
            style={{ cursor: locked ? 'default' : isDragging ? 'grabbing' : 'grab' }}
          />
        );
      })}

      {/* Axis labels */}
      {DIMENSIONS.map((d, i) => {
        const a = axisAngle(i);
        const lx = CX + Math.cos(a) * LABEL_R;
        const ly = CY + Math.sin(a) * LABEL_R;
        const ca = Math.cos(a);
        const anchor = Math.abs(ca) < 0.15 ? 'middle' : ca < 0 ? 'end' : 'start';
        const isActive = d.key === activeKey;

        return (
          <g key={d.key} style={{ cursor: 'default' }}
            onMouseEnter={() => onAxisHover?.(d.key)}
            onMouseLeave={() => onAxisHover?.(null)}
          >
            {/* Invisible hit area so hover works even between the two text lines */}
            <rect
              x={anchor === 'end' ? lx - 40 : anchor === 'start' ? lx : lx - 20}
              y={ly - 2}
              width={40} height={18}
              fill="transparent"
            />
            <text x={lx} y={ly + 3}
              textAnchor={anchor}
              fontFamily="Nunito, sans-serif" fontWeight="700" fontSize={7}
              fill={isActive ? '#ffe066' : locked ? '#9b89c4' : '#fdfcff'}
            >{d.short}</text>
            <text x={lx} y={ly + 14}
              textAnchor={anchor}
              fontFamily="Nunito, sans-serif" fontWeight="800" fontSize={10}
              fill={isActive ? '#ffe066' : locked ? '#7a6fa0' : '#ffe066'}
            >{values[d.key]}</text>
          </g>
        );
      })}
    </svg>
  );
}
