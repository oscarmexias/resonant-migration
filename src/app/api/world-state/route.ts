import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import type {
  WorldState,
  WorldStateClima,
  WorldStateEventos,
  WorldStateCosmos,
  WorldStateEconomia,
  WorldStateAtencion,
  WorldStateTierra,
  WorldStateSolar,
  WorldStateTrending,
  WorldStateTrafico,
  WorldStateAfluencia,
  ApiHealthEntry,
} from '@/types/worldstate'
import { FALLBACK_WORLDSTATE } from '@/types/worldstate'
import { fetchCityName, cityNameToCode, coordFallback } from '@/lib/cityCode'

// In-memory cache: 5 minutes (upgrade to Upstash Redis when scaling)
const cache = new Map<string, { data: WorldState; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

// In-memory rate limiter: 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── API Fetchers ─────────────────────────────────────────────────────────────

async function fetchClima(lat: number, lng: number): Promise<WorldStateClima> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,uv_index,relative_humidity_2m&wind_speed_unit=kmh`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Open-Meteo failed')
  const data = await res.json()
  const c = data.current
  return {
    temp: c.temperature_2m ?? FALLBACK_WORLDSTATE.clima.temp,
    wind: c.wind_speed_10m ?? FALLBACK_WORLDSTATE.clima.wind,
    windDir: c.wind_direction_10m ?? FALLBACK_WORLDSTATE.clima.windDir,
    uv: c.uv_index ?? FALLBACK_WORLDSTATE.clima.uv,
    humidity: c.relative_humidity_2m ?? FALLBACK_WORLDSTATE.clima.humidity,
  }
}

async function fetchEventos(): Promise<WorldStateEventos> {
  // GDELT Article List API — returns articles with V2Tone field
  // V2Tone = "avgTone,posScore,negScore,polarity,actRef,selfRef" (comma-separated)
  // avgTone range: roughly -100 (very negative) to +100 (very positive)
  // NOTE: no try/catch — let it reject so the GET handler can compute synthetic tone
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=*&mode=artlist&maxrecords=25&format=json&timespan=30min'
  const res = await fetch(url, {
    signal: controller.signal,
    next: { revalidate: 300 },
    headers: { 'User-Agent': 'ElOjo/1.0 (+https://resonantmigration.xyz)' },
  })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`GDELT failed: ${res.status}`)
  const data = await res.json()

  const articles: Array<{ V2Tone?: string; title?: string }> = data?.articles ?? []
  if (articles.length === 0) throw new Error('GDELT: no articles')

  // Average tone across all returned articles
  const tones = articles
    .map((a) => parseFloat(a.V2Tone?.split(',')[0] ?? 'NaN'))
    .filter((t) => !isNaN(t))

  if (tones.length === 0) throw new Error('GDELT: no tone data')

  const avgTone = tones.reduce((a, b) => a + b, 0) / tones.length
  const clamped = Math.max(-100, Math.min(100, avgTone))

  // Detect dominant theme from article titles
  const titles = articles.map((a) => (a.title ?? '').toLowerCase()).join(' ')
  let dominantTheme = 'politics'
  if (titles.includes('war') || titles.includes('attack') || titles.includes('killed') || titles.includes('conflict')) {
    dominantTheme = 'conflict'
  } else if (titles.includes('market') || titles.includes('economy') || titles.includes('trade')) {
    dominantTheme = 'economy'
  } else if (titles.includes('science') || titles.includes('research') || titles.includes('space')) {
    dominantTheme = 'science'
  } else if (clamped > 10) {
    dominantTheme = 'culture'
  }

  return {
    toneScore: clamped,
    conflictDensity: Math.max(0, -clamped) / 100,
    dominantTheme,
  }
}

async function fetchCosmos(): Promise<WorldStateCosmos> {
  const url = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json'
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('NOAA SWPC failed')
  const data = await res.json()
  const latest = Array.isArray(data) ? data[data.length - 1] : data
  return {
    kpIndex: Number(latest?.kp_index ?? FALLBACK_WORLDSTATE.cosmos.kpIndex),
    solarWind: Number(latest?.solar_wind ?? FALLBACK_WORLDSTATE.cosmos.solarWind),
  }
}

async function fetchEconomia(): Promise<WorldStateEconomia> {
  const url =
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('CoinGecko failed')
  const coins = await res.json()

  if (!Array.isArray(coins) || coins.length === 0) return FALLBACK_WORLDSTATE.economia

  const changes = coins
    .map((c: { price_change_percentage_24h?: number }) => c.price_change_percentage_24h ?? 0)
    .filter((v: number) => !isNaN(v))

  const avg = changes.reduce((a: number, b: number) => a + b, 0) / changes.length
  const variance = changes.reduce((acc: number, v: number) => acc + Math.pow(v - avg, 2), 0) / changes.length
  const volatility = Math.sqrt(variance)

  return {
    volatilityIndex: Math.min(100, volatility * 5),
    trendDir: avg > 1 ? 'up' : avg < -1 ? 'down' : 'neutral',
  }
}

async function fetchAtencion(): Promise<WorldStateAtencion> {
  // Wikimedia only has data through yesterday — today's date returns 404
  const yesterday = new Date(Date.now() - 86_400_000)
  const year = yesterday.getUTCFullYear()
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0')
  const day = String(yesterday.getUTCDate()).padStart(2, '0')

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { 'User-Agent': 'ElOjo/1.0 (+https://resonantmigration.xyz)' },
  })
  if (!res.ok) throw new Error('Wikipedia Pageviews failed')
  const data = await res.json()

  const articles = data?.items?.[0]?.articles?.slice(0, 20) ?? []
  const topArticles = articles
    .map((a: { article: string }) => a.article.replace(/_/g, ' '))
    .filter((a: string) => !['Main Page', 'Special:Search'].includes(a))
    .slice(0, 10)

  const text = topArticles.join(' ').toLowerCase()
  let topTheme = 'culture'
  let palette = 'default'

  if (text.includes('election') || text.includes('president') || text.includes('minister')) {
    topTheme = 'politics'; palette = 'politics'
  } else if (text.includes('war') || text.includes('attack') || text.includes('conflict')) {
    topTheme = 'conflict'; palette = 'conflict'
  } else if (text.includes('science') || text.includes('space') || text.includes('research')) {
    topTheme = 'science'; palette = 'science'
  } else if (text.includes('sport') || text.includes('championship') || text.includes('league')) {
    topTheme = 'sports'; palette = 'sports'
  }

  return { topTheme, palette, topArticles }
}

async function fetchTierra(lat: number, lng: number): Promise<WorldStateTierra> {
  const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&minmagnitude=0&orderby=time&limit=20`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('USGS failed')
  const data = await res.json()

  const quakes = data?.features ?? []
  if (quakes.length === 0) return { nearestMagnitude: 0, nearestDistanceKm: 9999, totalLastHour: 0 }

  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  let nearestDist = Infinity
  let nearestMag = 0
  for (const q of quakes) {
    const [qLng, qLat] = q.geometry.coordinates
    const dist = haversine(lat, lng, qLat, qLng)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestMag = q.properties.mag ?? 0
    }
  }

  return {
    nearestMagnitude: Math.max(0, nearestMag),
    nearestDistanceKm: Math.round(nearestDist),
    totalLastHour: quakes.length,
  }
}

function computeSolar(lat: number, lng: number, isoDate: string): WorldStateSolar {
  const d = new Date(isoDate)
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getUTCFullYear(), 0, 0).getTime()) / 86400000)
  const utcHour = d.getUTCHours() + d.getUTCMinutes() / 60

  const solarNoon = 12 - lng / 15
  const hourAngle = (utcHour - solarNoon) * 15 * (Math.PI / 180)

  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)) * (Math.PI / 180)
  const latRad = lat * (Math.PI / 180)

  const sinEl = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle)
  const elevationDeg = Math.asin(Math.max(-1, Math.min(1, sinEl))) * (180 / Math.PI)

  return {
    isDaylight: elevationDeg > -0.833,
    sunElevation: elevationDeg,
    uvIndex: elevationDeg > 0 ? Math.min(11, elevationDeg / 8) : 0,
  }
}

async function fetchTrending(lat: number, lng: number, atencion: WorldStateAtencion): Promise<WorldStateTrending> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN

  if (bearerToken) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4_000)
      const woeid = 1
      const res = await fetch(`https://api.twitter.com/1.1/trends/place.json?id=${woeid}`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        const trends = data?.[0]?.trends ?? []
        if (trends.length > 0) {
          const top = trends[0]
          const raw: string = top.name ?? ''
          const keyword = raw.replace(/^#/, '').toUpperCase().slice(0, 20)
          const tweetVol = top.tweet_volume ?? 50000
          return { keyword, score: Math.min(1, tweetVol / 1_000_000), source: 'twitter' }
        }
      }
    } catch { /* fall through */ }
  }

  if (atencion.topArticles.length > 0) {
    const article = atencion.topArticles[0]
    const keyword = article.split(' ').slice(0, 2).join(' ').toUpperCase().slice(0, 20)
    return { keyword, score: 0.5, source: 'wikipedia' }
  }

  const themeKeywords: Record<string, string> = {
    politics: 'ELECTION', conflict: 'CONFLICT', science: 'DISCOVERY',
    sports: 'CHAMPIONSHIP', culture: 'CULTURE', economy: 'MARKETS',
  }
  return {
    keyword: themeKeywords[atencion.topTheme] ?? 'RESONANCE',
    score: 0.3,
    source: 'synthetic',
  }
}

async function fetchTrafico(lat: number, lng: number): Promise<WorldStateTrafico> {
  const apiKey = process.env.TOMTOM_API_KEY

  if (apiKey) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4_000)
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${lat},${lng}&unit=kmph`
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        const seg = data?.flowSegmentData
        if (seg) {
          const speedRatio = Math.min(1, (seg.currentSpeed ?? 30) / Math.max(1, seg.freeFlowSpeed ?? 50))
          return { density: 1 - speedRatio, speedRatio, source: 'tomtom' }
        }
      }
    } catch { /* fall through */ }
  }

  const now = new Date()
  const hour = now.getUTCHours() + Math.round(lng / 15)
  const h = ((hour % 24) + 24) % 24
  const isRush = (h >= 7 && h <= 9) || (h >= 17 && h <= 19)
  const isNight = h >= 23 || h <= 5
  const baseDensity = isNight ? 0.1 : isRush ? 0.75 : 0.35
  return { density: baseDensity, speedRatio: 1 - baseDensity, source: 'synthetic' }
}

function computeAfluencia(lat: number, lng: number, eventos: WorldStateEventos): WorldStateAfluencia {
  const now = new Date()
  const hour = ((now.getUTCHours() + Math.round(lng / 15)) % 24 + 24) % 24
  const dow = now.getUTCDay()
  const isWeekend = dow === 0 || dow === 6
  const isPeak = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 22)
  const isMorning = hour >= 7 && hour <= 10

  let base = isPeak ? 0.7 : isMorning ? 0.45 : 0.25
  if (isWeekend) base *= 1.25
  base += eventos.toneScore > 20 ? 0.1 : 0
  base -= eventos.conflictDensity * 0.2

  return {
    density: Math.max(0, Math.min(1, base)),
    peakHour: isPeak,
    source: 'synthetic',
  }
}

// ─── Deterministic seed from WorldState ──────────────────────────────────────

function generateSeed(ws: Omit<WorldState, 'seed' | 'editionNumber'>): string {
  const payload = JSON.stringify({
    lat: Math.round(ws.location.lat * 100) / 100,
    lng: Math.round(ws.location.lng * 100) / 100,
    temp: Math.round(ws.clima.temp),
    wind: Math.round(ws.clima.wind),
    kp: Math.round(ws.cosmos.kpIndex * 10),
    vol: Math.round(ws.economia.volatilityIndex),
    tone: Math.round(ws.eventos.toneScore),
    mag: Math.round(ws.tierra.nearestMagnitude * 10),
    // 5-minute time window → deterministic per session
    timeWindow: Math.floor(new Date(ws.generatedAt).getTime() / (5 * 60 * 1000)),
  })
  return createHash('sha256').update(payload).digest('hex')
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { data: null, error: 'Rate limit exceeded. Max 10 req/min.', cached: false, fetchedAt: new Date().toISOString() },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '19.4326')
  const lng = parseFloat(searchParams.get('lng') ?? '-99.1332')

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { data: null, error: 'Invalid coordinates', cached: false, fetchedAt: new Date().toISOString() },
      { status: 400 }
    )
  }

  // Cache key: rounded to ~1km precision
  const cacheKey = `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ data: cached.data, error: null, cached: true, fetchedAt: new Date().toISOString() })
  }

  // Fetch all 6 APIs in parallel — Promise.allSettled: never blocks on partial failure
  const [climaResult, eventosResult, cosmosResult, economiaResult, atencionResult, tierraResult] =
    await Promise.allSettled([
      fetchClima(lat, lng),
      fetchEventos(),
      fetchCosmos(),
      fetchEconomia(),
      fetchAtencion(),
      fetchTierra(lat, lng),
    ])

  // Reverse geocode for city name + pixel art code
  let cityName: string | undefined
  let cityCode: string
  try {
    const rawCity = await fetchCityName(lat, lng)
    cityName = rawCity ?? undefined
    cityCode = rawCity ? cityNameToCode(rawCity) : coordFallback(lat, lng)
  } catch {
    cityCode = coordFallback(lat, lng)
  }

  const generatedAt = new Date().toISOString()

  const cosmos = cosmosResult.status === 'fulfilled' ? cosmosResult.value : FALLBACK_WORLDSTATE.cosmos
  const economia = economiaResult.status === 'fulfilled' ? economiaResult.value : FALLBACK_WORLDSTATE.economia
  const tierra = tierraResult.status === 'fulfilled' ? tierraResult.value : FALLBACK_WORLDSTATE.tierra

  // Synthetic eventos: derived from real signals when GDELT times out
  let eventos: WorldStateEventos
  if (eventosResult.status === 'fulfilled') {
    eventos = eventosResult.value
  } else {
    const syntheticTone = -(cosmos.kpIndex / 9) * 30
      + (economia.trendDir === 'down' ? -20 : economia.trendDir === 'up' ? 10 : 0)
      - (tierra.totalLastHour / 20) * 15
    const tone = Math.round(syntheticTone)
    eventos = {
      toneScore: tone,
      conflictDensity: Math.max(0, -tone) / 100,
      dominantTheme: tone < -20 ? 'conflict' : tone > 10 ? 'culture' : 'politics',
    }
  }

  // New signals: solar (sync), trending + trafico (async), afluencia (sync)
  const solar = computeSolar(lat, lng, new Date().toISOString())

  const atencionVal = atencionResult.status === 'fulfilled' ? atencionResult.value : FALLBACK_WORLDSTATE.atencion
  const eventosVal = eventosResult.status === 'fulfilled' ? eventosResult.value : FALLBACK_WORLDSTATE.eventos

  const t0Trending = Date.now()
  const [trendingResult, traficoResult] = await Promise.allSettled([
    fetchTrending(lat, lng, atencionVal),
    fetchTrafico(lat, lng),
  ])
  const trendingLatency = Date.now() - t0Trending

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : FALLBACK_WORLDSTATE.trending
  const trafico = traficoResult.status === 'fulfilled' ? traficoResult.value : FALLBACK_WORLDSTATE.trafico
  const afluencia = computeAfluencia(lat, lng, eventosVal)

  const apiHealth: Record<string, ApiHealthEntry> = {
    clima:     { status: climaResult.status === 'fulfilled' ? 'live' : 'fallback' },
    eventos:   { status: eventosResult.status === 'fulfilled' ? 'live' : 'simulated' },
    cosmos:    { status: cosmosResult.status === 'fulfilled' ? 'live' : 'fallback' },
    economia:  { status: economiaResult.status === 'fulfilled' ? 'live' : 'fallback' },
    atencion:  { status: atencionResult.status === 'fulfilled' ? 'live' : 'fallback' },
    tierra:    { status: tierraResult.status === 'fulfilled' ? 'live' : 'fallback' },
    trending:  { status: trendingResult.status === 'fulfilled' ? trending.source === 'synthetic' ? 'simulated' : 'live' : 'simulated', latencyMs: trendingLatency },
    trafico:   { status: traficoResult.status === 'fulfilled' ? trafico.source === 'synthetic' ? 'simulated' : 'live' : 'simulated' },
    solar:     { status: 'live' },
    afluencia: { status: 'simulated' },
  }

  const partial = {
    location: { lat, lng, city: cityName, cityCode },
    generatedAt,
    clima: climaResult.status === 'fulfilled' ? climaResult.value : FALLBACK_WORLDSTATE.clima,
    eventos,
    cosmos,
    economia,
    atencion: atencionVal,
    tierra,
    solar,
    trending,
    trafico,
    afluencia,
    apiHealth,
  }

  const worldState: WorldState = {
    ...partial,
    seed: generateSeed(partial),
    editionNumber: 0, // Phase B: replace with DB counter
  }

  cache.set(cacheKey, { data: worldState, expiresAt: Date.now() + CACHE_TTL })

  // Warn on partial failures (server-side only, not exposed to client)
  const failed = [
    climaResult.status === 'rejected' && 'clima',
    eventosResult.status === 'rejected' && 'eventos',
    cosmosResult.status === 'rejected' && 'cosmos',
    economiaResult.status === 'rejected' && 'economia',
    atencionResult.status === 'rejected' && 'atencion',
    tierraResult.status === 'rejected' && 'tierra',
  ].filter(Boolean)
  if (failed.length) console.warn(`[world-state] Fallback used for: ${failed.join(', ')}`)

  return NextResponse.json({ data: worldState, error: null, cached: false, fetchedAt: generatedAt })
}
