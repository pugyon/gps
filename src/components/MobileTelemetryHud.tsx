import React from 'react';
import { TrackingStats, Waypoint } from '../types';
import { formatDistance, formatFloorElevation } from '../utils/geo';
import { Compass, Clock, Mountain, MapPin, CheckCircle2 } from 'lucide-react';

interface MobileTelemetryHudProps {
  target: Waypoint | null;
  stats: TrackingStats | null;
  gpsAccuracy: number | null;
  currentAltitude: number | null;
  onOpenDetails?: () => void;
}

export const MobileTelemetryHud: React.FC<MobileTelemetryHudProps> = ({
  target,
  stats,
  gpsAccuracy,
  currentAltitude,
  onOpenDetails,
}) => {
  const dist = stats ? formatDistance(stats.distance) : null;
  const floorInfo = formatFloorElevation(stats?.elevationDiff ?? null);
  const isArrived = stats?.isArrived ?? false;

  return (
    <div
      onClick={onOpenDetails}
      className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl px-3 py-2 shadow-lg backdrop-blur-md cursor-pointer active:scale-[0.99] transition select-none"
    >
      {/* Target Arrival Banner if arrived */}
      {isArrived ? (
        <div className="py-1 px-2.5 mb-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300 font-bold animate-pulse">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>目標「{target?.name}」に到達しました！</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
            到着
          </span>
        </div>
      ) : null}

      {/* 3-Column Tactical HUD (Distance | Direction | Floor Elevation) */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/80 gap-1 items-center">
        {/* Cell 1: Distance */}
        <div className="px-1.5 flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 leading-none">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-semibold">直線距離</span>
          </div>
          <div className="flex items-baseline gap-0.5 mt-0.5 leading-none">
            {dist ? (
              <>
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums">
                  {dist.value}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono ml-0.5">
                  {dist.unit}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-slate-500 font-mono">
                {target ? '計測中' : '未選択'}
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-500 font-mono leading-none mt-1 truncate">
            {gpsAccuracy !== null ? `精度 ±${gpsAccuracy}m` : 'GPS待機中'}
          </span>
        </div>

        {/* Cell 2: Direction (Clock heading) */}
        <div className="px-1.5 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 leading-none">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-semibold">進行方向</span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-amber-300 mt-1 leading-none truncate">
            {stats ? stats.clockDirection : '---'}
          </div>
          <span className="text-[9px] text-slate-400 font-mono leading-none mt-1 truncate">
            {stats ? `${stats.cardinalDirection} (${Math.round(stats.bearing)}°)` : '端末上部が前'}
          </span>
        </div>

        {/* Cell 3: Floor & Altitude difference */}
        <div className="px-1.5 flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 leading-none">
            <Mountain className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-semibold">階層・高度差</span>
          </div>
          <div className="flex items-baseline gap-0.5 mt-0.5 leading-none">
            {stats && stats.elevationDiff !== null ? (
              <span
                className={`text-sm sm:text-base font-black font-mono leading-none ${
                  floorInfo.status === 'up'
                    ? 'text-amber-400'
                    : floorInfo.status === 'down'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              >
                {floorInfo.shortLabel}
                <span className="text-[10px] ml-1 font-semibold opacity-90">
                  ({stats.elevationDiff > 0 ? '+' : ''}
                  {stats.elevationDiff.toFixed(1)}m)
                </span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 font-mono">
                {currentAltitude !== null ? `${Math.round(currentAltitude)}m` : '高度取得中'}
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 leading-none mt-1 truncate font-bold">
            {stats && stats.elevationDiff !== null
              ? (target?.category === 'parking' || target?.icon === 'car' ? '🚗 立体駐車' : '🏢 階層ナビ')
              : '標高差'}
          </span>
        </div>
      </div>
    </div>
  );
};
