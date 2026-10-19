import React from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { simulationManager } from '../../stores/simulationStore';
import { WeatherPreset, TimePeriod } from '../../data/types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudFog, 
  CloudLightning,
  Clock,
  Gauge,
  Sliders,
  Layers,
  Map as MapIcon,
  Tv
} from 'lucide-react';

export const SimulationControls: React.FC = () => {
  const { 
    isPlaying, 
    speedMultiplier, 
    journeyProgress, 
    distanceCoveredKm, 
    activeRoute,
    simulatedMinutes,
    timePeriod,
    timeString,
    currentWeather,
    cameraMode
  } = useSimulation();

  const weatherPresets: { id: WeatherPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'sunny', label: 'Sunny', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'partly_cloudy', label: 'Cloudy', icon: <CloudSun className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'overcast', label: 'Overcast', icon: <Cloud className="w-3.5 h-3.5 text-slate-300" /> },
    { id: 'monsoon_rain', label: 'Monsoon', icon: <CloudRain className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'foggy', label: 'Mist / Fog', icon: <CloudFog className="w-3.5 h-3.5 text-indigo-300" /> },
    { id: 'thunderstorm', label: 'Storm', icon: <CloudLightning className="w-3.5 h-3.5 text-amber-300" /> },
  ];

  const timePresets: { label: string; minutes: number }[] = [
    { label: 'Dawn (06:00)', minutes: 360 },
    { label: 'Morning (09:00)', minutes: 540 },
    { label: 'Noon (12:00)', minutes: 720 },
    { label: 'Sunset (18:00)', minutes: 1080 },
    { label: 'Night (22:00)', minutes: 1320 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      {/* Primary Playback & Timeline Scrubber */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Play / Pause & Restart Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => simulationManager.togglePlay()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all whitespace-nowrap shadow-md ${
                isPlaying 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Journey'}</span>
            </button>

            <button
              onClick={() => simulationManager.restart()}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
              title="Restart Journey to Origin"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 flex items-center gap-1">
              <Gauge className="w-3 h-3" /> Speed:
            </span>
            {([1, 2, 4, 8] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => simulationManager.setSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  speedMultiplier === spd
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => simulationManager.setCameraMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                cameraMode === 'split' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => simulationManager.setCameraMode('trackside')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                cameraMode === 'trackside' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Cinema</span>
            </button>
            <button
              onClick={() => simulationManager.setCameraMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                cameraMode === 'map' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Timeline Progress Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Progress: {(journeyProgress * 100).toFixed(1)}%</span>
            <span>
              {distanceCoveredKm.toFixed(1)} / {activeRoute.totalDistanceKm} km
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={journeyProgress}
            onChange={(e) => simulationManager.setProgress(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      <div className="h-px bg-slate-800/80" />

      {/* Weather Controls & Time Controls in Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weather Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Weather Preset
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {weatherPresets.map((w) => (
              <button
                key={w.id}
                onClick={() => simulationManager.setWeather(w.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg border transition-all ${
                  currentWeather === w.id
                    ? 'bg-slate-800 border-emerald-500/80 text-white font-medium shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {w.icon}
                <span className="truncate">{w.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Time Engine */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Simulated Time
            </label>
            <span className="font-mono text-xs font-bold text-amber-300">
              {timeString} ({timePeriod})
            </span>
          </div>

          {/* Quick Time Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {timePresets.map((tp) => (
              <button
                key={tp.label}
                onClick={() => simulationManager.setSimulatedTime(tp.minutes)}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] rounded text-slate-300 hover:text-white transition-colors"
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Granular Time Slider */}
          <input
            type="range"
            min="0"
            max="1439"
            step="1"
            value={simulatedMinutes}
            onChange={(e) => simulationManager.setSimulatedTime(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-400 mt-1"
          />
        </div>
      </div>
    </div>
  );
};
