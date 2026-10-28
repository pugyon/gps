import React from 'react';
import { Waypoint, CurrentLocation } from '../types';
import { calculateHaversineDistance, formatDistance } from '../utils/geo';
import { soundEffects } from '../utils/audio';
import {
  X,
  Navigation,
  Trash2,
  Mountain,
  Clock,
  Plus,
  MapPin,
  Home,
  Car,
  RotateCw,
  Bookmark,
} from 'lucide-react';

interface WaypointListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
  activeTargetId: string | null;
  onSelectTarget: (id: string) => void;
  onUpdateWithCurrentLocation?: (id: string) => void;
  onDeleteWaypoint: (id: string) => void;
  onAddSampleWaypoints: () => void;
  currentLocation: CurrentLocation | null;
}

export const WaypointListDrawer: React.FC<WaypointListDrawerProps> = ({
  isOpen,
  onClose,
  waypoints,
  activeTargetId,
  onSelectTarget,
  onUpdateWithCurrentLocation,
  onDeleteWaypoint,
  onAddSampleWaypoints,
  currentLocation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              保存位置リスト（自宅・駐車位置など）
            </h3>
            <span className="text-[11px] text-slate-400">
              全 {waypoints.length} か所の保存スポット
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {waypoints.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                保存された位置情報がありません
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                画面下の「位置記録」ボタンから、自宅や駐車位置を保存してください。
              </p>
              <button
                onClick={() => {
                  soundEffects.playTick();
                  onAddSampleWaypoints();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>サンプル地点を追加（自宅・駐車位置）</span>
              </button>
            </div>
          ) : (
            waypoints.map((wp) => {
              const isSelected = activeTargetId === wp.id;
              const isHome = wp.category === 'home' || wp.icon === 'home' || wp.name.includes('自宅');
              const isParking = wp.category === 'parking' || wp.icon === 'car' || wp.name.includes('駐車');

              let distText = '---';
              let elevDiffText = '';

              if (currentLocation) {
                const d = calculateHaversineDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  wp.latitude,
                  wp.longitude
                );
                const fd = formatDistance(d);
                distText = `${fd.value} ${fd.unit}`;

                if (currentLocation.altitude !== null && wp.altitude !== null) {
                  const diff = wp.altitude - currentLocation.altitude;
                  elevDiffText = `標高差 ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}m`;
                }
              }

              return (
                <div
                  key={wp.id}
                  onClick={() => {
                    soundEffects.playTick();
                    onSelectTarget(wp.id);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? isHome
                        ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/40'
                        : isParking
                        ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/40'
                        : 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left Icon & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isHome
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : isParking
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isHome ? (
                        <Home className="w-5 h-5" />
                      ) : isParking ? (
                        <Car className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {wp.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            追跡中
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400 font-mono">
                        <span>直線距離: <strong className="text-slate-200">{distText}</strong></span>
                        {wp.altitude !== null && (
                          <span className="flex items-center gap-0.5 text-emerald-400/90">
                            <Mountain className="w-3 h-3" />
                            高度: {wp.altitude}m {elevDiffText && `(${elevDiffText})`}
                          </span>
                        )}
                      </div>

                      {wp.note && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          {wp.note}
                        </p>
                      )}

                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(wp.timestamp).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Update with current GPS */}
                    {onUpdateWithCurrentLocation && currentLocation && (
                      <button
                        onClick={() => {
                          soundEffects.playTick();
                          onUpdateWithCurrentLocation(wp.id);
                        }}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition"
                        title="現在地・高度で上書き更新"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Target Select */}
                    <button
                      onClick={() => {
                        soundEffects.playTick();
                        onSelectTarget(wp.id);
                      }}
                      className={`p-2 rounded-lg transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="この地点をナビ目標にする"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>

                    {/* Open in Google Maps */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}&travelmode=walking`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition"
                      title="Googleマップでこの場所を開く"
                    >
                      <MapPin className="w-4 h-4 text-rose-400" />
                    </a>

                    {/* Delete (only allow if more than 1 waypoint) */}
                    {waypoints.length > 1 && (
                      <button
                        onClick={() => {
                          soundEffects.playTick();
                          onDeleteWaypoint(wp.id);
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950/80">
          <button
            onClick={() => {
              soundEffects.playTick();
              onAddSampleWaypoints();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>初期サンプルに戻す</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
