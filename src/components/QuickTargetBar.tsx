import React from 'react';
import { Waypoint, CurrentLocation } from '../types';
import { calculateHaversineDistance, formatDistance } from '../utils/geo';
import { soundEffects } from '../utils/audio';
import { Home, Car, Plus, MapPin, ListFilter, Star } from 'lucide-react';

interface QuickTargetBarProps {
  waypoints: Waypoint[];
  activeTargetId: string | null;
  onSelectTarget: (id: string) => void;
  onOpenRecordModal: () => void;
  onOpenWaypointList?: () => void;
  currentLocation: CurrentLocation | null;
}

export const QuickTargetBar: React.FC<QuickTargetBarProps> = ({
  waypoints,
  activeTargetId,
  onSelectTarget,
  onOpenRecordModal,
  onOpenWaypointList,
  currentLocation,
}) => {
  const getDistanceString = (wp: Waypoint) => {
    if (!currentLocation) return null;
    const d = calculateHaversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      wp.latitude,
      wp.longitude
    );
    const fd = formatDistance(d);
    return `${fd.value}${fd.unit}`;
  };

  const activeWaypoint = waypoints.find((w) => w.id === activeTargetId) || waypoints[0];

  return (
    <div className="w-full flex items-center justify-between gap-1.5 py-1 px-1">
      {/* Scrollable Chip Track */}
      <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
        {waypoints.map((wp) => {
          const isSelected = activeTargetId === wp.id;
          const distStr = getDistanceString(wp);
          const isParking = wp.category === 'parking' || wp.id === 'wp_parking' || wp.name.includes('駐車');
          const isHome = wp.category === 'home' || wp.id === 'wp_home' || wp.name.includes('自宅');

          return (
            <button
              key={wp.id}
              onClick={() => {
                soundEffects.playTick();
                onSelectTarget(wp.id);
              }}
              className={`shrink-0 h-7 px-2 rounded-full border text-xs font-bold flex items-center gap-1 transition active:scale-95 ${
                isSelected
                  ? isParking
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500 shadow-xs'
                    : isHome
                    ? 'bg-blue-500/25 text-blue-300 border-blue-500 shadow-xs'
                    : 'bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              {isParking ? (
                <Car className="w-3 h-3 text-amber-400 shrink-0" />
              ) : isHome ? (
                <Home className="w-3 h-3 text-blue-400 shrink-0" />
              ) : (
                <Star className="w-3 h-3 text-yellow-400 shrink-0" />
              )}
              <span className="truncate max-w-[80px]">{wp.name}</span>
              {distStr && (
                <span className="font-mono text-[10px] opacity-80 shrink-0">
                  {distStr}
                </span>
              )}
            </button>
          );
        })}

        {/* Add spot button */}
        <button
          onClick={() => {
            soundEffects.playTick();
            onOpenRecordModal();
          }}
          className="shrink-0 h-7 px-2 rounded-full border border-dashed border-slate-700 bg-slate-950/60 text-slate-400 hover:text-white flex items-center gap-0.5 text-xs font-semibold active:scale-95 transition"
          title="現在地を新規登録"
        >
          <Plus className="w-3 h-3" />
          <span>追加</span>
        </button>
      </div>

      {/* Right Controls: Google Maps navigation link + List button */}
      <div className="flex items-center gap-1 shrink-0">
        {activeWaypoint && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeWaypoint.latitude},${activeWaypoint.longitude}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-2 rounded-full bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 text-xs font-bold border border-blue-500/40 flex items-center gap-1 transition active:scale-95"
            title="Googleマップで徒歩ルートを開く"
          >
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Map</span>
          </a>
        )}

        {onOpenWaypointList && (
          <button
            onClick={() => {
              soundEffects.playTick();
              onOpenWaypointList();
            }}
            className="h-7 w-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center transition active:scale-95"
            title="保存地点一覧"
          >
            <ListFilter className="w-3 h-3 text-emerald-400" />
          </button>
        )}
      </div>
    </div>
  );
};
