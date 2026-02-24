'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStateStore } from '@/store/worldState'
import { fetchWorldState, deriveArtParams } from '@/lib/worldstate'
import { useIsMobile, useIsLandscape } from '@/lib/useIsMobile'

// ── Fullscreen icon ───────────────────────────────────────────────────────────
function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.65, flexShrink: 0 }}>
      {active ? (
        <>
          <path d="M4 2 L2 2 L2 4"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 2 L8 2 L8 4"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 8 L2 8 L2 6"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 8 L8 8 L8 6"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
        </>
      ) : (
        <>
          <path d="M2 4 L2 2 L4 2"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 4 L8 2 L6 2"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 6 L2 8 L4 8"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 6 L8 8 L6 8"   stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
        </>
      )}
    </svg>
  )
}

// ── Crosshair SVG ─────────────────────────────────────────────────────────────
function Crosshair({ size = 11, opacity = 0.65 }: { size?: number; opacity?: number }) {
  const h = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ opacity, flexShrink: 0 }}>
      <circle cx={h} cy={h} r={h - 1.5} stroke="currentColor" strokeWidth="0.85"/>
      <line x1={h} y1="0"      x2={h}    y2={h - 2}  stroke="currentColor" strokeWidth="0.85"/>
      <line x1={h} y1={h + 2} x2={h}    y2={size}   stroke="currentColor" strokeWidth="0.85"/>
      <line x1="0"      y1={h} x2={h - 2}  y2={h}   stroke="currentColor" strokeWidth="0.85"/>
      <line x1={h + 2} y1={h} x2={size}    y2={h}   stroke="currentColor" strokeWidth="0.85"/>
    </svg>
  )
}

interface GeoResult {
  city: string
  country: string
  lat: number
  lng: number
  display: string
}

export default function CitySearch() {
  const [isOpen, setIsOpen]       = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<GeoResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()

  const {
    setPhase, setLocation, setWorldState, setArtParams, setError,
    mosaicMode, setMosaicMode,
    controlPanelOpen,
    citySearchOpen, setCitySearchOpen,
    monumentModeOn, setMonumentModeOn,
    immersiveMode,
  } = useWorldStateStore()

  // ── Open / close ────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    // With always-visible search bar, open just focuses the input
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
    inputRef.current?.blur()
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // ESC closes search
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Respond to store signal (e.g. programmatic open)
  useEffect(() => {
    if (citySearchOpen && !isOpen) {
      open()
      setCitySearchOpen(false)
    }
  }, [citySearchOpen, isOpen, open, setCitySearchOpen])

  // ── Fullscreen ───────────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(async () => {
    const doc  = document as any
    const el   = document.documentElement as any
    const inFS = !!document.fullscreenElement || !!doc.webkitFullscreenElement
    if (!inFS) {
      await (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el).catch(() => {})
    } else {
      await (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onChange = () => {
      const doc = document as any
      setIsFullscreen(!!document.fullscreenElement || !!doc.webkitFullscreenElement)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // ── Geocode search ───────────────────────────────────────────────────────────

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data: GeoResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setActiveIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 180)
  }

  // ── Navigate to city ─────────────────────────────────────────────────────────

  const navigateTo = useCallback(async (result: GeoResult) => {
    close()
    setPhase('loading-signals')
    setLocation({ lat: result.lat, lng: result.lng })
    try {
      const ws = await fetchWorldState(result.lat, result.lng)
      setWorldState(ws)
      setArtParams(deriveArtParams(ws))
      setPhase('generating')
      await new Promise((r) => setTimeout(r, 900))
      setPhase('output')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPhase('error')
    }
  }, [close, setPhase, setLocation, setWorldState, setArtParams, setError])

  // ── Keyboard navigation ──────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const target = activeIdx >= 0 ? results[activeIdx] : results[0]
      if (target) navigateTo(target)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  // Ghost buttons — desktop only, hidden when receipt is expanded
  const ghostBtn: React.CSSProperties = {
    position:       'fixed',
    zIndex:         25,
    display:        isMobile ? 'none' : 'flex',
    opacity:        controlPanelOpen ? 0 : 1,
    pointerEvents:  controlPanelOpen ? 'none' : 'auto',
    transition:     'opacity 0.2s, border-color 0.18s, color 0.18s, background 0.18s',
    background:     'rgba(4,4,14,0.78)',
    border:         '1px solid rgba(255,255,255,0.11)',
    color:          'rgba(255,255,255,0.48)',
    fontFamily:     'var(--font-mono)',
    fontSize:       '8px',
    letterSpacing:  '0.22em',
    padding:        '0 13px',
    cursor:         'pointer',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    height:         '34px',
    alignItems:     'center',
    gap:            '7px',
    lineHeight:     1,
  }

  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'
    e.currentTarget.style.color       = 'rgba(255,255,255,0.82)'
    e.currentTarget.style.background  = 'rgba(4,4,14,0.92)'
  }
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'
    e.currentTarget.style.color       = 'rgba(255,255,255,0.48)'
    e.currentTarget.style.background  = 'rgba(4,4,14,0.78)'
  }

  // Search bar visible when receipt is collapsed (both mobile and desktop), hidden in immersive mode
  const searchBarVisible = !controlPanelOpen && !immersiveMode

  // Compact width: 220px desktop, wider in landscape mobile, fits narrow screens
  const barWidth = isMobile
    ? (isLandscape ? 'min(320px, calc(100vw - 200px))' : 'min(220px, calc(100vw - 40px))')
    : '220px'

  return (
    <>
      {/* ── Centered always-visible search bar ─────────────────────────────── */}
      <div
        style={{
          position:  'fixed',
          bottom:    isMobile ? '72px' : '56px',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    50,
          width:     barWidth,
          opacity:   searchBarVisible ? 1 : 0,
          pointerEvents: searchBarVisible ? 'auto' : 'none',
          transition: 'opacity 0.2s',
          fontFamily: 'var(--font-mono)',
        }}
        role="search"
        aria-label="Buscar ciudad destino"
      >
        {/* Results / hints dropdown — above the bar */}
        {isOpen && (
          <div
            style={{
              position:            'absolute',
              bottom:              '100%',
              left:                0,
              right:               0,
              marginBottom:        '4px',
              background:          'rgba(4,4,14,0.97)',
              border:              '1px solid rgba(255,255,255,0.13)',
              backdropFilter:      'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              maxHeight:           '220px',
              overflowY:           'auto',
              zIndex:              51,
            }}
          >
            {results.length > 0 && (
              <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: '4px 0' }}>
                {results.map((r, i) => (
                  <li
                    key={`${r.lat}:${r.lng}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    onClick={() => navigateTo(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{
                      padding:        '10px 14px',
                      cursor:         'pointer',
                      background:     i === activeIdx ? 'rgba(255,255,255,0.05)' : 'transparent',
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      gap:            '8px',
                      transition:     'background 0.1s',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '9px', letterSpacing: '0.14em' }}>
                      {r.city.toUpperCase()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.26)', fontSize: '7.5px', letterSpacing: '0.12em', flexShrink: 0 }}>
                      {r.country.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!loading && query.length >= 1 && results.length === 0 && (
              <div style={{ padding: '14px', color: 'rgba(255,255,255,0.22)', fontSize: '8px', letterSpacing: '0.22em', textAlign: 'center' }}>
                SIN SEÑAL
              </div>
            )}
            {query.length === 0 && (
              <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.16)', fontSize: '7.5px', letterSpacing: '0.18em', lineHeight: 2 }}>
                ↑↓ NAVEGAR · ↵ EXPLORAR · ESC CERRAR
              </div>
            )}
          </div>
        )}

        {/* Search input row */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display:             'flex',
            alignItems:          'center',
            gap:                 '7px',
            padding:             '0 10px',
            height:              isMobile ? '40px' : '32px',
            background:          isOpen ? 'rgba(4,4,14,0.96)' : 'rgba(4,4,14,0.72)',
            border:              isOpen ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.09)',
            backdropFilter:      'blur(10px)',
            WebkitBackdropFilter:'blur(10px)',
            transition:          'border-color 0.18s, background 0.18s',
            cursor:              'text',
          }}
        >
          <Crosshair size={9} opacity={isOpen ? 0.45 : 0.22} />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="BUSCAR DESTINO"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Buscar ciudad destino"
            aria-autocomplete="list"
            style={{
              background:    'none',
              border:        'none',
              outline:       'none',
              color:         'rgba(255,255,255,0.82)',
              fontFamily:    'var(--font-mono)',
              // globals.css overrides to 16px on mobile — prevents iOS auto-zoom
              fontSize:      '9px',
              letterSpacing: '0.14em',
              padding:       0,
              width:         '100%',
              caretColor:    'rgba(255,255,255,0.5)',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
          {loading && (
            <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: '9px', letterSpacing: '0.3em', flexShrink: 0 }}>
              ···
            </span>
          )}
          {!loading && query.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpiar búsqueda"
              onClick={(e) => { e.stopPropagation(); setQuery(''); setResults([]); inputRef.current?.focus() }}
              onKeyDown={(e) => e.key === 'Enter' && (setQuery(''), setResults([]), inputRef.current?.focus())}
              style={{
                color: 'rgba(255,255,255,0.30)',
                fontSize: '16px',
                lineHeight: 1,
                cursor: 'pointer',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              ×
            </span>
          )}
        </div>
      </div>

      {/* ── Backdrop — closes search on outside click ── */}
      {isOpen && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(4,4,14,0.30)' }}
        />
      )}

      {/* ── SIGLAS toggle — desktop only, hidden in monument mode ── */}
      {!monumentModeOn && (
        <button
          onClick={() => setMosaicMode(mosaicMode === 'code' ? 'name' : 'code')}
          aria-label={mosaicMode === 'code' ? 'Cambiar a nombre completo' : 'Cambiar a siglas'}
          title={mosaicMode === 'code' ? 'Mostrar nombre completo' : 'Mostrar siglas'}
          style={{ ...ghostBtn, bottom: '60px', left: '20px' }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          <span style={{ fontSize: '9px', opacity: 0.55, fontWeight: 700, letterSpacing: 0 }}>
            {mosaicMode === 'code' ? 'AB' : '···'}
          </span>
          {mosaicMode === 'code' ? 'SIGLAS' : 'NOMBRE'}
        </button>
      )}

      {/* ── Monument / letras toggle — desktop only ── */}
      <button
        onClick={() => setMonumentModeOn(!monumentModeOn)}
        aria-label={monumentModeOn ? 'Volver a modo letras' : 'Modo monumento'}
        title={monumentModeOn ? 'Volver a modo letras' : 'Ver monumento de la ciudad'}
        style={{
          ...ghostBtn,
          bottom:      '60px',
          left:        monumentModeOn ? '20px' : '116px',
          color:       monumentModeOn ? 'rgba(212,129,31,0.85)' : 'rgba(255,255,255,0.48)',
          borderColor: monumentModeOn ? 'rgba(212,129,31,0.35)' : 'rgba(255,255,255,0.11)',
          // smooth position transition when SIGLAS appears/disappears
          transition:  'opacity 0.2s, border-color 0.18s, color 0.18s, background 0.18s, left 0.2s',
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.65, flexShrink: 0 }}>
          {monumentModeOn ? (
            <>
              <rect x="1.5" y="1.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.1"/>
              <rect x="8"   y="1.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.1"/>
              <rect x="1.5" y="8"   width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.1"/>
              <rect x="8"   y="8"   width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.1"/>
            </>
          ) : (
            <>
              <path d="M2 12.5 L2 7.5 Q2 2.5 7 2.5 Q12 2.5 12 7.5 L12 12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="0.5" y1="12.5" x2="13.5" y2="12.5" stroke="currentColor" strokeWidth="1.1"/>
              <line x1="4.5" y1="12.5" x2="4.5"  y2="8.5"  stroke="currentColor" strokeWidth="0.9"/>
              <line x1="9.5" y1="12.5" x2="9.5"  y2="8.5"  stroke="currentColor" strokeWidth="0.9"/>
            </>
          )}
        </svg>
        {monumentModeOn ? 'LETRAS' : 'FOTO'}
      </button>

      {/* ── Fullscreen toggle — desktop only ── */}
      <button
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        style={{ ...ghostBtn, bottom: '60px', right: '20px' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <FullscreenIcon active={isFullscreen} />
        {isFullscreen ? 'EXIT' : 'FULL'}
      </button>
    </>
  )
}
