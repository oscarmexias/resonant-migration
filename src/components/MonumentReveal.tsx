'use client'

import { useEffect, useState } from 'react'
import { useWorldStateStore } from '@/store/worldState'

interface Props {
  onReady: () => void
}

// Grain SVG — same as globals.css art-canvas grain
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

export default function MonumentReveal({ onReady }: Props) {
  const monumentData = useWorldStateStore((s) => s.monumentData)
  const location     = useWorldStateStore((s) => s.location)
  const worldState   = useWorldStateStore((s) => s.worldState)

  const [showPhoto,   setShowPhoto]   = useState(false)
  const [showLabel,   setShowLabel]   = useState(false)
  const [showName,    setShowName]    = useState(false)
  const [showCoords,  setShowCoords]  = useState(false)
  const [showTagline, setShowTagline] = useState(false)
  const [fadeOut,     setFadeOut]     = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowPhoto(true),   200)
    const t2 = setTimeout(() => setShowLabel(true),   600)
    const t3 = setTimeout(() => setShowName(true),    800)
    const t4 = setTimeout(() => setShowCoords(true),  1100)
    const t5 = setTimeout(() => setShowTagline(true), 1900)
    const t6 = setTimeout(() => setFadeOut(true),     2600)
    const t7 = setTimeout(() => onReady(),            3100)

    return () => [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout)
  }, [onReady])

  const lat = location?.lat
  const lng = location?.lng
  const latStr  = lat != null ? `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}` : '—'
  const lngStr  = lng != null ? `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}` : '—'
  const city    = worldState?.location?.city ?? ''
  const photoUrl     = monumentData?.imageProxyUrl ?? null
  const monumentName = monumentData?.name ?? city ?? null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        background: '#080808',
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.7s ease',
      }}
    >
      {/* ── Monument photo (if available) ───────────────────────────────────── */}
      {photoUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: showPhoto ? 1 : 0,
            transition: 'opacity 1.4s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={monumentName ?? 'Monument'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'grayscale(100%) sepia(50%) brightness(0.45) contrast(1.3)',
            }}
          />
        </div>
      )}

      {/* ── Vignette ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(8,8,8,0.88) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Grain overlay ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN_SVG,
          backgroundSize: '200px 200px',
          opacity: 0.07,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Scanlines ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── EL OJO IDENTIFICA — top label ────────────────────────────────────── */}
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--sp-8)',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            letterSpacing: '0.35em',
            color: 'var(--eye-core)',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            animation: 'tape-out 0.5s ease-out',
          }}
        >
          EL OJO IDENTIFICA
        </div>
      )}

      {/* ── Bottom content block ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '560px',
          padding: '0 var(--sp-6)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Divider top */}
        {showCoords && (
          <div
            style={{
              height: '1px',
              background: 'var(--concrete)',
              marginBottom: 'var(--sp-4)',
              animation: 'tape-out 0.3s ease-out',
            }}
          />
        )}

        {/* Monument / city name — big Bebas Neue */}
        {showName && monumentName && (
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 9vw, 80px)',
              color: '#ffffff',
              letterSpacing: '0.03em',
              lineHeight: 1,
              marginBottom: 'var(--sp-3)',
              textShadow: '0 0 40px rgba(212,129,31,0.3)',
              animation: 'slot-emerge 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            }}
          >
            {monumentName.toUpperCase()}
          </div>
        )}

        {/* City + coordinates */}
        {showCoords && (
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              color: 'var(--eye-core)',
              marginBottom: 'var(--sp-5)',
              animation: 'tape-out 0.4s ease-out',
            }}
          >
            {city ? `${city.toUpperCase()} · ` : ''}{latStr} {lngStr}
          </div>
        )}

        {/* Divider bottom */}
        {showCoords && (
          <div
            style={{
              height: '1px',
              background: 'var(--concrete)',
              marginBottom: 'var(--sp-4)',
              animation: 'tape-out 0.3s ease-out',
            }}
          />
        )}

        {/* EL OJO ACTIVA LA VISIÓN */}
        {showTagline && (
          <div
            style={{
              fontSize: '8px',
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              animation: 'tape-out 0.4s ease-out',
            }}
          >
            EL OJO ACTIVA LA VISIÓN
          </div>
        )}
      </div>
    </div>
  )
}
