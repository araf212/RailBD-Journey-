import React, { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { simulationManager } from './stores/simulationStore';
import { Station } from './data/types';
import { Header } from './components/layout/Header';
import { JourneyCanvas } from './components/canvas/JourneyCanvas';
import { RouteMap } from './components/map/RouteMap';
import { SimulationControls } from './components/controls/SimulationControls';
import { JourneyInfoPanel } from './components/panels/JourneyInfoPanel';
import { TrainCustomizerModal } from './components/panels/TrainCustomizerModal';
import { AboutModal } from './components/panels/AboutModal';
import { StationInfoModal } from './components/panels/StationInfoModal';
import { AudioSettingsModal } from './components/panels/AudioSettingsModal';

export default function App() {
  const { cameraMode, distanceCoveredKm } = useSimulation();

  const [activeTab, setActiveTab] = useState<'simulator' | 'map' | 'about'>('simulator');
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [inspectedStation, setInspectedStation] = useState<Station | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          simulationManager.togglePlay();
          break;
        case 'KeyH':
          e.preventDefault();
          simulationManager.triggerHorn(e.shiftKey ? 'short' : 'long');
          break;
        case 'KeyB':
          e.preventDefault();
          simulationManager.triggerBell();
          break;
        case 'KeyL':
          e.preventDefault();
          simulationManager.toggleHeadlight();
          break;
        case 'KeyR':
          e.preventDefault();
          simulationManager.restart();
          break;
        case 'Digit1':
          simulationManager.setSpeed(1);
          break;
        case 'Digit2':
          simulationManager.setSpeed(2);
          break;
        case 'Digit4':
          simulationManager.setSpeed(4);
          break;
        case 'Digit8':
          simulationManager.setSpeed(8);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFleet={() => setFleetModalOpen(true)}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenAudio={() => setAudioModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Primary Journey Viewport: 2D Pixel Canvas */}
        {(cameraMode === 'split' || cameraMode === 'trackside' || activeTab === 'simulator') && (
          <section aria-label="Journey Simulation Canvas" className="w-full">
            <JourneyCanvas onOpenAudioSettings={() => setAudioModalOpen(true)} />
          </section>
        )}

        {/* Master Simulation Playback & Environmental Controls */}
        <section aria-label="Simulation Controls" className="w-full">
          <SimulationControls />
        </section>

        {/* Split View: Route Map and Journey Information Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Route Map */}
          <div className="lg:col-span-7 w-full h-[540px]">
            <RouteMap onInspectStation={(st) => setInspectedStation(st)} />
          </div>

          {/* Journey Information, Cultural Insights & Station Timeline */}
          <div className="lg:col-span-5 w-full">
            <JourneyInfoPanel onInspectStation={(st) => setInspectedStation(st)} />
          </div>
        </div>
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            RailBD Journey · Bangladesh Railway Simulator · Inspired by Tiny Rails
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setAudioModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              Audio Mixer & Acoustics
            </button>
            <span>·</span>
            <button 
              onClick={() => setAboutModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              Data Provenance & Documentation
            </button>
            <span>·</span>
            <button 
              onClick={() => setFleetModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              Train Fleet
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TrainCustomizerModal
        isOpen={fleetModalOpen}
        onClose={() => setFleetModalOpen(false)}
      />

      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      <StationInfoModal
        station={inspectedStation}
        onClose={() => setInspectedStation(null)}
        currentDistKm={distanceCoveredKm}
      />

      <AudioSettingsModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />
    </div>
  );
}
