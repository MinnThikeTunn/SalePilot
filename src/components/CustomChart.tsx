import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface CustomChartProps {
  data: DataPoint[];
  color?: string;
  title?: string;
  unit?: string;
}

export function CustomChart({ data, color = "#10b981", title, unit = "" }: CustomChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.value), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Generate coordinates for Line Chart
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * graphWidth;
    const y = chartHeight - paddingBottom - (d.value / maxVal) * graphHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : "";

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs relative overflow-hidden">
      {title && (
        <h4 className="text-[11px] font-mono tracking-wider text-slate-500 mb-4 flex items-center justify-between uppercase font-semibold">
          <span>{title}</span>
          <span className="text-slate-900 font-bold font-sans">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()} {unit}
          </span>
        </h4>
      )}

      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * graphHeight;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[10px]"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {points.length > 0 && (
            <path
              d={areaPath}
              className="fill-indigo-500/5 transition-all duration-300"
              style={{ stroke: "none" }}
            />
          )}

          {/* Golden Line */}
          {points.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Interactive dots and hover grids */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Trigger area */}
              <rect
                x={p.x - graphWidth / (data.length * 2)}
                y={paddingTop}
                width={graphWidth / (data.length - 1 || 1)}
                height={graphHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Grid Column Line */}
              {hoveredIdx === i && (
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={chartHeight - paddingBottom}
                  stroke="#6366f1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="pointer-events-none"
                />
              )}

              {/* Data Dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 3.5}
                className="transition-all duration-150 pointer-events-none"
                fill={hoveredIdx === i ? "#ffffff" : color}
                stroke={color}
                strokeWidth={hoveredIdx === i ? 3 : 1.5}
              />
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={chartHeight - paddingBottom + 16}
              textAnchor="middle"
              className="fill-slate-500 font-mono text-[10px]"
            >
              {p.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-700/80 pointer-events-none font-sans z-10 shadow-xl"
            style={{
              left: `${((points[hoveredIdx].x - paddingLeft + 15) / graphWidth) * 85}%`,
              top: "-5px",
            }}
          >
            <div className="font-semibold text-slate-300">{points[hoveredIdx].label}</div>
            <div className="text-emerald-400 font-mono font-bold mt-0.5">
              {points[hoveredIdx].value.toLocaleString()} {unit}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
