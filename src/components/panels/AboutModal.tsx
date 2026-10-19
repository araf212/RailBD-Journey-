import React from 'react';
import { X, CheckCircle2, ShieldCheck, Keyboard, Heart, MapPin, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100">About RailBD Journey</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-medium text-emerald-400">Bangladesh Railway Journey Simulator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              The Vision
            </h4>
            <p>
              Inspired by the retro 2D pixel-art charm of <em>Tiny Rails</em>, <strong>RailBD Journey</strong> celebrates the breathtaking landscapes, river crossings, rural villages, and rich heritage of Bangladesh's railway network. From the iconic umbrella canopy of Dhaka Kamalapur across the historic Jamuna and Padma river basins to the mystic cultural heartland of Kushtia, every mile is rendered with atmospheric day-to-night lighting and dynamic weather.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-slate-100 text-xs mb-2 flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Geographical Data Provenance & Verification
            </h4>
            <p className="text-slate-400">
              All station sequences, geographic coordinates, track mileage, and river bridge crossings are based on official Bangladesh Railway (বাংলাদেশ রেলওয়ে) timetable datasets and OpenStreetMap rail network infrastructure. No intermediate stations or imaginary lines are fabricated.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-100 text-xs mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              Keyboard Shortcuts & Controls
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Play / Pause</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">Space</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Air Horn</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">H</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Station Bell</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">B</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Headlight</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">L</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Restart</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">R</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Speed (1x-8x)</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300">1, 2, 4, 8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
