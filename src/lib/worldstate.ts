import type { WorldState, ArtParams } from '@/types/worldstate'
import { scaleLinear } from 'd3-scale'

// ─── WorldState → ArtParams (D3 scales) ───────────────────────────────────────
// These mappings are the "soul" of El Ojo: real world → visual params

export function deriveArtParams(ws: WorldState): ArtParams {
  // Wind speed (0–100 km/h) → particle speed (0–1)
  const particleSpeed = scaleLinear().domain([0, 80]).range([0, 1]).clamp(true)(ws.clima.wind)

  // Kp index (0–9) → storminess (0–1)
  const storminess = scaleLinear().domain([0, 9]).range([0, 1]).clamp(true)(ws.cosmos.kpIndex)

  // Volatility (0–100%) → chaos (0–1)
  const chaos = scaleLinear().domain([0, 60]).range([0, 1]).clamp(true)(ws.economia.volatilityIndex)

  // Temperature (-20°C to 45°C) → warmth (0=cold blue, 1=warm amber)
  const warmth = scaleLinear().domain([-20, 45]).range([0, 1]).clamp(true)(ws.clima.temp)

  // Seismic magnitude (0–8) → shockwave intensity (0–1)
  const shockwaveIntensity = scaleLinear().domain([0, 8]).range([0, 1]).clamp(true)(ws.tierra.nearestMagnitude)

  // Wind direction (degrees) → field angle (radians)
  const fieldAngle = (ws.clima.windDir * Math.PI) / 180

  // Event tone (-100 to +100) → entropy (conflict = high entropy)
  const entropy = scaleLinear().domain([-100, 100]).range([1, 0]).clamp(true)(ws.eventos.toneScore)

  // UV index (0–11) → brightness (0.1–0.9)
  const brightness = scaleLinear().domain([0, 11]).range([0.1, 0.9]).clamp(true)(ws.clima.uv)

  // Humidity (0–100%) → density (0.1–1)
  const density = scaleLinear().domain([0, 100]).range([0.1, 1]).clamp(true)(ws.clima.humidity)

  // Wikipedia top theme → hue shift (degrees added to primaryHue)
  const PALETTE_HUE: Record<string, number> = {
    conflict:  -45,  // toward red
    science:    35,  // toward cyan
    sports:     80,  // toward green
    politics:    0,  // stays amber
    culture:   -20,  // toward violet
    default:     0,
  }
  const paletteHueShift = PALETTE_HUE[ws.atencion.palette] ?? 0

  // Solar wind speed (300–800 km/s) → aurora intensity (0–1)
  const solarWindSpeed = scaleLinear().domain([300, 800]).range([0, 1]).clamp(true)(ws.cosmos.solarWind)

  // Nearest quake distance (0–500 km) → proximity (near=1, far=0)
  const quakeProximity = scaleLinear().domain([500, 0]).range([0, 1]).clamp(true)(ws.tierra.nearestDistanceKm)

  // Total quakes last hour (0–20) → activity (0–1)
  const quakeActivity = scaleLinear().domain([0, 20]).range([0, 1]).clamp(true)(ws.tierra.totalLastHour)

  return {
    particleSpeed,
    storminess,
    chaos,
    warmth,
    shockwaveIntensity,
    fieldAngle,
    entropy,
    brightness,
    density,
    paletteHueShift,
    solarWindSpeed,
    trendDir: ws.economia.trendDir,
    quakeProximity,
    quakeActivity,
    // Solar
    isDaylight: ws.solar.isDaylight,
    sunElevation: ws.solar.sunElevation / 90,
    // Trending
    trendingKeyword: ws.trending.keyword,
    trendingIntensity: ws.trending.score,
    // Traffic + crowd
    trafficDensity: ws.trafico.density,
    crowdDensity: ws.afluencia.density,
  }
}

// ─── Fetch WorldState from API route ──────────────────────────────────────────

export async function fetchWorldState(lat: number, lng: number): Promise<WorldState> {
  const res = await fetch(`/api/world-state?lat=${lat}&lng=${lng}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const json = await res.json()

  if (json.error || !json.data) {
    throw new Error(json.error ?? 'No data returned')
  }

  return json.data as WorldState
}

// ─── Deterministic seed → PRNG float 0–1 ─────────────────────────────────────

export function seedToNumber(seed: string): number {
  return parseInt(seed.slice(0, 8), 16) / 0xffffffff
}

// ─── Share URL builder (deterministic) ────────────────────────────────────────

// Lookup tables for compact encoding
const TREND_DIRS = ['up', 'down', 'neutral'] as const
const THEMES = ['conflict', 'economy', 'science', 'culture', 'sports', 'politics', 'default']

interface SharePayload {
  s: string    // seed
  cc: string   // cityCode
  cn?: string  // city name
  e: number    // edition
  t: number    // temp
  w: number    // wind
  wd: number   // windDir
  uv: number   // uv
  h: number    // humidity
  kp: number   // kpIndex
  sw: number   // solarWind
  vi: number   // volatilityIndex
  td: number   // trendDir index (0=up,1=down,2=neutral)
  ts: number   // toneScore
  mm: number   // nearestMagnitude
  md: number   // nearestDistanceKm
  mq: number   // totalLastHour
  at: number   // atencion topTheme index
  dl: number   // isDaylight (0|1)
  se: number   // sunElevation
  tk: string   // trending keyword
  tsc: number  // trending score (0–100)
  tf: number   // trafico density (0–100)
  af: number   // afluencia density (0–100)
}

function encodeSharePayload(ws: WorldState): string {
  const payload: SharePayload = {
    s: ws.seed,
    cc: ws.location.cityCode ?? 'UNK',
    cn: ws.location.city,
    e: ws.editionNumber,
    t: Math.round(ws.clima.temp * 10) / 10,
    w: Math.round(ws.clima.wind),
    wd: Math.round(ws.clima.windDir),
    uv: Math.round(ws.clima.uv * 10) / 10,
    h: Math.round(ws.clima.humidity),
    kp: Math.round(ws.cosmos.kpIndex * 10) / 10,
    sw: Math.round(ws.cosmos.solarWind),
    vi: Math.round(ws.economia.volatilityIndex * 10) / 10,
    td: TREND_DIRS.indexOf(ws.economia.trendDir),
    ts: Math.round(ws.eventos.toneScore),
    mm: Math.round(ws.tierra.nearestMagnitude * 10) / 10,
    md: Math.round(ws.tierra.nearestDistanceKm),
    mq: ws.tierra.totalLastHour,
    at: THEMES.indexOf(ws.atencion.topTheme),
    dl: ws.solar.isDaylight ? 1 : 0,
    se: Math.round(ws.solar.sunElevation * 10) / 10,
    tk: (ws.trending.keyword ?? 'RESONANCE').slice(0, 20),
    tsc: Math.round((ws.trending.score ?? 0.5) * 100),
    tf: Math.round((ws.trafico.density ?? 0.3) * 100),
    af: Math.round((ws.afluencia.density ?? 0.3) * 100),
  }
  // base64url encode (no padding)
  const json = JSON.stringify(payload)
  if (typeof window !== 'undefined') {
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  return Buffer.from(json).toString('base64url')
}

export function decodeSharePayload(encoded: string): WorldState | null {
  try {
    let json: string
    if (typeof window !== 'undefined') {
      // Restore base64 padding
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const rem = padded.length % 4
      const withPad = rem === 0 ? padded : padded + '='.repeat(4 - rem)
      json = atob(withPad)
    } else {
      json = Buffer.from(encoded, 'base64url').toString('utf8')
    }
    const p: SharePayload = JSON.parse(json)

    const trendDir = TREND_DIRS[p.td] ?? 'neutral'
    const topTheme = THEMES[p.at] ?? 'culture'
    const topArticles: string[] = []

    const ws: WorldState = {
      location: {
        lat: 0,  // will be set from URL lat/lng params
        lng: 0,
        city: p.cn,
        cityCode: p.cc,
      },
      clima: { temp: p.t, wind: p.w, windDir: p.wd, uv: p.uv, humidity: p.h },
      cosmos: { kpIndex: p.kp, solarWind: p.sw },
      economia: { volatilityIndex: p.vi, trendDir },
      eventos: { toneScore: p.ts, conflictDensity: Math.max(0, -p.ts) / 100, dominantTheme: topTheme },
      tierra: { nearestMagnitude: p.mm, nearestDistanceKm: p.md, totalLastHour: p.mq },
      atencion: { topTheme, palette: topTheme, topArticles },
      solar: { isDaylight: p.dl === 1, sunElevation: p.se, uvIndex: p.uv },
      trending: { keyword: p.tk, score: p.tsc / 100, source: 'synthetic' },
      trafico: { density: p.tf / 100, speedRatio: 1 - p.tf / 100, source: 'synthetic' },
      afluencia: { density: p.af / 100, peakHour: false, source: 'synthetic' },
      apiHealth: {},
      generatedAt: new Date().toISOString(),
      seed: p.s,
      editionNumber: p.e,
    }
    return ws
  } catch {
    return null
  }
}

export function buildShareUrl(ws: WorldState): string {
  const params = new URLSearchParams({
    lat: String(Math.round(ws.location.lat * 10000) / 10000),
    lng: String(Math.round(ws.location.lng * 10000) / 10000),
    d: encodeSharePayload(ws),
  })
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/?${params.toString()}`
}
