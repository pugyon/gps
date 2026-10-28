import React from 'react';
import { TrackingStats, Waypoint } from '../types';
import { formatDistance } from '../utils/geo';
import { Compass, Clock, CheckCircle2, Navigation, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

interface NavigationStatsCardProps {
  target: Waypoint | null;
  stats: TrackingStats | null;
  gpsAccuracy: number | null;
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export const NavigationStatsCard: React.FC<NavigationStatsCardProps> = ({
  target,
  stats,
  gpsAccuracy,
  isTracking,
  onStartTracking,
  onStopTracking,
}) => {
  const dist = stats ? formatDistance(stats.distance) : null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Target Arrival Banner if arrived */}
      {stats?.isArrived && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-950 border border-emerald-500/60 shadow-lg shadow-emerald-950/40 flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black shrink-0">
            ★
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-200">
              目標地点に到達しました！
            </h4>
            <p className="text-xs text-emerald-300/80">
              目標「{target?.name}」の直近（約{dist?.value}{dist?.unit}）にいます
            </p>
          </div>
        </div>
      )}

      {/* Main Distance Readout */}
      <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
            目標までの直線距離
          </span>
          <div className="flex items-baseline gap-1.5">
            {dist ? (
              <>
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
                  {dist.value}
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {dist.unit}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-slate-500 font-mono">
                {target ? '計算中...' : '目標未選択'}
              </span>
            )}
          </div>
        </div>

        {/* GPS Accuracy Tag */}
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">GPS測位精度</span>
          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
              gpsAccuracy && gpsAccuracy <= 10
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
            }`}
          >
            {gpsAccuracy !== null ? `±${gpsAccuracy}m` : '測位待機中'}
          </span>
        </div>
      </div>

      {/* Clock Direction & Bearing Cards */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {/* Clock Direction */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>進行方向（時計針）</span>
          </div>
          <div className="text-base font-bold text-white mt-1.5 font-mono truncate">
            {stats ? stats.clockDirection : '---'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            スマホの上部を向けた方向が基準
          </span>
        </div>

        {/* Cardinal Bearing */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>目標の方角（絶対方位）</span>
          </div>
          <div className="text-base font-bold text-white mt-1.5 font-mono truncate">
            {stats ? `${stats.cardinalDirection}` : '---'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {stats ? `方位角: ${Math.round(stats.bearing)}°` : '北基準0°'}
          </span>
        </div>
      </div>

      {/* Google Maps External Link Button */}
      {target && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 min-w-0 truncate">
            <span>目的地: </span>
            <strong className="text-slate-200">{target.name}</strong>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold shadow-sm transition active:scale-95 shrink-0"
            title="Googleマップで徒歩ルート案内を開く"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Googleマップで開く</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>
        </div>
      )}
    </div>
  );
};
