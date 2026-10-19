import { ROUTES, DEFAULT_TRAIN_CARS } from '../data/routes';
import { RailwayRoute, Station, RouteSegment, WeatherPreset, TimePeriod, TrainCar } from '../data/types';
import { soundEngine } from '../audio/soundEngine';

export interface SimulationState {
  // Playback
  isPlaying: boolean;
  speedMultiplier: 1 | 2 | 4 | 8;
  journeyProgress: number; // 0 to 1
  distanceCoveredKm: number;
  currentSpeedKmh: number;

  // Route & Station
  activeRoute: RailwayRoute;
  currentStation: Station;
  nextStation: Station | null;
  currentSegment: RouteSegment;
  isAtStation: boolean;
  stationDwellRemainingSec: number;
  selectedStation: Station | null;

  // Time Engine
  simulatedMinutes: number; // 0 - 1439 (minutes in day, 360 = 06:00 AM)
  timePeriod: TimePeriod;
  timeString: string; // "06:45 AM"

  // Weather Engine
  currentWeather: WeatherPreset;
  targetWeather: WeatherPreset;
  weatherTransitionProgress: number; // 0 to 1

  // Train Configuration & Controls
  trainCars: TrainCar[];
  headlightOn: boolean;
  soundEnabled: boolean;
  masterVolume: number;
  cameraMode: 'trackside' | 'cab' | 'map' | 'split';

  // Map Coordinates
  currentCoords: [number, number]; // [lng, lat]
}

// Helpers for time formatting
export function formatSimulatedTime(minutes: number): { timeString: string; period: TimePeriod } {
  const normMin = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normMin / 60);
  const mins = normMin % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const timeString = `${hours12.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;

  let period: TimePeriod = 'night';
  const totalMin = hours24 * 60 + mins;

  if (totalMin >= 300 && totalMin < 390) { // 05:00 - 06:30
    period = 'dawn';
  } else if (totalMin >= 390 && totalMin < 690) { // 06:30 - 11:30
    period = 'morning';
  } else if (totalMin >= 690 && totalMin < 840) { // 11:30 - 14:00
    period = 'noon';
  } else if (totalMin >= 840 && totalMin < 1050) { // 14:00 - 17:30
    period = 'afternoon';
  } else if (totalMin >= 1050 && totalMin < 1140) { // 17:30 - 19:00
    period = 'sunset';
  } else if (totalMin >= 1140 && totalMin < 1230) { // 19:00 - 20:30
    period = 'dusk';
  } else {
    period = 'night';
  }

  return { timeString, period };
}

// Coordinate interpolation along GeoJSON/polyline coordinates
export function interpolateRouteCoords(coords: [number, number][], progress: number): [number, number] {
  if (!coords || coords.length === 0) return [90.4267, 23.7314];
  if (coords.length === 1) return coords[0];
  if (progress <= 0) return coords[0];
  if (progress >= 1) return coords[coords.length - 1];

  const totalSegments = coords.length - 1;
  const scaled = progress * totalSegments;
  const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const segProgress = scaled - segIndex;

  const [p1Lng, p1Lat] = coords[segIndex];
  const [p2Lng, p2Lat] = coords[segIndex + 1];

  const lng = p1Lng + (p2Lng - p1Lng) * segProgress;
  const lat = p1Lat + (p2Lat - p1Lat) * segProgress;

  return [lng, lat];
}

export type Listener = () => void;

class SimulationManager {
  private state: SimulationState;
  private listeners: Set<Listener> = new Set();
  private lastUpdateTimestamp: number = performance.now();
  private animFrameId: number | null = null;
  private visitedStationIds: Set<string> = new Set();
  private lastBrakeSoundStationId: string | null = null;
  private lastApproachHornStationId: string | null = null;

  constructor() {
    const initialRoute = ROUTES[0];
    const initialMinutes = 390; // 06:30 AM morning departure
    const { timeString, period } = formatSimulatedTime(initialMinutes);
    const initialCoords = initialRoute.coordinates[0];

    this.state = {
      isPlaying: true,
      speedMultiplier: 1,
      journeyProgress: 0.0,
      distanceCoveredKm: 0,
      currentSpeedKmh: 0,

      activeRoute: initialRoute,
      currentStation: initialRoute.stations[0],
      nextStation: initialRoute.stations[1] || null,
      currentSegment: initialRoute.segments[0],
      isAtStation: true,
      stationDwellRemainingSec: 4.0, // Start docked at Kamalapur platform, ready for departure!
      selectedStation: initialRoute.stations[0],

      simulatedMinutes: initialMinutes,
      timePeriod: period,
      timeString,

      currentWeather: 'sunny',
      targetWeather: 'sunny',
      weatherTransitionProgress: 1.0,

      trainCars: [...DEFAULT_TRAIN_CARS],
      headlightOn: false,
      soundEnabled: true,
      masterVolume: 0.5,
      cameraMode: 'split',

      currentCoords: initialCoords,
    };

    this.visitedStationIds.add(initialRoute.stations[0].id);
    this.startLoop();
  }

  public getState(): SimulationState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private startLoop() {
    if (typeof requestAnimationFrame === 'undefined') return;

    const loop = (timestamp: number) => {
      const deltaMs = Math.min(100, Math.max(0, timestamp - this.lastUpdateTimestamp));
      this.lastUpdateTimestamp = timestamp;

      this.tick(deltaMs);

      if (typeof requestAnimationFrame !== 'undefined') {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public tick(deltaMs: number) {
    if (deltaMs <= 0) return;

    let changed = false;
    const { isPlaying, speedMultiplier, activeRoute } = this.state;

    // Weather transition handling
    if (this.state.weatherTransitionProgress < 1.0) {
      this.state.weatherTransitionProgress = Math.min(
        1.0,
        this.state.weatherTransitionProgress + (deltaMs / 2000) * speedMultiplier
      );
      if (this.state.weatherTransitionProgress >= 1.0) {
        this.state.currentWeather = this.state.targetWeather;
      }
      changed = true;
    }

    if (isPlaying) {
      // 1. Station dwell state: train is halted alongside station platform
      if (this.state.isAtStation) {
        this.state.currentSpeedKmh = 0;
        const prevSec = this.state.stationDwellRemainingSec;
        this.state.stationDwellRemainingSec = Math.max(
          0,
          this.state.stationDwellRemainingSec - (deltaMs / 1000) * speedMultiplier
        );

        // Departure warning bell at 1.5s remaining
        if (prevSec > 1.5 && this.state.stationDwellRemainingSec <= 1.5) {
          soundEngine.playStationBell();
        }

        // Dwell elapsed: train departs and begins accelerating!
        if (this.state.stationDwellRemainingSec <= 0) {
          this.state.isAtStation = false;
          this.state.stationDwellRemainingSec = 0;
          this.state.currentSpeedKmh = 12; // Initial departure movement crawl
          soundEngine.playHorn('short'); // Authentic short departure toot
        }
        changed = true;
      } else {
        // 2. Normal travel & Station Approach / Departure dynamics
        const currentDist = this.state.distanceCoveredKm;

        // Current segment calculation
        const seg = activeRoute.segments.find(
          (s) => currentDist >= s.startKm && currentDist <= s.endKm
        ) || activeRoute.segments[activeRoute.segments.length - 1];
        this.state.currentSegment = seg;

        // Identify currently passed station and the next upcoming station that hasn't been visited yet
        let passedStation = activeRoute.stations[0];
        let nextSt: Station | null = null;

        for (const st of activeRoute.stations) {
          if (currentDist >= st.kmFromOrigin - 0.05) {
            passedStation = st;
          }
          if (!this.visitedStationIds.has(st.id) && st.kmFromOrigin >= currentDist - 0.05) {
            if (!nextSt) {
              nextSt = st;
            }
          }
        }

        this.state.currentStation = passedStation;
        this.state.nextStation = nextSt;

        const distToNext = nextSt ? Math.max(0, nextSt.kmFromOrigin - currentDist) : 999;

        // Realistic deceleration when approaching upcoming station platform
        let targetSpeed = seg.defaultSpeedLimitKmH;

        if (nextSt && distToNext <= 2.2) {
          // Approaching station platform: smoothly lower target speed as distance decreases
          // at 2.2 km: ~75% of max speed
          // at 1.5 km: ~50% of max speed
          // at 0.8 km: ~32 km/h
          // at 0.3 km: ~16 km/h
          // at 0.1 km: ~10 km/h
          const ratio = Math.max(0.08, distToNext / 2.2);
          targetSpeed = Math.max(10, seg.defaultSpeedLimitKmH * Math.pow(ratio, 0.72));

          // Warning sound cues as train nears the station platform
          if (distToNext <= 1.0 && this.lastApproachHornStationId !== nextSt.id) {
            this.lastApproachHornStationId = nextSt.id;
            soundEngine.playHorn('short');
          }
          if (distToNext <= 0.5 && this.lastBrakeSoundStationId !== nextSt.id) {
            this.lastBrakeSoundStationId = nextSt.id;
            soundEngine.playBrakeSqueal();
          }
        }

        // Smooth physical acceleration or braking towards targetSpeed
        if (this.state.currentSpeedKmh < targetSpeed) {
          // Speed rising smoothly as train accelerates away from station or up to cruise limit
          const accelRate = 50; // ms per km/h
          this.state.currentSpeedKmh = Math.min(
            targetSpeed,
            this.state.currentSpeedKmh + (deltaMs / accelRate)
          );
        } else if (this.state.currentSpeedKmh > targetSpeed) {
          // Train slowing down smoothly for station approach or speed restrictions
          const brakeRate = 35; // ms per km/h
          this.state.currentSpeedKmh = Math.max(
            targetSpeed,
            this.state.currentSpeedKmh - (deltaMs / brakeRate)
          );
        }

        // Check if arrived at station platform (within 0.04 km = 40m)
        if (nextSt && distToNext <= 0.04) {
          // Dock at station platform!
          this.state.isAtStation = true;
          this.state.stationDwellRemainingSec = 7.0; // Dwell for 7 seconds at station
          this.state.currentStation = nextSt;
          this.state.nextStation = activeRoute.stations[activeRoute.stations.indexOf(nextSt) + 1] || null;
          this.state.currentSpeedKmh = 0;
          this.state.distanceCoveredKm = nextSt.kmFromOrigin;
          this.state.journeyProgress = nextSt.kmFromOrigin / activeRoute.totalDistanceKm;
          this.visitedStationIds.add(nextSt.id);

          soundEngine.playStationBell();
          soundEngine.playAirBrakeRelease();

          // Check if this is the final terminus
          if (activeRoute.stations.indexOf(nextSt) === activeRoute.stations.length - 1) {
            this.state.isPlaying = false;
          }
        } else {
          // Progress along the route is directly driven by the train's actual speed
          const speedFraction = Math.max(0.06, this.state.currentSpeedKmh / seg.defaultSpeedLimitKmH);
          const baseProgressSpeedPerSec = 1.0 / 280; // ~4.6 mins for entire journey at 1x
          const progressDelta = (baseProgressSpeedPerSec * speedFraction * (deltaMs / 1000)) * speedMultiplier;

          let newProgress = this.state.journeyProgress + progressDelta;
          if (newProgress >= 1.0) {
            newProgress = 1.0;
            this.state.isPlaying = false;
            this.state.isAtStation = true;
            this.state.currentSpeedKmh = 0;
            this.state.stationDwellRemainingSec = 999;
          }

          this.state.journeyProgress = newProgress;
          const newDist = newProgress * activeRoute.totalDistanceKm;
          this.state.distanceCoveredKm = Math.round(newDist * 10) / 10;
        }

        // Update GPS map coordinates
        this.state.currentCoords = interpolateRouteCoords(activeRoute.coordinates, this.state.journeyProgress);

        // Advance simulated time: 1 real second = 1.5 simulated minutes at 1x
        const minutesDelta = (1.5 * (deltaMs / 1000)) * speedMultiplier;
        this.state.simulatedMinutes = (this.state.simulatedMinutes + minutesDelta) % 1440;
        const { timeString, period } = formatSimulatedTime(this.state.simulatedMinutes);
        this.state.timeString = timeString;
        this.state.timePeriod = period;

        // Auto toggle headlight at night/dusk/thunderstorm
        if (period === 'night' || period === 'dusk' || period === 'dawn' || this.state.currentWeather === 'thunderstorm') {
          this.state.headlightOn = true;
        } else {
          this.state.headlightOn = false;
        }

        // Audio updates
        if (this.state.soundEnabled) {
          soundEngine.updateTrainSimulation(
            true,
            speedMultiplier,
            this.state.currentSpeedKmh,
            this.state.isAtStation,
            distToNext,
            nextSt,
            !!seg.hasLevelCrossing
          );
          soundEngine.updateWeatherSimulation(this.state.currentWeather);
          soundEngine.updateTimeSimulation(period, this.state.isAtStation);
        }

        changed = true;
      }
    } else {
      // Stopped / Paused
      if (this.state.currentSpeedKmh > 0) {
        this.state.currentSpeedKmh = Math.max(0, this.state.currentSpeedKmh - (deltaMs / 60));
        changed = true;
      }
      if (this.state.soundEnabled) {
        soundEngine.updateTrainSimulation(
          false,
          speedMultiplier,
          0,
          this.state.isAtStation,
          999,
          null,
          false
        );
      }
    }

    if (changed) {
      this.notify();
    }
  }

  // User Actions
  public play() {
    this.state.isPlaying = true;
    soundEngine.ensureContext();
    this.notify();
  }

  public pause() {
    this.state.isPlaying = false;
    soundEngine.updateTrainSimulation(false, this.state.speedMultiplier, 0, this.state.isAtStation, 999, null, false);
    this.notify();
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setSpeed(multiplier: 1 | 2 | 4 | 8) {
    this.state.speedMultiplier = multiplier;
    this.notify();
  }

  public departStationNow() {
    if (this.state.isAtStation) {
      this.state.stationDwellRemainingSec = 0;
      this.state.isAtStation = false;
      this.state.currentSpeedKmh = 14; // Start moving immediately
      soundEngine.playHorn('short');
      this.notify();
    }
  }

  public restart() {
    this.visitedStationIds.clear();
    this.lastBrakeSoundStationId = null;
    this.lastApproachHornStationId = null;

    this.state.activeRoute = ROUTES[0];
    this.state.currentSegment = ROUTES[0].segments[0];
    this.state.journeyProgress = 0;
    this.state.distanceCoveredKm = 0;
    this.state.currentSpeedKmh = 0;
    this.state.isPlaying = true;
    this.state.isAtStation = true;
    this.state.stationDwellRemainingSec = 4.0; // Ready at origin platform
    this.state.currentStation = ROUTES[0].stations[0];
    this.state.nextStation = ROUTES[0].stations[1] || null;
    this.state.currentCoords = ROUTES[0].coordinates[0];
    this.visitedStationIds.add(ROUTES[0].stations[0].id);

    soundEngine.ensureContext();
    this.notify();
  }

  public setProgress(progress: number) {
    const p = Math.max(0, Math.min(1, progress));
    this.state.journeyProgress = p;
    const currentDist = p * this.state.activeRoute.totalDistanceKm;
    this.state.distanceCoveredKm = Math.round(currentDist * 10) / 10;
    this.state.currentCoords = interpolateRouteCoords(this.state.activeRoute.coordinates, p);
    
    // Recalculate segment
    const seg = this.state.activeRoute.segments.find(
      (s) => currentDist >= s.startKm && currentDist <= s.endKm
    ) || this.state.activeRoute.segments[this.state.activeRoute.segments.length - 1];
    this.state.currentSegment = seg;

    // Synchronize visited stations
    this.visitedStationIds.clear();
    for (const st of this.state.activeRoute.stations) {
      if (st.kmFromOrigin < currentDist - 0.15) {
        this.visitedStationIds.add(st.id);
      }
    }

    // Check if directly at or very near a station platform
    const nearStation = this.state.activeRoute.stations.find(
      (st) => Math.abs(st.kmFromOrigin - currentDist) <= 0.12
    );

    if (nearStation) {
      this.state.isAtStation = true;
      this.state.stationDwellRemainingSec = 6.0;
      this.state.currentSpeedKmh = 0;
      this.state.currentStation = nearStation;
      this.state.nextStation = this.state.activeRoute.stations[this.state.activeRoute.stations.indexOf(nearStation) + 1] || null;
      this.visitedStationIds.add(nearStation.id);
    } else {
      this.state.isAtStation = false;
      this.state.stationDwellRemainingSec = 0;
      this.state.currentSpeedKmh = 45;

      let passedStation = this.state.activeRoute.stations[0];
      let nextSt: Station | null = null;
      for (const st of this.state.activeRoute.stations) {
        if (currentDist >= st.kmFromOrigin - 0.1) {
          passedStation = st;
        }
        if (!this.visitedStationIds.has(st.id) && st.kmFromOrigin >= currentDist - 0.1) {
          if (!nextSt) nextSt = st;
        }
      }
      this.state.currentStation = passedStation;
      this.state.nextStation = nextSt;
    }

    this.notify();
  }

  public setSimulatedTime(minutes: number) {
    this.state.simulatedMinutes = minutes % 1440;
    const { timeString, period } = formatSimulatedTime(minutes);
    this.state.timeString = timeString;
    this.state.timePeriod = period;
    this.notify();
  }

  public setWeather(weather: WeatherPreset) {
    if (this.state.currentWeather === weather) return;
    this.state.targetWeather = weather;
    this.state.weatherTransitionProgress = 0;
    soundEngine.ensureContext();
    soundEngine.updateWeatherSimulation(weather);
    if (weather === 'thunderstorm') {
      soundEngine.playThunder();
    }
    this.notify();
  }

  public setRoute(routeId: string) {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) return;

    this.visitedStationIds.clear();
    this.lastBrakeSoundStationId = null;
    this.lastApproachHornStationId = null;

    this.state.activeRoute = route;
    this.state.journeyProgress = 0;
    this.state.distanceCoveredKm = 0;
    this.state.currentSpeedKmh = 0;
    this.state.currentStation = route.stations[0];
    this.state.nextStation = route.stations[1] || null;
    this.state.currentSegment = route.segments[0];
    this.state.selectedStation = route.stations[0];
    this.state.currentCoords = route.coordinates[0];
    this.state.isPlaying = true;
    this.state.isAtStation = true;
    this.state.stationDwellRemainingSec = 4.0;
    this.visitedStationIds.add(route.stations[0].id);
    this.notify();
  }

  public selectStation(station: Station | null) {
    this.state.selectedStation = station;
    this.notify();
  }

  public jumpToStation(station: Station, approach: boolean = false) {
    const routeForStation = ROUTES.find((r) => r.stations.some((s) => s.id === station.id));
    if (routeForStation && routeForStation.id !== this.state.activeRoute.id) {
      this.setRoute(routeForStation.id);
    }

    if (approach) {
      // Approach mode: place train 1.2 km before platform to watch deceleration and docking
      const approachDist = Math.max(0, station.kmFromOrigin - 1.2);
      this.setProgress(approachDist / this.state.activeRoute.totalDistanceKm);

      // Ensure target station and forward stations are unvisited
      for (const st of this.state.activeRoute.stations) {
        if (st.kmFromOrigin >= approachDist) {
          this.visitedStationIds.delete(st.id);
        }
      }

      this.state.nextStation = station;
      this.state.currentSpeedKmh = 60;
      this.state.isAtStation = false;
      this.state.isPlaying = true;
    } else {
      // Direct docking mode: place train directly alongside the platform
      const progress = station.kmFromOrigin / this.state.activeRoute.totalDistanceKm;
      this.setProgress(progress);
      this.state.currentStation = station;
      this.state.nextStation = this.state.activeRoute.stations[this.state.activeRoute.stations.indexOf(station) + 1] || null;
      this.state.isAtStation = true;
      this.state.stationDwellRemainingSec = 7.0;
      this.state.currentSpeedKmh = 0;
      this.visitedStationIds.add(station.id);
      soundEngine.playStationBell();
    }
    this.state.selectedStation = station;
    this.notify();
  }

  public triggerHorn(type: 'short' | 'long' = 'long') {
    soundEngine.ensureContext();
    soundEngine.playHorn(type);
  }

  public triggerBell() {
    soundEngine.ensureContext();
    soundEngine.playStationBell();
  }

  public toggleHeadlight() {
    this.state.headlightOn = !this.state.headlightOn;
    this.notify();
  }

  public toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    soundEngine.setMuted(!this.state.soundEnabled);
    this.notify();
  }

  public setMasterVolume(vol: number) {
    this.state.masterVolume = vol;
    soundEngine.setMasterVolume(vol);
    this.notify();
  }

  public setCameraMode(mode: 'trackside' | 'cab' | 'map' | 'split') {
    this.state.cameraMode = mode;
    this.notify();
  }

  public setTrainCars(cars: TrainCar[]) {
    this.state.trainCars = cars;
    this.notify();
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundEngine.cleanup();
  }
}

export const simulationManager = new SimulationManager();
