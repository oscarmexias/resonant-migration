// WorldState — the data object that drives all art generation
// All fields are mapped to visual parameters in ArtCanvasInner

export interface WorldStateLocation {
  lat: number
  lng: number
  city?: string      // nombre largo desde Nominatim (ej. "Ciudad de México")
  cityCode?: string  // sigla para el pixel art (ej. "CDMX", "MAD", "NYC")
  timezone?: string
}

export interface WorldStateClima {
  temp: number          // °C → color temperature
  wind: number          // km/h → particle speed
  windDir: number       // 0-360° → field direction
  uv: number            // 0-11 → brightness
  humidity: number      // 0-100 → density
}

export interface WorldStateEventos {
  toneScore: number        // -100 to +100 → angularity vs flow
  conflictDensity: number  // 0-1 → visual entropy
  dominantTheme: string    // 'conflict' | 'economy' | 'science' | 'culture'
}

export interface WorldStateCosmos {
  kpIndex: number    // 0-9 → storm intensity
  solarWind: number  // km/s → aurora effects
}

export interface WorldStateEconomia {
  volatilityIndex: number           // 0-100% → visual chaos
  trendDir: 'up' | 'down' | 'neutral'
}

export interface WorldStateAtencion {
  topTheme: string     // 'science' | 'conflict' | 'culture' | 'sports' | 'politics'
  palette: string      // color theme key
  topArticles: string[]
}

export interface WorldStateTierra {
  nearestMagnitude: number    // Richter → shockwave rings
  nearestDistanceKm: number   // km → ring radius
  totalLastHour: number       // count → tremor animation intensity
}

export interface WorldStateSolar {
  isDaylight: boolean       // true if sun is above horizon at location
  sunElevation: number      // degrees -90 to +90 (negative = below horizon)
  uvIndex: number           // 0-11 (reuses clima.uv but with day/night awareness)
}

export interface WorldStateTrending {
  keyword: string           // top trending word/phrase (≤20 chars)
  score: number             // 0-1 normalized engagement
  source: 'twitter' | 'wikipedia' | 'synthetic'
}

export interface WorldStateTrafico {
  density: number           // 0-1 (0=free flowing, 1=gridlock)
  speedRatio: number        // current/free-flow ratio 0-1 (1=free, 0=stopped)
  source: 'tomtom' | 'synthetic'
}

export interface WorldStateAfluencia {
  density: number           // 0-1 (0=empty, 1=packed)
  peakHour: boolean         // is it a typical peak hour?
  source: 'synthetic'
}

export interface ApiHealthEntry {
  status: 'live' | 'fallback' | 'simulated'
  latencyMs?: number
}

export interface WorldState {
  location: WorldStateLocation
  clima: WorldStateClima
  eventos: WorldStateEventos
  cosmos: WorldStateCosmos
  economia: WorldStateEconomia
  atencion: WorldStateAtencion
  tierra: WorldStateTierra
  solar: WorldStateSolar
  trending: WorldStateTrending
  trafico: WorldStateTrafico
  afluencia: WorldStateAfluencia
  apiHealth: Record<string, ApiHealthEntry>
  generatedAt: string    // ISO timestamp
  seed: string           // SHA256 of all values — deterministic art recreation
  editionNumber: number  // Global sequential counter (DB in Phase B)
}

// Art generation parameters — derived from WorldState via D3 scales
export interface ArtParams {
  particleSpeed: number       // 0-1  wind speed → particle velocity
  storminess: number          // 0-1  kp index → particle size + field strength
  chaos: number               // 0-1  crypto volatility → color saturation + jitter
  warmth: number              // 0-1  temperature → hue (blue↔amber)
  shockwaveIntensity: number  // 0-1  seismic magnitude → ring count + size
  fieldAngle: number          // radians  wind direction → particle drift angle
  entropy: number             // 0-1  GDELT tone → trail fade speed
  brightness: number          // 0-1  UV index → alpha
  density: number             // 0-1  humidity → particle count
  paletteHueShift: number     // degrees  Wikipedia top theme → hue offset
  solarWindSpeed: number      // 0-1  NOAA solar wind → aurora intensity at top
  trendDir: 'up' | 'down' | 'neutral'  // CoinGecko trend → vertical particle bias
  quakeProximity: number      // 0-1  nearest quake distance → ring pulse speed
  quakeActivity: number       // 0-1  total quakes last hour → ring opacity
  isDaylight: boolean           // day/night switch
  sunElevation: number          // -1 to +1 normalized (-90° to +90°)
  trendingKeyword: string       // trending word to render as text
  trendingIntensity: number     // 0-1 engagement score
  trafficDensity: number        // 0-1 road density
  crowdDensity: number          // 0-1 people density
}

// API route response
export interface WorldStateAPIResponse {
  data: WorldState | null
  error: string | null
  cached: boolean
  fetchedAt: string
}

// Signal loading status
export type SignalStatus = 'idle' | 'loading' | 'success' | 'error'

export interface SignalState {
  clima: SignalStatus
  eventos: SignalStatus
  cosmos: SignalStatus
  economia: SignalStatus
  atencion: SignalStatus
  tierra: SignalStatus
}

// Fallback WorldState when APIs fail
export const FALLBACK_WORLDSTATE: Omit<WorldState, 'location' | 'generatedAt' | 'seed' | 'editionNumber'> = {
  clima: { temp: 20, wind: 10, windDir: 0, uv: 3, humidity: 60 },
  eventos: { toneScore: 0, conflictDensity: 0.3, dominantTheme: 'culture' },
  cosmos: { kpIndex: 2, solarWind: 400 },
  economia: { volatilityIndex: 20, trendDir: 'neutral' },
  atencion: { topTheme: 'science', palette: 'default', topArticles: [] },
  tierra: { nearestMagnitude: 0, nearestDistanceKm: 9999, totalLastHour: 0 },
  solar: { isDaylight: true, sunElevation: 45, uvIndex: 3 },
  trending: { keyword: 'RESONANCE', score: 0.5, source: 'synthetic' as const },
  trafico: { density: 0.3, speedRatio: 0.7, source: 'synthetic' as const },
  afluencia: { density: 0.3, peakHour: false, source: 'synthetic' as const },
  apiHealth: {},
}
