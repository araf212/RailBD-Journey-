export type WeatherPreset = 
  | 'sunny' 
  | 'partly_cloudy' 
  | 'overcast' 
  | 'monsoon_rain' 
  | 'foggy' 
  | 'thunderstorm';

export type TimePeriod = 
  | 'dawn' 
  | 'morning' 
  | 'noon' 
  | 'afternoon' 
  | 'sunset' 
  | 'dusk' 
  | 'night';

export type LandscapeType = 
  | 'urban_departure' 
  | 'suburban_groves' 
  | 'rural_paddy' 
  | 'mustard_fields' 
  | 'river_crossing_jamuna' 
  | 'river_crossing_meghna' 
  | 'tea_gardens' 
  | 'historic_junction' 
  | 'station_platform';

export type CarriageType = 
  | 'loco_br_2900' 
  | 'loco_express_3000' 
  | 'loco_heritage_steam' 
  | 'shovon_chair' 
  | 'snigdha_ac' 
  | 'bhojon_dining' 
  | 'mail_luggage' 
  | 'chai_cafe' 
  | 'guard_caboose';

export type StationCategory = 
  | 'major_terminal' 
  | 'intercity_junction' 
  | 'local_station' 
  | 'rural_halt';

export interface LandmarkInfo {
  name: string;
  category: 'architecture' | 'engineering' | 'heritage' | 'culture_food' | 'nature';
  description: string;
  badgeIcon: 'lotus_roof' | 'bridge_truss' | 'water_tower' | 'tea_leaf' | 'sweets' | 'baul_ektara' | 'port_ship' | 'palm_groves';
  historicalYear?: string;
}

export interface Station {
  id: string;
  nameEn: string;
  nameBn: string;
  code: string;
  lat: number;
  lng: number;
  kmFromOrigin: number;
  division: string;
  district: string;
  category: StationCategory;
  crowdDensity: 'dense' | 'medium' | 'sparse';
  scenicFeatures: string;
  trivia: string;
  history: string;
  landmark: LandmarkInfo;
  announcementTextBn: string;
  announcementTextEn: string;
  isJunction?: boolean;
  platformCount: number;
}

export interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  startKm: number;
  endKm: number;
  lengthKm: number;
  landscapeType: LandscapeType;
  landscapeName: string;
  bridgeName?: string;
  riverName?: string;
  defaultSpeedLimitKmH: number;
  description: string;
  hasLevelCrossing?: boolean;
}

export interface RailwayRoute {
  id: string;
  nameEn: string;
  nameBn: string;
  trainNameEn: string;
  trainNameBn: string;
  trainNo: string;
  originStationId: string;
  destStationId: string;
  totalDistanceKm: number;
  verified: boolean;
  provenance: string;
  stations: Station[];
  segments: RouteSegment[];
  coordinates: [number, number][]; // [longitude, latitude] for map paths
}

export interface TrainCar {
  id: string;
  type: CarriageType;
  name: string;
  description: string;
}

export interface AudioSettings {
  masterVolume: number;
  trainVolume: number;
  hornVolume: number;
  stationVolume: number;
  announcementVolume: number;
  weatherVolume: number;
  environmentVolume: number;
  isMuted: boolean;
  autoHornEnabled: boolean;
  autoAnnouncementsEnabled: boolean;
  ambientEnabled: boolean;
  reducedAudioEffects: boolean;
}
