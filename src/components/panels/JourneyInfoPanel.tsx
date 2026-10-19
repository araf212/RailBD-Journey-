import React, { useState } from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { simulationManager } from '../../stores/simulationStore';
import { ROUTES } from '../../data/routes';
import { 
  Train, 
  MapPin, 
  Navigation, 
  Sparkles, 
  Info, 
  Compass, 
  CheckCircle2, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

import { Station } from '../../data/types';

interface JourneyInfoPanelProps {
  onInspectStation?: (station: Station) => void;
}

export const JourneyInfoPanel: React.FC<JourneyInfoPanelProps> = ({ onInspectStation }) => {
  const { 
    activeRoute, 
    currentStation, 
    nextStation, 
    distanceCoveredKm, 
    journeyProgress, 
    currentSegment,
    isAtStation
  } = useSimulation();

  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 text-slate-200">
      {/* Route Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Active Corridor
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">Train #{activeRoute.trainNo}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
            <span>{activeRoute.trainNameEn}</span>
            <span className="text-sm font-medium text-emerald-400 font-sans">
              ({activeRoute.trainNameBn})
            </span>
          </h2>
        </div>

        {/* Change Route Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRouteDropdownOpen(!routeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Route ({activeRoute.stations[0].nameEn.split(' ')[0]} → {activeRoute.stations[activeRoute.stations.length - 1].nameEn.split(' ')[0]})</span>
          </button>

          {routeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-30">
              <div className="text-[11px] font-bold uppercase text-slate-400 px-2 py-1">
                Verified Bangladesh Railway Routes
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {ROUTES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      simulationManager.setRoute(r.id);
                      setRouteDropdownOpen(false);
                    }}
                    className={`flex flex-col text-left p-2 rounded-lg transition-colors text-xs ${
                      activeRoute.id === r.id 
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200' 
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span className="font-semibold text-slate-100">{r.nameEn}</span>
                    <span className="text-[11px] text-slate-400">{r.trainNameEn} · {r.totalDistanceKm} km</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row: Clean typographic layout without pill boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Origin Terminal</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{activeRoute.stations[0].nameEn}</div>
          <div className="text-[11px] text-slate-400 font-mono">0.0 km</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Destination</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">
            {activeRoute.stations[activeRoute.stations.length - 1].nameEn}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{activeRoute.totalDistanceKm} km</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Next Station</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {nextStation ? nextStation.nameEn : 'Arrival Terminal'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {nextStation ? `${(nextStation.kmFromOrigin - distanceCoveredKm).toFixed(1)} km ahead` : 'Journey Completed'}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Traveled Distance</div>
          <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            {distanceCoveredKm.toFixed(1)} km <span className="text-slate-500 font-normal">({(journeyProgress * 100).toFixed(0)}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {isAtStation ? 'Station Stop' : 'Cruising'}
          </div>
        </div>
      </div>

      {/* Cultural Landscape & Railway Heritage Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Current Scenery & Heritage Insight: {currentSegment.landscapeName}
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {currentSegment.description}
        </p>
        {currentStation.trivia && (
          <div className="mt-1 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
            <span className="font-semibold text-emerald-400 shrink-0">Station Insight:</span>
            <span>{currentStation.trivia}</span>
          </div>
        )}
      </div>

      {/* Station Stepper List */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Route Stations ({activeRoute.stations.length})</span>
          <span className="text-[11px] font-normal text-slate-500">Click any station to inspect or fast travel</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {activeRoute.stations.map((st, i) => {
            const hasPassed = distanceCoveredKm >= st.kmFromOrigin - 0.5;
            const isCurrent = currentStation.id === st.id;

            return (
              <div
                key={st.id}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left shrink-0 min-w-[140px] transition-all ${
                  isCurrent 
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
                    : hasPassed 
                    ? 'bg-slate-950 border-emerald-800/60 text-slate-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{st.kmFromOrigin} km</span>
                  {hasPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="font-semibold text-slate-100 text-xs mt-1 truncate w-full">
                  {st.nameEn}
                </div>
                <div className="text-[10px] text-slate-400 truncate w-full">
                  {st.nameBn}
                </div>
                <div className="flex items-center gap-1 mt-2 w-full pt-1.5 border-t border-slate-800/60 flex-wrap">
                  {onInspectStation && (
                    <button
                      onClick={() => onInspectStation(st)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded transition-colors"
                      title="Inspect Station Landmark & History"
                    >
                      Info
                    </button>
                  )}
                  {st.kmFromOrigin > 0 && (
                    <button
                      onClick={() => simulationManager.jumpToStation(st, true)}
                      className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/70 text-amber-300 text-[10px] rounded transition-colors"
                      title="Simulate approaching station: watch train slow down, dock, and depart"
                    >
                      Approach
                    </button>
                  )}
                  <button
                    onClick={() => simulationManager.jumpToStation(st, false)}
                    className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] rounded transition-colors ml-auto"
                    title="Dock train directly at station platform"
                  >
                    Platform
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
