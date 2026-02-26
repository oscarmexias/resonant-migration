import { NextRequest, NextResponse } from 'next/server'
import { getMonument, getMonumentByCity } from '@/lib/monumentData'

// In-memory rate limiter: 30 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30

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

// GET /api/monument?cityCode=MAD&city=Madrid
// Returns: { name, nameEs, myth, imageUrl } or nulls if not found
//
// Image source priority:
//   1. Unsplash (if UNSPLASH_ACCESS_KEY env is set) — high-quality editorial photos
//   2. Wikipedia originalimage → full-resolution monument photo
//   3. Wikipedia search fallback for unknown cities
// Cached 24 hours.

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const WIKI_SEARCH  = 'https://en.wikipedia.org/w/api.php'
const WIKI_UA      = 'ResonantMigration/1.0 (https://resonant-migration.vercel.app)'

// ── Unsplash ──────────────────────────────────────────────────────────────────
async function fetchUnsplashPhoto(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&content_filter=high&order_by=relevant`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Prefer photos with high resolution; pick first result's "regular" URL (1080px)
    const photo = data?.results?.[0]
    return (photo?.urls?.regular as string) ?? null
  } catch {
    return null
  }
}

// ── Wikipedia ─────────────────────────────────────────────────────────────────
async function fetchWikiImage(wikiTitle: string): Promise<string | null> {
  try {
    const url = WIKI_SUMMARY + encodeURIComponent(wikiTitle)
    const res = await fetch(url, {
      headers: { 'User-Agent': WIKI_UA },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Prefer full-resolution originalimage over small thumbnail
    return (data?.originalimage?.source as string)
        ?? (data?.thumbnail?.source    as string)
        ?? null
  } catch {
    return null
  }
}

async function searchWikiMonument(city: string): Promise<string | null> {
  try {
    const searchUrl = new URL(WIKI_SEARCH)
    searchUrl.searchParams.set('action', 'query')
    searchUrl.searchParams.set('list',   'search')
    searchUrl.searchParams.set('srsearch', `${city} famous landmark monument`)
    searchUrl.searchParams.set('format', 'json')
    searchUrl.searchParams.set('srlimit', '5')

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': WIKI_UA },
      next: { revalidate: 86400 },
    })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()

    const results: Array<{ title: string }> = searchData?.query?.search ?? []
    for (const result of results) {
      const img = await fetchWikiImage(result.title.replace(/ /g, '_'))
      if (img) return img
    }
    return null
  } catch {
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const city     = searchParams.get('city') ?? ''
  const cityCode = (searchParams.get('cityCode') ?? '').toUpperCase()

  // Resolve monument entry
  const entryByCity = city ? getMonumentByCity(city) : null
  const entry       = entryByCity ?? (cityCode ? getMonument(cityCode) : null)

  if (entry) {
    // 1. Try Unsplash first — "monument name city" gives best editorial results
    const unsplashQuery = `${entry.name} ${entry.city} landmark`
    const imageUrl =
      (await fetchUnsplashPhoto(unsplashQuery)) ??
      (await fetchWikiImage(entry.wikiTitle))

    if (imageUrl) {
      return NextResponse.json(
        { name: entry.name, nameEs: entry.nameEs, myth: entry.myth, imageUrl },
        { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
      )
    }
  }

  // 2. Wikipedia search fallback for unknown/uncurated cities
  const searchCity = city || entry?.city || ''
  if (searchCity) {
    // Try Unsplash with city name first
    const unsplashFallback = await fetchUnsplashPhoto(`${searchCity} landmark famous monument`)
    const imageUrl = unsplashFallback ?? await searchWikiMonument(searchCity)
    if (imageUrl) {
      return NextResponse.json(
        {
          name:    entry?.name    ?? searchCity,
          nameEs:  entry?.nameEs  ?? searchCity,
          myth:    entry?.myth    ?? '',
          imageUrl,
        },
        { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
      )
    }
  }

  // Nothing found — canvas falls back to letter mosaic
  return NextResponse.json(
    { name: null, nameEs: null, myth: null, imageUrl: null },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  )
}
