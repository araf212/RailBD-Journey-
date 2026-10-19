import React from 'react';
import { Train, Settings, Compass, Sliders } from 'lucide-react';

interface Props {
  onOpenFleet: () => void;
  onOpenAbout: () => void;
  onOpenAudio?: () => void;
  activeTab: 'simulator' | 'map' | 'about';
  setActiveTab: (tab: 'simulator' | 'map' | 'about') => void;
}

export const Header: React.FC<Props> = ({ 
  onOpenFleet, 
  onOpenAbout, 
  onOpenAudio,
  activeTab, 
  setActiveTab 
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => setActiveTab('simulator')}
        className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 select-none"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
          <Train className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100 font-sans">
          RailBD Journey
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Simulator
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'map' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Route Map
        </button>

        <button
          onClick={onOpenFleet}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          Train Fleet
        </button>

        {onOpenAudio && (
          <button
            onClick={onOpenAudio}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Audio Mixer
          </button>
        )}

        <button
          onClick={onOpenAbout}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'about' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          About
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenFleet}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-2"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Train Fleet</span>
        </button>
      </div>
    </header>
  );
};
