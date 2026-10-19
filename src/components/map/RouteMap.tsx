import React, { useRef, useState, useMemo } from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { simulationManager } from '../../stores/simulationStore';
import { Station } from '../../data/types';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  MapPin, 
  Train, 
  Compass, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface RouteMapProps {
  onInspectStation?: (station: Station) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({ onInspectStation }) => {
  const { 
    activeRoute, 
    journeyProgress, 
    currentCoords, 
    selectedStation, 
    currentStation, 
    isAtStation 
  } = useSimulation();

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Map view transform state (zoom & pan)
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Bangladesh coordinate bounding box:
  // Lng: 88.0 to 92.8, Lat: 20.8 to 26.6
  const mapBounds = useMemo(() => {
    return {
      minLng: 88.0,
      maxLng: 92.8,
      minLat: 20.8,
      maxLat: 26.6,
      width: 600,
      height: 700,
    };
  }, []);

  // Convert GPS (lng, lat) to SVG canvas coordinates (x, y)
  const project = (lng: number, lat: number): [number, number] => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * mapBounds.width;
    // Invert latitude because SVG Y goes downward
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * mapBounds.height;
    return [x, y];
  };

  // Convert route coordinates to SVG path string
  const fullPathD = useMemo(() => {
    if (!activeRoute.coordinates || activeRoute.coordinates.length < 2) return '';
    return activeRoute.coordinates
      .map((c, i) => {
        const [x, y] = project(c[0], c[1]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRoute, mapBounds]);

  // Current train projected position
  const [trainX, trainY] = project(currentCoords[0], currentCoords[1]);

  // Completed path coordinates slice
  const completedPathD = useMemo(() => {
    if (!activeRoute.coordinates || activeRoute.coordinates.length < 2) return '';
    const totalSegs = activeRoute.coordinates.length - 1;
    const progressIndex = Math.min(Math.floor(journeyProgress * totalSegs), totalSegs - 1);

    const points: [number, number][] = [];
    for (let i = 0; i <= progressIndex; i++) {
      points.push(project(activeRoute.coordinates[i][0], activeRoute.coordinates[i][1]));
    }
    points.push([trainX, trainY]);

    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(' ');
  }, [activeRoute, journeyProgress, trainX, trainY]);

  // Major rivers of Bangladesh (Padma, Jamuna, Meghna) for authentic geography
  const riverPaths = useMemo(() => {
    // Jamuna (Brahmaputra) flowing south
    const jamuna = [
      project(89.7, 26.3),
      project(89.65, 25.5),
      project(89.75, 24.8),
      project(89.78, 24.39), // near bridge
      project(89.82, 23.85), // confluence with Padma
    ];
    // Padma (Ganges) flowing southeast
    const padma = [
      project(88.2, 24.6),
      project(88.8, 24.1),
      project(89.02, 24.05), // near Hardinge bridge
      project(89.82, 23.85), // confluence
      project(90.6, 23.2),  // down to Meghna
    ];
    // Meghna flowing south
    const meghna = [
      project(91.2, 25.1),
      project(90.98, 24.05), // near Bhairab bridge
      project(90.6, 23.2),
      project(90.65, 22.3),
      project(90.8, 21.8),
    ];

    const toPath = (pts: [number, number][]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

    return {
      jamuna: toPath(jamuna),
      padma: toPath(padma),
      meghna: toPath(meghna),
    };
  }, []);

  // Bangladesh simplified geographic border outline
  const bdOutlinePath = useMemo(() => {
    const borderCoords: [number, number][] = [
      [88.08, 24.85], [88.55, 25.25], [88.25, 26.35], [88.58, 26.63], [89.02, 26.25],
      [89.65, 26.15], [89.85, 25.15], [90.55, 25.18], [91.55, 25.18], [92.20, 25.15],
      [92.50, 24.75], [92.25, 24.35], [91.95, 23.95], [91.50, 23.75], [91.35, 23.15],
      [91.85, 22.85], [92.25, 22.35], [92.65, 21.85], [92.35, 21.15], [92.15, 20.85],
      [91.85, 21.45], [91.45, 22.15], [90.55, 22.05], [89.85, 21.85], [89.15, 21.65],
      [89.05, 22.35], [88.85, 23.15], [88.55, 23.85], [88.08, 24.85]
    ];
    return borderCoords
      .map((c, i) => {
        const [x, y] = project(c[0], c[1]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom((z) => Math.min(3.5, z + 0.25));
  const zoomOut = () => setZoom((z) => Math.max(0.7, z - 0.25));
  
  const resetView = () => {
    setZoom(1.1);
    setPan({ x: 0, y: 0 });
  };

  const centerOnTrain = () => {
    setZoom(1.8);
    // Center SVG (300, 350) onto (trainX, trainY)
    const targetX = (mapBounds.width / 2) - trainX * 1.8;
    const targetY = (mapBounds.height / 2) - trainY * 1.8;
    setPan({ x: targetX * 0.4, y: targetY * 0.4 });
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col select-none">
      {/* Top Map Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interactive Route Map · {activeRoute.nameEn}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified BR Network
          </span>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div 
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-[#070D18]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${mapBounds.width} ${mapBounds.height}`}
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Emerald glow for active train path */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Radial glow for train marker */}
            <radialGradient id="trainBeacon" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Bangladesh Landmass Silhouette */}
          <path
            d={bdOutlinePath}
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Major Rivers of Bangladesh */}
          <path
            d={riverPaths.jamuna}
            fill="none"
            stroke="#0284C7"
            strokeWidth="4.5"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          <path
            d={riverPaths.padma}
            fill="none"
            stroke="#0284C7"
            strokeWidth="5"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          <path
            d={riverPaths.meghna}
            fill="none"
            stroke="#0284C7"
            strokeWidth="6"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Geographic River Labels */}
          <text x={project(89.7, 24.6)[0]} y={project(89.7, 24.6)[1]} fill="#38BDF8" fontSize="8" opacity="0.6" fontStyle="italic">
            Jamuna River
          </text>
          <text x={project(89.4, 23.9)[0]} y={project(89.4, 23.9)[1]} fill="#38BDF8" fontSize="8" opacity="0.6" fontStyle="italic">
            Padma River
          </text>
          <text x={project(90.7, 23.6)[0]} y={project(90.7, 23.6)[1]} fill="#38BDF8" fontSize="8" opacity="0.6" fontStyle="italic">
            Meghna River
          </text>
          <text x={project(91.2, 21.6)[0]} y={project(91.2, 21.6)[1]} fill="#0284C7" fontSize="10" opacity="0.5" fontWeight="bold">
            Bay of Bengal
          </text>

          {/* Uncompleted Remaining Railway Route (Dashed slate) */}
          <path
            d={fullPathD}
            fill="none"
            stroke="#334155"
            strokeWidth="3.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          {/* Completed Traveled Segment (Glowing Emerald) */}
          <path
            d={completedPathD}
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#emeraldGlow)"
          />

          {/* Station Markers along Route */}
          {activeRoute.stations.map((station, index) => {
            const [sx, sy] = project(station.lng, station.lat);
            const isOrigin = index === 0;
            const isDest = index === activeRoute.stations.length - 1;
            const isCurrent = currentStation.id === station.id;
            const isSelected = selectedStation?.id === station.id;
            const hasPassed = (journeyProgress * activeRoute.totalDistanceKm) >= station.kmFromOrigin - 0.5;

            return (
              <g 
                key={station.id} 
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  simulationManager.selectStation(station);
                  onInspectStation?.(station);
                }}
              >
                {/* Selection halo */}
                {isSelected && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r="12"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    className="animate-spin"
                  />
                )}

                {/* Station Node Marker */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={isOrigin || isDest ? 6 : 4.5}
                  fill={isCurrent ? '#F59E0B' : hasPassed ? '#10B981' : '#1E293B'}
                  stroke={isSelected ? '#F59E0B' : '#FFFFFF'}
                  strokeWidth="1.5"
                />

                {/* Station Label */}
                <text
                  x={sx + 8}
                  y={sy + 3}
                  fill={isSelected ? '#FDE68A' : isCurrent ? '#F59E0B' : hasPassed ? '#E2E8F0' : '#94A3B8'}
                  fontSize={isOrigin || isDest ? "9" : "7.5"}
                  fontWeight={isOrigin || isDest || isSelected ? "bold" : "normal"}
                  className="pointer-events-none select-none font-sans"
                >
                  {station.nameEn}
                </text>
              </g>
            );
          })}

          {/* Live Train Marker with Beacon Pulse */}
          <g transform={`translate(${trainX}, ${trainY})`}>
            {/* Beacon Pulse Ring */}
            <circle cx="0" cy="0" r="16" fill="url(#trainBeacon)" />
            <circle cx="0" cy="0" r="7" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="0" cy="0" r="3" fill="#FEF08A" />
          </g>
        </svg>

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 backdrop-blur shadow-lg z-10">
          <button
            onClick={zoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={centerOnTrain}
            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
            title="Track Train"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Fit Route"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Train Position Status Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 backdrop-blur shadow-lg flex items-center gap-2.5 z-10 max-w-[280px]">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <div className="text-xs truncate">
            <div className="font-semibold text-slate-200 truncate">
              {isAtStation ? `Halted at ${currentStation.nameEn}` : `En route to ${currentStation.nameEn}`}
            </div>
            <div className="text-slate-400 text-[11px]">
              GPS: {currentCoords[1].toFixed(4)}°N, {currentCoords[0].toFixed(4)}°E
            </div>
          </div>
        </div>
      </div>

      {/* Selected Station Inspection Drawer */}
      {selectedStation && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-950/70 border border-emerald-800/60 rounded-lg text-emerald-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">{selectedStation.nameEn}</span>
                <span className="text-emerald-400 font-medium">{selectedStation.nameBn}</span>
                <span className="text-slate-500 font-mono text-[10px]">[{selectedStation.code}]</span>
              </div>
              <div className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">
                {selectedStation.scenicFeatures}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">Distance from Origin</div>
              <div className="font-mono font-semibold text-slate-200">{selectedStation.kmFromOrigin} km</div>
            </div>
            {onInspectStation && (
              <button
                onClick={() => onInspectStation(selectedStation)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              >
                Inspect Landmark
              </button>
            )}
            <button
              onClick={() => simulationManager.jumpToStation(selectedStation)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
            >
              Travel to Station
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
