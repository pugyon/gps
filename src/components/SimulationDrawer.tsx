import React, { useEffect } from 'react';
import { X, Play, Pause, RotateCw, Sparkles, Navigation } from 'lucide-react';

interface SimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulatingWalk: boolean;
  onToggleSimulateWalk: () => void;
  manualHeading: number;
  onHeadingChange: (heading: number) => void;
  manualDistance: number;
  onDistanceChange: (distance: number) => void;
  manualElevationDiff: number;
  onElevationDiffChange: (diff: number) => void;
  onApplyPreset: (name: string, distance: number, bearing: number, elevDiff: number) => void;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({
  isOpen,
  onClose,
  isSimulatingWalk,
  onToggleSimulateWalk,
  manualHeading,
  onHeadingChange,
  manualDistance,
  onDistanceChange,
  manualElevationDiff,
  onElevationDiffChange,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              動作テスト・シミュレーター
            </h3>
            <span className="text-[11px] text-slate-400">
              PCや室内でコンパスや高度差の反応をテストできます
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Scenario Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              クイック検証シナリオ
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onApplyPreset('右前方・高所（ビル上）', 65, 45, 14.5)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left hover:border-indigo-500/50 transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">① 右前方・ビル上（距離65m / 高度 +14.5m）</span>
                  <span className="text-[10px] text-slate-500">2時方向を向き、上り坂・階段ナビの検証</span>
                </div>
                <Navigation className="w-4 h-4 text-amber-400 shrink-0 transform rotate-45" />
              </button>

              <button
                onClick={() => onApplyPreset('直進・地下（駅前）', 120, 0, -8.0)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left hover:border-indigo-500/50 transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">② 12時方向直進・地下（距離120m / 高度 -8.0m）</span>
                  <span className="text-[10px] text-slate-500">まっすぐ進み、降下階段ナビの検証</span>
                </div>
                <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

              <button
                onClick={() => onApplyPreset('到達直前テスト', 3.5, 0, 0.2)}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-left hover:border-emerald-400 transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">③ 目標到達テスト（直近 3.5m）</span>
                  <span className="text-[10px] text-emerald-400/70">到達ファンファーレとバイブ演出の検証</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs">★ 到達</span>
              </button>
            </div>
          </div>

          {/* Heading Slider */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">スマホの向き（電子コンパス方位角）</span>
              <span className="font-mono font-bold text-indigo-400">{manualHeading}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualHeading}
              onChange={(e) => onHeadingChange(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <button onClick={() => onHeadingChange(0)} className="hover:text-white">北 (0°)</button>
              <button onClick={() => onHeadingChange(90)} className="hover:text-white">東 (90°)</button>
              <button onClick={() => onHeadingChange(180)} className="hover:text-white">南 (180°)</button>
              <button onClick={() => onHeadingChange(270)} className="hover:text-white">西 (270°)</button>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">目標までの距離</span>
              <span className="font-mono font-bold text-emerald-400">{manualDistance} m</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={manualDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Elevation Slider */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">高度差（立体駐車場・ビル階数）</span>
              <div className="text-right">
                <span className="font-mono font-bold text-amber-400">
                  {manualElevationDiff > 0 ? '+' : ''}{manualElevationDiff} m
                </span>
                <span className="text-[10px] text-slate-300 font-bold ml-1.5">
                  ({Math.abs(manualElevationDiff) <= 1.3
                    ? '同階'
                    : manualElevationDiff > 0
                    ? `▲約${Math.max(1, Math.round(manualElevationDiff / 3))}階上`
                    : `▼約${Math.max(1, Math.round(Math.abs(manualElevationDiff) / 3))}階下`})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="0.5"
              value={manualElevationDiff}
              onChange={(e) => onElevationDiffChange(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            {/* Quick floor shortcut buttons */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
              <button onClick={() => onElevationDiffChange(9.0)} className="hover:text-amber-300">4F(+9m)</button>
              <button onClick={() => onElevationDiffChange(6.0)} className="hover:text-amber-300">3F(+6m)</button>
              <button onClick={() => onElevationDiffChange(3.0)} className="hover:text-amber-300">2F(+3m)</button>
              <button onClick={() => onElevationDiffChange(0.0)} className="hover:text-emerald-300">同階(0m)</button>
              <button onClick={() => onElevationDiffChange(-3.0)} className="hover:text-cyan-300">B1F(-3m)</button>
            </div>
          </div>

          {/* Continuous Walk Simulation */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">歩行移動シミュレーション</span>
              <span className="text-[10px] text-slate-400">1秒ごとに約1.2m目標へ近づく動作をテスト</span>
            </div>
            <button
              onClick={onToggleSimulateWalk}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isSimulatingWalk
                  ? 'bg-amber-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isSimulatingWalk ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>停止</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>歩行開始</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
