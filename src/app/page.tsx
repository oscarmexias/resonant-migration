'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useWorldStateStore } from '@/store/worldState'
import { fetchWorldState, deriveArtParams, decodeSharePayload } from '@/lib/worldstate'
import { useIsMobile } from '@/lib/useIsMobile'
import ElOjo from '@/components/ElOjo'
import SignalLoader from '@/components/SignalLoader'
import Receipt from '@/components/Receipt'
import AwakeningSequence from '@/components/AwakeningSequence'
import CitySearch from '@/components/CitySearch'
import LandscapeHint from '@/components/LandscapeHint'

// Three.js requires browser — no SSR
const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  const isMobile = useIsMobile()
  const {
    phase, setPhase,
    setLocation, setWorldState, setArtParams, setError,
    setSignalStatus,
    locationDenied, setLocationDenied,
    worldState, reset,
    immersiveMode, setImmersiveMode,
  } = useWorldStateStore()

  const startAwakening = useCallback(() => {
    setPhase('awakening')
  }, [setPhase])

  const requestLocationAndGenerate = useCallback(async () => {
    setPhase('requesting-location')

    let lat = 19.4326
    let lng = -99.1332
    let denied = false

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 300_000,
          timeout: 6_000,
          enableHighAccuracy: false,
        })
      })
      lat = position.coords.latitude
      lng = position.coords.longitude
    } catch (geoErr) {
      if (geoErr instanceof GeolocationPositionError && geoErr.code === 1) {
        denied = true
      }
      console.info('[El Ojo] Geolocation unavailable — using CDMX default')
    }

    if (denied) {
      setLocationDenied(true)
      await new Promise((r) => setTimeout(r, 2500))
    }

    setLocation({ lat, lng })
    setPhase('loading-signals')

    const SIGNAL_KEYS = ['clima', 'eventos', 'cosmos', 'economia', 'atencion', 'tierra'] as const
    const staggerTimers: ReturnType<typeof setTimeout>[] = []
    SIGNAL_KEYS.forEach((key, i) => {
      const t = setTimeout(() => setSignalStatus(key, 'loading'), i * 120)
      staggerTimers.push(t)
    })

    try {
      const ws = await fetchWorldState(lat, lng)
      staggerTimers.forEach(clearTimeout)

      for (let i = 0; i < SIGNAL_KEYS.length; i++) {
        await new Promise((r) => setTimeout(r, 80))
        setSignalStatus(SIGNAL_KEYS[i], 'success')
      }

      setWorldState(ws)
      setArtParams(deriveArtParams(ws))
      setPhase('generating')
      await new Promise((r) => setTimeout(r, 900))
      setPhase('output')
    } catch (err) {
      staggerTimers.forEach(clearTimeout)
      SIGNAL_KEYS.forEach((key) => setSignalStatus(key, 'error'))
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPhase('error')
    }
  }, [setPhase, setLocation, setWorldState, setArtParams, setError, setLocationDenied, setSignalStatus])

  // Handle share links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lat = parseFloat(params.get('lat') ?? '')
    const lng = parseFloat(params.get('lng') ?? '')
    const encoded = params.get('d')

    if (!isNaN(lat) && !isNaN(lng) && encoded) {
      // Deterministic share link — decode stored snapshot, skip API
      const ws = decodeSharePayload(encoded)
      if (ws) {
        ws.location.lat = lat
        ws.location.lng = lng
        setLocation({ lat, lng })
        setWorldState(ws)
        setArtParams(deriveArtParams(ws))
        setPhase('output')
        return
      }
    }

    // Legacy links (lat+lng only) or fallback — re-fetch from API
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng })
      setPhase('loading-signals')
      fetchWorldState(lat, lng)
        .then((ws) => {
          setWorldState(ws)
          setArtParams(deriveArtParams(ws))
          setPhase('output')
        })
        .catch((err) => {
          setError(err.message)
          setPhase('error')
        })
    }
  }, [setPhase, setLocation, setWorldState, setArtParams, setError])

  const showCanvas   = phase === 'generating' || phase === 'output'
  const showEye      = phase === 'idle' || phase === 'requesting-location' || phase === 'loading-signals' || phase === 'generating'
  const showAwakening = phase === 'awakening'

  return (
    <main
      id="generation"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        minHeight: '100dvh',
        background: 'var(--void)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient glow on idle screen */}
      {(phase === 'idle' || phase === 'awakening') && <div className="idle-ambient" />}

      {/* Art canvas — fixed on desktop, relative+scrollable on mobile */}
      {showCanvas && worldState && (
        <div
          className="art-canvas-container"
        >
          <ArtCanvas />
        </div>
      )}

      {/* Eye — loading / idle states */}
      {showEye && (
        <ElOjo
          phase={phase}
          onActivate={phase === 'idle' ? startAwakening : undefined}
        />
      )}

      {showAwakening && <AwakeningSequence onReady={requestLocationAndGenerate} />}

      {/* Location denied notice */}
      {locationDenied && phase === 'requesting-location' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            maxWidth: '320px',
            width: 'calc(100% - 48px)',
            padding: 'var(--sp-6)',
            border: '1px solid var(--concrete)',
            background: 'rgba(8,8,8,0.97)',
            zIndex: 30,
          }}
        >
          <div style={{ color: 'var(--danger)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: 'var(--sp-4)' }}>
            KOORDINATEN VERWEIGERT
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '0.1em', lineHeight: 1.8 }}>
            Sin ubicación exacta, El Ojo ve desde<br />
            <span style={{ color: 'var(--eye-core)' }}>Ciudad de México</span> por defecto.<br />
            Tu visión será de ese lugar.
          </div>
        </div>
      )}

      {phase === 'loading-signals' && <SignalLoader />}

      {phase === 'output' && worldState && (
        <Receipt worldState={worldState} onNuevaVision={reset} />
      )}

      {/* City search — available while art is visible */}
      {phase === 'output' && <CitySearch />}

      {/* Immersive mode exit — tap anywhere indicator (iOS full view workaround) */}
      {phase === 'output' && immersiveMode && (
        <button
          onClick={() => setImmersiveMode(false)}
          aria-label="Salir de vista completa"
          style={{
            position:            'fixed',
            top:                 16,
            right:               16,
            zIndex:              100,
            background:          'rgba(4,4,14,0.70)',
            border:              '1px solid rgba(255,255,255,0.12)',
            backdropFilter:      'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
            color:               'rgba(255,255,255,0.45)',
            fontFamily:          'var(--font-mono)',
            fontSize:            '9px',
            letterSpacing:       '0.18em',
            padding:             '0 12px',
            height:              '32px',
            display:             'flex',
            alignItems:          'center',
            gap:                 '6px',
            cursor:              'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.6 }}>
            <path d="M4 2 L2 2 L2 4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 2 L8 2 L8 4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 8 L2 8 L2 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 8 L8 8 L8 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          EXIT
        </button>
      )}

      {/* Landscape nudge — portrait mobile only */}
      {phase === 'output' && <LandscapeHint />}

      {phase === 'error' && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--danger)',
            textAlign: 'center',
            padding: 'var(--sp-8)',
          }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', marginBottom: 'var(--sp-4)' }}>
            SEÑALES FUERA DE LÍNEA
          </div>
          <button
            onClick={requestLocationAndGenerate}
            style={{
              background: 'none',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              padding: 'var(--sp-3) var(--sp-6)',
              cursor: 'pointer',
              minHeight: 'var(--touch-min)',
            }}
          >
            REINTENTAR
          </button>
        </div>
      )}

      {/* Aria live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
      >
        {phase === 'loading-signals' && 'Cargando señales del mundo...'}
        {phase === 'generating' && 'Generando visión...'}
        {phase === 'output' && 'Visión generada. Lista para compartir o mintear.'}
      </div>
    </main>
  )
}
