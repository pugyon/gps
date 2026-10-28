import React, { useState } from 'react';
import {
  Sparkles,
  Footprints,
  Play,
  Pause,
  RotateCw,
  Trophy,
  ArrowUp,
  ArrowDown,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface SimpleTestBarProps {
  isActive: boolean;
  onToggleActive: () => void;
  manualDistance: number;
  onDistanceChange: (d: number) => void;
  manualHeading: number;
  onHeadingChange: (h: number) => void;
  manualElevationDiff: number;
  onElevationDiffChange: (diff: number) => void;
  isSimulatingWalk: boolean;
  onToggleSimulateWalk: () => void;
  onOpenAdvanced: () => void;
  targetName: string;
}

export const SimpleTestBar: React.FC<SimpleTestBarProps> = ({
  isActive,
  onToggleActive,
  manualDistance,
  onDistanceChange,
  manualHeading,
  onHeadingChange,
  manualElevationDiff,
  onElevationDiffChange,
  isSimulatingWalk,
  onToggleSimulateWalk,
  onOpenAdvanced,
  targetName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isActive) return null;

  // Quick 1-tap walk closer (5 meters)
  const handleWalkStep = () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('light');
    onDistanceChange(Math.max(1, manualDistance - 5));
  };

  // Quick 1-tap rotate heading (+45 deg)
  const handleRotateHeading = () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('light');
    onHeadingChange((manualHeading + 45) % 360);
  };

  // Quick 1-tap arrival test (3 meters)
  const handleInstantArrival = () => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('medium');
    onDistanceChange(3.0);
    onElevationDiffChange(0.0);
  };

  // Quick 1-tap elevation adjust
  const handleElevationStep = (delta: number) => {
    soundEffects.playTick();
    soundEffects.triggerHaptic('light');
    onElevationDiffChange(Math.round((manualElevationDiff + delta) * 10) / 10);
  };

  // Compact collapsed pill mode (Takes zero space, does not push radar)
  if (isCollapsed) {
    return (
      <div className="w-full bg-slate-900/90 border border-indigo-500/40 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-md text-xs select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
          <span className="font-mono font-bold text-emerald-400 text-xs shrink-0">
            {manualDistance >= 1000 ? `${(manualDistance / 1000).toFixed(1)}km` : `${Math.round(manualDistance)}m`}
          </span>
          <span className="font-mono font-bold text-amber-300 text-xs shrink-0">
            {manualElevationDiff > 0 ? `▲+${manualElevationDiff}m` : manualElevationDiff < 0 ? `▼${manualElevationDiff}m` : '0m'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleWalkStep}
            className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold active:scale-95"
            title="5m近づく"
          >
            -5m進む
          </button>
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-0.5 active:scale-95"
          >
            <span>展開</span>
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onToggleActive();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 active:scale-95"
            title="テストモード終了"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/95 border-2 border-indigo-500/50 rounded-2xl p-2.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
      {/* Top Header of Test Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">簡易テスト稼働中</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                仮想GPS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="最小化"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAdvanced}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="詳細スライダーを開く"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onToggleActive();
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="テストモードを終了して実機GPSに戻す"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Realtime Stats Readout in Test Mode */}
      <div className="grid grid-cols-3 gap-2 my-2.5 text-center">
        <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">疑似距離</span>
          <span className="text-sm font-black font-mono text-emerald-400 block">
            {manualDistance >= 1000 ? `${(manualDistance / 1000).toFixed(2)}km` : `${Math.round(manualDistance)}m`}
          </span>
          <span className="text-[10px] text-slate-500 block">水平直線</span>
        </div>
        <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">スマホ向き</span>
          <span className="text-sm font-black font-mono text-indigo-400 block">{manualHeading}°</span>
          <span className="text-[10px] text-slate-500 block">ジャイロ</span>
        </div>
        <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">高度差 (階数)</span>
          <span
            className={`text-sm font-black font-mono block ${
              manualElevationDiff > 0
                ? 'text-amber-400'
                : manualElevationDiff < 0
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }`}
          >
            {manualElevationDiff > 0 ? '+' : ''}
            {manualElevationDiff}m
          </span>
          <span className="text-[10px] font-bold text-slate-300 block">
            {Math.abs(manualElevationDiff) <= 1.3
              ? '✔ 同階(0F)'
              : manualElevationDiff > 0
              ? `▲約${Math.max(1, Math.round(manualElevationDiff / 3))}階上`
              : `▼約${Math.max(1, Math.round(Math.abs(manualElevationDiff) / 3))}階下`}
          </span>
        </div>
      </div>

      {/* 1-Tap Action Buttons (Super Simple!) */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {/* Walk closer button */}
        <button
          onClick={handleWalkStep}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 active:scale-95 transition"
          title="目標へ5m近づく"
        >
          <Footprints className="w-4 h-4 mb-0.5 text-emerald-400" />
          <span className="text-[10px] font-bold">5m近づく</span>
        </button>

        {/* Continuous walk simulation toggle */}
        <button
          onClick={() => {
            soundEffects.playTick();
            onToggleSimulateWalk();
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition ${
            isSimulatingWalk
              ? 'bg-amber-500/30 text-amber-300 border-amber-500 animate-pulse'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
          title="自動で目標へ歩行進行"
        >
          {isSimulatingWalk ? (
            <Pause className="w-4 h-4 mb-0.5 text-amber-400" />
          ) : (
            <Play className="w-4 h-4 mb-0.5 text-slate-300" />
          )}
          <span className="text-[10px] font-bold">
            {isSimulatingWalk ? '歩行停止' : '自動歩行'}
          </span>
        </button>

        {/* Rotate heading +45 deg */}
        <button
          onClick={handleRotateHeading}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition"
          title="スマホの向きを45度回転"
        >
          <RotateCw className="w-4 h-4 mb-0.5 text-indigo-400" />
          <span className="text-[10px] font-bold">向き+45°</span>
        </button>

        {/* Instant arrival check */}
        <button
          onClick={handleInstantArrival}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50 active:scale-95 transition"
          title="距離3mにして到達ファンファーレをテスト"
        >
          <Trophy className="w-4 h-4 mb-0.5 text-amber-400" />
          <span className="text-[10px] font-bold">到達(3m)</span>
        </button>
      </div>

      {/* Multi-story parking floor quick presets */}
      <div className="mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="font-bold text-slate-300">🏢 立体駐車場・階層テスト:</span>
          <span>1階＝約3m</span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
          <button
            onClick={() => {
              soundEffects.playTick();
              onElevationDiffChange(9.0);
            }}
            className={`py-1 rounded-lg border font-bold text-center transition ${
              manualElevationDiff === 9.0
                ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                : 'bg-slate-800/70 hover:bg-slate-800 text-amber-200 border-slate-700'
            }`}
            title="4F駐車（3フロア上 / +9m）"
          >
            🚗4F(+9m)
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onElevationDiffChange(6.0);
            }}
            className={`py-1 rounded-lg border font-bold text-center transition ${
              manualElevationDiff === 6.0
                ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                : 'bg-slate-800/70 hover:bg-slate-800 text-amber-200 border-slate-700'
            }`}
            title="3F駐車（2フロア上 / +6m）"
          >
            3F(+6m)
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onElevationDiffChange(3.0);
            }}
            className={`py-1 rounded-lg border font-bold text-center transition ${
              manualElevationDiff === 3.0
                ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                : 'bg-slate-800/70 hover:bg-slate-800 text-amber-200 border-slate-700'
            }`}
            title="2F駐車（1フロア上 / +3m）"
          >
            2F(+3m)
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onElevationDiffChange(0.0);
            }}
            className={`py-1 rounded-lg border font-bold text-center transition ${
              manualElevationDiff === 0.0
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                : 'bg-slate-800/70 hover:bg-slate-800 text-emerald-300 border-slate-700'
            }`}
            title="同じフロア（0m）"
          >
            ✔同階(0m)
          </button>
          <button
            onClick={() => {
              soundEffects.playTick();
              onElevationDiffChange(-3.0);
            }}
            className={`py-1 rounded-lg border font-bold text-center transition ${
              manualElevationDiff === -3.0
                ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                : 'bg-slate-800/70 hover:bg-slate-800 text-cyan-200 border-slate-700'
            }`}
            title="地下B1F（1フロア下 / -3m）"
          >
            B1F(-3m)
          </button>
        </div>
      </div>

      {/* Third row: Step +/- 1 floor and Quick resets */}
      <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
        <div className="flex items-center gap-1 text-slate-400">
          <span>階層微調:</span>
          <button
            onClick={() => handleElevationStep(3.0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono border border-slate-700 flex items-center gap-0.5 active:scale-95 transition"
            title="1階上へ (+3m)"
          >
            <ArrowUp className="w-3 h-3" />
            <span>+1階(+3m)</span>
          </button>
          <button
            onClick={() => handleElevationStep(-3.0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono border border-slate-700 flex items-center gap-0.5 active:scale-95 transition"
            title="1階下へ (-3m)"
          >
            <ArrowDown className="w-3 h-3" />
            <span>-1階(-3m)</span>
          </button>
        </div>

        <button
          onClick={() => {
            soundEffects.playTick();
            onDistanceChange(65);
            onHeadingChange(0);
            onElevationDiffChange(9.0);
          }}
          className="text-[10px] text-slate-400 hover:text-white underline"
        >
          標準値(4F/65m)に戻す
        </button>
      </div>
    </div>
  );
};
