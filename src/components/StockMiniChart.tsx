import React, { useState } from 'react';

interface ChartPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface StockMiniChartProps {
  data?: ChartPoint[] | number[];
  isPositive?: boolean;
  height?: number;
  showCandles?: boolean;
  interactive?: boolean;
}

export const StockMiniChart: React.FC<StockMiniChartProps> = ({
  data,
  isPositive = true,
  height = 60,
  showCandles = false,
  interactive = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Normalize data to points
  const points: ChartPoint[] = React.useMemo(() => {
    if (!data || data.length === 0) {
      // Default fallback 8 points
      const base = 100;
      return Array.from({ length: 8 }).map((_, i) => ({
        date: `D-${8 - i}`,
        close: base + (isPositive ? i * 2 : -i * 2) + Math.sin(i) * 3,
        open: base + (isPositive ? (i - 0.5) * 2 : (-i + 0.5) * 2),
        high: base + (isPositive ? i * 2 : -i * 2) + 5,
        low: base + (isPositive ? i * 2 : -i * 2) - 4,
      }));
    }

    if (typeof data[0] === 'number') {
      return (data as number[]).map((val, idx) => ({
        date: `P${idx + 1}`,
        close: val,
        open: val,
        high: val,
        low: val,
      }));
    }

    return data as ChartPoint[];
  }, [data, isPositive]);

  if (points.length < 2) {
    return <div className="h-[60px] flex items-center justify-center text-xs text-slate-500">차트 데이터 없음</div>;
  }

  const values = points.map((p) => p.close);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const width = 280;
  const paddingY = 8;
  const chartHeight = height - paddingY * 2;

  const getX = (idx: number) => (idx / (points.length - 1)) * (width - 16) + 8;
  const getY = (val: number) => height - paddingY - ((val - minVal) / range) * chartHeight;

  // Path generator
  const pathD = points
    .map((p, idx) => {
      const x = getX(idx);
      const y = getY(p.close);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${(width - 8).toFixed(1)} ${height} L 8 ${height} Z`;

  // Korean stock colors: Positive is Rose/Red, Negative is Blue
  const strokeColor = isPositive ? '#f43f5e' : '#3b82f6';
  const gradStart = isPositive ? 'rgba(244, 63, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)';
  const gradEnd = isPositive ? 'rgba(244, 63, 94, 0.0)' : 'rgba(59, 130, 246, 0.0)';
  const gradId = `grad-${isPositive ? 'pos' : 'neg'}-${Math.random().toString(36).substr(2, 5)}`;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full select-none">
      {interactive && activePoint && (
        <div className="absolute top-1 right-2 z-10 text-[11px] bg-slate-900/90 border border-slate-700/60 rounded px-2 py-0.5 text-slate-200 shadow pointer-events-none">
          <span className="text-slate-400 mr-1.5">{activePoint.date}:</span>
          <span className="font-semibold">{activePoint.close.toLocaleString()}원</span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>

        {/* Candlestick Mode */}
        {showCandles ? (
          points.map((p, idx) => {
            const x = getX(idx);
            const openY = getY(p.open ?? p.close);
            const closeY = getY(p.close);
            const highY = getY(p.high ?? Math.max(p.open ?? p.close, p.close));
            const lowY = getY(p.low ?? Math.min(p.open ?? p.close, p.close));
            const isCandleUp = p.close >= (p.open ?? p.close);
            const candleColor = isCandleUp ? '#f43f5e' : '#3b82f6';
            const top = Math.min(openY, closeY);
            const bodyH = Math.max(2, Math.abs(closeY - openY));

            return (
              <g key={idx}>
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={candleColor} strokeWidth="1.2" opacity="0.8" />
                {/* Body */}
                <rect
                  x={x - 4}
                  y={top}
                  width="8"
                  height={bodyH}
                  fill={isCandleUp ? candleColor : candleColor}
                  rx="1"
                />
              </g>
            );
          })
        ) : (
          <>
            {/* Area Fill */}
            <path d={areaD} fill={`url(#${gradId})`} />
            {/* Line */}
            <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Interactive Hover Line & Point */}
        {interactive &&
          points.map((p, idx) => {
            const x = getX(idx);
            return (
              <rect
                key={idx}
                x={x - 10}
                y={0}
                width={20}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}

        {interactive && hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={0}
              x2={getX(hoverIndex)}
              y2={height}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="2,2"
              strokeWidth="1"
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(points[hoverIndex].close)}
              r="4"
              fill={strokeColor}
              stroke="#0b0f19"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
