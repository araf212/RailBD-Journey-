/**
 * Advanced Multi-Bus Procedural Web Audio Engine for RailBD Journey
 * Supports:
 * - Dynamic train movement (rolling, click-clack with micro-jitter, engine rumble, brake squeal, air brake hiss)
 * - Authentic dual-tone air horns (short tap & long blast) with automatic crossing/station triggers
 * - Layered railway station crowd soundscapes, tea stalls, and PA announcements with chimes
 * - Weather-synchronized rain, thunder, wind, and mist
 * - Time-of-day birds and night crickets
 * - Bus mixer architecture with full volume persistence
 */

import { AudioSettings, Station, StationCategory } from '../data/types';
import { AUDIO_MANIFEST } from './assetRegistry';

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.6,
  trainVolume: 0.75,
  hornVolume: 0.85,
  stationVolume: 0.7,
  announcementVolume: 0.8,
  weatherVolume: 0.65,
  environmentVolume: 0.5,
  isMuted: false,
  autoHornEnabled: true,
  autoAnnouncementsEnabled: true,
  ambientEnabled: true,
  reducedAudioEffects: false,
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

  // Buses
  private masterBus: GainNode | null = null;
  private trainBus: GainNode | null = null;
  private hornBus: GainNode | null = null;
  private stationBus: GainNode | null = null;
  private announcementBus: GainNode | null = null;
  private weatherBus: GainNode | null = null;
  private envBus: GainNode | null = null;

  // Train rolling & engine nodes
  private trainRollingGain: GainNode | null = null;
  private trainRollingFilter: BiquadFilterNode | null = null;
  private engineRumbleGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;

  // Click-clack loop state
  private clickClackTimer: number | null = null;
  private lastClickClackTime: number = 0;
  private isTrainRolling: boolean = false;

  // Station crowd murmur node
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;

  // Weather nodes
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;

  // Cooldown & event tracking
  private lastAutoHornStationId: string | null = null;
  private lastAnnouncedStationId: string | null = null;
  private lastSpeedKmh: number = 0;
  private isBraking: boolean = false;
  private brakeSquealPlayedForStop: boolean = false;
  private airBrakePlayedForStop: boolean = false;

  // Speech synthesis for PA
  private isSpeaking: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('railbd_audio_settings');
      if (saved) {
        this.settings = { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to default
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem('railbd_audio_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public ensureContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();

      // Master Bus
      this.masterBus = this.ctx.createGain();
      this.masterBus.gain.setValueAtTime(this.settings.isMuted ? 0 : this.settings.masterVolume, this.ctx.currentTime);
      this.masterBus.connect(this.ctx.destination);

      // Sub-Buses
      this.trainBus = this.createBus(this.settings.trainVolume);
      this.hornBus = this.createBus(this.settings.hornVolume);
      this.stationBus = this.createBus(this.settings.stationVolume);
      this.announcementBus = this.createBus(this.settings.announcementVolume);
      this.weatherBus = this.createBus(this.settings.weatherVolume);
      this.envBus = this.createBus(this.settings.environmentVolume);

      // Initialize persistent continuous layers
      this.initTrainContinuousSynth();
      this.initStationCrowdSynth();
      this.initWeatherContinuousSynth();

      return true;
    } catch {
      return false;
    }
  }

  private createBus(volume: number): GainNode {
    const bus = this.ctx!.createGain();
    bus.gain.setValueAtTime(volume, this.ctx!.currentTime);
    bus.connect(this.masterBus!);
    return bus;
  }

  // --- Bus Volume Setters ---
  public setMasterVolume(v: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterBus && this.ctx) {
      this.masterBus.gain.setTargetAtTime(
        this.settings.isMuted ? 0 : this.settings.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    this.saveSettings();
  }

  public setBusVolume(busName: keyof AudioSettings, v: number) {
    const val = Math.max(0, Math.min(1, v));
    (this.settings as unknown as Record<string, unknown>)[busName] = val;

    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (busName === 'trainVolume' && this.trainBus) {
      this.trainBus.gain.setTargetAtTime(val, t, 0.05);
    } else if (busName === 'hornVolume' && this.hornBus) {
      this.hornBus.gain.setTargetAtTime(val, t, 0.05);
    } else if (busName === 'stationVolume' && this.stationBus) {
      this.stationBus.gain.setTargetAtTime(val, t, 0.05);
    } else if (busName === 'announcementVolume' && this.announcementBus) {
      this.announcementBus.gain.setTargetAtTime(val, t, 0.05);
    } else if (busName === 'weatherVolume' && this.weatherBus) {
      this.weatherBus.gain.setTargetAtTime(val, t, 0.05);
    } else if (busName === 'environmentVolume' && this.envBus) {
      this.envBus.gain.setTargetAtTime(val, t, 0.05);
    }

    this.saveSettings();
  }

  public setMuted(muted: boolean) {
    this.settings.isMuted = muted;
    if (this.masterBus && this.ctx) {
      this.masterBus.gain.setTargetAtTime(
        muted ? 0 : this.settings.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    this.saveSettings();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.settings.isMuted);
    return this.settings.isMuted;
  }

  public setAutoHorn(enabled: boolean) {
    this.settings.autoHornEnabled = enabled;
    this.saveSettings();
  }

  public setAutoAnnouncements(enabled: boolean) {
    this.settings.autoAnnouncementsEnabled = enabled;
    this.saveSettings();
  }

  public setAmbientEnabled(enabled: boolean) {
    this.settings.ambientEnabled = enabled;
    this.saveSettings();
  }

  // --- 1. CONTINUOUS TRAIN SYNTHESIS ---
  private initTrainContinuousSynth() {
    if (!this.ctx || !this.trainBus) return;

    // Rolling noise buffer (Brownian/pink noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      outputBrown: lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.0;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.trainRollingFilter = this.ctx.createBiquadFilter();
    this.trainRollingFilter.type = 'lowpass';
    this.trainRollingFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.trainRollingGain = this.ctx.createGain();
    this.trainRollingGain.gain.setValueAtTime(0, this.ctx.currentTime);

    noiseSource.connect(this.trainRollingFilter);
    this.trainRollingFilter.connect(this.trainRollingGain);
    this.trainRollingGain.connect(this.trainBus);

    noiseSource.start();

    // Engine rumble (sub-harmonics of diesel cylinders)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineRumbleGain = this.ctx.createGain();
    this.engineRumbleGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1

    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

    this.engineOsc1.connect(engineFilter);
    this.engineOsc2.connect(engineFilter);
    engineFilter.connect(this.engineRumbleGain);
    this.engineRumbleGain.connect(this.trainBus);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  /**
   * Called during simulation ticks to adjust continuous train sounds
   */
  public updateTrainSimulation(
    isPlaying: boolean,
    speedMultiplier: number,
    currentSpeedKmh: number,
    isAtStation: boolean,
    distToNextStationKm: number,
    nextStation: Station | null,
    hasCrossingAhead: boolean
  ) {
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;

    const moving = isPlaying && !isAtStation && currentSpeedKmh > 2;

    // Detect braking when speed drops sharply
    const speedDelta = this.lastSpeedKmh - currentSpeedKmh;
    this.isBraking = moving && speedDelta > 0.4 && currentSpeedKmh < 45;

    // Trigger brake squeal once on deceleration towards platform
    if (this.isBraking && !this.brakeSquealPlayedForStop && currentSpeedKmh > 10 && currentSpeedKmh < 35) {
      this.playBrakeSqueal();
      this.brakeSquealPlayedForStop = true;
    }

    // Trigger air brake release upon complete stop
    if (isAtStation && currentSpeedKmh <= 1 && !this.airBrakePlayedForStop) {
      this.playAirBrakeRelease();
      this.airBrakePlayedForStop = true;
    }

    // Reset stop triggers when departing
    if (moving && currentSpeedKmh > 15) {
      this.brakeSquealPlayedForStop = false;
      this.airBrakePlayedForStop = false;
    }

    this.lastSpeedKmh = currentSpeedKmh;

    // 1. Rolling noise & Engine rumble updates
    if (moving && this.trainRollingGain && this.trainRollingFilter && this.engineRumbleGain) {
      const speedNorm = Math.min(1.0, currentSpeedKmh / 95);
      const targetRollVol = 0.05 + speedNorm * 0.35;
      const targetRollFreq = 220 + speedNorm * 580;

      this.trainRollingGain.gain.setTargetAtTime(targetRollVol, t, 0.15);
      this.trainRollingFilter.frequency.setTargetAtTime(targetRollFreq, t, 0.2);

      const targetEngineVol = 0.04 + speedNorm * 0.22;
      this.engineRumbleGain.gain.setTargetAtTime(targetEngineVol, t, 0.15);

      if (this.engineOsc1) {
        this.engineOsc1.frequency.setTargetAtTime(50 + speedNorm * 35, t, 0.3);
      }

      // Start click-clack loop
      if (!this.isTrainRolling) {
        this.isTrainRolling = true;
        this.startClickClackLoop(speedMultiplier, currentSpeedKmh);
      } else {
        this.adjustClickClackPace(speedMultiplier, currentSpeedKmh);
      }
    } else {
      // Stopped / paused
      if (this.trainRollingGain) {
        this.trainRollingGain.gain.setTargetAtTime(0, t, 0.3);
      }
      if (this.engineRumbleGain) {
        // Soft idle throb when stopped at station
        const idleVol = isPlaying && isAtStation ? 0.04 : 0;
        this.engineRumbleGain.gain.setTargetAtTime(idleVol, t, 0.3);
      }
      this.stopClickClack();
    }

    // 2. Automatic Horn Triggers (approaching station or level crossing)
    if (
      this.settings.autoHornEnabled &&
      moving &&
      nextStation &&
      nextStation.id !== this.lastAutoHornStationId &&
      distToNextStationKm <= 1.2 &&
      distToNextStationKm >= 0.8
    ) {
      this.lastAutoHornStationId = nextStation.id;
      // Play a distant warning air horn blast
      this.playHorn('long', 0.65);
    }

    // 3. Station Ambience fade-in as train approaches
    this.updateStationAmbience(distToNextStationKm, isAtStation, nextStation);
  }

  // --- Click-clack loop with natural micro-jitter ---
  private startClickClackLoop(multiplier: number, speedKmh: number) {
    if (this.clickClackTimer) clearInterval(this.clickClackTimer);

    const baseInterval = Math.max(220, Math.min(1300, 1600 - (speedKmh * 11 * Math.min(multiplier, 2))));
    this.playNaturalClickClack(speedKmh);

    this.clickClackTimer = window.setInterval(() => {
      this.playNaturalClickClack(this.lastSpeedKmh);
    }, baseInterval);
  }

  private adjustClickClackPace(multiplier: number, speedKmh: number) {
    if (this.clickClackTimer) {
      clearInterval(this.clickClackTimer);
      const baseInterval = Math.max(220, Math.min(1300, 1600 - (speedKmh * 11 * Math.min(multiplier, 2))));
      this.clickClackTimer = window.setInterval(() => {
        this.playNaturalClickClack(this.lastSpeedKmh);
      }, baseInterval);
    }
  }

  private stopClickClack() {
    this.isTrainRolling = false;
    if (this.clickClackTimer) {
      clearInterval(this.clickClackTimer);
      this.clickClackTimer = null;
    }
  }

  private playNaturalClickClack(speedKmh: number) {
    if (!this.ctx || !this.trainBus || this.settings.isMuted) return;
    const t = this.ctx.currentTime;
    const speedRatio = Math.min(1.0, Math.max(0.2, speedKmh / 90));

    // Bogie 1: front wheel pair and rear wheel pair
    // Bogie 2: trailing car wheel pair
    // Add micro-timing variation (+/- 6ms) for natural human acoustic feel
    const jitter = (Math.random() - 0.5) * 0.012;

    this.playRailJointImpulse(t, 250 + (Math.random() * 40), 0.045, 0.18 * speedRatio);
    this.playRailJointImpulse(t + 0.08 + jitter, 210 + (Math.random() * 30), 0.04, 0.14 * speedRatio);
    this.playRailJointImpulse(t + 0.24 + jitter, 235 + (Math.random() * 35), 0.038, 0.15 * speedRatio);
    this.playRailJointImpulse(t + 0.32 + jitter * 1.5, 195 + (Math.random() * 25), 0.032, 0.11 * speedRatio);
  }

  private playRailJointImpulse(time: number, freq: number, duration: number, gainLevel: number) {
    if (!this.ctx || !this.trainBus) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, time);

    gain.gain.setValueAtTime(gainLevel * 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trainBus);

    osc.start(time);
    osc.stop(time + duration);
  }

  // --- Mechanical Brake Squeal ---
  public playBrakeSqueal() {
    if (!this.ctx || !this.trainBus || this.settings.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 1.4;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency modulates around 3100-3300 Hz
    osc.frequency.setValueAtTime(3200, t);
    osc.frequency.linearRampToValueAtTime(2900, t + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3100, t);
    filter.Q.setValueAtTime(14, t); // high resonance for realistic squeal

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trainBus);

    osc.start(t);
    osc.stop(t + dur);
  }

  // --- Pneumatic Air Brake Release Hiss ("Psssshh-t!") ---
  public playAirBrakeRelease() {
    if (!this.ctx || !this.trainBus || this.settings.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 0.9;

    const bufferSize = this.ctx.sampleRate * 1;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05); // sharp whoosh
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trainBus);

    whiteNoise.start(t);
    whiteNoise.stop(t + dur);
  }

  // --- 2. LOCOMOTIVE HORN SYSTEM ---
  public playHorn(type: 'short' | 'long' = 'long', distanceAttenuation: number = 1.0) {
    if (!this.ensureContext() || !this.ctx || !this.hornBus || this.settings.isMuted) return;

    const t = this.ctx.currentTime;
    const dur = type === 'short' ? 0.35 : 1.15;
    const atten = Math.max(0.1, Math.min(1.0, distanceAttenuation));

    // Bangladesh Railway 3-chime horn: Eb4 (311Hz), G4 (392Hz), Bb4 (466Hz)
    const frequencies = [311.13, 392.0, 466.16, 315.5];

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.hornBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      // Natural air pressure rise and subtle flutter
      osc.frequency.linearRampToValueAtTime(freq * 1.015, t + 0.06);
      osc.frequency.linearRampToValueAtTime(freq * 0.992, t + dur * 0.75);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      const targetGain = 0.14 * atten;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(targetGain, t + 0.05);
      gain.gain.setValueAtTime(targetGain * 0.9, t + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.hornBus);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // --- 3. STATION AMBIENCE & CROWD SYNTHESIS ---
  private initStationCrowdSynth() {
    if (!this.ctx || !this.stationBus) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.03 * w) / 1.03;
      output[i] = last * 2.5;
    }

    const crowdSource = this.ctx.createBufferSource();
    crowdSource.buffer = noiseBuffer;
    crowdSource.loop = true;

    // Vocal formant filters (simulating collective crowd vocal spectrum)
    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.crowdFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(0, this.ctx.currentTime);

    crowdSource.connect(this.crowdFilter);
    this.crowdFilter.connect(this.crowdGain);
    this.crowdGain.connect(this.stationBus);

    crowdSource.start();
  }

  private updateStationAmbience(distToStationKm: number, isAtStation: boolean, station: Station | null) {
    if (!this.ctx || !this.crowdGain || !station) return;
    const t = this.ctx.currentTime;

    // Ambience prominence based on station crowd density
    let maxStationVol = 0.12;
    if (station.crowdDensity === 'dense') maxStationVol = 0.22;
    else if (station.crowdDensity === 'sparse') maxStationVol = 0.05;

    if (isAtStation) {
      // Stopped at platform: Full station soundscape
      this.crowdGain.gain.setTargetAtTime(maxStationVol, t, 0.4);

      // Trigger arrival announcement once per station stop
      if (this.settings.autoAnnouncementsEnabled && station.id !== this.lastAnnouncedStationId) {
        this.lastAnnouncedStationId = station.id;
        this.playStationAnnouncement(station);
      }

      // Random platform tea vendor cups / luggage activity
      if (Math.random() < 0.03) {
        this.playTeaStallSound();
      }
    } else if (distToStationKm <= 1.0) {
      // Approaching platform: fade in smoothly
      const approachVol = ((1.0 - distToStationKm) / 1.0) * maxStationVol * 0.6;
      this.crowdGain.gain.setTargetAtTime(approachVol, t, 0.5);
    } else {
      // Distant: fade out
      this.crowdGain.gain.setTargetAtTime(0, t, 0.6);
    }
  }

  // --- Station Tea Vendor Sound (Kettle & Spoon Clink) ---
  public playTeaStallSound() {
    if (!this.ctx || !this.stationBus || this.settings.isMuted) return;
    const t = this.ctx.currentTime;

    // High ceramic/metal clink
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, t);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.stationBus);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // --- Station Brass Bell (Departure Warning) ---
  public playStationBell() {
    if (!this.ensureContext() || !this.ctx || !this.stationBus || this.settings.isMuted) return;

    const t = this.ctx.currentTime;
    const dur = 1.3;
    const baseFreq = 880; // A5
    const harmonics = [1, 2.76, 5.4, 8.9];

    harmonics.forEach((ratio, i) => {
      if (!this.ctx || !this.stationBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, t);

      gain.gain.setValueAtTime(0.09 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i * 0.6 + 1));

      osc.connect(gain);
      gain.connect(this.stationBus);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // --- Station PA Chime (Ding-Dong-Ding) & Public Address ---
  public playStationAnnouncement(station: Station) {
    if (!this.ensureContext() || !this.ctx || !this.announcementBus || this.settings.isMuted) return;

    const t = this.ctx.currentTime;

    // 3-tone railway chime: G4 -> C5 -> E5
    const notes = [
      { freq: 392.0, time: 0 },
      { freq: 523.25, time: 0.35 },
      { freq: 659.25, time: 0.70 }
    ];

    notes.forEach((note) => {
      if (!this.ctx || !this.announcementBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t + note.time);

      gain.gain.setValueAtTime(0.14, t + note.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.time + 0.6);

      osc.connect(gain);
      gain.connect(this.announcementBus);

      osc.start(t + note.time);
      osc.stop(t + note.time + 0.6);
    });

    // Native Speech Synthesis for station announcement if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !this.isSpeaking) {
      setTimeout(() => {
        try {
          const text = station.announcementTextEn;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.05;
          utterance.volume = this.settings.announcementVolume * (this.settings.isMuted ? 0 : 1);
          this.isSpeaking = true;
          utterance.onend = () => { this.isSpeaking = false; };
          utterance.onerror = () => { this.isSpeaking = false; };
          window.speechSynthesis.speak(utterance);
        } catch {
          this.isSpeaking = false;
        }
      }, 1200);
    }
  }

  // --- 4. WEATHER & ENVIRONMENT CONTINUOUS SYNTHESIS ---
  private initWeatherContinuousSynth() {
    if (!this.ctx || !this.weatherBus) return;

    // Rain noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      output[i] = last * 3.5;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.weatherBus);

    rainSource.start();

    // Countryside Wind / Mist
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.weatherBus);

    windSource.start();
  }

  public updateWeatherSimulation(weather: string) {
    if (!this.ctx || !this.rainGain || !this.windGain) return;
    const t = this.ctx.currentTime;

    let targetRain = 0;
    let targetWind = 0.04;

    if (weather === 'monsoon_rain') {
      targetRain = 0.16;
      targetWind = 0.08;
    } else if (weather === 'thunderstorm') {
      targetRain = 0.28;
      targetWind = 0.16;
    } else if (weather === 'foggy') {
      targetRain = 0.02;
      targetWind = 0.06;
    } else if (weather === 'overcast') {
      targetRain = 0.0;
      targetWind = 0.07;
    }

    this.rainGain.gain.setTargetAtTime(targetRain, t, 0.4);
    this.windGain.gain.setTargetAtTime(targetWind, t, 0.4);
  }

  public playThunder() {
    if (!this.ensureContext() || !this.ctx || !this.weatherBus || this.settings.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 2.6;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(45, t + dur);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.weatherBus);

    osc.start(t);
    osc.stop(t + dur);
  }

  // --- Rural Birds & Night Crickets ---
  public updateTimeSimulation(period: string, isAtStation: boolean) {
    if (!this.ctx || !this.envBus || !this.settings.ambientEnabled || this.settings.isMuted) return;

    // Distant birds during morning & daytime in countryside (not at busy station)
    if (!isAtStation && (period === 'morning' || period === 'dawn' || period === 'afternoon')) {
      if (Math.random() < 0.015) {
        this.playRuralBirdChirp();
      }
    }

    // Crickets during dusk and night
    if (period === 'night' || period === 'dusk') {
      if (Math.random() < 0.04) {
        this.playCricketChirp();
      }
    }
  }

  private playRuralBirdChirp() {
    if (!this.ctx || !this.envBus) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startF = 2400 + Math.random() * 800;
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.linearRampToValueAtTime(startF + 600, t + 0.05);
    osc.frequency.linearRampToValueAtTime(startF - 300, t + 0.12);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.envBus);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  private playCricketChirp() {
    if (!this.ctx || !this.envBus) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(4600 + (Math.random() * 200), t);

    gain.gain.setValueAtTime(0.025, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.envBus);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public cleanup() {
    this.stopClickClack();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
