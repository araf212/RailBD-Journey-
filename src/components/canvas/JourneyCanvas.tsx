import React, { useRef, useEffect, useState } from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { simulationManager } from '../../stores/simulationStore';
import { PixelCanvasEngine } from '../../game/PixelCanvasEngine';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Lightbulb, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  Compass,
  Gauge
} from 'lucide-react';

interface JourneyCanvasProps {
  onOpenAudioSettings?: () => void;
}

export const JourneyCanvas: React.FC<JourneyCanvasProps> = ({ onOpenAudioSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PixelCanvasEngine | null>(null);

  const [hornActive, setHornActive] = useState(false);

  const state = useSimulation();
  const { 
    currentStation, 
    nextStation, 
    currentSegment, 
    isAtStation, 
    stationDwellRemainingSec,
    currentSpeedKmh,
    timeString,
    timePeriod,
    currentWeather,
    headlightOn,
    soundEnabled,
    journeyProgress,
    activeRoute
  } = state;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const engine = new PixelCanvasEngine(canvas);
    engineRef.current = engine;
    engine.updateState(state);
    engine.start();

    // Resize observer
    const handleResize = () => {
      if (canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        engine.resize(rect.width, rect.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update engine with latest state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateState(state);
    }
  }, [state]);

  const handleHornPress = (type: 'short' | 'long' = 'long') => {
    setHornActive(true);
    simulationManager.triggerHorn(type);
    setTimeout(() => {
      setHornActive(false);
    }, type === 'short' ? 400 : 1200);
  };

  const getWeatherIcon = () => {
    switch (currentWeather) {
      case 'monsoon_rain':
        return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
      case 'thunderstorm':
        return <CloudLightning className="w-3.5 h-3.5 text-amber-400" />;
      case 'foggy':
      case 'overcast':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      case 'partly_cloudy':
        return <Cloud className="w-3.5 h-3.5 text-sky-300" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="relative w-full h-[360px] md:h-[440px] lg:h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none group">
      {/* 2D Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pixel-rendering"
      />

      {/* Top HUD: Segment & Station Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none gap-2 z-10">
        {/* Left Badge: Location & Scenery */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                {currentSegment.landscapeName}
                {currentSegment.bridgeName && (
                  <span className="text-[10px] text-amber-400 font-normal">
                    · {currentSegment.bridgeName}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {isAtStation ? (
                  <span className="text-amber-400 font-semibold">
                    ১ নম্বর প্ল্যাটফর্মে ট্রেন বিরতি: {currentStation.nameBn} ({currentStation.nameEn})
                  </span>
                ) : (
                  <span>
                    Past {currentStation.nameEn} → Next: {nextStation?.nameEn || 'Terminus'} ({nextStation ? `${(nextStation.kmFromOrigin - state.distanceCoveredKm).toFixed(1)} km` : '0 km'})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Badge: Speedometer & Clock */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <div className="font-mono">
              <span className="font-bold text-slate-100 text-sm">{Math.round(currentSpeedKmh)}</span>
              <span className="text-slate-400 text-[10px] ml-1">km/h</span>
            </div>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs">
            {getWeatherIcon()}
            <div className="flex flex-col text-right">
              <span className="font-mono font-bold text-slate-100 text-xs">{timeString}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">{timePeriod}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Station Platform Status Banner (Approaching, Stopped, or Departing) */}
      <div className="absolute top-16 left-3 right-3 flex justify-center pointer-events-none z-10">
        {isAtStation ? (
          <div className="pointer-events-auto bg-amber-950/90 border-2 border-amber-500/80 text-amber-100 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-200">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-mono">
                  PLATFORM 1
                </span>
                <span className="font-bold text-sm text-amber-200">
                  {currentStation.nameBn} · {currentStation.nameEn}
                </span>
                <span className="text-xs text-amber-400/80 font-mono">
                  [{currentStation.code}]
                </span>
              </div>
              <span className="text-[11px] text-amber-300/80">
                ট্রেন বিরতি · Resuming in {Math.ceil(stationDwellRemainingSec)}s (Decelerated to 0 km/h)
              </span>
            </div>
            <button
              onClick={() => simulationManager.departStationNow()}
              className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
              title="Depart station immediately without waiting for dwell timer"
            >
              ছাড়ুন / Depart Now
            </button>
          </div>
        ) : nextStation && (nextStation.kmFromOrigin - state.distanceCoveredKm) <= 2.0 && (nextStation.kmFromOrigin - state.distanceCoveredKm) > 0.05 ? (
          <div className="pointer-events-auto bg-slate-950/90 border border-amber-500/60 text-amber-200 backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                  APPROACHING PLATFORM
                </span>
                <span className="text-xs font-bold text-slate-100">
                  {nextStation.nameBn} ({nextStation.nameEn})
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {(nextStation.kmFromOrigin - state.distanceCoveredKm).toFixed(1)} km ahead · Train Decelerating to Platform
              </span>
            </div>
          </div>
        ) : (state.distanceCoveredKm - currentStation.kmFromOrigin) <= 0.8 && currentSpeedKmh < (currentSegment.defaultSpeedLimitKmH * 0.85) && state.distanceCoveredKm > 0.1 ? (
          <div className="pointer-events-auto bg-slate-950/90 border border-emerald-500/60 text-emerald-200 backdrop-blur-md px-3.5 py-1 rounded-lg shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              {currentStation.nameBn} প্ল্যাটফর্ম ত্যাগ · Train Speed Rising ({Math.round(currentSpeedKmh)} km/h)
            </span>
          </div>
        ) : null}
      </div>

      {/* Bottom Floating Train Cockpit Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-1.5 shadow-xl pointer-events-auto z-10">
        {/* Train Horn with active visual feedback */}
        <div className="flex items-center rounded-md overflow-hidden border border-amber-600/70 shadow-sm">
          <button
            onClick={() => handleHornPress('long')}
            className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              hornActive 
                ? 'bg-amber-400 text-slate-950 scale-105 shadow-lg ring-2 ring-amber-300' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
            title="Locomotive Air Horn Long Blast (Press H)"
          >
            <span>বাঁশি</span>
            <span className="text-[10px] opacity-80">(Horn)</span>
          </button>
          <button
            onClick={() => handleHornPress('short')}
            className="px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-mono border-l border-amber-500/40"
            title="Short Horn Warning Toot"
          >
            Toot
          </button>
        </div>

        {/* Station Bell */}
        <button
          onClick={() => simulationManager.triggerBell()}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Station Brass Bell (Press B)"
        >
          <Bell className="w-4 h-4 text-amber-400" />
        </button>

        {/* Headlight */}
        <button
          onClick={() => simulationManager.toggleHeadlight()}
          className={`p-1.5 rounded-md transition-colors ${
            headlightOn 
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Locomotive Headlight (Press L)"
        >
          <Lightbulb className="w-4 h-4" />
        </button>

        {/* Audio Mute & Mixer Button */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => simulationManager.toggleSound()}
            className={`p-1.5 rounded-md transition-colors ${
              soundEnabled 
                ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'text-rose-400 bg-rose-950/30'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {onOpenAudioSettings && (
            <button
              onClick={onOpenAudioSettings}
              className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors font-mono"
              title="Open Audio Mixer Settings"
            >
              Mixer
            </button>
          )}
        </div>
      </div>

      {/* Progress Track Bar along Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-200"
          style={{ width: `${journeyProgress * 100}%` }}
        />
      </div>
    </div>
  );
};
