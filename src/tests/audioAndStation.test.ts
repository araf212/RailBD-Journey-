import { describe, it, expect, beforeEach } from 'vitest';
import { soundEngine } from '../audio/soundEngine';
import { ROUTES } from '../data/routes';
import { AUDIO_MANIFEST } from '../audio/assetRegistry';

describe('Station Information & Extensibility Model', () => {
  it('contains comprehensive landmark and history data for all stations in primary route', () => {
    const route = ROUTES[0];
    expect(route.stations.length).toBeGreaterThanOrEqual(9);

    route.stations.forEach((station) => {
      expect(station.id).toBeDefined();
      expect(station.nameEn).toBeDefined();
      expect(station.nameBn).toBeDefined();
      expect(station.code).toBeDefined();
      expect(station.category).toBeDefined();
      expect(station.history).toBeDefined();
      expect(station.history.length).toBeGreaterThan(20);
      expect(station.trivia).toBeDefined();
      expect(station.landmark).toBeDefined();
      expect(station.landmark.name).toBeDefined();
      expect(station.landmark.badgeIcon).toBeDefined();
      expect(station.announcementTextBn).toBeDefined();
      expect(station.announcementTextEn).toBeDefined();
    });
  });

  it('correctly categorizes stations into terminals, junctions, and regional stops', () => {
    const kamalapur = ROUTES[0].stations.find((s) => s.id === 'kamalapur')!;
    expect(kamalapur.category).toBe('major_terminal');
    expect(kamalapur.crowdDensity).toBe('dense');

    const joydebpur = ROUTES[0].stations.find((s) => s.id === 'joydebpur')!;
    expect(joydebpur.category).toBe('intercity_junction');

    const tangail = ROUTES[0].stations.find((s) => s.id === 'tangail')!;
    expect(tangail.category).toBe('local_station');
  });

  it('ensures each station has representative landmark badges matching available graphics', () => {
    const allowedBadges = [
      'lotus_roof',
      'bridge_truss',
      'water_tower',
      'tea_leaf',
      'sweets',
      'baul_ektara',
      'port_ship',
      'palm_groves'
    ];

    ROUTES.forEach((route) => {
      route.stations.forEach((st) => {
        expect(allowedBadges).toContain(st.landmark.badgeIcon);
      });
    });
  });
});

describe('Audio Asset Registry & Manifest', () => {
  it('registers all required audio asset categories', () => {
    const categories = new Set(Object.values(AUDIO_MANIFEST).map((a) => a.category));
    expect(categories.has('train')).toBe(true);
    expect(categories.has('horn')).toBe(true);
    expect(categories.has('station')).toBe(true);
    expect(categories.has('crowd')).toBe(true);
    expect(categories.has('announcements')).toBe(true);
    expect(categories.has('weather')).toBe(true);
    expect(categories.has('environment')).toBe(true);
  });

  it('documents license and procedural synthesis sources for every asset', () => {
    Object.values(AUDIO_MANIFEST).forEach((asset) => {
      expect(asset.id).toBeDefined();
      expect(asset.license).toBeDefined();
      expect(asset.source).toBeDefined();
      expect(asset.soundType).toBeDefined();
    });
  });
});

describe('Multi-Bus Sound Engine & State Management', () => {
  beforeEach(() => {
    soundEngine.setMuted(false);
    soundEngine.setMasterVolume(0.6);
  });

  it('manages master volume within clamped bounds 0 to 1', () => {
    soundEngine.setMasterVolume(0.8);
    expect(soundEngine.getSettings().masterVolume).toBe(0.8);

    soundEngine.setMasterVolume(1.5);
    expect(soundEngine.getSettings().masterVolume).toBe(1.0);

    soundEngine.setMasterVolume(-0.2);
    expect(soundEngine.getSettings().masterVolume).toBe(0.0);
  });

  it('toggles mute correctly', () => {
    expect(soundEngine.getSettings().isMuted).toBe(false);
    soundEngine.toggleMute();
    expect(soundEngine.getSettings().isMuted).toBe(true);
    soundEngine.toggleMute();
    expect(soundEngine.getSettings().isMuted).toBe(false);
  });

  it('sets individual bus channel volumes independently', () => {
    soundEngine.setBusVolume('trainVolume', 0.9);
    soundEngine.setBusVolume('hornVolume', 0.45);
    soundEngine.setBusVolume('stationVolume', 0.75);
    soundEngine.setBusVolume('weatherVolume', 0.85);

    const s = soundEngine.getSettings();
    expect(s.trainVolume).toBe(0.9);
    expect(s.hornVolume).toBe(0.45);
    expect(s.stationVolume).toBe(0.75);
    expect(s.weatherVolume).toBe(0.85);
  });

  it('toggles behavioral options (auto horn, auto announcements, ambient)', () => {
    soundEngine.setAutoHorn(false);
    expect(soundEngine.getSettings().autoHornEnabled).toBe(false);
    soundEngine.setAutoHorn(true);
    expect(soundEngine.getSettings().autoHornEnabled).toBe(true);

    soundEngine.setAutoAnnouncements(false);
    expect(soundEngine.getSettings().autoAnnouncementsEnabled).toBe(false);

    soundEngine.setAmbientEnabled(false);
    expect(soundEngine.getSettings().ambientEnabled).toBe(false);
  });

  it('handles simulation audio updates gracefully without throwing in Node test environment', () => {
    expect(() => {
      soundEngine.updateTrainSimulation(true, 1, 65, false, 5.0, null, false);
      soundEngine.updateWeatherSimulation('monsoon_rain');
      soundEngine.updateTimeSimulation('morning', false);
      soundEngine.playHorn('short');
      soundEngine.playStationBell();
      soundEngine.playTeaStallSound();
      soundEngine.cleanup();
    }).not.toThrow();
  });
});
