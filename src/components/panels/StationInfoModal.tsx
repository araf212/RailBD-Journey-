import React from 'react';
import { Station } from '../../data/types';
import { simulationManager } from '../../stores/simulationStore';
import { soundEngine } from '../../audio/soundEngine';
import { 
  X, 
  MapPin, 
  Building2, 
  Train, 
  Volume2, 
  Navigation, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2,
  Users
} from 'lucide-react';

interface Props {
  station: Station | null;
  onClose: () => void;
  currentDistKm: number;
}

export const StationInfoModal: React.FC<Props> = ({ station, onClose, currentDistKm }) => {
  if (!station) return null;

  const hasPassed = currentDistKm >= station.kmFromOrigin - 0.2;
  const isCurrent = Math.abs(currentDistKm - station.kmFromOrigin) < 0.8;
  const distDiff = (station.kmFromOrigin - currentDistKm).toFixed(1);

  // Render representative pixel-art SVG illustration for each station landmark
  const renderPixelArtLandmark = (badge: string) => {
    switch (badge) {
      case 'lotus_roof':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            {/* Kamalapur parasol umbrella roof canopy vaults */}
            <path d="M 10 35 Q 35 15 60 35 Q 85 15 110 35 Q 135 15 150 35" fill="none" stroke="#FEF08A" strokeWidth="4" />
            <path d="M 35 15 L 35 55 M 85 15 L 85 55 M 135 15 L 135 55" stroke="#94A3B8" strokeWidth="3" />
            {/* Station platform & train track */}
            <rect x="0" y="55" width="160" height="25" fill="#334155" />
            <rect x="0" y="57" width="160" height="3" fill="#EAB308" />
            <rect x="20" y="44" width="85" height="13" fill="#15803D" rx="2" />
            <rect x="20" y="50" width="85" height="2" fill="#DC2626" />
            <rect x="25" y="46" width="10" height="4" fill="#FEF08A" />
            <rect x="40" y="46" width="10" height="4" fill="#FEF08A" />
            <rect x="55" y="46" width="10" height="4" fill="#FEF08A" />
          </svg>
        );
      case 'bridge_truss':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            {/* Jamuna River Water */}
            <rect x="0" y="45" width="160" height="35" fill="#0284C7" />
            <rect x="15" y="52" width="25" height="2" fill="#38BDF8" />
            <rect x="90" y="60" width="35" height="2" fill="#38BDF8" />
            {/* Concrete Piers */}
            <rect x="25" y="30" width="16" height="30" fill="#94A3B8" />
            <rect x="95" y="30" width="16" height="30" fill="#94A3B8" />
            {/* Steel Truss Diagonals */}
            <path d="M 0 30 L 160 30 M 0 10 L 160 10 M 0 30 L 25 10 L 60 30 L 95 10 L 130 30 L 160 10" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
            {/* Traditional Country Boat (Nouka) */}
            <polygon points="120,58 144,58 140,65 124,65" fill="#78350F" />
            <polygon points="132,58 132,45 142,52" fill="#F97316" />
          </svg>
        );
      case 'water_tower':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            {/* Ground */}
            <rect x="0" y="65" width="160" height="15" fill="#15803D" />
            {/* Red-brick historic water tower */}
            <rect x="25" y="20" width="40" height="45" fill="#B91C1C" />
            <rect x="20" y="10" width="50" height="12" fill="#7F1D1D" rx="2" />
            <rect x="30" y="8" width="30" height="4" fill="#334155" />
            <rect x="38" y="35" width="14" height="18" fill="#1E293B" rx="1" />
            {/* Semaphore signal mast */}
            <rect x="105" y="15" width="4" height="50" fill="#475569" />
            <rect x="85" y="22" width="22" height="6" fill="#10B981" />
            <circle cx="90" cy="25" r="2" fill="#FFFFFF" />
          </svg>
        );
      case 'baul_ektara':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            {/* Sunset rural sky */}
            <rect x="0" y="0" width="160" height="60" fill="#7C2D12" />
            <circle cx="120" cy="25" r="14" fill="#FBBF24" opacity="0.8" />
            <rect x="0" y="60" width="160" height="20" fill="#15803D" />
            {/* Ektara instrument */}
            <ellipse cx="65" cy="55" rx="14" ry="10" fill="#B45309" />
            <path d="M 60 50 L 70 12 L 74 12 L 67 50" fill="#D97706" />
            <line x1="65" y1="50" x2="72" y2="15" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* Baul shrine white dome */}
            <path d="M 15 60 C 15 45, 35 45, 35 60 Z" fill="#F8FAFC" />
            <rect x="23" y="42" width="4" height="4" fill="#F59E0B" />
          </svg>
        );
      case 'tea_leaf':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            {/* Sky */}
            <rect x="0" y="0" width="160" height="40" fill="#0284C7" />
            {/* Rolling tea terraces */}
            <path d="M 0 45 Q 40 30 80 45 Q 120 60 160 40 L 160 80 L 0 80 Z" fill="#047857" />
            <path d="M 0 55 Q 50 40 100 55 Q 140 70 160 55 L 160 80 L 0 80 Z" fill="#065F46" />
            <path d="M 0 68 Q 60 55 120 68 L 160 70 L 160 80 L 0 80 Z" fill="#064E3B" />
            {/* Tea leaves cluster */}
            <ellipse cx="50" cy="38" rx="8" ry="4" fill="#22C55E" transform="rotate(-25 50 38)" />
            <ellipse cx="58" cy="38" rx="8" ry="4" fill="#10B981" transform="rotate(25 58 38)" />
          </svg>
        );
      case 'sweets':
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            <rect x="0" y="0" width="160" height="80" fill="#1E1B4B" />
            {/* Terracotta Clay Handi */}
            <ellipse cx="80" cy="55" rx="36" ry="18" fill="#B45309" />
            <path d="M 46 55 Q 44 40 55 35 Q 80 30 105 35 Q 116 40 114 55 Z" fill="#92400E" />
            {/* Tangail Chomchom / Poradaha Sweets */}
            <ellipse cx="68" cy="38" rx="8" ry="6" fill="#F59E0B" />
            <ellipse cx="84" cy="36" rx="9" ry="6" fill="#D97706" />
            <ellipse cx="98" cy="39" rx="7" ry="5" fill="#FBBF24" />
            <ellipse cx="76" cy="44" rx="8" ry="5" fill="#FDE68A" />
            <ellipse cx="92" cy="43" rx="8" ry="5" fill="#F59E0B" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-full pixel-rendering bg-slate-950 rounded-lg border border-slate-800">
            <rect x="0" y="0" width="160" height="50" fill="#0284C7" />
            <rect x="0" y="50" width="160" height="30" fill="#15803D" />
            {/* Station Sign */}
            <rect x="40" y="25" width="80" height="20" fill="#FEF08A" stroke="#000000" strokeWidth="2" />
            <rect x="78" y="45" width="4" height="20" fill="#475569" />
            <text x="80" y="38" fill="#000000" fontSize="7" fontWeight="bold" textAnchor="middle">{station.code}</text>
          </svg>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'major_terminal': return 'Central Terminal';
      case 'intercity_junction': return 'Intercity Railway Junction';
      case 'local_station': return 'Regional Passenger Station';
      default: return 'Rural Railway Halt';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{station.nameEn}</h3>
                <span className="text-sm font-semibold text-emerald-400 font-sans">
                  {station.nameBn}
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">
                  {station.code}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{getCategoryLabel(station.category)}</span>
                <span>·</span>
                <span>{station.district} District, {station.division} Division</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300 leading-relaxed">
          {/* Representative Pixel-Art Landmark Showcase */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl items-center sm:items-stretch">
            <div className="w-full sm:w-44 h-28 shrink-0">
              {renderPixelArtLandmark(station.landmark.badgeIcon)}
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Representative Landmark
                </span>
                {station.landmark.historicalYear && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400 font-mono">Est. {station.landmark.historicalYear}</span>
                  </>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                {station.landmark.name}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {station.landmark.description}
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Mileage</div>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">{station.kmFromOrigin} km</div>
              <div className="text-[10px] text-slate-400">from Dhaka</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Platform Layout</div>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">{station.platformCount} Platforms</div>
              <div className="text-[10px] text-slate-400">{station.isJunction ? 'Junction Yard' : 'Linear Stoppage'}</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Crowd Ambience</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5 capitalize">{station.crowdDensity}</div>
              <div className="text-[10px] text-slate-400">Platform Bustle</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Journey Status</div>
              <div className="text-sm font-bold mt-0.5 flex items-center gap-1">
                {isCurrent ? (
                  <span className="text-amber-400">At Station</span>
                ) : hasPassed ? (
                  <span className="text-emerald-400">Passed</span>
                ) : (
                  <span className="text-sky-400 font-mono">{distDiff} km away</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {hasPassed ? 'Traversed' : 'En Route'}
              </div>
            </div>
          </div>

          {/* Historical Heritage Section */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Railway History & Origins
            </h4>
            <p className="text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              {station.history}
            </p>
          </div>

          {/* Interesting Facts & Trivia */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Interesting Facts & Station Trivia
            </h4>
            <p className="text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              {station.trivia}
            </p>
          </div>

          {/* Bilingual Platform Public Address Announcement Text */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Station PA Announcement</span>
              </div>
              <button
                onClick={() => soundEngine.playStationAnnouncement(station)}
                className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 text-[11px] rounded-lg transition-colors flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Play Chime & Voice</span>
              </button>
            </div>
            <div className="text-[11px] font-sans text-emerald-400 italic">
              "{station.announcementTextBn}"
            </div>
            <div className="text-[11px] text-slate-400 italic">
              "{station.announcementTextEn}"
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={() => soundEngine.playStationBell()}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            <span>Ring Station Bell</span>
          </button>

          <div className="flex items-center gap-2">
            {station.kmFromOrigin > 0 && (
              <button
                onClick={() => {
                  simulationManager.jumpToStation(station, true);
                  onClose();
                }}
                className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                title="Watch train approach, decelerate, and stop at this platform"
              >
                <span>Approach & Slowdown</span>
              </button>
            )}
            <button
              onClick={() => {
                simulationManager.jumpToStation(station, false);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              title="Dock directly at station platform"
            >
              <Train className="w-3.5 h-3.5" />
              <span>Dock at Platform</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
