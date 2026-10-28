import React, { useState } from 'react';
import { Volume2, VolumeX, Compass, Sliders, Smartphone, Download, Check, Sparkles } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  needsCompassPermission: boolean;
  onRequestCompassPermission: () => void;
  simulationOpen: boolean;
  onToggleSimulation: () => void;
  radarMode: 'dragon' | 'tactical';
  onToggleRadarMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  needsCompassPermission,
  onRequestCompassPermission,
  simulationOpen,
  onToggleSimulation,
  radarMode,
  onToggleRadarMode,
}) => {
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
    if (!next) {
      soundEffects.playTick();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-1.5 h-11 shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 select-none">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-700 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/50">
            <span className="text-white text-[11px] font-black">★</span>
          </div>
          <h1 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-100 flex items-center gap-1 whitespace-nowrap">
            DRAGON RADAR
            <span className="text-[9px] font-mono uppercase tracking-normal px-1 py-0.2 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/30">
              GPS
            </span>
          </h1>
        </div>

        {/* Zone 2: Mode & Sensor Controls */}
        <div className="flex items-center gap-2">
          {/* Radar Mode Switch */}
          <button
            onClick={() => {
              soundEffects.playTick();
              onToggleRadarMode();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 active:scale-95 transition-all whitespace-nowrap"
            title="レーダー表示モード切替"
          >
            {radarMode === 'dragon' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>レーダー</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>コンパスHUD</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'サウンドをオン' : 'サウンドをミュート'}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
            title={isMuted ? '効果音: OFF' : '効果音: ON'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* iOS Compass Permission Prompt */}
          {needsCompassPermission && (
            <button
              onClick={onRequestCompassPermission}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all whitespace-nowrap"
              title="iOSコンパスを有効化"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>方位許可</span>
            </button>
          )}

          {/* Simulation Toggle */}
          <button
            onClick={() => {
              soundEffects.playTick();
              onToggleSimulation();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap active:scale-95 ${
              simulationOpen
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50'
                : 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:bg-slate-800'
            }`}
            title="室内・PC検証用テストモード切替"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>テスト</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>インストール</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">アプリ追加</span>
            </button>
          )}
        </div>
      </header>

      {/* iOS Installation Instruction Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Download className="w-5 h-5 text-emerald-400" />
              iPhone / iPad にアプリを追加
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Safariの下部メニューにある<strong>共有アイコン</strong>（四角から矢印が上に出ているマーク）をタップし、
              メニューから<strong>「ホーム画面に追加」</strong>を選択すると全画面でアプリのように動作します。
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>ホーム画面からワンタップですぐ起動</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>全画面フルスクリーン＆高精度GPS稼働</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
};
