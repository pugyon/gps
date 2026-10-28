import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { RadarDisplay } from './components/RadarDisplay';
import { ElevationGauge } from './components/ElevationGauge';
import { NavigationStatsCard } from './components/NavigationStatsCard';
import { WaypointModal } from './components/WaypointModal';
import { WaypointListDrawer } from './components/WaypointListDrawer';
import { SimulationDrawer } from './components/SimulationDrawer';
import { SimpleTestBar } from './components/SimpleTestBar';
import { MobileTelemetryHud } from './components/MobileTelemetryHud';
import { useGeoSensors } from './hooks/useGeoSensors';
import { Waypoint, CurrentLocation, RadarMode, RadarZoom } from './types';
import { computeTrackingStats } from './utils/geo';
import { soundEffects } from './utils/audio';
import { QuickTargetBar } from './components/QuickTargetBar';
import {
  MapPin,
  Play,
  Square,
  ListFilter,
  AlertTriangle,
  Locate,
  Sparkles,
  Info,
  X,
  Layers,
} from 'lucide-react';

const STORAGE_KEY_WAYPOINTS = 'dragon_radar_saved_waypoints';
const STORAGE_KEY_ACTIVE_TARGET = 'dragon_radar_active_target_id';
const STORAGE_KEY_RADAR_MODE = 'dragon_radar_ui_mode';

const DEFAULT_INITIAL_WAYPOINTS: Waypoint[] = [
  {
    id: 'wp_parking',
    name: '駐車位置',
    latitude: 35.6586 + 0.00045, // approx 45m
    longitude: 139.7454 + 0.00035,
    altitude: 30.0,
    accuracy: 3,
    timestamp: Date.now() - 1800000,
    note: 'マイカーの駐車位置',
    icon: 'car',
    category: 'parking',
  },
  {
    id: 'wp_home',
    name: '自宅',
    latitude: 35.6586 - 0.0011, // approx 120m
    longitude: 139.7454 - 0.0007,
    altitude: 44.0,
    accuracy: 4,
    timestamp: Date.now() - 86400000,
    note: 'マイホーム',
    icon: 'home',
    category: 'home',
  },
  {
    id: 'wp_dragon_4star',
    name: '★ 四星球 (探索目標)',
    latitude: 35.6586 + 0.0007,
    longitude: 139.7454 - 0.0005,
    altitude: 38.5,
    accuracy: 3,
    timestamp: Date.now(),
    note: '神龍を呼ぶためのドラゴンボール',
    icon: 'dragon-ball',
    category: 'custom',
  },
];

export default function App() {
  // Navigation & UI States
  const [radarMode, setRadarMode] = useState<RadarMode>(() => {
    return (localStorage.getItem(STORAGE_KEY_RADAR_MODE) as RadarMode) || 'dragon';
  });
  const [radarZoom, setRadarZoom] = useState<RadarZoom>('auto');
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WAYPOINTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INITIAL_WAYPOINTS;
  });
  const [activeTargetId, setActiveTargetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_TARGET) || DEFAULT_INITIAL_WAYPOINTS[0].id;
  });

  // Modal / Drawer States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isWaypointListOpen, setIsWaypointListOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);

  // Simulation Controls for testing on Desktop/Indoors
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [simManualHeading, setSimManualHeading] = useState(0);
  const [simManualDistance, setSimManualDistance] = useState(65);
  const [simManualElevationDiff, setSimManualElevationDiff] = useState(9.0);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  // Geo Sensors Hook
  const {
    location,
    setLocation,
    compassHeading,
    setCompassHeading,
    isTracking,
    gpsError,
    needsCompassPermission,
    requestCompassPermission,
    getCurrentPosition,
    startTracking,
    stopTracking,
  } = useGeoSensors();

  // Auto-start GPS tracking on mount
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  // When real GPS location is first received, if waypoints are the initial defaults,
  // calibrate them so they are at realistic, walkable distances around the user!
  const hasAdjustedDefaultsRef = useRef(false);
  useEffect(() => {
    if (location && !hasAdjustedDefaultsRef.current) {
      hasAdjustedDefaultsRef.current = true;
      setWaypoints((prev) => {
        const isDefaultMock = prev.some(
          (w) => w.id === 'wp_parking' && Math.abs(w.latitude - (35.6586 + 0.00045)) < 0.0001
        );
        if (isDefaultMock) {
          const lat = location.latitude;
          const lon = location.longitude;
          const alt = location.altitude ?? 30.0;
          return [
            {
              id: 'wp_parking',
              name: '駐車位置',
              latitude: lat + 0.00045, // approx 45m
              longitude: lon + 0.00035,
              altitude: Math.round((alt + 4.5) * 10) / 10,
              accuracy: 3,
              timestamp: Date.now() - 1800000,
              note: 'マイカーの駐車位置（初期サンプル）',
              icon: 'car',
              category: 'parking',
            },
            {
              id: 'wp_home',
              name: '自宅',
              latitude: lat - 0.0011, // approx 120m
              longitude: lon - 0.0007,
              altitude: Math.round((alt + 14.0) * 10) / 10,
              accuracy: 4,
              timestamp: Date.now() - 86400000,
              note: 'マイホーム（初期サンプル）',
              icon: 'home',
              category: 'home',
            },
            {
              id: 'wp_dragon_4star',
              name: '★ 四星球 (探索目標)',
              latitude: lat + 0.0007,
              longitude: lon - 0.0005,
              altitude: Math.round((alt + 8.5) * 10) / 10,
              accuracy: 3,
              timestamp: Date.now(),
              note: '神龍を呼ぶためのドラゴンボール',
              icon: 'dragon-ball',
              category: 'custom',
            },
          ];
        }
        return prev;
      });
    }
  }, [location]);

  // Quick update waypoint with current location
  const handleUpdateWithCurrentLocation = (id: string) => {
    if (!location) return;
    soundEffects.playRecordBeep();
    soundEffects.triggerHaptic('success');

    setWaypoints((prev) =>
      prev.map((wp) => {
        if (wp.id === id) {
          return {
            ...wp,
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            altitudeAccuracy: location.altitudeAccuracy,
            accuracy: location.accuracy,
            timestamp: Date.now(),
          };
        }
        return wp;
      })
    );
  };

  // Save waypoints to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WAYPOINTS, JSON.stringify(waypoints));
    } catch (e) {
      console.error('Failed to save waypoints:', e);
    }
  }, [waypoints]);

  // Save active target to localStorage
  useEffect(() => {
    if (activeTargetId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TARGET, activeTargetId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TARGET);
    }
  }, [activeTargetId]);

  // Save radar mode preference
  const handleToggleRadarMode = () => {
    const next = radarMode === 'dragon' ? 'tactical' : 'dragon';
    setRadarMode(next);
    localStorage.setItem(STORAGE_KEY_RADAR_MODE, next);
  };

  // Determine current active target waypoint
  const activeTarget = useMemo(() => {
    if (!waypoints.length) return null;
    if (activeTargetId) {
      const found = waypoints.find((w) => w.id === activeTargetId);
      if (found) return found;
    }
    return waypoints[0]; // fallback to first saved
  }, [waypoints, activeTargetId]);

  // Effective current location: in real mode, uses GPS sensors; in test mode, creates realistic coordinates
  const effectiveLocation = useMemo<CurrentLocation | null>(() => {
    if (isSimulationActive) {
      const baseTarget = activeTarget || waypoints[0];
      const targetLat = baseTarget ? baseTarget.latitude : 35.6586;
      const targetLon = baseTarget ? baseTarget.longitude : 139.7454;
      const targetAlt = baseTarget?.altitude ?? 30.0;

      // Target is at bearing 45° from user at distance simManualDistance meters
      // So user is in opposite direction (-45°) from target
      const R_EARTH = 6378137;
      const bearingRad = (45 * Math.PI) / 180;
      const dLat = -(simManualDistance * Math.cos(bearingRad)) / R_EARTH * (180 / Math.PI);
      const dLon =
        -(simManualDistance * Math.sin(bearingRad)) /
        (R_EARTH * Math.cos((targetLat * Math.PI) / 180)) *
        (180 / Math.PI);

      return {
        latitude: targetLat + dLat,
        longitude: targetLon + dLon,
        altitude: Math.round((targetAlt - simManualElevationDiff) * 10) / 10,
        altitudeAccuracy: 1.5,
        accuracy: 3,
        heading: simManualHeading,
        speed: isSimulatingWalk ? 1.2 : 0,
        timestamp: Date.now(),
      };
    }
    return location;
  }, [
    isSimulationActive,
    activeTarget,
    waypoints,
    simManualDistance,
    simManualElevationDiff,
    simManualHeading,
    isSimulatingWalk,
    location,
  ]);

  const effectiveHeading = isSimulationActive ? simManualHeading : compassHeading;

  // Compute tracking stats
  const trackingStats = useMemo(() => {
    if (!effectiveLocation || !activeTarget) return null;

    return computeTrackingStats(
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      effectiveLocation.altitude,
      activeTarget.latitude,
      activeTarget.longitude,
      activeTarget.altitude,
      effectiveHeading
    );
  }, [effectiveLocation, activeTarget, effectiveHeading]);

  // Handle periodic radar ping sounds when tracking is active
  const lastPingTimeRef = useRef<number>(0);
  useEffect(() => {
    if (!isTracking && !isSimulationActive) return;
    if (!trackingStats) return;

    // Ping interval based on distance:
    // < 15m -> ping every 1.2s
    // < 50m -> ping every 2.0s
    // < 200m -> ping every 3.5s
    // > 200m -> ping every 5.0s
    const intervalMs =
      trackingStats.distance < 15
        ? 1200
        : trackingStats.distance < 50
        ? 2000
        : trackingStats.distance < 200
        ? 3500
        : 5000;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastPingTimeRef.current >= intervalMs) {
        lastPingTimeRef.current = now;
        soundEffects.playRadarPing(trackingStats.distance);
        soundEffects.triggerHaptic('light');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, isSimulationActive, trackingStats]);

  // Trigger celebration once arrived
  const hasTriggeredArrivalRef = useRef<boolean>(false);
  useEffect(() => {
    if (trackingStats?.isArrived) {
      if (!hasTriggeredArrivalRef.current) {
        hasTriggeredArrivalRef.current = true;
        soundEffects.playArrivedFanfare();
        soundEffects.triggerHaptic('success');
      }
    } else {
      hasTriggeredArrivalRef.current = false;
    }
  }, [trackingStats?.isArrived]);

  // Simulated walking loop
  useEffect(() => {
    if (!isSimulatingWalk) return;

    const timer = setInterval(() => {
      setSimManualDistance((prev) => {
        if (prev <= 2) {
          setIsSimulatingWalk(false);
          return 2;
        }
        return Math.max(2, Math.round((prev - 1.5) * 10) / 10);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulatingWalk]);

  // Handle "位置記録" (Record Location)
  const handleRecordLocationClick = async () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('medium');
    setIsRecordingLoading(true);

    try {
      // Query GPS immediately
      await getCurrentPosition();
      setIsRecordModalOpen(true);
    } catch {
      // If error occurs, still open modal if we have any fallback or let user retry
      setIsRecordModalOpen(true);
    } finally {
      setIsRecordingLoading(false);
    }
  };

  // Handle "開始" (Start Tracking)
  const handleToggleTracking = () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('heavy');

    if (isTracking) {
      stopTracking();
    } else {
      if (waypoints.length === 0) {
        // No waypoints yet: inform user or prompt
        setIsWaypointListOpen(true);
        return;
      }
      startTracking();
      // Also request compass permission if on iOS
      if (needsCompassPermission) {
        requestCompassPermission();
      }
      soundEffects.playRadarPing(100);
    }
  };

  // Add sample waypoints for instant exploration
  const handleAddSampleWaypoints = () => {
    const lat = location?.latitude ?? 35.65858;
    const lon = location?.longitude ?? 139.74543;
    const alt = location?.altitude ?? 30.0;

    const samples: Waypoint[] = [
      {
        id: `sample_1_${Date.now()}`,
        name: '★ 一星球 (ドラゴンボール)',
        latitude: lat + 0.0006, // approx 65m North-East
        longitude: lon + 0.0005,
        altitude: Math.round((alt + 15.5) * 10) / 10,
        accuracy: 5,
        timestamp: Date.now(),
        note: '山頂・高台付近に反応あり',
        icon: 'dragon-ball',
      },
      {
        id: `sample_2_${Date.now()}`,
        name: 'ベースキャンプ (避難所)',
        latitude: lat - 0.0012, // approx 130m South
        longitude: lon - 0.0008,
        altitude: Math.round((alt - 6.0) * 10) / 10,
        accuracy: 8,
        timestamp: Date.now() - 3600000,
        note: '食料と予備バッテリー保管場所',
        icon: 'camp',
      },
      {
        id: `sample_3_${Date.now()}`,
        name: '車を停めた駐車エリア',
        latitude: lat + 0.0025, // approx 280m
        longitude: lon - 0.0015,
        altitude: alt,
        accuracy: 4,
        timestamp: Date.now() - 7200000,
        note: 'P2駐車場 A-14番柱の横',
        icon: 'car',
      },
    ];

    setWaypoints((prev) => [...samples, ...prev]);
    setActiveTargetId(samples[0].id);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 select-none touch-none overscroll-none pb-safe">
      {/* Top Bar with brand, sound toggle, mode switch, simulation toggle */}
      <TopBar
        needsCompassPermission={needsCompassPermission}
        onRequestCompassPermission={requestCompassPermission}
        simulationOpen={isSimulationActive}
        onToggleSimulation={() => {
          soundEffects.playTick();
          setIsSimulationActive((prev) => {
            const next = !prev;
            if (next && !isTracking) {
              startTracking();
            }
            return next;
          });
        }}
        radarMode={radarMode}
        onToggleRadarMode={handleToggleRadarMode}
      />

      {/* Quick Target Switcher Bar (1-row horizontal swipe chip track with Google Maps link) */}
      <div className="w-full max-w-md mx-auto px-2 shrink-0">
        <QuickTargetBar
          waypoints={waypoints}
          activeTargetId={activeTargetId}
          onSelectTarget={(id) => {
            setActiveTargetId(id);
            if (!isTracking) {
              startTracking();
            }
          }}
          onOpenRecordModal={() => setIsRecordModalOpen(true)}
          onOpenWaypointList={() => setIsWaypointListOpen(true)}
          currentLocation={effectiveLocation}
        />
      </div>

      {/* Main Single-Screen Viewport (Flex-1 center, strictly locked inside 100dvh) */}
      <main className="flex-1 min-h-0 w-full max-w-md mx-auto px-2 flex flex-col items-center justify-between overflow-hidden relative">
        {/* GPS Error or Warning Toast */}
        {gpsError && !isSimulationActive && (
          <div className="w-full shrink-0 p-2 mb-1 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg z-20">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{gpsError}</span>
            </div>
            <button
              onClick={() => getCurrentPosition()}
              className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[10px] shrink-0"
            >
              再試行
            </button>
          </div>
        )}

        {/* 1-Tap Simple Test Bar (Accessible when active, collapsible so it doesn't push radar) */}
        {isSimulationActive && (
          <div className="w-full shrink-0 z-20 mb-0.5">
            <SimpleTestBar
              isActive={isSimulationActive}
              onToggleActive={() => {
                soundEffects.playTick();
                setIsSimulationActive(false);
              }}
              manualDistance={simManualDistance}
              onDistanceChange={setSimManualDistance}
              manualHeading={simManualHeading}
              onHeadingChange={setSimManualHeading}
              manualElevationDiff={simManualElevationDiff}
              onElevationDiffChange={setSimManualElevationDiff}
              isSimulatingWalk={isSimulatingWalk}
              onToggleSimulateWalk={() => {
                soundEffects.playTick();
                setIsSimulatingWalk((prev) => !prev);
              }}
              onOpenAdvanced={() => setIsSimulationOpen(true)}
              targetName={activeTarget ? activeTarget.name : '未選択'}
            />
          </div>
        )}

        {/* RADAR SCREEN (The Hero Centerpiece - Dynamically scales to fit viewport height) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center relative my-auto">
          <RadarDisplay
            mode={radarMode}
            target={activeTarget}
            allWaypoints={waypoints}
            currentLocation={effectiveLocation}
            stats={trackingStats}
            currentHeading={effectiveHeading}
            zoom={radarZoom}
            onZoomChange={setRadarZoom}
            onSelectWaypoint={(id) => {
              soundEffects.playTick();
              setActiveTargetId(id);
            }}
            onKnobClick={() => {
              soundEffects.playRadarPing(trackingStats ? trackingStats.distance : 100);
            }}
          />
        </div>

        {/* MOBILE TELEMETRY HUD (Unified Distance | Direction | Floor Elevation Bar) */}
        <div className="w-full shrink-0 pt-0.5 pb-1">
          <MobileTelemetryHud
            target={activeTarget}
            stats={trackingStats}
            gpsAccuracy={effectiveLocation?.accuracy ?? null}
            currentAltitude={effectiveLocation?.altitude ?? null}
            onOpenDetails={() => setIsDetailsOpen(true)}
          />
        </div>
      </main>

      {/* MOBILE THUMB DOCK (Bottom Action Bar) */}
      <footer className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-3 py-2 shrink-0">
        <div className="max-w-md mx-auto w-full grid grid-cols-2 gap-2.5">
          {/* Button 1: 位置記録 (Record Position) */}
          <button
            onClick={handleRecordLocationClick}
            disabled={isRecordingLoading}
            className="h-11 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-50"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              {isRecordingLoading ? (
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Locate className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-left">
              <span className="block leading-tight text-xs font-bold text-slate-100">
                位置記録
              </span>
              <span className="block text-[9px] text-slate-400 leading-tight">
                現在地・高度を保存
              </span>
            </div>
          </button>

          {/* Button 2: 開始 / 追跡中 (Start / Stop Tracking) */}
          <button
            onClick={handleToggleTracking}
            className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition ${
              isTracking || isSimulationActive
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-red-950/50 ring-2 ring-red-400/40 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 text-white shadow-emerald-950/50 hover:brightness-110'
            }`}
          >
            {isTracking || isSimulationActive ? (
              <>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Square className="w-3 h-3 fill-white text-white" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight text-xs font-bold">
                    追跡中（停止）
                  </span>
                  <span className="block text-[9px] text-emerald-100/80 leading-tight">
                    タップで停止
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight text-xs font-bold">
                    開始（ナビ）
                  </span>
                  <span className="block text-[9px] text-emerald-100/80 leading-tight">
                    方角・高度差を表示
                  </span>
                </div>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Details Slide-up Sheet (When user taps the Telemetry HUD) */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 pb-8 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">詳細ナビゲーション & 高度情報</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Stats Card */}
            <NavigationStatsCard
              target={activeTarget}
              stats={trackingStats}
              gpsAccuracy={effectiveLocation?.accuracy ?? null}
              isTracking={isTracking || isSimulationActive}
              onStartTracking={handleToggleTracking}
              onStopTracking={handleToggleTracking}
            />

            {/* Elevation Gauge */}
            <ElevationGauge
              currentAltitude={effectiveLocation?.altitude ?? null}
              targetAltitude={activeTarget?.altitude ?? null}
              altitudeAccuracy={effectiveLocation?.accuracy ?? null}
              elevationDiff={trackingStats?.elevationDiff ?? null}
            />
          </div>
        </div>
      )}

      {/* Record Position Modal */}
      <WaypointModal
        currentLocation={location}
        existingWaypoints={waypoints}
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={(newWp) => {
          setWaypoints((prev) => {
            const index = prev.findIndex((w) => w.id === newWp.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = newWp;
              return updated;
            }
            return [newWp, ...prev];
          });
          setActiveTargetId(newWp.id);
        }}
      />

      {/* Saved Waypoints Drawer */}
      <WaypointListDrawer
        isOpen={isWaypointListOpen}
        onClose={() => setIsWaypointListOpen(false)}
        waypoints={waypoints}
        activeTargetId={activeTargetId}
        onSelectTarget={(id) => {
          setActiveTargetId(id);
          setIsWaypointListOpen(false);
          // If not tracking, automatically start tracking this point!
          if (!isTracking) {
            startTracking();
          }
        }}
        onUpdateWithCurrentLocation={handleUpdateWithCurrentLocation}
        onDeleteWaypoint={(id) => {
          setWaypoints((prev) => prev.filter((w) => w.id !== id));
          if (activeTargetId === id) {
            setActiveTargetId(null);
          }
        }}
        onAddSampleWaypoints={handleAddSampleWaypoints}
        currentLocation={location}
      />

      {/* Simulation / Testing Drawer */}
      <SimulationDrawer
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        isSimulatingWalk={isSimulatingWalk}
        onToggleSimulateWalk={() => setIsSimulatingWalk((prev) => !prev)}
        manualHeading={simManualHeading}
        onHeadingChange={setSimManualHeading}
        manualDistance={simManualDistance}
        onDistanceChange={setSimManualDistance}
        manualElevationDiff={simManualElevationDiff}
        onElevationDiffChange={setSimManualElevationDiff}
        onApplyPreset={(name, distance, bearing, elevDiff) => {
          setSimManualDistance(distance);
          setSimManualElevationDiff(elevDiff);
          soundEffects.playTick();
        }}
      />
    </div>
  );
}
