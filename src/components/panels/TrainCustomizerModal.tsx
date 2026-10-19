import React from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { simulationManager } from '../../stores/simulationStore';
import { CarriageType, TrainCar } from '../../data/types';
import { Train, Plus, Trash2, X, Sparkles, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_LOCOS = [
  {
    type: 'loco_br_2900' as CarriageType,
    name: 'Class 2900 EMD Diesel (Iconic BR Livery)',
    description: 'The workhorse of Bangladesh Railway in signature forest green with red and yellow speed stripes.',
  },
  {
    type: 'loco_express_3000' as CarriageType,
    name: 'Class 3000 Modern Intercity Express',
    description: 'Modern streamlined locomotive designed for high-speed intercity routes like Subarna & Cox’s Bazar Express.',
  },
  {
    type: 'loco_heritage_steam' as CarriageType,
    name: 'Heritage 1930 Steam Engine (Eastern Bengal Railway)',
    description: 'Historic coal-fired steam engine from the pre-independence era with exposed driving rods and boiler.',
  },
];

const AVAILABLE_COACHES = [
  {
    type: 'shovon_chair' as CarriageType,
    name: 'Shovon Chair Coach (শোভন)',
    description: 'Bangladesh Railway passenger carriage in green & red livery with barred panoramic windows.',
  },
  {
    type: 'bhojon_dining' as CarriageType,
    name: 'Bhojon Gari / Dining Car (ভোজন গাড়ি)',
    description: 'Pantry coach serving piping hot milk tea (cha), samosas, and biryani.',
  },
  {
    type: 'snigdha_ac' as CarriageType,
    name: 'Snigdha AC Coach (স্নিগ্ধা)',
    description: 'First class air-conditioned carriage with modern silver finish and emerald accent striping.',
  },
  {
    type: 'guard_caboose' as CarriageType,
    name: 'Guard & Luggage Van (ব্রেক ভ্যান)',
    description: 'Rear guard observation coach with flashing red safety tail lamp.',
  },
];

export const TrainCustomizerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { trainCars } = useSimulation();

  if (!isOpen) return null;

  const currentLoco = trainCars.find((c) => c.type.startsWith('loco')) || trainCars[0];

  const handleSelectLoco = (locoType: CarriageType, name: string, description: string) => {
    const updated = trainCars.map((car) => {
      if (car.type.startsWith('loco')) {
        return { ...car, type: locoType, name, description };
      }
      return car;
    });
    simulationManager.setTrainCars(updated);
  };

  const handleAddCoach = (coachType: CarriageType, name: string, description: string) => {
    if (trainCars.length >= 7) return; // limit train length for canvas
    const newCar: TrainCar = {
      id: `car-${Date.now()}-${Math.random()}`,
      type: coachType,
      name,
      description,
    };
    // Insert before rear guard caboose if present, or at end
    const lastIsGuard = trainCars[trainCars.length - 1]?.type === 'guard_caboose';
    if (lastIsGuard) {
      const copy = [...trainCars];
      copy.splice(copy.length - 1, 0, newCar);
      simulationManager.setTrainCars(copy);
    } else {
      simulationManager.setTrainCars([...trainCars, newCar]);
    }
  };

  const handleRemoveCar = (index: number) => {
    if (trainCars.length <= 2) return; // keep at least engine and 1 coach
    const updated = trainCars.filter((_, i) => i !== index);
    simulationManager.setTrainCars(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/70 border border-emerald-800/60 rounded-lg text-emerald-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Train Fleet & Carriage Customizer</h3>
              <p className="text-xs text-slate-400">Configure your Bangladesh Railway locomotive and train formation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Section 1: Choose Locomotive */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Locomotive Power
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_LOCOS.map((loco) => {
                const isSelected = currentLoco.type === loco.type;
                return (
                  <button
                    key={loco.type}
                    onClick={() => handleSelectLoco(loco.type, loco.name, loco.description)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-200">{loco.name.split('(')[0]}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {loco.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Current Train Formation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Train Formation ({trainCars.length} Cars)
              </span>
              <span className="text-[11px] text-slate-500">Max 7 cars for optimal parallax performance</span>
            </div>

            <div className="flex flex-col gap-2">
              {trainCars.map((car, idx) => {
                const isLoco = car.type.startsWith('loco');
                return (
                  <div
                    key={car.id || idx}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold w-4">#{idx + 1}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{car.name}</span>
                        <span className="text-[11px] text-slate-400">{car.description}</span>
                      </div>
                    </div>

                    {!isLoco && (
                      <button
                        onClick={() => handleRemoveCar(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Remove Coach"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Add Carriages */}
          {trainCars.length < 7 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Add Coach to Train
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_COACHES.map((coach) => (
                  <button
                    key={coach.type}
                    onClick={() => handleAddCoach(coach.type, coach.name, coach.description)}
                    className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {coach.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{coach.description}</div>
                    </div>
                    <div className="p-1.5 bg-slate-900 rounded-lg text-slate-400 group-hover:text-emerald-400 shrink-0 ml-2">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            Apply Formation
          </button>
        </div>
      </div>
    </div>
  );
};
