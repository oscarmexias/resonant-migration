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

// ── Wikimedia Commons — high-quality professional photography ─────────────────
// Commons has orders of magnitude better images than Wikipedia article thumbnails.
// Uses the File namespace (ns=6) search + imageinfo API to get 1280px URLs.
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

async function fetchCommonsImage(query: string): Promise<string | null> {
  try {
    // Step 1: search Commons File namespace for the landmark
    const searchUrl = new URL(COMMONS_API)
    searchUrl.searchParams.set('action', 'query')
    searchUrl.searchParams.set('list', 'search')
    searchUrl.searchParams.set('srsearch', query)
    searchUrl.searchParams.set('srnamespace', '6')   // File: namespace
    searchUrl.searchParams.set('srlimit', '5')
    searchUrl.searchParams.set('format', 'json')
    searchUrl.searchParams.set('origin', '*')

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': WIKI_UA },
      next: { revalidate: 86400 },
    })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()

    const files: Array<{ title: string }> = searchData?.query?.search ?? []
    // Skip non-photo files (SVG, OGG, PDF, maps, etc.)
    const photoFiles = files.filter((f) => {
      const t = f.title.toLowerCase()
      return !t.endsWith('.svg') && !t.endsWith('.ogg') && !t.endsWith('.pdf')
        && !t.endsWith('.ogv') && !t.endsWith('.webm') && !t.includes('map')
        && !t.includes('plan') && !t.includes('coat_of_arms') && !t.includes('logo')
        && !t.includes('diagram') && !t.includes('icon')
    })
    if (photoFiles.length === 0) return null

    // Step 2: get the actual image URL at 1280px width
    const titles = photoFiles.slice(0, 3).map((f) => f.title).join('|')
    const infoUrl = new URL(COMMONS_API)
    infoUrl.searchParams.set('action', 'query')
    infoUrl.searchParams.set('titles', titles)
    infoUrl.searchParams.set('prop', 'imageinfo')
    infoUrl.searchParams.set('iiprop', 'url|size|mime')
    infoUrl.searchParams.set('iiurlwidth', '1280')
    infoUrl.searchParams.set('format', 'json')
    infoUrl.searchParams.set('origin', '*')

    const infoRes = await fetch(infoUrl.toString(), {
      headers: { 'User-Agent': WIKI_UA },
      next: { revalidate: 86400 },
    })
    if (!infoRes.ok) return null
    const infoData = await infoRes.json()

    const pages = Object.values(infoData?.query?.pages ?? {}) as Array<{
      imageinfo?: Array<{ thumburl?: string; url?: string; mime?: string; width?: number; height?: number }>
    }>

    // Pick the best photo: prefer landscape orientation, skip non-image MIME types
    let bestUrl: string | null = null
    let bestScore = -1
    for (const page of pages) {
      const info = page.imageinfo?.[0]
      if (!info) continue
      if (!info.mime?.startsWith('image/')) continue
      const url = info.thumburl ?? info.url ?? null
      if (!url) continue
      const w = info.width ?? 0
      const h = info.height ?? 1
      const ratio = w / h
      // Prefer landscape (ratio > 1) and reasonable resolution
      const score = (ratio > 1 ? ratio : 0) + (w > 800 ? 1 : 0)
      if (score > bestScore) { bestScore = score; bestUrl = url }
    }
    return bestUrl
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

  // Resolve monument entry from curated database
  const entryByCity = city ? getMonumentByCity(city) : null
  const entry       = entryByCity ?? (cityCode ? getMonument(cityCode) : null)

  if (entry) {
    // Priority: Unsplash (if key) → Wikimedia Commons → Wikipedia article image
    const unsplashQuery = `${entry.name} ${entry.city} landmark`
    const commonsQuery  = `${entry.name} ${entry.city}`
    const imageUrl =
      (await fetchUnsplashPhoto(unsplashQuery)) ??
      (await fetchCommonsImage(commonsQuery)) ??
      (await fetchWikiImage(entry.wikiTitle))

    if (imageUrl) {
      return NextResponse.json(
        { name: entry.name, nameEs: entry.nameEs, myth: entry.myth, imageUrl },
        { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
      )
    }
  }

  // Fallback for unknown/uncurated cities
  const searchCity = city || entry?.city || ''
  if (searchCity) {
    const unsplashFallback = await fetchUnsplashPhoto(`${searchCity} landmark famous monument`)
    const commonsFallback  = await fetchCommonsImage(`${searchCity} landmark`)
    const imageUrl = unsplashFallback ?? commonsFallback ?? await searchWikiMonument(searchCity)
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
