import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiter: 20 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20

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

// Forward geocoding via Nominatim (OpenStreetMap)
// GET /api/geocode?q=Madrid
// Returns: Array<{ city, country, lat, lng, display }>

interface NominatimResult {
  display_name: string
  lat:          string
  lon:          string
  type:         string
  class:        string
  importance:   number
  address: {
    city?:          string
    town?:          string
    village?:       string
    municipality?:  string
    suburb?:        string
    county?:        string
    state?:         string
    country?:       string
    country_code?:  string
  }
}

// Place types that represent a populated city/town (Nominatim taxonomy)
const CITY_TYPES = new Set(['city', 'town', 'municipality', 'borough', 'suburb', 'quarter'])

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format',         'json')
    url.searchParams.set('limit',          '10')
    url.searchParams.set('q',              q)
    url.searchParams.set('addressdetails', '1')
    // No featuretype restriction — let Nominatim return everything, we filter below

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent':      'ElOjo/1.0 (generative-art; contact@resonantmigration.xyz)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json([])

    const data: NominatimResult[] = await res.json()

    // Filter: keep city/town-class places; prefer higher importance
    const filtered = data.filter(r => {
      if (r.class === 'place' && CITY_TYPES.has(r.type)) return true
      if (r.class === 'boundary' && r.type === 'administrative') return true
      return false
    })

    // If strict filter returns nothing, fall back to all results (handles edge cases)
    const pool = filtered.length > 0 ? filtered : data

    // Sort by importance (Nominatim score, higher = more well-known)
    pool.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))

    const seen = new Set<string>()
    const results = pool
      .slice(0, 8)
      .reduce<Array<{ city: string; country: string; lat: number; lng: number; display: string }>>(
        (acc, r) => {
          const city =
            r.address.city         ??
            r.address.town         ??
            r.address.municipality ??
            r.address.suburb       ??
            r.address.village      ??
            r.address.county       ??
            r.address.state        ??
            q
          const country = r.address.country ?? ''
          const key = `${city.toLowerCase()}|${country.toLowerCase()}`
          if (seen.has(key)) return acc
          seen.add(key)
          acc.push({
            city,
            country,
            lat:     parseFloat(r.lat),
            lng:     parseFloat(r.lon),
            display: country ? `${city}, ${country}` : city,
          })
          return acc
        },
        [],
      )
      .slice(0, 5) // max 5 shown in UI

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    })
  } catch {
    return NextResponse.json([])
  }
}
