import React, { useState } from 'react';
import { soundEngine } from '../../audio/soundEngine';
import { AudioSettings } from '../../data/types';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Train, 
  Megaphone, 
  CloudRain, 
  TreePine, 
  Users, 
  Bell, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => soundEngine.getSettings());

  if (!isOpen) return null;

  const handleMasterChange = (val: number) => {
    soundEngine.setMasterVolume(val);
    setSettings(soundEngine.getSettings());
  };

  const handleBusChange = (bus: keyof AudioSettings, val: number) => {
    soundEngine.setBusVolume(bus, val);
    setSettings(soundEngine.getSettings());
  };

  const handleMuteToggle = () => {
    soundEngine.toggleMute();
    setSettings(soundEngine.getSettings());
  };

  const handleAutoHornToggle = () => {
    soundEngine.setAutoHorn(!settings.autoHornEnabled);
    setSettings(soundEngine.getSettings());
  };

  const handleAutoAnnounceToggle = () => {
    soundEngine.setAutoAnnouncements(!settings.autoAnnouncementsEnabled);
    setSettings(soundEngine.getSettings());
  };

  const handleAmbientToggle = () => {
    soundEngine.setAmbientEnabled(!settings.ambientEnabled);
    setSettings(soundEngine.getSettings());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Audio Soundscape & Mixing Controls</h3>
              <p className="text-xs text-slate-400">Multi-bus procedural sound synthesis & Bangladesh railway audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-slate-300">
          {/* Master Control Banner */}
          <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMuteToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    settings.isMuted 
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' 
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                  }`}
                  title={settings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {settings.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div>
                  <span className="font-bold text-slate-100 text-sm">Master Volume</span>
                  <div className="text-[11px] text-slate-400">
                    {settings.isMuted ? 'Muted' : `${Math.round(settings.masterVolume * 100)}%`}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono">
                <span className={`w-2 h-2 rounded-full ${settings.isMuted ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                <span className={settings.isMuted ? 'text-rose-400' : 'text-emerald-400 font-semibold'}>
                  {settings.isMuted ? 'AUDIO MUTED' : 'SYNTHESIS ACTIVE'}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              disabled={settings.isMuted}
              value={settings.masterVolume}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
            />
          </div>

          {/* Sub-Buses Volume Sliders */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Channel Audio Buses
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Train Movement Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Train className="w-3.5 h-3.5 text-emerald-400" /> Train Rolling & Rumble
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.trainVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.trainVolume}
                  onChange={(e) => handleBusChange('trainVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Locomotive Horn Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Locomotive Air Horn
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.hornVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.hornVolume}
                  onChange={(e) => handleBusChange('hornVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Station Ambience & Crowd Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Users className="w-3.5 h-3.5 text-sky-400" /> Station Crowd & Platform
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.stationVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.stationVolume}
                  onChange={(e) => handleBusChange('stationVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Announcements Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> PA Chime & Announcements
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.announcementVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.announcementVolume}
                  onChange={(e) => handleBusChange('announcementVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Weather Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain, Thunder & Wind
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.weatherVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.weatherVolume}
                  onChange={(e) => handleBusChange('weatherVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              {/* Countryside Environment Bus */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <TreePine className="w-3.5 h-3.5 text-emerald-300" /> Rural Birds & Crickets
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(settings.environmentVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.environmentVolume}
                  onChange={(e) => handleBusChange('environmentVolume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Simulation Audio Behaviors
            </span>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                <div>
                  <div className="font-semibold text-slate-200">Automatic Station & Crossing Horn</div>
                  <div className="text-[11px] text-slate-400">Locomotive automatically sounds warning air horn when nearing stations</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoHornEnabled}
                  onChange={handleAutoHornToggle}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                <div>
                  <div className="font-semibold text-slate-200">Automatic Station Arrival Announcements</div>
                  <div className="text-[11px] text-slate-400">Plays railway PA chime and bilingual arrival voice announcement upon stopping</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAnnouncementsEnabled}
                  onChange={handleAutoAnnounceToggle}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                <div>
                  <div className="font-semibold text-slate-200">Rural Countryside Ambience</div>
                  <div className="text-[11px] text-slate-400">Plays native Bengal morning birds and night crickets based on time of day</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ambientEnabled}
                  onChange={handleAmbientToggle}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            Apply Audio Settings
          </button>
        </div>
      </div>
    </div>
  );
};
