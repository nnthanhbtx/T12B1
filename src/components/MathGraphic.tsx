import React, { useId } from 'react';
import { InlineMath } from 'react-katex';
import { TableProperties } from 'lucide-react';

export interface VariationTablePoint {
  x: string;
  yPrime?: string;
  yVal: string;
  yPos: 'top' | 'bottom' | 'mid';
}

export interface VariationTableData {
  type: 'bbt';
  title?: string;
  xValues: string[]; // e.g. ["-\\infty", "", "0", "", "2", "", "+\\infty"] or ["-\\infty", "0", "2", "+\\infty"]
  yPrimeSigns: string[]; // e.g. ["", "+", "0", "-", "0", "+", ""]
  yValues: {
    val: string;
    pos: 'top' | 'bottom' | 'mid';
  }[];
  notes?: string;
}

export interface CoordinateGraphData {
  type: 'graph';
  title?: string;
  funcType: 'cubic' | 'quartic' | 'rational';
  points?: { x: number; y: number; label: string }[];
  description?: string;
}

export type MathDiagram = VariationTableData | CoordinateGraphData;

interface MathGraphicProps {
  tikz?: string;
  diagram?: MathDiagram;
}

/**
 * Clean and format a string for KaTeX rendering
 */
export const cleanMath = (raw: string): string => {
  if (!raw) return '';
  let str = raw.trim();
  // Strip leading and trailing $ or \( \)
  if (str.startsWith('$') && str.endsWith('$') && str.length >= 2) {
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('\\(') && str.endsWith('\\)') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  }
  return str;
};

/**
 * Standard Math Text renderer with KaTeX and symbol fallbacks
 */
export const MathText: React.FC<{ math: string; className?: string }> = ({ math, className = '' }) => {
  const cleaned = cleanMath(math);
  if (!cleaned) return null;

  // Double vertical line (hai vạch đứng - điểm không xác định)
  if (cleaned === '||' || cleaned === '\\|' || cleaned === 'dline') {
    return (
      <div className="flex gap-1 justify-center items-center h-full px-1">
        <div className="w-[1.5px] h-full min-h-[22px] bg-slate-400" />
        <div className="w-[1.5px] h-full min-h-[22px] bg-slate-400" />
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <InlineMath
        math={cleaned}
        renderError={() => <span className="font-sans text-xs">{math}</span>}
      />
    </span>
  );
};

interface NormalizedPoint {
  x: string;
  yPrime: string;
  yVal: string;
  yPos: 'top' | 'bottom' | 'mid';
}

interface NormalizedInterval {
  sign: string;
  arrow: 'up' | 'down' | 'flat';
  startPos: 'top' | 'bottom' | 'mid';
  endPos: 'top' | 'bottom' | 'mid';
}

/**
 * Parse and normalize variation table data into points and intervals
 */
function parseBBT(diagram: VariationTableData): {
  points: NormalizedPoint[];
  intervals: NormalizedInterval[];
} {
  const { xValues = [], yPrimeSigns = [], yValues = [] } = diagram;

  // Check if xValues uses alternating pattern (contains empty strings at odd indices)
  const isAlternating = xValues.some((v, idx) => idx % 2 === 1 && v === '');

  const points: NormalizedPoint[] = [];
  const intervals: NormalizedInterval[] = [];

  if (isAlternating) {
    // Alternating format: xValues has 2k + 1 items
    const numPoints = Math.floor((xValues.length + 1) / 2);
    for (let i = 0; i < numPoints; i++) {
      const xIdx = 2 * i;
      const yValObj = yValues[i] || { val: '', pos: 'mid' as const };
      points.push({
        x: xValues[xIdx] || '',
        yPrime: yPrimeSigns[xIdx] || '',
        yVal: yValObj.val || '',
        yPos: yValObj.pos || 'mid'
      });
    }

    for (let i = 0; i < numPoints - 1; i++) {
      const signIdx = 2 * i + 1;
      const sign = yPrimeSigns[signIdx] || '';
      const startPos = points[i]?.yPos || 'bottom';
      const endPos = points[i + 1]?.yPos || 'top';

      let arrow: 'up' | 'down' | 'flat' = 'flat';
      if (sign === '+') {
        arrow = 'up';
      } else if (sign === '-') {
        arrow = 'down';
      } else {
        if (startPos === 'bottom' && endPos === 'top') arrow = 'up';
        else if (startPos === 'top' && endPos === 'bottom') arrow = 'down';
      }

      intervals.push({ sign, arrow, startPos, endPos });
    }
  } else {
    // Flat format: each xValue is a point
    const numPoints = xValues.length;
    for (let i = 0; i < numPoints; i++) {
      const yValObj = yValues[i] || { val: '', pos: 'mid' as const };
      const isEndpoint = i === 0 || i === numPoints - 1;
      points.push({
        x: xValues[i] || '',
        yPrime: isEndpoint ? '' : (yPrimeSigns[i] || '0'),
        yVal: yValObj.val || '',
        yPos: yValObj.pos || 'mid'
      });
    }

    for (let i = 0; i < numPoints - 1; i++) {
      const sign = yPrimeSigns[i] || (points[i].yPos === 'bottom' ? '+' : '-');
      const startPos = points[i]?.yPos || 'bottom';
      const endPos = points[i + 1]?.yPos || 'top';

      let arrow: 'up' | 'down' | 'flat' = 'flat';
      if (sign === '+') arrow = 'up';
      else if (sign === '-') arrow = 'down';
      else {
        if (startPos === 'bottom' && endPos === 'top') arrow = 'up';
        else if (startPos === 'top' && endPos === 'bottom') arrow = 'down';
      }

      intervals.push({ sign, arrow, startPos, endPos });
    }
  }

  return { points, intervals };
}

/**
 * Render standard Vietnamese Bảng Biến Thiên (BBT) conforming to MOET SGK Toán 12
 */
export const MathGraphic: React.FC<MathGraphicProps> = ({ tikz, diagram }) => {
  const instanceId = useId().replace(/:/g, '_');

  if (diagram && diagram.type === 'bbt') {
    const { points, intervals } = parseBBT(diagram);
    const K = points.length;

    if (K === 0) return null;

    // Construct gridTemplateColumns:
    // Header (60px) + (Point + Interval)* + Last Point
    const gridCols = `60px ${points
      .map((_, i) => (i < K - 1 ? 'minmax(42px, auto) minmax(56px, 1fr)' : 'minmax(42px, auto)'))
      .join(' ')}`;

    return (
      <div className="my-3 sm:my-4 p-2.5 sm:p-4 bg-slate-900/95 rounded-2xl border border-blue-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-white max-w-full overflow-hidden">
        {diagram.title && (
          <div className="text-xs sm:text-sm font-bold text-yellow-300 mb-2.5 text-center flex items-center justify-center gap-1.5">
            <TableProperties size={15} className="text-yellow-400 shrink-0" />
            <span>{diagram.title}</span>
          </div>
        )}

        <div className="w-full overflow-x-auto pb-1">
          <div
            className="min-w-[340px] sm:min-w-[420px] max-w-2xl mx-auto border border-slate-700 rounded-xl overflow-hidden bg-slate-950/90 text-xs sm:text-sm shadow-inner"
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
            }}
          >
            {/* ======================================================== */}
            {/* ROW 1: DÒNG x                                           */}
            {/* ======================================================== */}
            {/* Header x */}
            <div className="h-10 flex items-center justify-center border-b border-slate-700 border-r-2 border-slate-600 bg-slate-900/90 font-bold text-amber-300 select-none">
              <MathText math="x" />
            </div>

            {/* Points and Intervals for Row x */}
            {points.map((pt, i) => (
              <React.Fragment key={`row-x-${i}`}>
                {/* Point i */}
                <div className="h-10 px-1 flex items-center justify-center border-b border-slate-700 font-semibold text-amber-200">
                  <MathText math={pt.x} />
                </div>

                {/* Interval i (empty for Row x) */}
                {i < K - 1 && (
                  <div className="h-10 border-b border-slate-700" />
                )}
              </React.Fragment>
            ))}

            {/* ======================================================== */}
            {/* ROW 2: DÒNG y' (hoặc f'(x))                              */}
            {/* ======================================================== */}
            {/* Header y' */}
            <div className="h-10 flex items-center justify-center border-b-2 border-slate-600 border-r-2 border-slate-600 bg-slate-900/90 font-bold text-sky-300 select-none">
              <MathText math="y'" />
            </div>

            {/* Points and Intervals for Row y' */}
            {points.map((pt, i) => (
              <React.Fragment key={`row-yprime-${i}`}>
                {/* Point i in y' */}
                <div className="h-10 px-1 flex items-center justify-center border-b-2 border-slate-600">
                  {pt.yPrime === '||' ? (
                    <MathText math="||" />
                  ) : pt.yPrime ? (
                    <span className="font-mono text-slate-300 text-xs sm:text-sm font-semibold">
                      {pt.yPrime}
                    </span>
                  ) : i > 0 && i < K - 1 ? (
                    <span className="font-mono text-slate-300 text-xs sm:text-sm">0</span>
                  ) : null}
                </div>

                {/* Interval i in y' (Signs + / -) */}
                {i < K - 1 && (
                  <div className="h-10 flex items-center justify-center border-b-2 border-slate-600">
                    {intervals[i]?.sign === '+' ? (
                      <span className="font-bold text-emerald-400 text-base leading-none select-none">
                        +
                      </span>
                    ) : intervals[i]?.sign === '-' ? (
                      <span className="font-bold text-rose-400 text-base leading-none select-none">
                        −
                      </span>
                    ) : null}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* ======================================================== */}
            {/* ROW 3: DÒNG y (hoặc f(x)) - CÁC MŨI TÊN VÀ GIÁ TRỊ BIẾN THIÊN */}
            {/* ======================================================== */}
            {/* Header y */}
            <div className="h-24 sm:h-28 flex items-center justify-center border-r-2 border-slate-600 bg-slate-900/90 font-bold text-amber-400 text-base select-none">
              <MathText math="y" />
            </div>

            {/* Points and Intervals for Row y */}
            {points.map((pt, i) => {
              const isDiscontinuity = pt.yPrime === '||' || pt.yVal === '||';

              return (
                <React.Fragment key={`row-y-${i}`}>
                  {/* Point i value in Row y */}
                  <div className="h-24 sm:h-28 px-1 relative flex flex-col items-center">
                    {isDiscontinuity ? (
                      <div className="flex gap-1 justify-center items-center h-full">
                        <div className="w-[1.5px] h-full bg-slate-500" />
                        <div className="w-[1.5px] h-full bg-slate-500" />
                      </div>
                    ) : pt.yPos === 'top' ? (
                      <div className="pt-1.5 sm:pt-2 flex flex-col items-center">
                        <MathText
                          math={pt.yVal}
                          className="font-bold text-amber-300 drop-shadow-[0_1px_3px_rgba(251,191,36,0.3)]"
                        />
                      </div>
                    ) : pt.yPos === 'bottom' ? (
                      <div className="mt-auto pb-1.5 sm:pb-2 flex flex-col items-center">
                        <MathText
                          math={pt.yVal}
                          className="font-bold text-sky-300 drop-shadow-[0_1px_3px_rgba(56,189,248,0.3)]"
                        />
                      </div>
                    ) : (
                      <div className="my-auto flex flex-col items-center">
                        <MathText
                          math={pt.yVal}
                          className="font-semibold text-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Interval i in Row y: Mũi tên biến thiên */}
                  {i < K - 1 && (
                    <div className="h-24 sm:h-28 px-0.5 flex items-center justify-center relative">
                      {(() => {
                        const interval = intervals[i];
                        const markerId = `arrowhead_${instanceId}_${i}`;
                        const isUp = interval?.arrow === 'up';
                        const isDown = interval?.arrow === 'down';

                        const strokeColor = isUp ? '#38bdf8' : isDown ? '#fb7185' : '#94a3b8';

                        // Coordinates inside 100 x 80 viewBox
                        const x1 = 4;
                        const y1 = isUp ? 68 : isDown ? 14 : 40;
                        const x2 = 94;
                        const y2 = isUp ? 14 : isDown ? 68 : 40;

                        return (
                          <svg
                            className="w-full h-full select-none"
                            viewBox="0 0 100 80"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <marker
                                id={markerId}
                                viewBox="0 0 10 10"
                                refX="7"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
                              </marker>
                            </defs>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={strokeColor}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              markerEnd={`url(#${markerId})`}
                            />
                          </svg>
                        );
                      })()}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {diagram.notes && (
          <div className="text-[11px] sm:text-xs text-slate-400 mt-2 text-center italic">
            {diagram.notes}
          </div>
        )}
      </div>
    );
  }

  // Fallback for tikz or generic diagram
  if (tikz) {
    return (
      <div className="my-3 p-3 bg-slate-950/80 rounded-xl border border-blue-400/30 text-center overflow-x-auto text-xs sm:text-sm font-mono text-blue-200">
        <div className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1 font-bold">
          Hình vẽ minh họa
        </div>
        <div className="text-slate-300 font-sans leading-relaxed">
          <InlineMath math={cleanMath(tikz)} />
        </div>
      </div>
    );
  }

  return null;
};

