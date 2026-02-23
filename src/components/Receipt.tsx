'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { WorldState } from '@/types/worldstate'
import { buildShareUrl } from '@/lib/worldstate'
import { useIsMobile } from '@/lib/useIsMobile'
import { useWorldStateStore } from '@/store/worldState'

interface ReceiptProps {
  worldState: WorldState
  onNuevaVision: () => void
}

// Mirror the color formula from ArtCanvasInner so the panel accent matches the art
function getPrimaryHue(ws: WorldState): number {
  const warmth = Math.max(0, Math.min(1, (ws.clima.temp + 20) / 65))
  const baseHue = warmth * 38 + (1 - warmth) * 215
  const SHIFT: Record<string, number> = {
    conflict: -45, science: 35, sports: 80, politics: 0, culture: -20, default: 0,
  }
  const shift = SHIFT[ws.atencion.palette] ?? 0
  return ((baseHue + shift) % 360 + 360) % 360
}

// ─── Full signal decoder rows ─────────────────────────────────────────────────
const DECODER: Array<{
  label: string
  source: string
  effect: string
  detail: string
}> = [
  {
    label: 'TEMPERATURA',
    source: 'Open-Meteo',
    effect: 'Color base',
    detail: '−20 °C → azul (215°). +45 °C → ámbar (38°). Todo lo demás interpola entre ambos extremos.',
  },
  {
    label: 'VIENTO velocidad',
    source: 'Open-Meteo',
    effect: 'Velocidad de partículas',
    detail: '0–80 km/h escala la rapidez de cada partícula. Con viento máximo el canvas se vuelve torrencial.',
  },
  {
    label: 'VIENTO dirección',
    source: 'Open-Meteo',
    effect: 'Ángulo del campo',
    detail: 'Los grados (0–360°) se convierten a radianes y empujan todas las partículas en la dirección del viento real.',
  },
  {
    label: 'HUMEDAD',
    source: 'Open-Meteo',
    effect: 'Densidad de partículas',
    detail: '0% → 150 partículas. 100% → 850. Días húmedos producen un campo más denso y orgánico.',
  },
  {
    label: 'UV INDEX',
    source: 'Open-Meteo',
    effect: 'Brillo (opacidad)',
    detail: 'UV 0 → partículas muy tenues. UV 11 → partículas brillantes al 90%. El sol pinta más fuerte.',
  },
  {
    label: 'KP INDEX',
    source: 'NOAA SWPC',
    effect: 'Storminess + auroras',
    detail: 'Mide tormentas geomagnéticas (0–9). Kp alto = campo más violento. Viento solar >430 km/s activa auroras verdes en el borde superior.',
  },
  {
    label: 'VOLATILIDAD CRYPTO',
    source: 'CoinGecko',
    effect: 'Caos de movimiento',
    detail: 'Varianza del precio 24h del top-10. Alta volatilidad = ruido aleatorio en cada partícula + saturación de color más alta.',
  },
  {
    label: 'TENDENCIA CRYPTO',
    source: 'CoinGecko',
    effect: 'Gravedad vertical',
    detail: 'Mercado alcista → partículas flotan hacia arriba. Bajista → caen. Lateral → sin bias.',
  },
  {
    label: 'TONO DE NOTICIAS',
    source: 'GDELT / sintético',
    effect: 'Longitud de trails',
    detail: 'Tono negativo = el canvas "recuerda" más: trails largos y fantasmales. Tono positivo = limpieza rápida cada frame.',
  },
  {
    label: 'SISMO magnitud',
    source: 'USGS',
    effect: 'Cantidad de anillos',
    detail: 'Magnitud 0–8 → 0–5 anillos concéntricos desde el centro. Sismo cercano (<500 km) → anillos pulsan más rápido.',
  },
  {
    label: 'SISMO actividad',
    source: 'USGS',
    effect: 'Opacidad de anillos',
    detail: 'Total de sismos en la última hora. Más actividad global = anillos más visibles, más opacidad.',
  },
  {
    label: 'TEMA WIKIPEDIA',
    source: 'Wikimedia',
    effect: 'Hue shift de color',
    detail: 'Conflicto −45° (hacia rojo) · Ciencia +35° (cian) · Deportes +80° (verde) · Cultura −20° (violeta) · Política 0° (sin cambio).',
  },
]

// ─── Tooltip component ────────────────────────────────────────────────────────
const TOOLTIP_W = 200

function Tooltip({ text, primaryHue }: { text: string; primaryHue: number }) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const show = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const rawLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2
    const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - TOOLTIP_W - 8))
    setPos({ top: rect.bottom + 6, left: clampedLeft })
  }

  const hide = () => setPos(null)

  return (
    <span
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={show}
      onTouchEnd={hide}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          border: `1px solid hsl(${primaryHue},40%,35%)`,
          color: `hsl(${primaryHue},50%,55%)`,
          fontSize: '7px',
          fontWeight: '700',
          cursor: 'default',
          flexShrink: 0,
          letterSpacing: 0,
        }}
      >
        ?
      </span>
      {pos && typeof window !== 'undefined' && createPortal(
        <span
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: TOOLTIP_W,
            background: 'rgba(12,12,12,0.97)',
            border: `1px solid hsl(${primaryHue},30%,25%)`,
            color: '#ccc',
            fontSize: '9px',
            lineHeight: '1.6',
            letterSpacing: '0.04em',
            padding: '8px 10px',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            boxShadow: `0 0 12px hsla(${primaryHue},60%,30%,0.3)`,
          }}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  )
}

// ─── DataPoint with color coding + tooltip ───────────────────────────────────
function DataPoint({
  label,
  value,
  valueColor,
  tooltip,
  primaryHue,
  healthStatus,
}: {
  label: string
  value: string
  valueColor?: string
  tooltip: string
  primaryHue: number
  healthStatus?: 'live' | 'fallback' | 'simulated'
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-dim)',
          fontSize: '8px',
          letterSpacing: '0.15em',
          marginBottom: '3px',
        }}
      >
        {label}
        {healthStatus && healthStatus !== 'live' && (
          <span
            className={`health-badge ${healthStatus === 'simulated' ? 'health-simulated' : 'health-fallback'}`}
            title={healthStatus === 'simulated' ? 'Señal simulada — API no disponible' : 'Señal aproximada — datos parciales'}
            style={{ marginLeft: '4px' }}
          >
            {healthStatus === 'simulated' ? 'SIM' : '~'}
          </span>
        )}
        <Tooltip text={tooltip} primaryHue={primaryHue} />
      </div>
      <div
        style={{
          color: valueColor ?? 'var(--text)',
          fontSize: '10px',
          fontWeight: '500',
          letterSpacing: '0.05em',
          transition: 'color 0.5s ease',
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── Decoder table ────────────────────────────────────────────────────────────
function DecoderTable({ primaryHue }: { primaryHue: number }) {
  const accent = `hsl(${primaryHue},60%,55%)`
  const accentDim = `hsl(${primaryHue},30%,25%)`

  return (
    <div
      style={{
        marginBottom: 'var(--sp-3)',
        borderTop: `1px solid ${accentDim}`,
        paddingTop: 'var(--sp-3)',
      }}
    >
      <div
        style={{
          fontSize: '8px',
          letterSpacing: '0.2em',
          color: accent,
          marginBottom: 'var(--sp-2)',
        }}
      >
        SEÑALES → PINTURA
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 1fr',
          gap: '4px 8px',
          paddingBottom: '4px',
          borderBottom: `1px solid hsl(${primaryHue},15%,18%)`,
          marginBottom: '4px',
        }}
      >
        {['SEÑAL', 'FUENTE', 'EFECTO VISUAL'].map((h) => (
          <span key={h} style={{ color: `hsl(${primaryHue},30%,40%)`, fontSize: '7px', letterSpacing: '0.15em' }}>
            {h}
          </span>
        ))}
      </div>

      {DECODER.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px 1fr',
            gap: '3px 8px',
            padding: '4px 0',
            borderBottom: `1px solid hsl(${primaryHue},10%,13%)`,
          }}
        >
          <span style={{ color: 'var(--text)', fontSize: '8px', letterSpacing: '0.08em' }}>
            {row.label}
          </span>
          <span style={{ color: `hsl(${primaryHue},30%,45%)`, fontSize: '7px', letterSpacing: '0.06em' }}>
            {row.source}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '0.04em', lineHeight: '1.4' }}>
            {row.effect}
            <span
              style={{
                display: 'block',
                color: `hsl(${primaryHue},20%,38%)`,
                fontSize: '7px',
                marginTop: '2px',
                lineHeight: '1.5',
              }}
            >
              {row.detail}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Receipt ─────────────────────────────────────────────────────────────
export default function Receipt({ worldState, onNuevaVision }: ReceiptProps) {
  const isMobile = useIsMobile()
  const setControlPanelOpen = useWorldStateStore((s) => s.setControlPanelOpen)
  const mosaicMode          = useWorldStateStore((s) => s.mosaicMode)
  const setMosaicMode       = useWorldStateStore((s) => s.setMosaicMode)
  const setCitySearchOpen   = useWorldStateStore((s) => s.setCitySearchOpen)
  const monumentModeOn      = useWorldStateStore((s) => s.monumentModeOn)
  const setMonumentModeOn   = useWorldStateStore((s) => s.setMonumentModeOn)
  // Default collapsed on mobile so art is visible; expanded on desktop
  const [collapsed, setCollapsed] = useState(true)
  const [showDecoder, setShowDecoder] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const toggleCollapsed = useCallback((next: boolean) => {
    setCollapsed(next)
    setControlPanelOpen(!next)
  }, [setControlPanelOpen])

  const toggleFullscreen = useCallback(async () => {
    const doc = document as any; const el = document.documentElement as any
    const inFS = !!document.fullscreenElement || !!doc.webkitFullscreenElement
    await (inFS
      ? (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document)
      : (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
    )?.catch(() => {})
  }, [])

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const iconBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px',
    borderRadius: '3px',
    color: 'rgba(255,255,255,0.45)',
    cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  }

  const { clima, cosmos, economia, tierra, atencion, location, generatedAt, seed } = worldState
  const primaryHue = getPrimaryHue(worldState)
  const accentColor = `hsl(${primaryHue},70%,55%)`

  const handleShare = useCallback(async () => {
    const url = buildShareUrl(worldState)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'El Ojo — Mi visión del mundo',
          text: `Generado en ${location.city ?? `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}`,
          url,
        })
        return
      } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(url)
  }, [worldState, location])

  const handleDownload = useCallback(() => {
    const artCanvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!artCanvas) return

    const W = artCanvas.width
    const H = artCanvas.height

    // Offscreen canvas for watermark composite
    const offscreen = document.createElement('canvas')
    offscreen.width  = W
    offscreen.height = H
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // 1. Copy art
    ctx.drawImage(artCanvas, 0, 0)

    // 2. Bottom-left branding strip
    const STRIP_H = Math.max(36, Math.floor(H * 0.05))
    const strip = ctx.createLinearGradient(0, H - STRIP_H, 0, H)
    strip.addColorStop(0,   'rgba(8,8,8,0)')
    strip.addColorStop(0.5, 'rgba(8,8,8,0.55)')
    strip.addColorStop(1,   'rgba(8,8,8,0.82)')
    ctx.fillStyle = strip
    ctx.fillRect(0, H - STRIP_H, W, STRIP_H)

    // 3. Text: EL OJO brand + edition + seed hash + city + date
    const fontSize = Math.max(9, Math.floor(H * 0.013))
    ctx.font = `${fontSize}px 'IBM Plex Mono', 'Courier New', monospace`
    ctx.fillStyle = `rgba(212,129,31,0.85)` // --eye-core

    const editionStr = `#${String(worldState.editionNumber || 0).padStart(5, '0')}`
    const cityStr = location.city
      ? location.city.toUpperCase()
      : `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`
    const hashStr = seed.slice(0, 12).toUpperCase()
    const dateStr = new Date(generatedAt).toLocaleDateString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })

    const leftText  = `EL OJO  ${editionStr}  ${cityStr}`
    const rightText = `${dateStr}  ${hashStr}`

    const padding = Math.max(10, Math.floor(W * 0.016))
    const textY   = H - Math.floor(STRIP_H * 0.25)

    ctx.textAlign = 'left'
    ctx.fillText(leftText, padding, textY)

    ctx.fillStyle = `rgba(212,129,31,0.5)`
    ctx.textAlign = 'right'
    ctx.fillText(rightText, W - padding, textY)

    // 4. Top-right: resonantmigration.xyz (very subtle)
    const smallFontSize = Math.max(7, Math.floor(H * 0.009))
    ctx.font = `${smallFontSize}px 'IBM Plex Mono', 'Courier New', monospace`
    ctx.fillStyle = 'rgba(88,88,88,0.6)'
    ctx.textAlign = 'right'
    ctx.fillText('resonantmigration.xyz', W - padding, padding + smallFontSize)

    ctx.textAlign = 'left'

    // 5. Download
    const link = document.createElement('a')
    link.download = `el-ojo-${seed.slice(0, 8)}.png`
    link.href = offscreen.toDataURL('image/png')
    link.click()
  }, [seed, worldState, location, generatedAt])

  const formattedDate = new Date(generatedAt).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

  const latStr = `${Math.abs(location.lat).toFixed(4)}°${location.lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(location.lng).toFixed(4)}°${location.lng >= 0 ? 'E' : 'W'}`

  // Per-signal color coding
  const warmth = Math.max(0, Math.min(1, (clima.temp + 20) / 65))
  const tempHue = warmth * 38 + (1 - warmth) * 215
  const tempColor = `hsl(${tempHue},70%,60%)`

  const kpColor = `hsl(${Math.max(0, 120 - cosmos.kpIndex * 13)},65%,55%)`
  const volatColor = `hsl(${Math.max(0, 120 - economia.volatilityIndex * 2)},65%,55%)`

  const sismoColor =
    tierra.nearestMagnitude > 4 ? '#ff4444'
    : tierra.nearestMagnitude > 2 ? '#ff8c00'
    : 'var(--text)'

  const TEMA_COLORS: Record<string, string> = {
    conflict: '#ff5555',
    science:  '#00d2d2',
    sports:   '#44ee77',
    politics: '#ffaa00',
    culture:  '#cc88ff',
    default:  'var(--text)',
  }
  const temaColor = TEMA_COLORS[atencion.topTheme] ?? 'var(--text)'

  const trendColor =
    economia.trendDir === 'up'   ? '#44ee77'
    : economia.trendDir === 'down' ? '#ff5555'
    : 'var(--text-dim)'
  const trendLabel =
    economia.trendDir === 'up' ? '↑ SUBE' : economia.trendDir === 'down' ? '↓ BAJA' : '→ LATERAL'

  return (
    <div
      className={`receipt-panel slot-emerge ${collapsed ? 'collapsed' : 'expanded'}`}
      style={{ borderTop: `1px solid hsl(${primaryHue},35%,22%)`, transition: 'border-color 0.8s ease, max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}
    >
      {/* ── Drag pill (mobile only) ── */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px' }}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>
      )}

      {/* ── Handle strip: always visible, toggles panel ── */}
      <button
        className="receipt-handle"
        onClick={() => toggleCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expandir panel de señales' : 'Colapsar panel de señales'}
        style={{ borderBottom: collapsed ? 'none' : `1px solid hsl(${primaryHue},15%,16%)` }}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return
          const delta = touchStartY.current - e.changedTouches[0].clientY
          if (delta > 40)  toggleCollapsed(false)
          if (delta < -40) toggleCollapsed(true)
          touchStartY.current = null
        }}
      >
        {/* Left: edition + city + key stats */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
          <span style={{ color: accentColor, fontSize: '9px', letterSpacing: '0.2em', transition: 'color 0.8s', flexShrink: 0 }}>
            #{String(worldState.editionNumber || 0).padStart(5, '0')}
          </span>
          {(location.city || location.cityCode) && (
            <span style={{
              color: 'var(--text)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              fontWeight: '500',
              flexShrink: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? '100px' : '180px',
            }}>
              {location.city ?? location.cityCode}
            </span>
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '0.08em', flexShrink: 0 }}>
            {Math.round(clima.temp)}°C
          </span>
          <span style={{ color: kpColor, fontSize: '8px', letterSpacing: '0.08em', flexShrink: 0 }}>
            Kp {cosmos.kpIndex.toFixed(1)}
          </span>
          {!isMobile && (
            <span style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '0.08em', flexShrink: 0 }}>
              {latStr} {lngStr}
            </span>
          )}
        </span>

        {/* Right: icon buttons (mobile) + chevron */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isMobile && (
            <>
              {/* SIGLAS / NOMBRE toggle — hidden in monument mode */}
              {!monumentModeOn && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setMosaicMode(mosaicMode === 'code' ? 'name' : 'code') }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), setMosaicMode(mosaicMode === 'code' ? 'name' : 'code'))}
                  aria-label={mosaicMode === 'code' ? 'Mostrar nombre' : 'Mostrar siglas'}
                  style={iconBtnStyle}
                >
                  <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: 0, lineHeight: 1 }}>
                    {mosaicMode === 'code' ? 'AB' : '···'}
                  </span>
                </span>
              )}
              {/* FULLSCREEN */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), toggleFullscreen())}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                style={iconBtnStyle}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {isFullscreen ? (
                    <>
                      <path d="M5 2 L3 2 L3 4"   stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 2 L11 2 L11 4"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 12 L3 12 L3 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12 L11 12 L11 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  ) : (
                    <>
                      <path d="M3 5 L3 3 L5 3"   stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11 5 L11 3 L9 3"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 9 L3 11 L5 11"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11 9 L11 11 L9 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  )}
                </svg>
              </span>
              {/* MONUMENT / LETRAS mode toggle */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setMonumentModeOn(!monumentModeOn) }}
                onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), setMonumentModeOn(!monumentModeOn))}
                aria-label={monumentModeOn ? 'Modo letras' : 'Modo monumento'}
                style={{
                  ...iconBtnStyle,
                  color: monumentModeOn ? 'rgba(212,129,31,0.85)' : 'rgba(255,255,255,0.45)',
                }}
              >
                {monumentModeOn ? (
                  /* grid icon → click to return to letter mode */
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1.5" y="1.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="8" y="1.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="1.5" y="8" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1"/>
                    <rect x="8" y="8" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                ) : (
                  /* arch/monument icon → click to enter monument mode */
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 12.5 L2 7.5 Q2 2.5 7 2.5 Q12 2.5 12 7.5 L12 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    <line x1="0.5" y1="12.5" x2="13.5" y2="12.5" stroke="currentColor" strokeWidth="1"/>
                    <line x1="4.5" y1="12.5" x2="4.5" y2="8.5" stroke="currentColor" strokeWidth="0.8"/>
                    <line x1="9.5" y1="12.5" x2="9.5" y2="8.5" stroke="currentColor" strokeWidth="0.8"/>
                  </svg>
                )}
              </span>
            </>
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '0.15em' }}>
            {collapsed ? (isMobile ? '' : 'VER SEÑALES') : (isMobile ? '' : 'OCULTAR')}
          </span>
          <span
            style={{
              display: 'inline-block',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
              fontSize: '10px',
              lineHeight: 1,
            }}
          >
            ▲
          </span>
        </span>
      </button>

      {/* ── Expandable body ── */}
      <div
        style={{
          padding: collapsed ? '0 var(--sp-6)' : 'var(--sp-4) var(--sp-6)',
          overflow: collapsed ? 'hidden' : 'visible',
        }}
      >
        {/* Signal grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 'var(--sp-2)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          <DataPoint
            label="TEMP"
            value={`${Math.round(clima.temp)}°C`}
            valueColor={tempColor}
            tooltip="Temperatura local → color base del arte. Frío extremo pinta azul, calor extremo pinta ámbar."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.clima?.status}
          />
          <DataPoint
            label="VIENTO"
            value={`${Math.round(clima.wind)} km/h`}
            tooltip="Velocidad del viento → rapidez de las partículas. Dirección del viento → ángulo del campo magnético que las empuja."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.clima?.status}
          />
          <DataPoint
            label="KP INDEX"
            value={cosmos.kpIndex.toFixed(1)}
            valueColor={kpColor}
            tooltip="Índice de tormenta geomagnética (0–9). Alto = campo más violento, partículas empujadas con más fuerza. Kp > 4 puede activar auroras verdes arriba."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.cosmos?.status}
          />
          <DataPoint
            label="VOLAT."
            value={`${economia.volatilityIndex.toFixed(1)}%`}
            valueColor={volatColor}
            tooltip="Varianza 24h del top-10 crypto → caos de movimiento. Alta volatilidad = ruido en cada partícula + saturación de color más alta."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.economia?.status}
          />
          <DataPoint
            label="CRYPTO"
            value={trendLabel}
            valueColor={trendColor}
            tooltip="Tendencia del mercado crypto → gravedad vertical. Alcista = partículas flotan. Bajista = partículas caen. Lateral = sin bias."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.economia?.status}
          />
          <DataPoint
            label="SISMO"
            value={tierra.nearestMagnitude > 0 ? `M${tierra.nearestMagnitude.toFixed(1)}` : 'QUIETO'}
            valueColor={sismoColor}
            tooltip="Magnitud del sismo más cercano → anillos concéntricos. Cercanía → velocidad de pulso. Actividad total de la última hora → opacidad de los anillos."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.tierra?.status}
          />
          <DataPoint
            label="TEMA"
            value={atencion.topTheme.toUpperCase()}
            valueColor={temaColor}
            tooltip="Tema más leído en Wikipedia ayer → gira el hue del color. Conflicto −45° (rojo), Ciencia +35° (cian), Deportes +80° (verde), Cultura −20° (violeta)."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.atencion?.status}
          />
          <DataPoint
            label="HUMEDAD"
            value={`${clima.humidity}%`}
            tooltip="Humedad local → cantidad de partículas. 0% = 150 partículas. 100% = 850. Días húmedos generan un campo más denso."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.clima?.status}
          />
          <DataPoint
            label="UV"
            value={clima.uv.toFixed(1)}
            tooltip="Índice UV → brillo (opacidad) de cada partícula. UV 0 = tenues. UV 11 = máxima luminosidad."
            primaryHue={primaryHue}
            healthStatus={worldState.apiHealth?.clima?.status}
          />
          {/* ── New signals ── */}
          {worldState.solar && (
            <DataPoint
              label="SOLAR"
              value={worldState.solar.isDaylight ? `DÍA · UV ${worldState.solar.uvIndex.toFixed(1)}` : 'NOCHE · UV 0'}
              tooltip="Ciclo día/noche → iluminación base. UV solar → intensidad lumínica del arte."
              primaryHue={primaryHue}
              healthStatus={worldState.apiHealth?.solar?.status}
            />
          )}
          {worldState.trending && (
            <DataPoint
              label="TENDENCIA"
              value={`${worldState.trending.keyword} · ${worldState.trending.source.toUpperCase()}`}
              tooltip="Tema trending → palabra renderizada en el canvas. Mayor engagement = mayor intensidad."
              primaryHue={primaryHue}
              healthStatus={worldState.apiHealth?.trending?.status}
            />
          )}
          {worldState.trafico && (
            <DataPoint
              label="TRÁFICO"
              value={`${Math.round(worldState.trafico.density * 100)}% · ${worldState.trafico.speedRatio < 0.4 ? 'CONGESTIONADO' : worldState.trafico.speedRatio > 0.8 ? 'LIBRE' : 'MODERADO'}`}
              tooltip="Densidad vial → compresión de partículas. Congestión alta = campo más denso y lento."
              primaryHue={primaryHue}
              healthStatus={worldState.apiHealth?.trafico?.status}
            />
          )}
          {worldState.afluencia && (
            <DataPoint
              label="AFLUENCIA"
              value={`${Math.round(worldState.afluencia.density * 100)}% · ${worldState.afluencia.peakHour ? 'HORA PICO' : 'NORMAL'}`}
              tooltip="Densidad de personas → cantidad de partículas secundarias. Hora pico = pulso más rápido."
              primaryHue={primaryHue}
              healthStatus={worldState.apiHealth?.afluencia?.status}
            />
          )}
        </div>

        {/* Coordinates + seed */}
        <div
          style={{
            color: 'var(--text-dim)',
            fontSize: '8px',
            letterSpacing: '0.12em',
            marginBottom: 'var(--sp-3)',
          }}
        >
          {latStr} {lngStr} · HASH: {seed.slice(0, 12).toUpperCase()}
        </div>

        {/* Decoder toggle */}
        <button
          onClick={() => setShowDecoder((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: `hsl(${primaryHue},40%,45%)`,
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            letterSpacing: '0.2em',
            cursor: 'pointer',
            padding: '0 0 var(--sp-3) 0',
            display: 'block',
            transition: 'color 0.3s',
            minHeight: 'var(--touch-min)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = `hsl(${primaryHue},40%,45%)`)}
        >
          {showDecoder ? '▲ OCULTAR SEÑALES' : '▼ CÓMO SE PINTA ESTO'}
        </button>

        {/* Decoder table */}
        {showDecoder && <DecoderTable primaryHue={primaryHue} />}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', paddingBottom: 'var(--sp-2)' }}>
          <ActionBtn onClick={handleDownload} label="DESCARGAR" primaryHue={primaryHue} />
          <ActionBtn onClick={handleShare}   label="COMPARTIR LINK" primary primaryHue={primaryHue} />
          <ActionBtn onClick={onNuevaVision} label="NUEVA VISIÓN" primaryHue={primaryHue} />
          <ActionBtn onClick={() => {}} label="MINTEAR (PRONTO)" disabled primaryHue={primaryHue} />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({
  onClick, label, primary, disabled, primaryHue,
}: {
  onClick: () => void
  label: string
  primary?: boolean
  disabled?: boolean
  primaryHue: number
}) {
  const accent = `hsl(${primaryHue},70%,55%)`
  return (
    <button
      className="action-btn"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: primary ? accent : 'none',
        border: `1px solid ${disabled ? 'var(--text-dim)' : primary ? accent : `hsl(${primaryHue},20%,25%)`}`,
        color: primary ? 'var(--void)' : disabled ? 'var(--text-dim)' : 'var(--text)',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.1s, color 0.1s, border-color 0.8s',
      }}
    >
      {label}
    </button>
  )
}
