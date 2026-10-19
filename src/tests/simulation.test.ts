import { describe, it, expect, beforeEach } from 'vitest';
import { 
  formatSimulatedTime, 
  interpolateRouteCoords, 
  simulationManager 
} from '../stores/simulationStore';
import { ROUTES } from '../data/routes';

describe('Simulation Clock & Time Engine', () => {
  it('formats morning time correctly', () => {
    const { timeString, period } = formatSimulatedTime(540); // 09:00 AM
    expect(timeString).toBe('09:00 AM');
    expect(period).toBe('morning');
  });

  it('formats midday noon correctly', () => {
    const { timeString, period } = formatSimulatedTime(720); // 12:00 PM
    expect(timeString).toBe('12:00 PM');
    expect(period).toBe('noon');
  });

  it('formats sunset correctly', () => {
    const { timeString, period } = formatSimulatedTime(1080); // 18:00 PM
    expect(timeString).toBe('06:00 PM');
    expect(period).toBe('sunset');
  });

  it('formats night correctly and wraps across 24 hours', () => {
    const { timeString, period } = formatSimulatedTime(1440 + 60); // 01:00 AM
    expect(timeString).toBe('01:00 AM');
    expect(period).toBe('night');
  });

  it('formats dawn correctly', () => {
    const { timeString, period } = formatSimulatedTime(330); // 05:30 AM
    expect(timeString).toBe('05:30 AM');
    expect(period).toBe('dawn');
  });
});

describe('Route Interpolation & Coordinates', () => {
  const sampleCoords: [number, number][] = [
    [90.0, 23.0],
    [90.5, 23.5],
    [91.0, 24.0],
  ];

  it('returns start coordinate at progress 0', () => {
    const pt = interpolateRouteCoords(sampleCoords, 0);
    expect(pt[0]).toBe(90.0);
    expect(pt[1]).toBe(23.0);
  });

  it('returns end coordinate at progress 1', () => {
    const pt = interpolateRouteCoords(sampleCoords, 1);
    expect(pt[0]).toBe(91.0);
    expect(pt[1]).toBe(24.0);
  });

  it('interpolates midpoint correctly at progress 0.5', () => {
    const pt = interpolateRouteCoords(sampleCoords, 0.5);
    expect(pt[0]).toBeCloseTo(90.5, 5);
    expect(pt[1]).toBeCloseTo(23.5, 5);
  });

  it('handles empty coordinate arrays gracefully without crashing', () => {
    const pt = interpolateRouteCoords([], 0.5);
    expect(pt).toBeDefined();
    expect(pt.length).toBe(2);
  });

  it('clamps negative and excessive progress gracefully', () => {
    const ptLow = interpolateRouteCoords(sampleCoords, -0.5);
    expect(ptLow[0]).toBe(90.0);
    const ptHigh = interpolateRouteCoords(sampleCoords, 1.5);
    expect(ptHigh[0]).toBe(91.0);
  });
});

describe('Simulation Manager State & Actions', () => {
  beforeEach(() => {
    simulationManager.restart();
  });

  it('initializes with active route and stations', () => {
    const state = simulationManager.getState();
    expect(state.activeRoute.id).toBe('dhaka_kushtia');
    expect(state.currentStation.id).toBe('kamalapur');
    expect(state.nextStation?.id).toBe('biman_bandar');
    expect(state.isPlaying).toBe(true);
  });

  it('pauses and plays', () => {
    simulationManager.pause();
    expect(simulationManager.getState().isPlaying).toBe(false);

    simulationManager.play();
    expect(simulationManager.getState().isPlaying).toBe(true);

    simulationManager.togglePlay();
    expect(simulationManager.getState().isPlaying).toBe(false);
  });

  it('sets speed multiplier correctly', () => {
    simulationManager.setSpeed(4);
    expect(simulationManager.getState().speedMultiplier).toBe(4);
    simulationManager.setSpeed(8);
    expect(simulationManager.getState().speedMultiplier).toBe(8);
  });

  it('scrubs progress and updates distance and stations', () => {
    simulationManager.setProgress(0.5);
    const state = simulationManager.getState();
    expect(state.journeyProgress).toBe(0.5);
    expect(state.distanceCoveredKm).toBeCloseTo(state.activeRoute.totalDistanceKm * 0.5, 1);
    expect(state.currentStation).toBeDefined();
  });

  it('switches weather presets and initiates transition', () => {
    simulationManager.setWeather('monsoon_rain');
    const state = simulationManager.getState();
    expect(state.targetWeather).toBe('monsoon_rain');
  });

  it('jumps directly to a chosen station', () => {
    const tangail = ROUTES[0].stations.find((s) => s.id === 'tangail')!;
    simulationManager.jumpToStation(tangail);
    const state = simulationManager.getState();
    expect(state.currentStation.id).toBe('tangail');
    expect(state.selectedStation?.id).toBe('tangail');
  });

  it('handles route switching', () => {
    simulationManager.setRoute('dhaka_chattogram');
    const state = simulationManager.getState();
    expect(state.activeRoute.id).toBe('dhaka_chattogram');
    expect(state.currentStation.id).toBe('kamalapur');
  });

  it('docks at platform with 0 speed and station dwell', () => {
    const joydebpur = ROUTES[0].stations.find((s) => s.id === 'joydebpur')!;
    simulationManager.jumpToStation(joydebpur, false);
    const state = simulationManager.getState();
    expect(state.isAtStation).toBe(true);
    expect(state.currentSpeedKmh).toBe(0);
    expect(state.stationDwellRemainingSec).toBeGreaterThan(0);
    expect(state.currentStation.id).toBe('joydebpur');
  });

  it('departs station platform and begins acceleration', () => {
    const tangail = ROUTES[0].stations.find((s) => s.id === 'tangail')!;
    simulationManager.jumpToStation(tangail, false);
    expect(simulationManager.getState().isAtStation).toBe(true);
    expect(simulationManager.getState().currentSpeedKmh).toBe(0);

    // Call departStationNow
    simulationManager.departStationNow();
    const stateAfterDepart = simulationManager.getState();
    expect(stateAfterDepart.isAtStation).toBe(false);
    expect(stateAfterDepart.currentSpeedKmh).toBeGreaterThan(0);

    // Run tick to verify speed rises smoothly
    const initialSpeed = stateAfterDepart.currentSpeedKmh;
    simulationManager.tick(500);
    expect(simulationManager.getState().currentSpeedKmh).toBeGreaterThan(initialSpeed);
  });

  it('slows down when approaching a station platform', () => {
    const tangail = ROUTES[0].stations.find((s) => s.id === 'tangail')!;
    // Jump to 1.2 km before Tangail (approach mode)
    simulationManager.jumpToStation(tangail, true);
    const approachState = simulationManager.getState();
    expect(approachState.isAtStation).toBe(false);
    expect(approachState.currentSpeedKmh).toBe(60);

    // Progress towards station: should decelerate
    for (let i = 0; i < 15; i++) {
      simulationManager.tick(100);
    }
    const midApproachState = simulationManager.getState();
    // Speed should have decreased as we near the platform
    expect(midApproachState.currentSpeedKmh).toBeLessThan(60);
  });
});

