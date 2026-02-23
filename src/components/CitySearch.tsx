'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStateStore } from '@/store/worldState'
import { fetchWorldState, deriveArtParams } from '@/lib/worldstate'

// ── Crosshair SVG shared by button and panel ─────────────────────────────────
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
  const [isOpen, setIsOpen]     = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<GeoResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setPhase, setLocation, setWorldState, setArtParams, setError, mosaicMode, setMosaicMode } =
    useWorldStateStore()

  // ── Open / close ────────────────────────────────────────────────────────────

  const open = () => {
    setIsOpen(true)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
    // defer focus so the element is rendered first
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // ESC closes panel globally
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

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

  // Shared ghost-button style
  const ghostBtn: React.CSSProperties = {
    position:       'fixed',
    zIndex:         25,
    background:     'rgba(4,4,14,0.78)',
    border:         '1px solid rgba(255,255,255,0.11)',
    color:          'rgba(255,255,255,0.48)',
    fontFamily:     'var(--font-mono)',
    fontSize:       '8px',
    letterSpacing:  '0.22em',
    padding:        '0 13px',
    cursor:         'pointer',
    backdropFilter: 'blur(10px)',
    height:         '34px',
    display:        'flex',
    alignItems:     'center',
    gap:            '7px',
    lineHeight:     1,
    transition:     'border-color 0.18s, color 0.18s, background 0.18s',
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

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={open}
        aria-label="Buscar destino"
        style={{ ...ghostBtn, bottom: '60px', left: '20px' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <Crosshair />
        DESTINO
      </button>

      {/* ── Mosaic mode toggle ── */}
      <button
        onClick={() => setMosaicMode(mosaicMode === 'code' ? 'name' : 'code')}
        aria-label={mosaicMode === 'code' ? 'Cambiar a nombre completo' : 'Cambiar a siglas'}
        title={mosaicMode === 'code' ? 'Mostrar nombre completo' : 'Mostrar siglas'}
        style={{ ...ghostBtn, bottom: '60px', left: '116px' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <span style={{ fontSize: '9px', opacity: 0.55, fontWeight: 700, letterSpacing: 0 }}>
          {mosaicMode === 'code' ? 'AB' : '···'}
        </span>
        {mosaicMode === 'code' ? 'SIGLAS' : 'NOMBRE'}
      </button>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49,
            background: 'rgba(4,4,14,0.40)',
          }}
        />
      )}

      {/* ── Search panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Buscar destino"
          style={{
            position: 'fixed',
            bottom: '102px',        // above the trigger button (60px + 34px + 8px gap)
            left: '20px',
            zIndex: 50,
            width: 'min(340px, calc(100vw - 40px))',
            background: 'rgba(4,4,14,0.96)',
            border: '1px solid rgba(255,255,255,0.13)',
            backdropFilter: 'blur(20px)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {/* Input row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Crosshair size={10} opacity={0.28} />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Tokyo · Paris · Lagos…"
              autoComplete="off"
              spellCheck={false}
              style={{
                background:    'none',
                border:        'none',
                outline:       '2px solid transparent',  // focus handled by parent panel border
                color:         'rgba(255,255,255,0.88)',
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.10em',
                padding:       '14px 0',
                width:         '100%',
                caretColor:    'rgba(255,255,255,0.6)',
              }}
            />
            {loading && (
              <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: '9px', letterSpacing: '0.3em', flexShrink: 0 }}>
                ···
              </span>
            )}
          </div>

          {/* Result list */}
          {results.length > 0 && (
            <ul
              role="listbox"
              style={{ listStyle: 'none', margin: 0, padding: '4px 0', maxHeight: '200px', overflowY: 'auto' }}
            >
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

          {/* Empty / no results */}
          {!loading && query.length >= 1 && results.length === 0 && (
            <div style={{ padding: '14px', color: 'rgba(255,255,255,0.22)', fontSize: '8px', letterSpacing: '0.22em', textAlign: 'center' }}>
              SIN SEÑAL
            </div>
          )}

          {/* Hint footer */}
          {query.length === 0 && (
            <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.16)', fontSize: '7.5px', letterSpacing: '0.18em', lineHeight: 2 }}>
              ↑↓ NAVEGAR · ↵ EXPLORAR · ESC CERRAR
            </div>
          )}
        </div>
      )}
    </>
  )
}
