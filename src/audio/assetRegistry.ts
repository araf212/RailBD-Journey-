/**
 * Centralized Audio Asset Registry for RailBD Journey
 * Catalogs sound assets, playback strategies, licenses, and procedural synthesis mappings.
 */

export type AudioCategory = 
  | 'train' 
  | 'horn' 
  | 'station' 
  | 'crowd' 
  | 'announcements' 
  | 'weather' 
  | 'environment' 
  | 'ui';

export type SoundType = 'procedural_synth' | 'audio_file' | 'speech_synthesis';

export interface AudioAsset {
  id: string;
  category: AudioCategory;
  name: string;
  filePath?: string;
  soundType: SoundType;
  description: string;
  license: string;
  source: string;
  isAvailableLocally: boolean;
  loop?: boolean;
}

export const AUDIO_MANIFEST: Record<string, AudioAsset> = {
  // 1. Train Movement
  'train_wheels_rolling': {
    id: 'train_wheels_rolling',
    category: 'train',
    name: 'Continuous Steel Wheels Rolling',
    filePath: '/audio/train/wheels_rolling_continuous.wav',
    soundType: 'procedural_synth',
    description: 'Continuous filtered mechanical rumble and rail friction tuned to current train speed.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API BiquadFilter + Brown Noise Node',
    isAvailableLocally: true,
    loop: true,
  },
  'train_click_clack': {
    id: 'train_click_clack',
    category: 'train',
    name: 'Track Joint Clatter (Rhythmic Click-Clack)',
    filePath: '/audio/train/track_joint_click_clack.wav',
    soundType: 'procedural_synth',
    description: 'Authentic 4-beat bogie joint impulse with randomized natural micro-timing jitter.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Multi-harmonic Damped Resonator',
    isAvailableLocally: true,
    loop: false,
  },
  'train_diesel_rumble': {
    id: 'train_diesel_rumble',
    category: 'train',
    name: 'Class 2900 EMD V12 Diesel Engine Throbbing',
    filePath: '/audio/train/emd_diesel_v12_rumble.wav',
    soundType: 'procedural_synth',
    description: 'Low-frequency 55-80 Hz 2-stroke diesel engine throb scaling with throttle.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Sub-harmonic Oscillator Bus',
    isAvailableLocally: true,
    loop: true,
  },
  'train_brake_squeal': {
    id: 'train_brake_squeal',
    category: 'train',
    name: 'Cast Iron Brake Shoe Squeal',
    filePath: '/audio/train/brake_shoe_squeal.wav',
    soundType: 'procedural_synth',
    description: 'High-frequency 3.1 kHz metallic resonance triggered during sharp deceleration.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API High-Q Bandpass Filter',
    isAvailableLocally: true,
    loop: false,
  },
  'train_air_brake_release': {
    id: 'train_air_brake_release',
    category: 'train',
    name: 'Pneumatic Air Brake Release Hiss',
    filePath: '/audio/train/air_brake_release_whoosh.wav',
    soundType: 'procedural_synth',
    description: 'Distinctive "pshh-t!" pneumatic pressure exhaust upon coming to a complete stop.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API White Noise Envelope',
    isAvailableLocally: true,
    loop: false,
  },

  // 2. Locomotive Horns
  'horn_br_diesel_long': {
    id: 'horn_br_diesel_long',
    category: 'horn',
    name: 'Dual-Tone Locomotive Air Horn (Long Blast)',
    filePath: '/audio/horn/br_diesel_airhorn_long.wav',
    soundType: 'procedural_synth',
    description: 'Authentic Eb4 (311Hz) + G4 (392Hz) + Bb4 chorded chime air horn of Bangladesh Railway.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Multi-oscillator Chime',
    isAvailableLocally: true,
  },
  'horn_br_diesel_short': {
    id: 'horn_br_diesel_short',
    category: 'horn',
    name: 'Dual-Tone Locomotive Air Horn (Warning Toot)',
    filePath: '/audio/horn/br_diesel_airhorn_short.wav',
    soundType: 'procedural_synth',
    description: 'Short 0.3s warning tap used when approaching level crossings.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Multi-oscillator Chime',
    isAvailableLocally: true,
  },

  // 3. Station Ambience
  'station_crowd_murmur': {
    id: 'station_crowd_murmur',
    category: 'crowd',
    name: 'Bengal Platform Crowd Chatter & Murmur',
    filePath: '/audio/crowd/station_platform_crowd_murmur.wav',
    soundType: 'procedural_synth',
    description: 'Layered formant vocal tract resonances simulating station platform passenger bustle.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Multi-Bandpass Filtered Noise',
    isAvailableLocally: true,
    loop: true,
  },
  'station_tea_vendor': {
    id: 'station_tea_vendor',
    category: 'station',
    name: 'Platform Tea Stall Ambience',
    filePath: '/audio/station/cha_vendor_cups_activity.wav',
    soundType: 'procedural_synth',
    description: 'Steaming kettle hiss, metallic spoon clinks, and cup rattles.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Resonant Impulse Array',
    isAvailableLocally: true,
  },
  'station_departure_bell': {
    id: 'station_departure_bell',
    category: 'station',
    name: 'Station Brass Departure Bell',
    filePath: '/audio/station/station_brass_bell.wav',
    soundType: 'procedural_synth',
    description: 'Rich metallic brass gong ringing before train leaves platform.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Additive Harmonic Synthesizer',
    isAvailableLocally: true,
  },

  // 4. Announcements
  'announcement_chime': {
    id: 'announcement_chime',
    category: 'announcements',
    name: 'Public Address 3-Tone Railway Chime',
    filePath: '/audio/announcements/pa_chime_ding_dong.wav',
    soundType: 'procedural_synth',
    description: 'Classic ding-dong-ding chime preceding railway station announcements.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Pure Sine Chime',
    isAvailableLocally: true,
  },
  'announcement_voice_bilingual': {
    id: 'announcement_voice_bilingual',
    category: 'announcements',
    name: 'Bilingual Station Arrival Announcement (Bengali / English)',
    filePath: '/audio/announcements/station_announcement_bilingual.mp3',
    soundType: 'speech_synthesis',
    description: 'Public address voice announcement customized for the specific arriving station.',
    license: 'Web Speech API / Procedural Voice Synthesis',
    source: 'Browser Native Web Speech Synthesis Engine',
    isAvailableLocally: true,
  },

  // 5. Weather
  'weather_rain_monsoon': {
    id: 'weather_rain_monsoon',
    category: 'weather',
    name: 'Bengal Monsoon Rain on Tin Roof & Track',
    filePath: '/audio/weather/monsoon_rain_tin_roof.wav',
    soundType: 'procedural_synth',
    description: 'Continuous rainfall with roof droplet impact resonances.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Dual-filtered Noise Shaper',
    isAvailableLocally: true,
    loop: true,
  },
  'weather_thunder_rumble': {
    id: 'weather_thunder_rumble',
    category: 'weather',
    name: 'Kalbaishakhi Storm Thunder Crack & Rumble',
    filePath: '/audio/weather/thunder_rumble_kalbaishakhi.wav',
    soundType: 'procedural_synth',
    description: 'Low 30-140 Hz acoustic shockwave followed by long reverberant decay.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Exponential Down-chirp Oscillator',
    isAvailableLocally: true,
  },
  'weather_wind_breeze': {
    id: 'weather_wind_breeze',
    category: 'weather',
    name: 'Open Countryside Wind & Mist Breeze',
    filePath: '/audio/weather/countryside_wind_mist.wav',
    soundType: 'procedural_synth',
    description: 'Low-frequency undulating wind noise modulated by train speed.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Lowpass Noise Sweeper',
    isAvailableLocally: true,
    loop: true,
  },

  // 6. Environment
  'env_rural_birds': {
    id: 'env_rural_birds',
    category: 'environment',
    name: 'Rural Morning Birds (Doyel & Cuckoo)',
    filePath: '/audio/environment/bengal_rural_birds.wav',
    soundType: 'procedural_synth',
    description: 'Gentle chirps and songs of Bengal native birds during daytime countryside segments.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API FM Modulated Chirp Generator',
    isAvailableLocally: true,
  },
  'env_night_crickets': {
    id: 'env_night_crickets',
    category: 'environment',
    name: 'Bengal Night Field Crickets',
    filePath: '/audio/environment/night_field_crickets.wav',
    soundType: 'procedural_synth',
    description: 'High-pitched 4.6 kHz rhythmic cricket chirping during dusk and night.',
    license: 'Custom Procedural Web Audio Synthesis (CC0 / Open Domain)',
    source: 'Built-in Web Audio API Dual High-frequency Sine Pulser',
    isAvailableLocally: true,
  },
};
