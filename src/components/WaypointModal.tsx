import React, { useState } from 'react';
import { CurrentLocation, Waypoint } from '../types';
import { soundEffects } from '../utils/audio';
import { MapPin, Mountain, X, Check, Home, Car, Bookmark, Sparkles } from 'lucide-react';

interface WaypointModalProps {
  currentLocation: CurrentLocation | null;
  existingWaypoints: Waypoint[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (waypoint: Waypoint) => void;
}

export const WaypointModal: React.FC<WaypointModalProps> = ({
  currentLocation,
  existingWaypoints,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'home' | 'parking' | 'custom'>('parking');
  const [customName, setCustomName] = useState('マイ記録地点');
  const [selectedIcon, setSelectedIcon] = useState<Waypoint['icon']>('car');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  // Check if Home or Parking already exists in saved waypoints
  const existingHome = existingWaypoints.find((w) => w.id === 'wp_home' || w.category === 'home' || w.name.includes('自宅'));
  const existingParking = existingWaypoints.find((w) => w.id === 'wp_parking' || w.category === 'parking' || w.name.includes('駐車'));

  const handleSelectSlot = (slot: 'home' | 'parking' | 'custom') => {
    setSelectedSlot(slot);
    if (slot === 'home') {
      setCustomName('自宅');
      setSelectedIcon('home');
      setNote(existingHome?.note || 'マイホーム・帰還拠点');
    } else if (slot === 'parking') {
      setCustomName('駐車位置');
      setSelectedIcon('car');
      setNote(existingParking?.note || '車の駐車位置');
    } else {
      setCustomName('お気に入りスポット');
      setSelectedIcon('pin');
    }
  };

  const handleSave = () => {
    if (!currentLocation) return;

    soundEffects.playRecordBeep();
    soundEffects.triggerHaptic('success');

    let id: string;
    let name: string;
    let icon: Waypoint['icon'];
    let category: Waypoint['category'];

    if (selectedSlot === 'home') {
      id = existingHome ? existingHome.id : 'wp_home';
      name = '自宅';
      icon = 'home';
      category = 'home';
    } else if (selectedSlot === 'parking') {
      id = existingParking ? existingParking.id : 'wp_parking';
      name = '駐車位置';
      icon = 'car';
      category = 'parking';
    } else {
      id = `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      name = customName.trim() || '無題の記録地点';
      icon = selectedIcon;
      category = 'custom';
    }

    const newWaypoint: Waypoint = {
      id,
      name,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      altitude: currentLocation.altitude,
      altitudeAccuracy: currentLocation.altitudeAccuracy,
      accuracy: currentLocation.accuracy,
      timestamp: Date.now(),
      note: note.trim() || undefined,
      icon,
      category,
    };

    onSave(newWaypoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">現在地を保存</h3>
              <p className="text-[11px] text-slate-400">GPS座標と高度（高さ）を保存します</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Captured Coordinates Summary */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>現在地座標:</span>
            <span className="text-white font-semibold tabular-nums">
              {currentLocation ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}` : '取得中...'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              取得標高 (高さ):
            </span>
            <span className="text-emerald-300 font-bold tabular-nums">
              {currentLocation?.altitude !== null && currentLocation?.altitude !== undefined
                ? `${currentLocation.altitude} m`
                : 'GPS高度待機中'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[10px]">
            <span>測位精度:</span>
            <span>±{currentLocation?.accuracy ?? 0}m</span>
          </div>
        </div>

        {/* Quick Slot Selector (自宅 / 駐車位置 / その他) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            保存するスロット（複数管理可能）
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Slot 1: 自宅 */}
            <button
              type="button"
              onClick={() => handleSelectSlot('home')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                selectedSlot === 'home'
                  ? 'bg-blue-950/60 border-blue-500/80 text-white shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block leading-tight">自宅</span>
              <span className="text-[9px] text-slate-500 block">
                {existingHome ? '上書き更新' : '新規登録'}
              </span>
            </button>

            {/* Slot 2: 駐車位置 */}
            <button
              type="button"
              onClick={() => handleSelectSlot('parking')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                selectedSlot === 'parking'
                  ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-md ring-1 ring-amber-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block leading-tight">駐車位置</span>
              <span className="text-[9px] text-slate-500 block">
                {existingParking ? '上書き更新' : '新規登録'}
              </span>
            </button>

            {/* Slot 3: 新規地点 */}
            <button
              type="button"
              onClick={() => handleSelectSlot('custom')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                selectedSlot === 'custom'
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block leading-tight">その他の地点</span>
              <span className="text-[9px] text-slate-500 block">自由登録</span>
            </button>
          </div>
        </div>

        {/* Custom Name (Only if 'custom' is selected) */}
        {selectedSlot === 'custom' && (
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              地点名
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例: キャンプ場、職場、絶景スポット"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        )}

        {/* Memo / Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            メモ・フロア情報（任意）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              selectedSlot === 'parking'
                ? '例: 地下2階 B-12柱、エレベーター横'
                : selectedSlot === 'home'
                ? '例: 自宅マンション 5階'
                : '例: 赤い看板の近く'
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!currentLocation}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>
              {selectedSlot === 'home'
                ? '自宅として記録'
                : selectedSlot === 'parking'
                ? '駐車位置として記録'
                : 'この地点を保存'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
