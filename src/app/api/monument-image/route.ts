// GET /api/monument-image?url=https://...
// Server-side image proxy — avoids CORS restrictions from browser
// fetching Unsplash/Wikipedia images directly.

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'images.unsplash.com',
  'upload.wikimedia.org',
  'wikipedia.org',
  'wikimedia.org',
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  // Validate url param
  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 })
  }

  // Only proxy from known image hosts
  const isAllowed = ALLOWED_HOSTS.some(host => parsed.hostname.endsWith(host))
  if (!isAllowed) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const upstream = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ResonantMigration/1.0' },
    })
    clearTimeout(timeout)

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 })
    }

    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Upstream timeout' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
