import React from 'react';
import { formatElevation } from '../utils/geo';
import { ArrowUpRight, ArrowDownRight, Minus, Mountain, Info } from 'lucide-react';

interface ElevationGaugeProps {
  currentAltitude: number | null;
  targetAltitude: number | null;
  altitudeAccuracy?: number | null;
  elevationDiff: number | null;
}

export const ElevationGauge: React.FC<ElevationGaugeProps> = ({
  currentAltitude,
  targetAltitude,
  altitudeAccuracy,
  elevationDiff,
}) => {
  const elevInfo = formatElevation(elevationDiff);

  // Normalize vertical bar position: target relative to current
  // Clamp between -50m and +50m for visualization percentage
  const maxVisualRange = 30; // meters
  let targetPercentage = 50; // center
  if (elevationDiff !== null) {
    const clampedDiff = Math.max(-maxVisualRange, Math.min(maxVisualRange, elevationDiff));
    // When diff > 0 (target is above), percentage should go up towards 90%
    targetPercentage = 50 + (clampedDiff / maxVisualRange) * 40;
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              高度差メーター（高低差ナビ）
            </h3>
            <span className="text-[10px] text-slate-400">
              保存地点と現在地の標高差
            </span>
          </div>
        </div>

        {/* Direction Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
          {elevInfo.direction === 'up' && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              上昇・上り
            </span>
          )}
          {elevInfo.direction === 'down' && (
            <span className="flex items-center gap-1 text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3.5 h-3.5" />
              降下・下り
            </span>
          )}
          {elevInfo.direction === 'same' && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              <Minus className="w-3.5 h-3.5" />
              水平同高度
            </span>
          )}
          {elevInfo.direction === 'unknown' && (
            <span className="text-slate-500 text-[11px]">計測中</span>
          )}
        </div>
      </div>

      {/* Main Elevation Difference Display */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Left Side: Big Text & Advice */}
        <div className="col-span-8 flex flex-col justify-center">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white flex items-baseline gap-1">
            {elevationDiff !== null ? (
              <>
                <span className={elevationDiff > 0 ? 'text-amber-400' : elevationDiff < 0 ? 'text-cyan-400' : 'text-emerald-400'}>
                  {elevationDiff > 0 ? '+' : ''}
                  {Math.abs(elevationDiff) < 10 ? elevationDiff.toFixed(1) : Math.round(elevationDiff)}
                </span>
                <span className="text-sm font-normal text-slate-400">m</span>
              </>
            ) : (
              <span className="text-slate-500 text-lg">GPS標高取得中...</span>
            )}
          </div>

          <p className="text-xs font-medium text-slate-300 mt-1 leading-snug">
            {elevInfo.text}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {elevInfo.subtext}
          </p>
        </div>

        {/* Right Side: Graphic Altimeter Column */}
        <div className="col-span-4 flex items-center justify-end pr-1">
          <div className="relative w-12 h-24 bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
            {/* Center Reference Line (Current Altitude Level = 50%) */}
            <div className="absolute top-1/2 inset-x-0 h-0.5 bg-slate-700/80 -translate-y-1/2 z-10" />
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-slate-400 select-none z-10">
              現在
            </span>

            {/* Target Altitude Indicator Marker */}
            {elevationDiff !== null && (
              <div
                className="absolute inset-x-1.5 transition-all duration-500 ease-out z-20 flex items-center justify-center"
                style={{
                  bottom: `${targetPercentage}%`,
                  transform: 'translateY(50%)',
                }}
              >
                <div
                  className={`w-full py-0.5 rounded text-[9px] font-mono font-bold text-center shadow-lg flex items-center justify-center gap-0.5 ${
                    elevationDiff > 1
                      ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                      : elevationDiff < -1
                      ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/30'
                      : 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  }`}
                >
                  目標
                </div>
              </div>
            )}

            {/* Top / Bottom range markers */}
            <span className="absolute top-1 right-1 text-[8px] font-mono text-slate-600">
              +30m
            </span>
            <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-600">
              -30m
            </span>
          </div>
        </div>
      </div>

      {/* Sub-metrics bar: Target Alt vs Current Alt */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">記録時の標高 (目標)</span>
          <span className="text-slate-100 font-bold text-sm">
            {targetAltitude !== null ? `${targetAltitude.toFixed(1)} m` : '未記録'}
          </span>
        </div>
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">現在地の標高 (リアルタイム)</span>
          <span className="text-slate-100 font-bold text-sm">
            {currentAltitude !== null ? `${currentAltitude.toFixed(1)} m` : '--- m'}
          </span>
          {altitudeAccuracy && (
            <span className="text-[9px] text-slate-500 block">±{Math.round(altitudeAccuracy)}m</span>
          )}
        </div>
      </div>
    </div>
  );
};
