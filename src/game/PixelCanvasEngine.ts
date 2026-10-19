/**
 * PixelCanvasEngine.ts
 * High-performance 2D Pixel-Art Railway Journey Engine
 * Inspired by Tiny Rails & authentic Bangladesh landscapes
 */

import { SimulationState } from '../stores/simulationStore';
import { WeatherPreset, TimePeriod, LandscapeType, Station } from '../data/types';

// Palette definitions for times of day
interface SkyColors {
  top: string;
  mid: string;
  bottom: string;
  sunColor: string;
  sunHalo: string;
  ambientLight: number; // 0 (pitch dark) to 1 (bright daylight)
  tintOverlay?: string;
}

const SKY_PALETTES: Record<TimePeriod, SkyColors> = {
  dawn: {
    top: '#1E1B4B',     // deep indigo
    mid: '#C2410C',     // fiery orange
    bottom: '#FDE047',  // golden yellow
    sunColor: '#FEF08A',
    sunHalo: 'rgba(251, 146, 60, 0.4)',
    ambientLight: 0.65,
    tintOverlay: 'rgba(234, 88, 12, 0.08)',
  },
  morning: {
    top: '#0284C7',     // crisp sky blue
    mid: '#38BDF8',
    bottom: '#BAE6FD',
    sunColor: '#FEF9C3',
    sunHalo: 'rgba(253, 224, 71, 0.35)',
    ambientLight: 0.95,
  },
  noon: {
    top: '#0369A1',     // bright midday azure
    mid: '#0EA5E9',
    bottom: '#E0F2FE',
    sunColor: '#FFFFFF',
    sunHalo: 'rgba(255, 255, 255, 0.4)',
    ambientLight: 1.0,
  },
  afternoon: {
    top: '#0284C7',
    mid: '#60A5FA',
    bottom: '#FEF3C7',
    sunColor: '#FDE68A',
    sunHalo: 'rgba(245, 158, 11, 0.3)',
    ambientLight: 0.92,
  },
  sunset: {
    top: '#311042',     // purple violet
    mid: '#BE123C',     // rose red
    bottom: '#F59E0B',  // amber gold
    sunColor: '#FBBF24',
    sunHalo: 'rgba(239, 68, 68, 0.45)',
    ambientLight: 0.55,
    tintOverlay: 'rgba(194, 65, 12, 0.12)',
  },
  dusk: {
    top: '#0F172A',     // deep slate
    mid: '#312E81',     // indigo
    bottom: '#7C2D12',  // dusky copper
    sunColor: '#F87171',
    sunHalo: 'rgba(153, 27, 27, 0.25)',
    ambientLight: 0.35,
    tintOverlay: 'rgba(30, 27, 75, 0.25)',
  },
  night: {
    top: '#020617',     // obsidian night
    mid: '#0B1329',
    bottom: '#1E293B',
    sunColor: '#F1F5F9', // moon
    sunHalo: 'rgba(226, 232, 240, 0.18)',
    ambientLight: 0.2,
    tintOverlay: 'rgba(2, 6, 23, 0.45)',
  },
};

interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  wingPhase: number;
}

export class PixelCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime: number = 0;

  // Logical pixel art resolution (scaled to fit canvas)
  public readonly V_WIDTH = 640;
  public readonly V_HEIGHT = 320;

  // Offscreen buffer for crisp nearest-neighbor pixel rendering
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  // Parallax offsets
  private scrollOffsetDistHorizon = 0;
  private scrollOffsetMidground = 0;
  private scrollOffsetNearGround = 0;
  private scrollOffsetTrack = 0;
  private scrollOffsetForeground = 0;

  // Particle systems
  private smokeParticles: Particle[] = [];
  private rainParticles: Particle[] = [];
  private rainSplashParticles: Particle[] = [];
  private clouds: Cloud[] = [];
  private birds: Bird[] = [];
  private stars: { x: number; y: number; brightness: number; twinkleSpeed: number }[] = [];

  // Weather lightning state
  private lightningTimer = 0;
  private lightningActive = false;
  private lightningDuration = 0;

  // Wheel rotation & train bounce
  private wheelAngle = 0;
  private trainBounce = 0;

  // Current simulation state reference
  private currentState: SimulationState | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width = this.V_WIDTH;
    this.offCanvas.height = this.V_HEIGHT;
    const offCtx = this.offCanvas.getContext('2d');
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offCtx = offCtx;
    this.offCtx.imageSmoothingEnabled = false;

    this.initClouds();
    this.initStars();
    this.initBirds();
    this.initRain();
  }

  private initClouds() {
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.V_WIDTH,
        y: 20 + Math.random() * 80,
        speed: 4 + Math.random() * 8,
        width: 40 + Math.random() * 60,
        height: 14 + Math.random() * 16,
        opacity: 0.5 + Math.random() * 0.4,
      });
    }
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.V_WIDTH,
        y: Math.random() * 140,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
  }

  private initBirds() {
    this.birds = [];
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: Math.random() * this.V_WIDTH,
        y: 40 + Math.random() * 70,
        vx: 18 + Math.random() * 12,
        wingPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initRain() {
    this.rainParticles = [];
    for (let i = 0; i < 150; i++) {
      this.rainParticles.push({
        x: Math.random() * this.V_WIDTH,
        y: Math.random() * this.V_HEIGHT,
        vx: -60 - Math.random() * 40,
        vy: 320 + Math.random() * 120,
        life: 1,
        maxLife: 1,
        size: 8 + Math.random() * 8,
        color: '#BAE6FD',
      });
    }
  }

  public updateState(state: SimulationState) {
    this.currentState = state;
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private update(dt: number) {
    if (!this.currentState) return;
    const { isPlaying, speedMultiplier, currentSpeedKmh, currentWeather } = this.currentState;

    const effectiveSpeed = isPlaying ? (currentSpeedKmh / 60) * speedMultiplier : 0;

    // Parallax scrolling updates (pixels per second)
    const baseTrackSpeed = effectiveSpeed * 90;
    this.scrollOffsetDistHorizon = (this.scrollOffsetDistHorizon + baseTrackSpeed * 0.08 * dt) % this.V_WIDTH;
    this.scrollOffsetMidground = (this.scrollOffsetMidground + baseTrackSpeed * 0.35 * dt) % this.V_WIDTH;
    this.scrollOffsetNearGround = (this.scrollOffsetNearGround + baseTrackSpeed * 0.75 * dt) % this.V_WIDTH;
    this.scrollOffsetTrack = (this.scrollOffsetTrack + baseTrackSpeed * dt) % 32;
    this.scrollOffsetForeground = (this.scrollOffsetForeground + baseTrackSpeed * 1.35 * dt) % this.V_WIDTH;

    // Wheel angle & suspension bounce
    if (effectiveSpeed > 0.05) {
      this.wheelAngle = (this.wheelAngle + baseTrackSpeed * 0.1 * dt) % (Math.PI * 2);
      this.trainBounce = Math.sin(this.wheelAngle * 2) * 1.2;
    } else {
      this.trainBounce = 0;
    }

    // Clouds
    this.clouds.forEach((c) => {
      c.x -= (c.speed + baseTrackSpeed * 0.04) * dt;
      if (c.x + c.width < 0) {
        c.x = this.V_WIDTH + 20;
        c.y = 20 + Math.random() * 80;
      }
    });

    // Birds (only daytime)
    if (this.currentState.timePeriod !== 'night') {
      this.birds.forEach((b) => {
        b.x -= (b.vx + baseTrackSpeed * 0.1) * dt;
        b.wingPhase += 14 * dt;
        if (b.x < -30) {
          b.x = this.V_WIDTH + 40;
          b.y = 40 + Math.random() * 70;
        }
      });
    }

    // Smoke particles from locomotive chimney
    if (effectiveSpeed > 0.05 || isPlaying) {
      // Spawn smoke
      if (Math.random() < (0.45 * Math.min(speedMultiplier, 3))) {
        // Locomotive chimney is at x ~ 438, y ~ 205
        this.smokeParticles.push({
          x: 438,
          y: 205 + this.trainBounce,
          vx: -baseTrackSpeed * 0.8 - (20 + Math.random() * 30),
          vy: -25 - Math.random() * 20,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.7,
          size: 4 + Math.random() * 4,
          color: Math.random() > 0.4 ? 'rgba(203, 213, 225, 0.7)' : 'rgba(148, 163, 184, 0.5)',
        });
      }
    }

    // Update smoke
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += dt * 8; // expand
      if (p.life >= p.maxLife || p.x < -20) {
        this.smokeParticles.splice(i, 1);
      }
    }

    // Rain particles
    if (currentWeather === 'monsoon_rain' || currentWeather === 'thunderstorm') {
      const dropCount = currentWeather === 'thunderstorm' ? 180 : 120;
      while (this.rainParticles.length < dropCount) {
        this.rainParticles.push({
          x: Math.random() * (this.V_WIDTH + 80),
          y: -10,
          vx: -90 - Math.random() * 60,
          vy: 360 + Math.random() * 120,
          life: 1,
          maxLife: 1,
          size: 9 + Math.random() * 7,
          color: '#BAE6FD',
        });
      }

      for (let i = 0; i < this.rainParticles.length; i++) {
        const r = this.rainParticles[i];
        r.x += (r.vx - baseTrackSpeed * 0.2) * dt;
        r.y += r.vy * dt;

        // Splashes on train or track
        if (r.y >= 250 && Math.random() < 0.15) {
          this.rainSplashParticles.push({
            x: r.x,
            y: r.y,
            vx: (Math.random() - 0.5) * 40,
            vy: -20 - Math.random() * 30,
            life: 0,
            maxLife: 0.18,
            size: 2,
            color: '#E0F2FE',
          });
        }

        if (r.y > this.V_HEIGHT || r.x < -20) {
          r.x = Math.random() * (this.V_WIDTH + 60);
          r.y = -10;
        }
      }

      // Rain splashes
      for (let i = this.rainSplashParticles.length - 1; i >= 0; i--) {
        const s = this.rainSplashParticles[i];
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life >= s.maxLife) {
          this.rainSplashParticles.splice(i, 1);
        }
      }
    } else {
      this.rainParticles = [];
      this.rainSplashParticles = [];
    }

    // Thunderstorm lightning
    if (currentWeather === 'thunderstorm') {
      this.lightningTimer += dt;
      if (this.lightningTimer > 4 + Math.random() * 5) {
        this.lightningTimer = 0;
        this.lightningActive = true;
        this.lightningDuration = 0.12 + Math.random() * 0.08;
      }
      if (this.lightningActive) {
        this.lightningDuration -= dt;
        if (this.lightningDuration <= 0) {
          this.lightningActive = false;
        }
      }
    } else {
      this.lightningActive = false;
    }
  }

  private render() {
    if (!this.currentState) return;
    const g = this.offCtx;
    const { timePeriod, currentWeather, currentSegment, isAtStation, currentStation } = this.currentState;

    // 1. SKY DOME
    this.renderSky(g, timePeriod, currentWeather);

    // 2. CELESTIAL BODY & STARS
    this.renderCelestial(g, timePeriod, currentWeather);

    // 3. DISTANT CLOUDS
    this.renderClouds(g, currentWeather, timePeriod);

    // 4. DISTANT HORIZON (Mountains, floodplains, distant horizon line)
    this.renderDistantHorizon(g, currentSegment.landscapeType, timePeriod);

    // 5. MIDGROUND SCENERY (Lush Bengal paddy, villages, coconut groves, or river crossing)
    this.renderMidground(g, currentSegment.landscapeType, timePeriod);

    // 6. STATION PLATFORMS (Approaching, Docked alongside train, or Departing)
    this.renderStationPlatforms(g, timePeriod, isAtStation);

    // 7. TRACKSIDE INFRASTRUCTURE (Telegraph poles & catenary wires)
    this.renderTelegraphPoles(g);

    // 8. RAILWAY TRACK BED & GRAVEL BALLAST
    this.renderRailwayTrack(g, currentSegment.landscapeType);

    // 9. THE TRAIN (Locomotive + Carriages)
    this.renderTrain(g);

    // 10. SMOKE PARTICLES
    this.renderSmoke(g);

    // 11. FOREGROUND VEGETATION (Kashful, wild ferns, reeds)
    this.renderForeground(g, currentSegment.landscapeType);

    // 12. WEATHER OVERLAYS (Rain streaks, splashes, fog bands, lightning)
    this.renderWeatherEffects(g, currentWeather);

    // 13. TIME-OF-DAY ATMOSPHERIC LIGHTING & TINT
    this.renderAtmosphericLighting(g, timePeriod);

    // 14. BLIT OFFSCREEN BUFFER TO DISPLAY CANVAS
    this.blitToScreen();
  }

  private renderSky(g: CanvasRenderingContext2D, timePeriod: TimePeriod, weather: WeatherPreset) {
    const palette = SKY_PALETTES[timePeriod];
    const grad = g.createLinearGradient(0, 0, 0, this.V_HEIGHT);

    let top = palette.top;
    let mid = palette.mid;
    let bottom = palette.bottom;

    if (weather === 'overcast' || weather === 'monsoon_rain') {
      top = '#334155';
      mid = '#475569';
      bottom = '#64748B';
    } else if (weather === 'thunderstorm') {
      top = this.lightningActive ? '#E2E8F0' : '#0F172A';
      mid = this.lightningActive ? '#CBD5E1' : '#1E293B';
      bottom = this.lightningActive ? '#94A3B8' : '#334155';
    } else if (weather === 'foggy') {
      top = '#475569';
      mid = '#94A3B8';
      bottom = '#CBD5E1';
    }

    grad.addColorStop(0, top);
    grad.addColorStop(0.55, mid);
    grad.addColorStop(1, bottom);

    g.fillStyle = grad;
    g.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);
  }

  private renderCelestial(g: CanvasRenderingContext2D, timePeriod: TimePeriod, weather: WeatherPreset) {
    if (weather === 'overcast' || weather === 'monsoon_rain' || weather === 'thunderstorm') {
      return;
    }

    // Stars at night/dusk
    if (timePeriod === 'night' || timePeriod === 'dusk') {
      const now = performance.now() * 0.002;
      this.stars.forEach((st) => {
        const alpha = Math.max(0.1, Math.min(1, st.brightness + Math.sin(now * st.twinkleSpeed) * 0.3));
        g.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        g.fillRect(Math.floor(st.x), Math.floor(st.y), 1.5, 1.5);
      });
    }

    // Sun / Moon positioning
    let sunX = 460;
    let sunY = 55;
    const isNight = timePeriod === 'night';

    if (timePeriod === 'dawn') {
      sunX = 520;
      sunY = 95;
    } else if (timePeriod === 'noon') {
      sunX = 320;
      sunY = 32;
    } else if (timePeriod === 'sunset') {
      sunX = 140;
      sunY = 100;
    }

    const palette = SKY_PALETTES[timePeriod];

    // Sun halo / glow
    const haloGrad = g.createRadialGradient(sunX, sunY, 6, sunX, sunY, 36);
    haloGrad.addColorStop(0, palette.sunHalo);
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = haloGrad;
    g.beginPath();
    g.arc(sunX, sunY, 36, 0, Math.PI * 2);
    g.fill();

    // Solid core (pixel-art disc)
    g.fillStyle = palette.sunColor;
    g.beginPath();
    g.arc(sunX, sunY, isNight ? 14 : 16, 0, Math.PI * 2);
    g.fill();

    // Moon craters
    if (isNight) {
      g.fillStyle = 'rgba(148, 163, 184, 0.4)';
      g.beginPath();
      g.arc(sunX - 4, sunY - 3, 3.5, 0, Math.PI * 2);
      g.arc(sunX + 3, sunY + 4, 2.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  private renderClouds(g: CanvasRenderingContext2D, weather: WeatherPreset, timePeriod: TimePeriod) {
    const isStormy = weather === 'thunderstorm';
    const isOvercast = weather === 'overcast' || weather === 'monsoon_rain';
    const isNight = timePeriod === 'night' || timePeriod === 'dusk';

    const cloudColor = isStormy 
      ? (this.lightningActive ? 'rgba(226, 232, 240, 0.9)' : 'rgba(30, 41, 59, 0.85)')
      : isOvercast 
      ? 'rgba(100, 116, 139, 0.75)' 
      : isNight 
      ? 'rgba(51, 65, 85, 0.45)' 
      : 'rgba(255, 255, 255, 0.75)';

    g.fillStyle = cloudColor;

    this.clouds.forEach((c) => {
      const x = Math.floor(c.x);
      const y = Math.floor(c.y);
      const w = Math.floor(c.width);
      const h = Math.floor(c.height);

      // Pixelated puffy cloud shapes
      g.fillRect(x, y + h * 0.35, w, h * 0.65);
      g.fillRect(x + w * 0.15, y, w * 0.7, h * 0.9);
      g.fillRect(x + w * 0.35, y - h * 0.25, w * 0.35, h * 0.6);
    });

    // Daytime birds
    if (!isStormy && !isNight && weather !== 'foggy') {
      g.fillStyle = timePeriod === 'sunset' ? '#78350F' : '#1E293B';
      this.birds.forEach((b) => {
        const wingY = Math.sin(b.wingPhase) * 3;
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        // Pixel bird (V shape)
        g.fillRect(bx, by, 3, 2);
        g.fillRect(bx - 3, by + wingY, 3, 1);
        g.fillRect(bx + 3, by + wingY, 3, 1);
      });
    }
  }

  private renderDistantHorizon(g: CanvasRenderingContext2D, landscape: LandscapeType, timePeriod: TimePeriod) {
    const isNight = timePeriod === 'night';
    const isDusk = timePeriod === 'dusk' || timePeriod === 'sunset';

    const baseHillColor = isNight ? '#091E1A' : isDusk ? '#4A1D2F' : '#2D6A4F';
    const highlightColor = isNight ? '#0E3B33' : isDusk ? '#6B2D44' : '#40916C';

    const offset = this.scrollOffsetDistHorizon;

    if (landscape === 'river_crossing_jamuna' || landscape === 'river_crossing_meghna') {
      // Endless expansive river horizon with low silt islands (chars)
      const riverY = 165;
      g.fillStyle = isNight ? '#0B1E2E' : isDusk ? '#831843' : '#38BDF8';
      g.fillRect(0, riverY, this.V_WIDTH, 45);

      // Distant low sandy islands / chars
      g.fillStyle = isNight ? '#132A38' : isDusk ? '#9D174D' : '#FDE68A';
      for (let i = -1; i < 4; i++) {
        const islandX = i * 220 - (offset % 220);
        g.beginPath();
        g.ellipse(islandX + 80, riverY + 12, 60, 6, 0, 0, Math.PI * 2);
        g.fill();

        // Little distant country boat (Nouka) on the Jamuna river
        g.fillStyle = '#1E293B';
        g.fillRect(islandX + 110, riverY + 6, 12, 3);
        // Sail
        g.fillStyle = isNight ? '#475569' : '#F97316';
        g.beginPath();
        g.moveTo(islandX + 116, riverY + 6);
        g.lineTo(islandX + 116, riverY - 5);
        g.lineTo(islandX + 123, riverY + 3);
        g.closePath();
        g.fill();
      }
      return;
    }

    if (landscape === 'tea_gardens') {
      // Rolling lush Sylhet hillocks
      g.fillStyle = baseHillColor;
      for (let i = -1; i < 4; i++) {
        const startX = i * 260 - (offset % 260);
        g.beginPath();
        g.arc(startX + 80, 210, 80, Math.PI, Math.PI * 2);
        g.arc(startX + 200, 210, 70, Math.PI, Math.PI * 2);
        g.fill();
      }
      return;
    }

    // Default Bengal rural horizon (distant tree line & coconut canopy silhouettes)
    g.fillStyle = baseHillColor;
    const treeY = 175;
    for (let x = -20; x < this.V_WIDTH + 40; x += 16) {
      const idx = Math.floor((x + offset) / 16);
      const h = 18 + ((idx * 37) % 16);
      g.fillRect(x, treeY - h, 14, h + 20);
      // rounded canopy top
      g.fillStyle = highlightColor;
      g.fillRect(x + 2, treeY - h - 3, 10, 3);
      g.fillStyle = baseHillColor;
    }
  }

  private renderMidground(g: CanvasRenderingContext2D, landscape: LandscapeType, timePeriod: TimePeriod) {
    const isNight = timePeriod === 'night';
    const isDusk = timePeriod === 'dusk' || timePeriod === 'sunset';

    const paddyGreen = isNight ? '#064E3B' : isDusk ? '#713F12' : '#15803D';
    const paddyHighlight = isNight ? '#065F46' : isDusk ? '#A16207' : '#22C55E';
    const mustardYellow = isNight ? '#362E00' : isDusk ? '#B45309' : '#EAB308';
    const trunkColor = isNight ? '#1E293B' : '#451A03';

    const midOffset = this.scrollOffsetMidground;

    // 1. River Crossing Mode (Bangabandhu Jamuna Rail Bridge or Meghna Bridge)
    if (landscape === 'river_crossing_jamuna' || landscape === 'river_crossing_meghna') {
      const waterY = 190;
      // Broad water field
      const waterGrad = g.createLinearGradient(0, waterY, 0, 250);
      waterGrad.addColorStop(0, isNight ? '#0B1E2E' : isDusk ? '#831843' : '#0284C7');
      waterGrad.addColorStop(1, isNight ? '#020617' : isDusk ? '#4C0519' : '#0369A1');
      g.fillStyle = waterGrad;
      g.fillRect(0, waterY, this.V_WIDTH, 60);

      // Water ripples
      g.fillStyle = isNight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 20; i++) {
        const rx = (i * 37 - midOffset * 1.5) % this.V_WIDTH;
        const ry = waterY + 6 + (i * 13) % 48;
        g.fillRect(rx < 0 ? rx + this.V_WIDTH : rx, ry, 18, 2);
      }

      // Massive bridge concrete pillars & steel truss girders
      for (let i = -1; i < 5; i++) {
        const pillarX = i * 160 - (midOffset % 160);
        // Concrete pier in water
        g.fillStyle = isNight ? '#1E293B' : '#94A3B8';
        g.fillRect(pillarX + 70, 210, 20, 40);
        g.fillStyle = isNight ? '#0F172A' : '#64748B';
        g.fillRect(pillarX + 66, 205, 28, 6);

        // Steel truss diagonals spanning between piers
        g.strokeStyle = isNight ? '#334155' : '#CBD5E1';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(pillarX + 80, 205);
        g.lineTo(pillarX + 160, 160);
        g.lineTo(pillarX + 240, 205);
        g.stroke();
      }

      // Wooden Country Boats ('Nouka') with sails
      for (let i = -1; i < 3; i++) {
        const boatX = i * 280 - (midOffset * 0.7 % 280);
        if (boatX > -50 && boatX < this.V_WIDTH + 50) {
          // Boat hull
          g.fillStyle = isNight ? '#1E293B' : '#78350F';
          g.fillRect(boatX + 40, waterY + 22, 26, 6);
          // Sail
          g.fillStyle = isNight ? '#334155' : (i % 2 === 0 ? '#E11D48' : '#059669');
          g.beginPath();
          g.moveTo(boatX + 53, waterY + 22);
          g.lineTo(boatX + 53, waterY + 5);
          g.lineTo(boatX + 63, waterY + 14);
          g.closePath();
          g.fill();
        }
      }
      return;
    }

    // 2. Rural Land (Paddy fields, mustard yellow flowers, village homesteads, palms)
    const groundY = 195;
    g.fillStyle = landscape === 'mustard_fields' ? mustardYellow : paddyGreen;
    g.fillRect(0, groundY, this.V_WIDTH, 55);

    // Terraced rice seedling strips
    g.fillStyle = paddyHighlight;
    for (let y = groundY + 4; y < 240; y += 8) {
      for (let x = -20; x < this.V_WIDTH + 30; x += 24) {
        const shiftX = (x - (midOffset % 24));
        g.fillRect(shiftX, y, 14, 2);
      }
    }

    // Traditional rural elements spaced along the scroll
    const spacing = 180;
    for (let i = -1; i < 5; i++) {
      const baseX = i * spacing - (midOffset % spacing);

      // Rural homestead (tin-roof house 'Tin-er ghor' with clay porch)
      if (i % 2 === 0) {
        const houseX = baseX + 40;
        const houseY = groundY - 14;

        // Clay walls
        g.fillStyle = isNight ? '#1E293B' : '#D97706';
        g.fillRect(houseX, houseY + 12, 34, 18);
        // Door
        g.fillStyle = isNight ? '#0F172A' : '#78350F';
        g.fillRect(houseX + 13, houseY + 18, 8, 12);
        // Corrugated tin roof (triangle/gabled)
        g.fillStyle = isNight ? '#475569' : '#94A3B8';
        g.beginPath();
        g.moveTo(houseX - 4, houseY + 12);
        g.lineTo(houseX + 17, houseY);
        g.lineTo(houseX + 38, houseY + 12);
        g.closePath();
        g.fill();
        // Tin ridges
        g.strokeStyle = isNight ? '#334155' : '#E2E8F0';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(houseX + 3, houseY + 9);
        g.lineTo(houseX + 17, houseY);
        g.moveTo(houseX + 31, houseY + 9);
        g.lineTo(houseX + 17, houseY);
        g.stroke();

        // Tiny clay porch & flower pot
        g.fillStyle = isNight ? '#0F172A' : '#B45309';
        g.fillRect(houseX - 2, houseY + 28, 38, 3);
      } else {
        // Village pond with Shapla (Water Lily - Bangladesh National Flower)
        const pondX = baseX + 30;
        g.fillStyle = isNight ? '#0B1E2E' : '#0284C7';
        g.beginPath();
        g.ellipse(pondX + 30, groundY + 15, 26, 8, 0, 0, Math.PI * 2);
        g.fill();

        // Pink Shapla flower pixel dot
        g.fillStyle = '#F43F5E';
        g.fillRect(pondX + 24, groundY + 12, 3, 3);
        g.fillRect(pondX + 36, groundY + 14, 3, 3);
      }

      // Tall Coconut Palm (Narikel Gachh)
      const palmX = baseX + 120;
      const palmBaseY = groundY + 10;
      const palmHeight = 55;

      // Slender curving trunk
      g.strokeStyle = trunkColor;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(palmX, palmBaseY);
      g.quadraticCurveTo(palmX + 4, palmBaseY - palmHeight * 0.5, palmX + 8, palmBaseY - palmHeight);
      g.stroke();

      // Fronds (feather-like pixel palm leaves)
      const topX = palmX + 8;
      const topY = palmBaseY - palmHeight;

      g.fillStyle = isNight ? '#064E3B' : '#16A34A';
      // Left frond
      g.fillRect(topX - 16, topY + 2, 16, 3);
      g.fillRect(topX - 22, topY + 5, 8, 2);
      // Right frond
      g.fillRect(topX + 2, topY + 2, 16, 3);
      g.fillRect(topX + 16, topY + 5, 8, 2);
      // Up frond
      g.fillRect(topX - 4, topY - 10, 8, 10);
      // Coconuts cluster
      g.fillStyle = isNight ? '#1E293B' : '#CA8A04';
      g.fillRect(topX - 2, topY, 2, 2);
      g.fillRect(topX + 1, topY + 1, 2, 2);

      // Banana Tree (Kola Gachh)
      const bananaX = baseX + 95;
      g.fillStyle = isNight ? '#047857' : '#22C55E';
      g.fillRect(bananaX, groundY - 2, 12, 4);
      g.fillRect(bananaX - 4, groundY - 6, 8, 4);
      g.fillRect(bananaX + 8, groundY - 6, 8, 4);
    }
  }

  private renderStationPlatforms(
    g: CanvasRenderingContext2D,
    timePeriod: TimePeriod,
    isAtStation: boolean
  ) {
    if (!this.currentState) return;
    const { activeRoute, distanceCoveredKm } = this.currentState;

    for (const station of activeRoute.stations) {
      const kmDelta = station.kmFromOrigin - distanceCoveredKm;
      // Approach & departure visibility window: -2.0 km to +2.4 km
      if (kmDelta > -2.0 && kmDelta < 2.4) {
        // When stopped directly alongside train at kmDelta = 0, anchor is at x = -60
        // Scaled at 450 px/km:
        // at kmDelta = 1.5 km: platX = -60 + 675 = 615 (entering smoothly as train slows down)
        // at kmDelta = 0: platX = -60 (docked perfectly across full viewport)
        // at kmDelta = -1.5 km: platX = -60 - 675 = -735 (sliding off left as train accelerates away)
        const platX = Math.floor(-60 + (kmDelta * 450));
        this.renderSinglePlatform(
          g,
          platX,
          station,
          timePeriod,
          isAtStation && Math.abs(kmDelta) < 0.1
        );
      }
    }
  }

  private renderSinglePlatform(
    g: CanvasRenderingContext2D,
    platX: number,
    station: Station,
    timePeriod: TimePeriod,
    isHaltedHere: boolean
  ) {
    const isNight = timePeriod === 'night' || timePeriod === 'dusk';
    const platY = 228;
    const platWidth = 860;

    // 1. Raised Brick Station Platform Deck
    g.fillStyle = '#64748B'; // Platform concrete paving
    g.fillRect(platX, platY, platWidth, 20);

    // Platform paving flagstones
    g.fillStyle = '#475569';
    for (let px = platX; px < platX + platWidth; px += 28) {
      g.fillRect(px, platY + 1, 1, 19);
    }

    // Yellow tactile safety edge strip with bold black hazard diagonal stripes
    g.fillStyle = '#FACC15';
    g.fillRect(platX, platY, platWidth, 4);
    g.fillStyle = '#0F172A';
    for (let h = platX; h < platX + platWidth; h += 14) {
      g.fillRect(h, platY, 5, 4);
    }

    // Lower platform wall facing tracks (brick mortar texture)
    g.fillStyle = '#334155';
    g.fillRect(platX, platY + 4, platWidth, 16);
    g.fillStyle = '#1E293B';
    g.fillRect(platX, platY + 19, platWidth, 1);

    // 2. Continuous Platform Roof Shelter Canopy
    const roofX = platX + 30;
    const roofWidth = platWidth - 60;
    const roofY = 166;

    // Corrugated metal slanted roof
    g.fillStyle = isNight ? '#1E293B' : '#334155';
    g.fillRect(roofX, roofY, roofWidth, 7);
    g.fillStyle = isNight ? '#334155' : '#475569';
    g.fillRect(roofX - 6, roofY + 7, roofWidth + 12, 2);

    // Steel support columns every 75px
    for (let c = roofX + 25; c < roofX + roofWidth - 20; c += 75) {
      g.fillStyle = '#94A3B8';
      g.fillRect(c, roofY + 7, 4, platY - (roofY + 7));
      // Column foot mounting base
      g.fillStyle = '#0F172A';
      g.fillRect(c - 2, platY - 4, 8, 4);

      // Overhead diagonal truss bracings
      g.strokeStyle = '#64748B';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(c, roofY + 15);
      g.lineTo(c - 16, roofY + 8);
      g.moveTo(c + 4, roofY + 15);
      g.lineTo(c + 20, roofY + 8);
      g.stroke();
    }

    // 3. Iconic Bangladesh Railway Station Nameboard (Center Main Board)
    // Situated at platX + 310 (directly visible above train coaches, centered when stopped!)
    const signX = platX + 310;
    const signY = 138;
    const signW = 240;
    const signH = 48;

    // Dual black mounting steel posts from signboard down to platform deck
    g.fillStyle = '#0F172A';
    g.fillRect(signX + 28, signY + signH, 5, platY - (signY + signH));
    g.fillRect(signX + signW - 33, signY + signH, 5, platY - (signY + signH));

    // Signboard yellow plate
    g.fillStyle = '#FACC15'; // Signature BR Sunflower Yellow
    g.fillRect(signX, signY, signW, signH);

    // Outer thick black border and inner accent border
    g.strokeStyle = '#000000';
    g.lineWidth = 3;
    g.strokeRect(signX, signY, signW, signH);
    g.lineWidth = 1;
    g.strokeRect(signX + 3, signY + 3, signW - 6, signH - 6);

    // Bangladesh Railway Winged Crest (Red circle with green wing flourishes)
    g.fillStyle = '#DC2626';
    g.beginPath();
    g.arc(signX + (signW / 2), signY + 9, 3.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#16A34A';
    g.fillRect(signX + (signW / 2) - 8, signY + 8, 4, 2);
    g.fillRect(signX + (signW / 2) + 4, signY + 8, 4, 2);

    // Bold Bengali Station Name
    g.fillStyle = '#000000';
    g.font = 'bold 15px system-ui, -apple-system, sans-serif';
    g.textAlign = 'center';
    g.fillText(station.nameBn, signX + (signW / 2), signY + 23);

    // Bold English Station Name in uppercase
    g.font = 'bold 11px monospace, sans-serif';
    g.fillText(station.nameEn.toUpperCase(), signX + (signW / 2), signY + 35);

    // Platform & Code subtext line
    g.font = 'bold 7.5px monospace';
    g.fillStyle = '#3E2723';
    g.fillText(`[${station.code}] · প্ল্যাটফর্ম নং ১ / PLATFORM 1`, signX + (signW / 2), signY + 44);

    // 4. Approach Station Nameboard (Right Side - seen first as train pulls in)
    const signX2 = platX + 680;
    const signY2 = 152;
    const signW2 = 145;
    const signH2 = 34;
    g.fillStyle = '#0F172A';
    g.fillRect(signX2 + 18, signY2 + signH2, 4, platY - (signY2 + signH2));
    g.fillRect(signX2 + signW2 - 22, signY2 + signH2, 4, platY - (signY2 + signH2));
    g.fillStyle = '#FACC15';
    g.fillRect(signX2, signY2, signW2, signH2);
    g.strokeStyle = '#000000';
    g.lineWidth = 2;
    g.strokeRect(signX2, signY2, signW2, signH2);
    g.fillStyle = '#000000';
    g.font = 'bold 10px system-ui, sans-serif';
    g.fillText(station.nameBn, signX2 + (signW2 / 2), signY2 + 14);
    g.font = 'bold 8px monospace';
    g.fillText(station.nameEn.toUpperCase(), signX2 + (signW2 / 2), signY2 + 24);
    g.font = 'bold 6.5px monospace';
    g.fillStyle = '#451A03';
    g.fillText(`[${station.code}] · PLATFORM 1`, signX2 + (signW2 / 2), signY2 + 31);

    // 5. Entrance Welcome Board (Left Side)
    const signX0 = platX + 70;
    g.fillStyle = '#FACC15';
    g.fillRect(signX0, 168, 115, 24);
    g.strokeStyle = '#000000';
    g.lineWidth = 1.5;
    g.strokeRect(signX0, 168, 115, 24);
    g.fillStyle = '#000000';
    g.font = 'bold 8.5px system-ui';
    g.fillText(`স্বাগতম · ${station.nameBn}`, signX0 + 57, 178);
    g.font = 'bold 7px monospace';
    g.fillText(`WELCOME TO ${station.code}`, signX0 + 57, 188);
    g.fillStyle = '#000000';
    g.fillRect(signX0 + 55, 192, 4, platY - 192);

    // 6. Station Master Red-Brick Office Building
    const hutX = platX + 560;
    const hutY = platY - 58;
    g.fillStyle = '#B91C1C'; // Red brick
    g.fillRect(hutX, hutY, 88, 58);
    // Brick mortar rows
    g.fillStyle = '#991B1B';
    for (let r = hutY + 4; r < platY; r += 6) {
      g.fillRect(hutX, r, 88, 1);
    }
    // Office door
    g.fillStyle = '#451A03';
    g.fillRect(hutX + 54, hutY + 24, 20, 34);
    // Office window with crossbar
    g.fillStyle = isNight ? '#FEF08A' : '#BAE6FD';
    g.fillRect(hutX + 12, hutY + 22, 26, 20);
    g.strokeStyle = '#FFFFFF';
    g.lineWidth = 1;
    g.strokeRect(hutX + 12, hutY + 22, 26, 20);
    g.beginPath();
    g.moveTo(hutX + 25, hutY + 22);
    g.lineTo(hutX + 25, hutY + 42);
    g.moveTo(hutX + 12, hutY + 32);
    g.lineTo(hutX + 38, hutY + 32);
    g.stroke();

    // Round Station Clock above office
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(hutX + 44, hutY + 11, 9, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#000000';
    g.lineWidth = 1.5;
    g.stroke();
    // Clock hands
    g.beginPath();
    g.moveTo(hutX + 44, hutY + 11);
    g.lineTo(hutX + 44, hutY + 6);
    g.moveTo(hutX + 44, hutY + 11);
    g.lineTo(hutX + 49, hutY + 11);
    g.stroke();

    // Station brass bell hanging beside door
    g.fillStyle = '#F59E0B';
    g.beginPath();
    g.arc(hutX + 80, hutY + 18, 4.5, Math.PI, Math.PI * 2);
    g.lineTo(hutX + 85, hutY + 25);
    g.lineTo(hutX + 75, hutY + 25);
    g.closePath();
    g.fill();

    // Station Master in uniform waving green departure flag
    const smX = hutX - 16;
    g.fillStyle = '#FFFFFF'; // White uniform shirt
    g.fillRect(smX, platY - 26, 7, 14);
    g.fillStyle = '#1E293B'; // Dark trousers
    g.fillRect(smX, platY - 12, 7, 12);
    g.fillStyle = '#D97706'; // Head
    g.fillRect(smX + 1, platY - 32, 5, 6);
    g.fillStyle = '#B91C1C'; // Red cap
    g.fillRect(smX, platY - 34, 7, 3);
    // Green signal flag
    g.fillStyle = '#15803D';
    g.fillRect(smX - 8, platY - 30, 8, 6);
    g.fillStyle = '#78350F';
    g.fillRect(smX - 1, platY - 30, 2, 14);

    // 7. Tea Vendor Stall ("Cha er dokan")
    const stallX = platX + 185;
    const stallY = platY - 28;
    // Wooden stall frame
    g.fillStyle = '#78350F';
    g.fillRect(stallX, stallY + 10, 42, 18);
    // Striped red and white canvas awning
    for (let c = 0; c < 42; c += 6) {
      g.fillStyle = (c / 6) % 2 === 0 ? '#DC2626' : '#FFFFFF';
      g.fillRect(stallX + c, stallY + 1, 6, 10);
    }
    // "চা স্টল" sign on stall
    g.fillStyle = '#FEF08A';
    g.fillRect(stallX + 6, stallY + 12, 30, 7);
    g.fillStyle = '#000000';
    g.font = 'bold 5.5px system-ui';
    g.fillText('গরম চা', stallX + 21, stallY + 17);
    // Steaming samovar kettle
    g.fillStyle = '#E2E8F0';
    g.fillRect(stallX + 10, stallY + 7, 9, 6);
    // Animated tiny steam puff
    if (Math.sin(performance.now() * 0.006) > 0) {
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      g.fillRect(stallX + 12, stallY + 3, 2, 2);
      g.fillRect(stallX + 14, stallY, 2, 2);
    }
    // Earthen clay tea cups (bhaar)
    g.fillStyle = '#B45309';
    g.fillRect(stallX + 26, stallY + 9, 3, 3);
    g.fillRect(stallX + 31, stallY + 9, 3, 3);

    // 8. Platform Benches & Waiting Passengers
    [platX + 250, platX + 500].forEach((bx, idx) => {
      // Wooden bench
      g.fillStyle = '#451A03';
      g.fillRect(bx, platY - 12, 26, 3); // seat
      g.fillRect(bx, platY - 21, 26, 3); // backrest
      g.fillRect(bx + 2, platY - 12, 2, 12); // leg
      g.fillRect(bx + 22, platY - 12, 2, 12); // leg

      // Passenger sitting
      g.fillStyle = idx === 0 ? '#1E293B' : '#047857';
      g.fillRect(bx + 7, platY - 23, 6, 11);
      g.fillStyle = '#D97706'; // head
      g.fillRect(bx + 8, platY - 28, 4, 5);

      // Standing passenger with suitcase beside bench
      const standX = bx - 15;
      g.fillStyle = '#B91C1C';
      g.fillRect(standX, platY - 26, 6, 16);
      g.fillStyle = '#D97706';
      g.fillRect(standX + 1, platY - 31, 4, 5);
      // Luggage bag / trunk
      g.fillStyle = '#78350F';
      g.fillRect(standX + 7, platY - 9, 9, 9);
    });

    // 9. Vintage Platform Lampposts & Warm Evening Lanterns
    [platX + 100, platX + 240, platX + 480, platX + 660, platX + 800].forEach((lx) => {
      // Cast-iron pole
      g.fillStyle = '#0F172A';
      g.fillRect(lx, platY - 52, 3, 52);
      // Bracket
      g.fillRect(lx - 4, platY - 52, 11, 2);
      // Lantern housing
      g.fillStyle = '#000000';
      g.strokeRect(lx - 3, platY - 58, 9, 7);

      // Glowing glass lantern globe
      const lampGlow = isNight ? '#FEF08A' : '#FFFBEB';
      g.fillStyle = lampGlow;
      g.fillRect(lx - 2, platY - 57, 7, 5);

      // Atmospheric radial light halo during dusk/night/dawn
      if (isNight || timePeriod === 'dawn' || timePeriod === 'sunset') {
        const rad = g.createRadialGradient(lx + 1, platY - 55, 2, lx + 1, platY - 55, 32);
        rad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
        rad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        g.fillStyle = rad;
        g.beginPath();
        g.arc(lx + 1, platY - 55, 32, 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  private renderTelegraphPoles(g: CanvasRenderingContext2D) {
    const poleY = 248;
    const spacing = 140;
    const offset = this.scrollOffsetNearGround;

    // Check if telegraph pole would overlap any active station platform
    const hasPlatformAt = (x: number) => {
      if (!this.currentState) return false;
      const { activeRoute, distanceCoveredKm } = this.currentState;
      for (const st of activeRoute.stations) {
        const kmDelta = st.kmFromOrigin - distanceCoveredKm;
        if (kmDelta > -2.0 && kmDelta < 2.4) {
          const platX = Math.floor(-60 + (kmDelta * 450));
          if (x >= platX - 15 && x <= platX + 875) {
            return true;
          }
        }
      }
      return false;
    };

    g.strokeStyle = '#334155';
    g.lineWidth = 1;

    for (let i = -1; i < 6; i++) {
      const poleX = Math.floor(i * spacing - (offset % spacing));
      if (hasPlatformAt(poleX)) continue; // Suppress rural pole inside station platform

      const poleHeight = 65;

      // Wooden pole
      g.fillStyle = '#451A03';
      g.fillRect(poleX, poleY - poleHeight, 4, poleHeight);

      // Crossbars (insulators)
      g.fillStyle = '#78350F';
      g.fillRect(poleX - 8, poleY - poleHeight + 4, 20, 3);
      g.fillRect(poleX - 6, poleY - poleHeight + 14, 16, 3);

      // White ceramic insulators
      g.fillStyle = '#F8FAFC';
      g.fillRect(poleX - 7, poleY - poleHeight + 2, 3, 2);
      g.fillRect(poleX + 8, poleY - poleHeight + 2, 3, 2);
      g.fillRect(poleX - 5, poleY - poleHeight + 12, 3, 2);
      g.fillRect(poleX + 6, poleY - poleHeight + 12, 3, 2);

      // Wires sagging between poles (only if next pole is also clear)
      const nextPoleX = poleX + spacing;
      if (!hasPlatformAt(nextPoleX)) {
        g.beginPath();
        g.moveTo(poleX + 8, poleY - poleHeight + 3);
        g.quadraticCurveTo(poleX + spacing * 0.5, poleY - poleHeight + 16, nextPoleX - 7, poleY - poleHeight + 3);
        g.moveTo(poleX + 6, poleY - poleHeight + 13);
        g.quadraticCurveTo(poleX + spacing * 0.5, poleY - poleHeight + 24, nextPoleX - 5, poleY - poleHeight + 13);
        g.stroke();
      }
    }
  }

  private renderRailwayTrack(g: CanvasRenderingContext2D, landscape: LandscapeType) {
    const trackY = 248;

    // Embankment / Ballast bed (gravel stone texture)
    g.fillStyle = '#334155';
    g.fillRect(0, trackY + 8, this.V_WIDTH, 26);
    g.fillStyle = '#475569';
    g.fillRect(0, trackY + 12, this.V_WIDTH, 18);

    // Individual gravel stones
    for (let x = 0; x < this.V_WIDTH; x += 8) {
      g.fillStyle = (x % 16 === 0) ? '#1E293B' : '#64748B';
      g.fillRect(x + ((x * 13) % 5), trackY + 14 + ((x * 7) % 12), 3, 2);
    }

    // Concrete & Wooden sleepers (crossties)
    const sleeperSpacing = 16;
    const shift = Math.floor(this.scrollOffsetTrack % sleeperSpacing);

    for (let x = -sleeperSpacing; x < this.V_WIDTH + sleeperSpacing; x += sleeperSpacing) {
      const sx = x - shift;
      // Sleeper top
      g.fillStyle = '#1E293B';
      g.fillRect(sx, trackY + 4, 10, 8);
      // Rail clips / fastening plate
      g.fillStyle = '#94A3B8';
      g.fillRect(sx + 2, trackY + 3, 6, 2);
    }

    // Dual Steel Rails (top rail + shadow base)
    // Upper rail (near)
    g.fillStyle = '#0F172A';
    g.fillRect(0, trackY + 3, this.V_WIDTH, 4);
    g.fillStyle = '#E2E8F0'; // polished steel shine reflection
    g.fillRect(0, trackY + 2, this.V_WIDTH, 2);

    // Lower rail edge
    g.fillStyle = '#475569';
    g.fillRect(0, trackY + 10, this.V_WIDTH, 2);
  }

  private renderTrain(g: CanvasRenderingContext2D) {
    if (!this.currentState) return;
    const { trainCars, headlightOn, timePeriod } = this.currentState;

    // Train anchor position
    // Engine leading on the right (facing right) as it journeys forward through Bangladesh
    const engineX = 420;
    const trackY = 248;
    const carY = trackY - 40 + this.trainBounce;

    const carWidth = 92;
    const carGap = 6;

    // Headlight beam (volumetric golden cone projected forward onto tracks)
    if (headlightOn) {
      const beamGrad = g.createRadialGradient(engineX + 78, carY + 28, 4, engineX + 220, carY + 32, 140);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      beamGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.4)');
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

      g.fillStyle = beamGrad;
      g.beginPath();
      g.moveTo(engineX + 78, carY + 28);
      g.lineTo(this.V_WIDTH, carY - 20);
      g.lineTo(this.V_WIDTH, carY + 65);
      g.closePath();
      g.fill();
    }

    // Render each car from rear to front
    trainCars.forEach((car, index) => {
      // Rear car is at lowest X, Engine is leading at right
      const carIndexFromFront = trainCars.length - 1 - index;
      const cx = engineX - (carIndexFromFront * (carWidth + carGap));

      // Draw metallic coupler link between cars
      if (index < trainCars.length - 1) {
        g.fillStyle = '#1E293B';
        g.fillRect(cx + carWidth, carY + 30, carGap, 4);
      }

      if (car.type.startsWith('loco')) {
        this.drawLocomotive(g, cx, carY, car.type);
      } else if (car.type === 'shovon_chair') {
        this.drawShovonCoach(g, cx, carY, timePeriod);
      } else if (car.type === 'bhojon_dining') {
        this.drawBhojonCoach(g, cx, carY, timePeriod);
      } else if (car.type === 'snigdha_ac') {
        this.drawSnigdhaCoach(g, cx, carY, timePeriod);
      } else if (car.type === 'guard_caboose') {
        this.drawGuardCaboose(g, cx, carY);
      } else {
        this.drawShovonCoach(g, cx, carY, timePeriod);
      }
    });
  }

  /**
   * Bangladesh Railway Class 2900 EMD Diesel-Electric Locomotive
   */
  private drawLocomotive(g: CanvasRenderingContext2D, x: number, y: number, type: string) {
    const isHeritage = type === 'loco_heritage_steam';
    const isExpress = type === 'loco_express_3000';

    if (isHeritage) {
      // British-era Heritage Steam Locomotive
      g.fillStyle = '#1E293B'; // Boiler black
      g.fillRect(x, y + 8, 70, 30);
      // Cab
      g.fillStyle = '#7F1D1D';
      g.fillRect(x, y, 26, 38);
      // Chimney
      g.fillStyle = '#0F172A';
      g.fillRect(x + 52, y - 6, 8, 14);
      // Cowcatcher
      g.fillStyle = '#B45309';
      g.beginPath();
      g.moveTo(x + 70, y + 36);
      g.lineTo(x + 80, y + 38);
      g.lineTo(x + 70, y + 40);
      g.fill();
    } else {
      // Iconic BR Class 2900 / 3000 (Green & Red with Cream Band)
      const primaryGreen = isExpress ? '#065F46' : '#15803D';
      const secondaryRed = '#DC2626';

      // Main cab & body
      g.fillStyle = primaryGreen;
      g.fillRect(x, y + 4, 76, 34);

      // Sloped front aerodynamic hood
      g.beginPath();
      g.moveTo(x + 76, y + 10);
      g.lineTo(x + 84, y + 22);
      g.lineTo(x + 84, y + 38);
      g.lineTo(x + 76, y + 38);
      g.closePath();
      g.fill();

      // Iconic Bangladesh Railway Crimson Speed Stripe
      g.fillStyle = secondaryRed;
      g.fillRect(x, y + 24, 82, 5);
      // Cream accent stripe
      g.fillStyle = '#FEF08A';
      g.fillRect(x, y + 29, 81, 2);

      // Cab front window & side windows
      g.fillStyle = '#0284C7';
      // Front windshield (facing right)
      g.fillRect(x + 64, y + 8, 12, 10);
      // Side cab window
      g.fillRect(x + 46, y + 8, 14, 10);

      // Driver silhouette
      g.fillStyle = '#0F172A';
      g.fillRect(x + 68, y + 12, 5, 6);

      // Roof Radiator & Exhaust chimney
      g.fillStyle = '#1E293B';
      g.fillRect(x + 18, y, 24, 4); // radiator fan housing
      g.fillRect(x + 24, y - 4, 6, 4); // exhaust stack

      // Air Horn
      g.fillStyle = '#EAB308';
      g.fillRect(x + 60, y + 1, 8, 3);

      // Headlight lamp housing
      g.fillStyle = '#FEF08A';
      g.fillRect(x + 82, y + 26, 4, 5);
      g.strokeStyle = '#000000';
      g.lineWidth = 1;
      g.strokeRect(x + 82, y + 26, 4, 5);

      // Front Cowcatcher plow
      g.fillStyle = '#B91C1C';
      g.beginPath();
      g.moveTo(x + 82, y + 36);
      g.lineTo(x + 89, y + 38);
      g.lineTo(x + 82, y + 40);
      g.closePath();
      g.fill();
    }

    // Bogie frame & rotating wheels
    this.drawBogiesAndWheels(g, x, y + 36, 76);
  }

  /**
   * Shovon Chair Coach (Classic BR green with red stripes and window grills)
   */
  private drawShovonCoach(g: CanvasRenderingContext2D, x: number, y: number, timePeriod: TimePeriod) {
    const isNight = timePeriod === 'night' || timePeriod === 'dusk';

    // Body
    g.fillStyle = '#15803D';
    g.fillRect(x, y + 6, 86, 32);

    // Curved roof
    g.fillStyle = '#475569';
    g.fillRect(x - 1, y + 3, 88, 4);

    // BR Red livery band
    g.fillStyle = '#DC2626';
    g.fillRect(x, y + 24, 86, 4);
    g.fillStyle = '#FEF08A';
    g.fillRect(x, y + 28, 86, 2);

    // Windows with warm light if night
    const windowColor = isNight ? '#FEF08A' : '#7DD3FC';
    for (let w = 0; w < 4; w++) {
      const wx = x + 10 + w * 18;
      g.fillStyle = windowColor;
      g.fillRect(wx, y + 10, 13, 10);
      // Window frame & bars
      g.strokeStyle = '#1E293B';
      g.lineWidth = 1;
      g.strokeRect(wx, y + 10, 13, 10);
      g.beginPath();
      g.moveTo(wx + 6.5, y + 10);
      g.lineTo(wx + 6.5, y + 20);
      g.stroke();

      // Passenger silhouettes inside
      if (w % 2 === 0) {
        g.fillStyle = '#1E293B';
        g.fillRect(wx + 4, y + 14, 5, 6);
      }
    }

    // Bogies & wheels
    this.drawBogiesAndWheels(g, x, y + 36, 86);
  }

  /**
   * Bhojon Gari (Dining Car with Tea/Singara service)
   */
  private drawBhojonCoach(g: CanvasRenderingContext2D, x: number, y: number, timePeriod: TimePeriod) {
    const isNight = timePeriod === 'night' || timePeriod === 'dusk';

    // Body (Deep maroon and gold)
    g.fillStyle = '#831843';
    g.fillRect(x, y + 6, 86, 32);

    // Roof
    g.fillStyle = '#64748B';
    g.fillRect(x - 1, y + 3, 88, 4);

    // Gold stripes
    g.fillStyle = '#F59E0B';
    g.fillRect(x, y + 24, 86, 4);

    // Dining windows with curtains / warm light
    const windowColor = isNight ? '#FDE047' : '#BAE6FD';
    for (let w = 0; w < 4; w++) {
      const wx = x + 10 + w * 18;
      g.fillStyle = windowColor;
      g.fillRect(wx, y + 10, 13, 10);
      // Red curtains
      g.fillStyle = '#BE123C';
      g.fillRect(wx, y + 10, 3, 10);
      g.fillRect(wx + 10, y + 10, 3, 10);
      g.strokeStyle = '#334155';
      g.lineWidth = 1;
      g.strokeRect(wx, y + 10, 13, 10);
    }

    // Pantry vent chimney on roof with tiny puff of steam
    g.fillStyle = '#CBD5E1';
    g.fillRect(x + 40, y, 5, 4);

    this.drawBogiesAndWheels(g, x, y + 36, 86);
  }

  /**
   * Snigdha AC Coach (Modern Silver-Green livery)
   */
  private drawSnigdhaCoach(g: CanvasRenderingContext2D, x: number, y: number, timePeriod: TimePeriod) {
    const isNight = timePeriod === 'night' || timePeriod === 'dusk';

    // Modern sleek silver body
    g.fillStyle = '#E2E8F0';
    g.fillRect(x, y + 6, 86, 32);

    // Aerodynamic silver-grey roof
    g.fillStyle = '#94A3B8';
    g.fillRect(x - 1, y + 3, 88, 4);

    // Emerald AC band
    g.fillStyle = '#059669';
    g.fillRect(x, y + 24, 86, 4);

    // Wide tinted panoramic windows
    const winColor = isNight ? '#FDE047' : '#0369A1';
    for (let w = 0; w < 3; w++) {
      const wx = x + 10 + w * 24;
      g.fillStyle = winColor;
      g.fillRect(wx, y + 10, 18, 10);
      g.strokeStyle = '#64748B';
      g.lineWidth = 1;
      g.strokeRect(wx, y + 10, 18, 10);
    }

    this.drawBogiesAndWheels(g, x, y + 36, 86);
  }

  /**
   * Guard Caboose with blinking tail marker
   */
  private drawGuardCaboose(g: CanvasRenderingContext2D, x: number, y: number) {
    // Body
    g.fillStyle = '#15803D';
    g.fillRect(x, y + 6, 86, 32);

    // Roof with lookout cupola / observation dome
    g.fillStyle = '#475569';
    g.fillRect(x - 1, y + 3, 88, 4);
    g.fillStyle = '#334155';
    g.fillRect(x + 12, y - 2, 22, 6);

    // Red band
    g.fillStyle = '#DC2626';
    g.fillRect(x, y + 24, 86, 4);

    // Cargo roll-up doors
    g.fillStyle = '#64748B';
    g.fillRect(x + 36, y + 10, 24, 18);
    // Door slats
    g.strokeStyle = '#334155';
    g.lineWidth = 1;
    for (let s = y + 13; s < y + 27; s += 3) {
      g.beginPath();
      g.moveTo(x + 36, s);
      g.lineTo(x + 60, s);
      g.stroke();
    }

    // Rear Guard lookout platform
    g.fillStyle = '#1E293B';
    g.fillRect(x - 6, y + 14, 7, 24);

    // Blinking red tail lamp at rear
    const isLampOn = Math.floor(performance.now() * 0.003) % 2 === 0;
    if (isLampOn) {
      g.fillStyle = '#EF4444';
      g.beginPath();
      g.arc(x - 3, y + 18, 3, 0, Math.PI * 2);
      g.fill();

      // Tail light red glow halo
      const glow = g.createRadialGradient(x - 3, y + 18, 1, x - 3, y + 18, 10);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x - 3, y + 18, 10, 0, Math.PI * 2);
      g.fill();
    }

    this.drawBogiesAndWheels(g, x, y + 36, 86);
  }

  /**
   * Rotating bogie wheels & suspension springs
   */
  private drawBogiesAndWheels(g: CanvasRenderingContext2D, x: number, y: number, width: number) {
    // Two bogies per coach: front and rear
    const bogie1X = x + 16;
    const bogie2X = x + width - 16;

    [bogie1X, bogie2X].forEach((bx) => {
      // Bogie dark metal frame
      g.fillStyle = '#0F172A';
      g.fillRect(bx - 12, y, 24, 4);

      // Two wheels per bogie
      [-7, 7].forEach((wx) => {
        const cx = bx + wx;
        const cy = y + 4;
        const r = 5;

        // Outer steel tyre
        g.fillStyle = '#334155';
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();

        // Inner hub
        g.fillStyle = '#64748B';
        g.beginPath();
        g.arc(cx, cy, 2.5, 0, Math.PI * 2);
        g.fill();

        // Rotating spoke highlight
        const spokeX = cx + Math.cos(this.wheelAngle) * 3.5;
        const spokeY = cy + Math.sin(this.wheelAngle) * 3.5;
        g.fillStyle = '#E2E8F0';
        g.fillRect(spokeX - 0.5, spokeY - 0.5, 1.5, 1.5);
      });
    });
  }

  private renderSmoke(g: CanvasRenderingContext2D) {
    this.smokeParticles.forEach((p) => {
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), 0, Math.PI * 2);
      g.fill();
    });
  }

  private renderForeground(g: CanvasRenderingContext2D, landscape: LandscapeType) {
    const fgY = 278;
    const spacing = 120;
    const offset = this.scrollOffsetForeground;

    // Silhouette foreground vegetation rushing past
    g.fillStyle = '#022C22'; // Deep forest silhouette

    for (let i = -1; i < 7; i++) {
      const baseX = Math.floor(i * spacing - (offset % spacing));

      // Kashful (Tall White Autumn Catkin grass plumes)
      if (landscape === 'rural_paddy' || landscape === 'mustard_fields') {
        const kashX = baseX + 25;
        // Stems
        g.fillRect(kashX, fgY - 26, 2, 26);
        g.fillRect(kashX + 6, fgY - 32, 2, 32);
        // White fluffy plumes
        g.fillStyle = 'rgba(241, 245, 249, 0.7)';
        g.fillRect(kashX - 2, fgY - 36, 5, 12);
        g.fillRect(kashX + 4, fgY - 42, 6, 14);
        g.fillStyle = '#022C22';
      }

      // Wild ferns / reeds
      const fernX = baseX + 80;
      g.fillRect(fernX, fgY - 14, 18, 14);
      g.fillRect(fernX + 4, fgY - 20, 10, 6);
    }
  }

  private renderWeatherEffects(g: CanvasRenderingContext2D, weather: WeatherPreset) {
    if (weather === 'monsoon_rain' || weather === 'thunderstorm') {
      // Falling rain streaks
      g.strokeStyle = weather === 'thunderstorm' ? '#93C5FD' : '#BAE6FD';
      g.lineWidth = 1;
      g.beginPath();
      this.rainParticles.forEach((r) => {
        g.moveTo(Math.floor(r.x), Math.floor(r.y));
        g.lineTo(Math.floor(r.x + (r.vx * 0.03)), Math.floor(r.y + (r.vy * 0.03)));
      });
      g.stroke();

      // Splashes
      g.fillStyle = '#E0F2FE';
      this.rainSplashParticles.forEach((s) => {
        g.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      });
    }

    if (weather === 'foggy') {
      // Multi-layer drifting translucent fog bands
      const time = performance.now() * 0.0008;
      for (let i = 0; i < 4; i++) {
        const fogY = 140 + i * 36;
        const fogAlpha = 0.25 + Math.sin(time + i) * 0.08;
        g.fillStyle = `rgba(226, 232, 240, ${fogAlpha})`;
        g.fillRect(0, fogY, this.V_WIDTH, 26);
      }
    }

    if (weather === 'thunderstorm' && this.lightningActive) {
      // Blinding white flash overlay
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      g.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

      // Jagged lightning bolt
      g.strokeStyle = '#FFFFFF';
      g.lineWidth = 2;
      g.beginPath();
      let lx = 340 + Math.random() * 80;
      let ly = 10;
      g.moveTo(lx, ly);
      for (let s = 0; s < 6; s++) {
        lx += (Math.random() - 0.5) * 40;
        ly += 25 + Math.random() * 15;
        g.lineTo(lx, ly);
      }
      g.stroke();
    }
  }

  private renderAtmosphericLighting(g: CanvasRenderingContext2D, timePeriod: TimePeriod) {
    const palette = SKY_PALETTES[timePeriod];
    if (palette.tintOverlay) {
      g.fillStyle = palette.tintOverlay;
      g.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);
    }
  }

  private blitToScreen() {
    const screenW = this.canvas.width;
    const screenH = this.canvas.height;

    // Draw offscreen buffer scaled up with crisp pixel interpolation
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, screenW, screenH);
    this.ctx.drawImage(this.offCanvas, 0, 0, screenW, screenH);
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }

  public destroy() {
    this.stop();
  }
}
