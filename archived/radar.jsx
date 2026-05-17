// Custom radar chart for 6 dimensions — supports drag-to-change on vertices

function RadarChart({ values, locked, onAxisTap, onChange, size = 460 }) {
  const { useState, useRef, useEffect } = React;
  const [draggingIdx, setDraggingIdx] = useState(null);
  const draggingRef = useRef(null);
  const svgRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const cx = size / 2, cy = size / 2;
  const radius = size / 2 - 64;
  const axes = DIMENSIONS;
  const n = axes.length;

  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const point = (i, v) => {
    const r = (v / 10) * radius;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };

  const labelPos = (i) => {
    const r = radius + 28;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };

  const polyPoints = axes.map((a, i) => point(i, values[a.key])).map(p => p.join(',')).join(' ');

  const gridRings = [2, 4, 6, 8, 10];
  const stroke = locked ? '#7a6fa0' : '#ffe066';
  const fill = locked ? 'rgba(201,184,240,0.3)' : 'rgba(181,234,215,0.35)';
  const fillStroke = locked ? '#9b89c4' : '#6aab90';

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const src = e.touches ? e.touches[0] : e;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = size / rect.width;
      const scaleY = size / rect.height;
      const svgX = (src.clientX - rect.left) * scaleX;
      const svgY = (src.clientY - rect.top) * scaleY;
      const { index, key } = draggingRef.current;
      const ang = angle(index);
      const dx = svgX - cx;
      const dy = svgY - cy;
      const proj = dx * Math.cos(ang) + dy * Math.sin(ang);
      const clamped = Math.max(0, Math.min(radius, proj));
      const newVal = Math.max(1, Math.min(10, Math.round((clamped / radius) * 10)));
      if (onChangeRef.current) onChangeRef.current(key, newVal);
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = null;
      setDraggingIdx(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  function startDrag(e, i, key) {
    if (locked || !onChangeRef.current) return;
    e.preventDefault();
    draggingRef.current = { index: i, key };
    setDraggingIdx(i);
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'transparent', padding: 8,
    }}>
      <svg
        ref={svgRef}
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="geometricPrecision"
        style={{ maxWidth: '100%', height: 'auto', userSelect: 'none' }}
      >
        {/* Concentric grid rings */}
        {gridRings.map((v) => {
          const pts = axes.map((_, i) => {
            const r = (v / 10) * radius;
            return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r].join(',');
          }).join(' ');
          return (
            <polygon
              key={v}
              points={pts}
              fill="none"
              stroke="#7a6fa0"
              strokeWidth={v === 10 ? 1.5 : 1}
              strokeOpacity={v === 10 ? 0.7 : 0.25}
              strokeDasharray={v === 10 ? '0' : '2 4'}
            />
          );
        })}

        {/* Axis spokes */}
        {axes.map((a, i) => {
          const [px, py] = point(i, 10);
          return <line key={a.key} x1={cx} y1={cy} x2={px} y2={py} stroke="#7a6fa0" strokeWidth="1" strokeOpacity="0.3" />;
        })}

        {/* Filled polygon */}
        <polygon
          points={polyPoints}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: draggingIdx !== null ? 'none' : 'all 220ms ease' }}
        />

        {/* Vertex circles — drag handles */}
        {axes.map((a, i) => {
          const [px, py] = point(i, values[a.key]);
          const isDragging = draggingIdx === i;
          const canDrag = !locked && onChange;
          return (
            <circle
              key={a.key}
              cx={px} cy={py}
              r={isDragging ? 8 : 5}
              fill={isDragging ? '#ffe066' : stroke}
              stroke={fillStroke}
              strokeWidth="1.5"
              style={{
                cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none',
                transition: isDragging ? 'none' : 'r 150ms ease, fill 150ms ease',
              }}
              onMouseDown={(e) => startDrag(e, i, a.key)}
              onTouchStart={(e) => startDrag(e, i, a.key)}
            />
          );
        })}

        {/* Axis labels (tap to open detail sheet) */}
        {axes.map((a, i) => {
          const [lx, ly] = labelPos(i);
          const anchor = Math.abs(lx - cx) < 8 ? 'middle' : (lx < cx ? 'end' : 'start');
          const valStr = `${values[a.key]}`;
          return (
            <g
              key={a.key}
              className={!locked ? 'radar-hit' : ''}
              onClick={() => !locked && onAxisTap && onAxisTap(a.key)}
            >
              <rect x={lx - 42} y={ly - 20} width="84" height="40" fill="transparent" />
              <text
                x={lx} y={ly - 2}
                textAnchor={anchor}
                fontFamily="Nunito, sans-serif"
                fontWeight="700"
                fontSize="12"
                fill={locked ? '#9b89c4' : '#fdfcff'}
              >{a.short}</text>
              <text
                x={lx} y={ly + 17}
                textAnchor={anchor}
                fontFamily="Nunito, sans-serif"
                fontWeight="700"
                fontSize="15"
                fill={locked ? '#7a6fa0' : '#ffe066'}
              >{valStr}</text>
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="#7a6fa0" />
      </svg>
    </div>
  );
}

Object.assign(window, { RadarChart });
