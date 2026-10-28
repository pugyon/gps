import React, { useMemo, useState, useEffect } from 'react';
import { Waypoint, CurrentLocation, TrackingStats, RadarMode, RadarZoom } from '../types';
import { soundEffects } from '../utils/audio';
import {
  formatDistance,
  calculateHaversineDistance,
  calculateBearing,
  calculateRelativeBearing,
  formatFloorElevation,
} from '../utils/geo';
import { ZoomIn, ZoomOut, Navigation, Compass, Layers, Satellite, Map as MapIcon, Globe } from 'lucide-react';
import { RadarMapCanvas, MapTileLayer } from './RadarMapCanvas';

const STORAGE_KEY_MAP_LAYER = 'dragon_radar_map_layer';
const STORAGE_KEY_HEADING_UP = 'dragon_radar_heading_up';

interface RadarDisplayProps {
  mode: RadarMode;
  target: Waypoint | null;
  allWaypoints: Waypoint[];
  currentLocation: CurrentLocation | null;
  stats: TrackingStats | null;
  currentHeading: number | null; // degrees 0-360
  zoom: RadarZoom;
  onZoomChange: (zoom: RadarZoom) => void;
  onSelectWaypoint?: (id: string) => void;
  onKnobClick?: () => void;
}

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  mode,
  target,
  allWaypoints,
  currentLocation,
  stats,
  currentHeading,
  zoom,
  onZoomChange,
  onSelectWaypoint,
  onKnobClick,
}) => {
  // Map Layer selection: 'none' (CRT), 'satellite' (Esri), 'street' (OSM), 'dark' (CartoDB)
  const [mapLayer, setMapLayer] = useState<MapTileLayer>(() => {
    return (localStorage.getItem(STORAGE_KEY_MAP_LAYER) as MapTileLayer) || 'satellite';
  });

  // Heading-Up (radar rotates with user walking/turning) vs North-Up (top is true North)
  const [headingUp, setHeadingUp] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HEADING_UP);
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MAP_LAYER, mapLayer);
  }, [mapLayer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HEADING_UP, String(headingUp));
  }, [headingUp]);

  // Format distance for active target
  const formattedDist = useMemo(() => {
    return stats ? formatDistance(stats.distance) : null;
  }, [stats]);

  // Format parking & building floor elevation difference
  const floorInfo = useMemo(() => {
    return formatFloorElevation(stats?.elevationDiff ?? null);
  }, [stats?.elevationDiff]);

  // Determine effective range in meters
  const effectiveRange = useMemo(() => {
    if (zoom === 'auto') {
      if (!stats) return 100;
      if (stats.distance < 15) return 20;
      if (stats.distance < 60) return 80;
      if (stats.distance < 250) return 300;
      if (stats.distance < 1200) return 1500;
      return Math.max(1000, Math.ceil(stats.distance * 1.3));
    }
    return zoom;
  }, [zoom, stats]);

  // Handle top red knob press
  const handleKnobPress = () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('medium');
    if (onKnobClick) {
      onKnobClick();
    } else {
      const zoomCycle: RadarZoom[] = [50, 200, 1000, 'auto'];
      const nextIndex = (zoomCycle.indexOf(zoom) + 1) % zoomCycle.length;
      onZoomChange(zoomCycle[nextIndex]);
    }
  };

  // Radar screen metrics (radius 132px, center 150, 150)
  const screenRadius = 132;
  const cx = 150;
  const cy = 150;

  // Compute blips for ALL destinations
  const allBlips = useMemo(() => {
    const list = allWaypoints.length > 0 ? allWaypoints : target ? [target] : [];
    if (!list.length) return [];

    return list.map((wp, idx) => {
      const isActive = target ? target.id === wp.id : idx === 0;
      let dist = 65;
      let relBearing = 45 + idx * 80;
      let isEstimated = false;

      if (isActive && stats) {
        dist = stats.distance;
        relBearing = stats.relativeBearing;
      } else if (currentLocation) {
        dist = calculateHaversineDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          wp.latitude,
          wp.longitude
        );
        const bearing = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          wp.latitude,
          wp.longitude
        );
        relBearing = calculateRelativeBearing(bearing, currentHeading ?? 0);
      } else {
        isEstimated = true;
      }

      // If North-Up, screen 12 o'clock is True North. If Heading-Up, 12 o'clock is user facing direction.
      let displayBearing = relBearing;
      if (!headingUp && currentLocation) {
        const absBearing = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          wp.latitude,
          wp.longitude
        );
        displayBearing = absBearing;
      }

      const relRad = ((displayBearing - 90) * Math.PI) / 180;
      const isOutOfRange = dist > effectiveRange;
      const distanceRatio = Math.min(dist / effectiveRange, 1.0);
      // Keep within bounds, minimum 18px from center so center player arrow is visible
      const r = Math.max(18, distanceRatio * screenRadius);

      const x = cx + r * Math.cos(relRad);
      const y = cy + r * Math.sin(relRad);

      return {
        id: wp.id,
        waypoint: wp,
        isActive,
        distance: dist,
        relativeBearing: relBearing,
        x,
        y,
        isOutOfRange,
        isEstimated,
      };
    });
  }, [allWaypoints, target, stats, currentLocation, currentHeading, effectiveRange, headingUp]);

  const activeBlip = allBlips.find((b) => b.isActive) || allBlips[0];

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-md mx-auto">
      {/* Top Capsule Corp Knob Switch */}
      <div className="relative z-20 flex flex-col items-center -mb-2">
        <button
          onClick={handleKnobPress}
          className="group relative flex flex-col items-center focus:outline-none"
          title="プッシュボタン（レンジ切替 / レーダーPING）"
        >
          {/* Red push top */}
          <div className="w-9 h-3.5 bg-gradient-to-b from-red-500 to-red-700 rounded-t-md shadow-md shadow-red-900/60 border border-red-400 group-active:translate-y-0.5 transition-transform" />
          {/* Metal stem */}
          <div className="w-14 h-3 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-t border-t border-slate-200 shadow-inner" />
        </button>
      </div>

      {/* Radar Main Housing */}
      <div
        className={`relative w-[min(94vw,min(54vh,430px))] h-[min(94vw,min(54vh,430px))] rounded-full p-2.5 sm:p-3 shadow-2xl flex items-center justify-center transition-colors duration-500 shrink-0 ${
          mode === 'dragon'
            ? 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-500 border-4 border-slate-400 ring-4 ring-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            : 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-4 border-cyan-700/60 ring-4 ring-cyan-950/80 shadow-[0_20px_50px_rgba(6,182,212,0.2)]'
        }`}
      >
        {/* Inner Dark Recessed Rim */}
        <div className="w-full h-full rounded-full bg-slate-950 p-2 shadow-inner border border-slate-800 relative flex items-center justify-center overflow-hidden">
          {/* Glass Screen Display */}
          <div
            className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center ${
              mapLayer !== 'none'
                ? 'bg-slate-950'
                : mode === 'dragon'
                ? 'radar-grid-bg'
                : 'bg-slate-950'
            }`}
          >
            {/* Real Map / Satellite Imagery Layer (No API Key Required) */}
            <RadarMapCanvas
              latitude={currentLocation?.latitude ?? null}
              longitude={currentLocation?.longitude ?? null}
              heading={currentHeading}
              effectiveRange={effectiveRange}
              mapLayer={mapLayer}
              headingUp={headingUp}
            />

            {/* Subtle dragon radar CRT tint overlay over map */}
            {mapLayer !== 'none' && mode === 'dragon' && (
              <div className="absolute inset-0 bg-emerald-950/20 mix-blend-color pointer-events-none" />
            )}

            {/* SVG Grid and Elements */}
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full absolute inset-0 pointer-events-none"
            >
              <defs>
                {/* Radial Glow for Screen Edge */}
                <radialGradient id="screen-inner-vignette" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="transparent" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
                </radialGradient>

                {/* Sweep Cone Gradient */}
                <radialGradient id="sweep-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(34,197,94,0)" />
                  <stop offset="85%" stopColor="rgba(34,197,94,0.15)" />
                  <stop offset="100%" stopColor="rgba(74,222,128,0.35)" />
                </radialGradient>

                {/* Target Blip Glow */}
                <filter id="dragon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dragon Radar Grid: Triangle & Concentric Pattern */}
              {mode === 'dragon' && (
                <g className="opacity-75">
                  {/* Concentric rings */}
                  <circle cx="150" cy="150" r="132" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.7" />
                  <circle cx="150" cy="150" r="99" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
                  <circle cx="150" cy="150" r="66" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
                  <circle cx="150" cy="150" r="33" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />

                  {/* Main Axes */}
                  <line x1="18" y1="150" x2="282" y2="150" stroke="#22c55e" strokeWidth="1.8" opacity="0.6" />
                  <line x1="150" y1="18" x2="150" y2="282" stroke="#22c55e" strokeWidth="1.8" opacity="0.6" />

                  {/* Iconic Triangular Grid Lines of Dragon Radar */}
                  <line x1="150" y1="18" x2="243" y2="243" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
                  <line x1="150" y1="18" x2="57" y2="243" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
                  <line x1="18" y1="150" x2="243" y2="57" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
                  <line x1="18" y1="150" x2="243" y2="243" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
                </g>
              )}

              {/* Tactical Compass HUD Grid */}
              {mode === 'tactical' && (
                <g
                  style={{
                    transformOrigin: '150px 150px',
                    transform: `rotate(${-(currentHeading ?? 0)}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <circle cx="150" cy="150" r="132" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                  <circle cx="150" cy="150" r="99" fill="none" stroke="#0891b2" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                  <circle cx="150" cy="150" r="50" fill="none" stroke="#0891b2" strokeWidth="1" opacity="0.4" />

                  {/* Compass Tick Marks (every 30 deg) */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = i * 30;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 150 + 120 * Math.sin(rad);
                    const y1 = 150 - 120 * Math.cos(rad);
                    const x2 = 150 + 130 * Math.sin(rad);
                    const y2 = 150 - 130 * Math.cos(rad);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#22d3ee"
                        strokeWidth={i % 3 === 0 ? '2' : '1'}
                        opacity={i % 3 === 0 ? '0.9' : '0.5'}
                      />
                    );
                  })}

                  {/* Cardinal Letters */}
                  <text x="150" y="34" fill="#ef4444" fontSize="14" fontWeight="bold" textAnchor="middle">
                    N
                  </text>
                  <text x="268" y="155" fill="#22d3ee" fontSize="12" fontWeight="bold" textAnchor="middle">
                    E
                  </text>
                  <text x="150" y="278" fill="#22d3ee" fontSize="12" fontWeight="bold" textAnchor="middle">
                    S
                  </text>
                  <text x="32" y="155" fill="#22d3ee" fontSize="12" fontWeight="bold" textAnchor="middle">
                    W
                  </text>
                </g>
              )}

              {/* Sweeping Radar Beam */}
              {mode === 'dragon' && (
                <g className="animate-radar-sweep origin-[150px_150px]">
                  <path
                    d="M150,150 L282,150 A132,132 0 0,0 243,57 Z"
                    fill="url(#sweep-grad)"
                  />
                  <line
                    x1="150"
                    y1="150"
                    x2="282"
                    y2="150"
                    stroke="#86efac"
                    strokeWidth="2"
                    opacity="0.9"
                    filter="drop-shadow(0 0 3px #4ade80)"
                  />
                </g>
              )}

              {/* Direction Indicator Vector line to Target (Tactical mode) */}
              {mode === 'tactical' && activeBlip && (
                <line
                  x1="150"
                  y1="150"
                  x2={150 + 125 * Math.sin((activeBlip.relativeBearing * Math.PI) / 180)}
                  y2={150 - 125 * Math.cos((activeBlip.relativeBearing * Math.PI) / 180)}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  opacity="0.75"
                />
              )}

              {/* ALL DESTINATION BLIPS ON RADAR */}
              {allBlips.map((blip) => {
                const bDist = formatDistance(blip.distance);
                const isHome =
                  blip.waypoint.category === 'home' ||
                  blip.waypoint.icon === 'home' ||
                  blip.waypoint.name.includes('自宅');
                const isParking =
                  blip.waypoint.category === 'parking' ||
                  blip.waypoint.icon === 'car' ||
                  blip.waypoint.name.includes('駐車');

                const pinColor = isHome
                  ? '#0284c7'
                  : isParking
                  ? '#ea580c'
                  : '#f59e0b';
                const flareColor = isHome
                  ? '#38bdf8'
                  : isParking
                  ? '#fb923c'
                  : '#fde047';

                if (blip.isActive) {
                  // Active Primary Destination Pin (📍 Map Drop Pin with shadow, icon badge, and callout tag)
                  return (
                    <g
                      key={blip.id}
                      style={{
                        transform: `translate(${blip.x}px, ${blip.y}px)`,
                      }}
                      className="cursor-pointer pointer-events-auto"
                      onClick={() => onSelectWaypoint?.(blip.id)}
                    >
                      {/* Ground Shadow beneath the pin */}
                      <ellipse cx="0" cy="2" rx="6" ry="2.5" fill="rgba(0,0,0,0.6)" />

                      {/* Radar Beacon Pulse radiating from target ground spot */}
                      <circle
                        cx="0"
                        cy="0"
                        r={blip.isOutOfRange ? 10 : 14}
                        fill={flareColor}
                        filter="url(#dragon-glow)"
                        opacity="0.4"
                        className="animate-ping"
                      />

                      {/* Out of range edge indicator ring */}
                      {blip.isOutOfRange && (
                        <circle
                          cx="0"
                          cy="0"
                          r="18"
                          fill="none"
                          stroke={flareColor}
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Google Maps Style Map Drop Pin (Point grounded at 0,0) */}
                      <path
                        d="M 0,0 C -3.5,-5 -8,-10.5 -8,-16 A 8,8 0 1,1 8,-16 C 8,-10.5 3.5,-5 0,0 Z"
                        fill={pinColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.75))"
                      />

                      {/* White circular badge on pin head */}
                      <circle cx="0" cy="-16" r="5.2" fill="#ffffff" />

                      {/* Icon inside badge */}
                      {isHome ? (
                        <polygon
                          points="0,-19.5 3.5,-16 2.2,-16 2.2,-13 -2.2,-13 -2.2,-16 -3.5,-16"
                          fill="#0284c7"
                        />
                      ) : isParking ? (
                        <text
                          x="0"
                          y="-13.5"
                          fontSize="7.5"
                          fontWeight="900"
                          textAnchor="middle"
                          fill="#ea580c"
                        >
                          P
                        </text>
                      ) : (
                        <polygon
                          points="0,-19.5 1.2,-16.8 4,-16.8 1.8,-15.1 2.6,-12.4 0,-14.1 -2.6,-12.4 -1.8,-15.1 -4,-16.8 -1.2,-16.8"
                          fill="#d97706"
                        />
                      )}

                      {/* 3D Vertical Floor Elevation Guide Pole (立体階層ステム) */}
                      {stats && stats.elevationDiff !== null && Math.abs(stats.elevationDiff) >= 1.4 && (
                        <g opacity="0.9">
                          {stats.elevationDiff > 0 ? (
                            <>
                              {/* Target is above: ascending dashed line with upper ring */}
                              <line
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="15"
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                strokeDasharray="3 2"
                              />
                              <polygon points="0,-1 -3,3 3,3" fill="#fbbf24" />
                              <ellipse cx="0" cy="15" rx="5" ry="2" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" />
                            </>
                          ) : (
                            <>
                              {/* Target is below: descending dashed line with lower ring */}
                              <line
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="-12"
                                stroke="#38bdf8"
                                strokeWidth="1.8"
                                strokeDasharray="3 2"
                              />
                              <polygon points="0,-13 -3,-9 3,-9" fill="#38bdf8" />
                              <ellipse cx="0" cy="-12" rx="5" ry="2" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                            </>
                          )}
                        </g>
                      )}

                      {/* Pin Floating Callout Tag (Name, Distance & Floor Level) */}
                      <g transform="translate(0, -32)">
                        <rect
                          x="-42"
                          y="-11"
                          width="84"
                          height="23"
                          rx="5"
                          fill="rgba(15, 23, 42, 0.95)"
                          stroke={pinColor}
                          strokeWidth="1.4"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.75))"
                        />
                        {/* Row 1: Target Icon & Name & Distance */}
                        <text
                          x="0"
                          y="-2"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="7.5"
                          fontWeight="bold"
                        >
                          {isHome ? '🏠' : isParking ? '🚗' : '★'} {blip.waypoint.name.slice(0, 5)} · {bDist.value}{bDist.unit}
                        </text>
                        {/* Row 2: Floor Level Readout (e.g. ▲ 3F上 (+9.0m) or ✔ 同階) */}
                        <text
                          x="0"
                          y="8"
                          textAnchor="middle"
                          fill={
                            floorInfo.status === 'up'
                              ? '#fbbf24'
                              : floorInfo.status === 'down'
                              ? '#38bdf8'
                              : '#4ade80'
                          }
                          fontSize="7"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {floorInfo.badgeText}
                        </text>
                      </g>
                    </g>
                  );
                } else {
                  // Secondary Saved Waypoints (Other Map Pins standing on the radar)
                  return (
                    <g
                      key={blip.id}
                      style={{
                        transform: `translate(${blip.x}px, ${blip.y}px)`,
                      }}
                      className="cursor-pointer pointer-events-auto opacity-90 hover:opacity-100 transition-opacity"
                      onClick={() => onSelectWaypoint?.(blip.id)}
                    >
                      {/* Ground Shadow */}
                      <ellipse cx="0" cy="1.5" rx="4.5" ry="2" fill="rgba(0,0,0,0.5)" />

                      {/* Secondary Map Pin */}
                      <path
                        d="M 0,0 C -2.5,-3.5 -5.5,-7.5 -5.5,-12 A 5.5,5.5 0 1,1 5.5,-12 C 5.5,-7.5 2.5,-3.5 0,0 Z"
                        fill={pinColor}
                        stroke="#ffffff"
                        strokeWidth="1"
                        filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))"
                      />
                      <circle cx="0" cy="-12" r="3.6" fill="#ffffff" />
                      <text
                        x="0"
                        y="-10.2"
                        fontSize="5.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={pinColor}
                      >
                        {isHome ? '宅' : isParking ? 'P' : '★'}
                      </text>

                      {/* Small Label */}
                      <g transform="translate(0, -20)">
                        <rect
                          x="-22"
                          y="-6"
                          width="44"
                          height="11"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.88)"
                          stroke={pinColor}
                          strokeWidth="0.8"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize="6.5"
                          fontWeight="bold"
                        >
                          {blip.waypoint.name.slice(0, 4)}
                        </text>
                      </g>
                    </g>
                  );
                }
              })}

              {/* CENTER PLAYER ARROW: Points in direction of phone's forward axis */}
              <g
                style={{
                  transformOrigin: '150px 150px',
                  // In heading-up mode, arrow points to relative direction of active target.
                  // In north-up mode, arrow points toward phone's heading relative to North.
                  transform: headingUp
                    ? activeBlip
                      ? `rotate(${activeBlip.relativeBearing}deg)`
                      : 'rotate(0deg)'
                    : `rotate(${currentHeading ?? 0}deg)`,
                  transition: 'transform 0.12s linear',
                }}
              >
                {/* Arrow Pointer */}
                <polygon
                  points="150,116 161,154 150,146 139,154"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                />
                {/* Center dot */}
                <circle cx="150" cy="150" r="4.5" fill="#ffffff" />
              </g>

              {/* VERTICAL FLOOR ALTIMETER GAUGE (立体駐車場・階層インジケーター) */}
              {stats && stats.elevationDiff !== null && (
                <g className="transition-opacity duration-300" opacity="0.92">
                  {/* Outer Housing Capsule */}
                  <rect
                    x="244"
                    y="94"
                    width="23"
                    height="112"
                    rx="10"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke={mode === 'dragon' ? 'rgba(34, 197, 94, 0.6)' : 'rgba(6, 182, 212, 0.6)'}
                    strokeWidth="1.2"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.7))"
                  />

                  {/* Center Rail */}
                  <line
                    x1="255.5"
                    y1="104"
                    x2="255.5"
                    y2="196"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />

                  {/* Floor ticks: +3F(106), +2F(121), +1F(136), 0F(150), -1F(164), -2F(179), -3F(194) */}
                  {/* +3F */}
                  <line x1="252" y1="106" x2="259" y2="106" stroke="#94a3b8" strokeWidth="1" />
                  <text x="261" y="108" fill="#94a3b8" fontSize="5.5" fontWeight="bold" fontFamily="monospace">
                    +3
                  </text>

                  {/* +2F */}
                  <line x1="253" y1="121" x2="258" y2="121" stroke="#64748b" strokeWidth="0.8" />
                  <text x="260" y="123" fill="#64748b" fontSize="5" fontFamily="monospace">
                    +2
                  </text>

                  {/* +1F */}
                  <line x1="253" y1="136" x2="258" y2="136" stroke="#64748b" strokeWidth="0.8" />
                  <text x="260" y="138" fill="#64748b" fontSize="5" fontFamily="monospace">
                    +1
                  </text>

                  {/* 0F (現在階 / Current Floor) */}
                  <line
                    x1="248"
                    y1="150"
                    x2="263"
                    y2="150"
                    stroke={mode === 'dragon' ? '#4ade80' : '#22d3ee'}
                    strokeWidth="2"
                  />
                  <text
                    x="245"
                    y="149"
                    fill={mode === 'dragon' ? '#4ade80' : '#22d3ee'}
                    fontSize="5.5"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    現
                  </text>

                  {/* -1F */}
                  <line x1="253" y1="164" x2="258" y2="164" stroke="#64748b" strokeWidth="0.8" />
                  <text x="260" y="166" fill="#64748b" fontSize="5" fontFamily="monospace">
                    -1
                  </text>

                  {/* -2F */}
                  <line x1="253" y1="179" x2="258" y2="179" stroke="#64748b" strokeWidth="0.8" />
                  <text x="260" y="181" fill="#64748b" fontSize="5" fontFamily="monospace">
                    -2
                  </text>

                  {/* -3F */}
                  <line x1="252" y1="194" x2="259" y2="194" stroke="#94a3b8" strokeWidth="1" />
                  <text x="261" y="196" fill="#94a3b8" fontSize="5.5" fontWeight="bold" fontFamily="monospace">
                    -3
                  </text>

                  {/* Target Floor Marker & Directional Beam */}
                  {(() => {
                    const diff = stats.elevationDiff ?? 0;
                    const clampedDiff = Math.max(-9, Math.min(9, diff));
                    // 1 floor (3m) corresponds to 14.6px
                    const markerY = 150 - (clampedDiff / 3.0) * 14.6;
                    const isUp = diff > 1.3;
                    const isDown = diff < -1.3;
                    const markerColor = isUp ? '#f59e0b' : isDown ? '#06b6d4' : '#22c55e';

                    return (
                      <g>
                        {/* Connecting track glow */}
                        {Math.abs(diff) > 1.3 && (
                          <line
                            x1="255.5"
                            y1="150"
                            x2="255.5"
                            y2={markerY}
                            stroke={markerColor}
                            strokeWidth="2.5"
                            strokeDasharray="3 2"
                            opacity="0.95"
                          />
                        )}

                        {/* Pointer cursor on rail */}
                        <circle
                          cx="255.5"
                          cy={markerY}
                          r="4"
                          fill={markerColor}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          filter="drop-shadow(0 0 3px rgba(0,0,0,0.8))"
                        />

                        {/* Callout Tag beside the rail (pointing left) */}
                        <rect
                          x="218"
                          y={markerY - 6}
                          width="24"
                          height="12"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.94)"
                          stroke={markerColor}
                          strokeWidth="1"
                        />
                        <text
                          x="230"
                          y={markerY + 2.5}
                          textAnchor="middle"
                          fill={markerColor}
                          fontSize="6.5"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {floorInfo.shortLabel}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Glass Vignette overlay */}
              <circle
                cx="150"
                cy="150"
                r="134"
                fill="url(#screen-inner-vignette)"
                pointerEvents="none"
              />
            </svg>

            {/* Prominent Distance & Multi-story Floor Readout directly on Radar Screen */}
            {activeBlip && (
              <div className="absolute top-7 inset-x-0 flex flex-col items-center pointer-events-none z-10 animate-in fade-in">
                {/* Primary Distance Pill */}
                <div className="flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-slate-950/90 border border-emerald-500/60 shadow-lg shadow-emerald-950/50 backdrop-blur-xs text-white">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">
                    距離
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                    {formatDistance(activeBlip.distance).value}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatDistance(activeBlip.distance).unit}
                  </span>
                  {stats?.elevationDiff !== null && stats?.elevationDiff !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold ml-1 px-1.5 py-0.2 rounded border ${
                        floorInfo.status === 'up'
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                          : floorInfo.status === 'down'
                          ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {floorInfo.badgeText}
                    </span>
                  )}
                </div>

                {/* Multi-story Parking Floor Guidance Pill (立体階層ガイド) */}
                {stats?.elevationDiff !== null && stats?.elevationDiff !== undefined && (
                  <div
                    className={`mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-md backdrop-blur-sm ${
                      floorInfo.status === 'up'
                        ? 'bg-amber-950/95 text-amber-200 border-amber-500/60 shadow-amber-950/60'
                        : floorInfo.status === 'down'
                        ? 'bg-cyan-950/95 text-cyan-200 border-cyan-500/60 shadow-cyan-950/60'
                        : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 shadow-emerald-950/60'
                    }`}
                  >
                    <span>
                      {activeBlip.waypoint.category === 'parking' || activeBlip.waypoint.icon === 'car'
                        ? '🚗 立体駐車'
                        : '🏢 階層'}
                      :
                    </span>
                    <span>{floorInfo.floorLabel}</span>
                  </div>
                )}

                {/* Multi-story Close Alert: Horizontally arrived, but on another floor */}
                {stats && stats.distance <= 20 && Math.abs(stats.elevationDiff ?? 0) >= 2.0 && (
                  <div className="mt-1 px-2.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400 text-amber-200 text-[9px] font-bold animate-pulse text-center max-w-[210px] shadow-lg">
                    ⚠️ 直上/直下にいます！【階段・EVで{floorInfo.shortLabel}へ】
                  </div>
                )}
              </div>
            )}

            {/* Range Scale & Distance in Radar Screen Bottom */}
            <div className="absolute bottom-3.5 inset-x-0 flex flex-col items-center pointer-events-none z-10">
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider font-bold text-emerald-400/90 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-md">
                <span>RANGE: {effectiveRange >= 1000 ? `${(effectiveRange / 1000).toFixed(1)}km` : `${effectiveRange}m`}</span>
                {activeBlip && (
                  <>
                    <span className="text-emerald-600">·</span>
                    <span className="text-amber-300 font-bold">
                      目標まで {formatDistance(activeBlip.distance).value}{formatDistance(activeBlip.distance).unit}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Target Status indicator in screen top */}
            <div className="absolute top-3.5 inset-x-0 flex justify-center pointer-events-none z-10">
              {activeBlip ? (
                <span className="text-[10px] font-medium text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40 truncate max-w-[200px]">
                  追跡中: {activeBlip.waypoint.name}
                  {activeBlip.isEstimated ? ' (測位中)' : ''}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                  目標未選択
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Tactical Radar Toolbar (Zoom, Layer, Orientation) */}
      <div className="flex items-center justify-between w-full mt-1 px-1 max-w-[min(94vw,420px)] gap-1 shrink-0">
        {/* Zoom Stepper */}
        <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-800 p-0.5 text-xs">
          <button
            onClick={() => {
              soundEffects.playTick();
              const ranges: RadarZoom[] = [10, 50, 200, 1000, 5000];
              const curIndex = ranges.indexOf(zoom as any);
              if (curIndex > 0) onZoomChange(ranges[curIndex - 1]);
              else if (zoom === 'auto') onZoomChange(50);
            }}
            disabled={zoom === 10}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 active:scale-95"
            title="拡大（ズームイン）"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onZoomChange(zoom === 'auto' ? 200 : 'auto');
            }}
            className={`px-1.5 h-6 text-[10px] font-mono font-bold rounded transition ${
              zoom === 'auto'
                ? 'bg-emerald-500/25 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="自動レンジ"
          >
            AUTO
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              const ranges: RadarZoom[] = [10, 50, 200, 1000, 5000];
              const curIndex = ranges.indexOf(zoom as any);
              if (curIndex !== -1 && curIndex < ranges.length - 1) onZoomChange(ranges[curIndex + 1]);
              else if (zoom === 'auto') onZoomChange(1000);
            }}
            disabled={zoom === 5000}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 active:scale-95"
            title="縮小（ズームアウト）"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-800 p-0.5 text-xs gap-0.5">
          <button
            onClick={() => {
              soundEffects.playTick();
              setMapLayer('none');
            }}
            className={`px-2 h-6 rounded text-[10px] font-semibold transition ${
              mapLayer === 'none' ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'text-slate-400'
            }`}
            title="CRTグリーン風背景"
          >
            CRT
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              setMapLayer('satellite');
            }}
            className={`px-2 h-6 rounded text-[10px] font-semibold flex items-center gap-0.5 transition ${
              mapLayer === 'satellite' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'
            }`}
            title="実写衛星航空写真（API不要）"
          >
            <Satellite className="w-2.5 h-2.5 text-amber-400" />
            <span>航空</span>
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              setMapLayer('street');
            }}
            className={`px-2 h-6 rounded text-[10px] font-semibold flex items-center gap-0.5 transition ${
              mapLayer === 'street' ? 'bg-blue-500/30 text-blue-300 font-bold' : 'text-slate-400'
            }`}
            title="OpenStreetMap道路地図"
          >
            <MapIcon className="w-2.5 h-2.5 text-blue-400" />
            <span>地図</span>
          </button>
        </div>

        {/* Heading Up / North Up Toggle */}
        <button
          onClick={() => {
            soundEffects.playTick();
            setHeadingUp((prev) => !prev);
          }}
          className={`h-7 px-2 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 active:scale-95 transition ${
            headingUp
              ? 'bg-slate-900 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 text-cyan-300 border-cyan-500/40'
          }`}
          title={headingUp ? '進行方向が上（ヘディングアップ）' : '北が上（ノースアップ）'}
        >
          <Compass className="w-3 h-3" />
          <span>{headingUp ? '進行UP' : '北UP'}</span>
        </button>
      </div>
    </div>
  );
};
