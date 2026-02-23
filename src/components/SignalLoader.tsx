'use client'

import { useEffect, useState } from 'react'
import { useWorldStateStore } from '@/store/worldState'
import type { SignalState } from '@/types/worldstate'

const SIGNALS: Array<{
  key: keyof SignalState
  label: string
  source: string
  what: string           // qué mide este sensor
}> = [
  { key: 'clima',    label: 'CLIMA',    source: 'Open-Meteo', what: 'temp · viento · UV · humedad' },
  { key: 'eventos',  label: 'EVENTOS',  source: 'GDELT',      what: 'tono global · conflicto' },
  { key: 'cosmos',   label: 'COSMOS',   source: 'NOAA SWPC',  what: 'índice Kp · viento solar' },
  { key: 'economia', label: 'ECONOMÍA', source: 'CoinGecko',  what: 'volatilidad cripto' },
  { key: 'atencion', label: 'ATENCIÓN', source: 'Wikipedia',  what: 'lo que el mundo lee ahora' },
  { key: 'tierra',   label: 'TIERRA',   source: 'USGS',       what: 'sismos · magnitud' },
]

const COLORS: Record<string, string> = {
  idle:    'var(--text-dim)',
  loading: 'var(--eye-core)',
  success: 'var(--accent)',
  error:   'var(--danger)',
}

const SYMBOLS: Record<string, string> = {
  idle:    '·',
  loading: '◐',
  success: '●',
  error:   '✕',
}

export default function SignalLoader() {
  const signals = useWorldStateStore((s) => s.signals)
  const location = useWorldStateStore((s) => s.location)
  const worldState = useWorldStateStore((s) => s.worldState)
  const [elapsed, setElapsed] = useState(0)

  // Live elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const successCount = Object.values(signals).filter((s) => s === 'success').length
  const totalCount = SIGNALS.length
  const allDone = successCount === totalCount

  const latStr = location
    ? `${Math.abs(location.lat).toFixed(4)}°${location.lat >= 0 ? 'N' : 'S'}`
    : '——'
  const lngStr = location
    ? `${Math.abs(location.lng).toFixed(4)}°${location.lng >= 0 ? 'E' : 'W'}`
    : '——'

  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '380px',
        padding: '0 var(--sp-6)',
        fontFamily: 'var(--font-mono)',
        zIndex: 15,
      }}
    >
      {/* Header: coordinates + elapsed */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--sp-4)',
          paddingBottom: 'var(--sp-3)',
          borderBottom: '1px solid var(--concrete)',
        }}
      >
        <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--eye-core)' }}>
          {latStr} {lngStr}
        </span>
        <span style={{ fontSize: '8px', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
          {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
        </span>
      </div>

      {/* Signal rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
        {SIGNALS.map(({ key, label, source, what }) => {
          const status = signals[key]
          const isLoading = status === 'loading'
          const isSuccess = status === 'success'

          return (
            <div
              key={key}
              className={isLoading ? 'signal-loading' : isSuccess ? 'sensor-flash' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                opacity: status === 'idle' ? 0.35 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  color: COLORS[status],
                  width: '14px',
                  flexShrink: 0,
                  fontSize: '11px',
                }}
              >
                {SYMBOLS[status]}
              </span>

              {/* Signal name */}
              <span style={{ color: COLORS[status], fontWeight: isSuccess ? '700' : '400', minWidth: '80px' }}>
                {label}
              </span>

              {/* Dotted fill */}
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted var(--concrete)',
                  height: '1px',
                  alignSelf: 'center',
                }}
              />

              {/* Source or "what" description */}
              <span style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '0.1em', flexShrink: 0 }}>
                {isSuccess ? what : source}
              </span>

              {/* API health badge */}
              {worldState?.apiHealth?.[key]?.status === 'simulated' && (
                <span className="signal-sim-badge">SIM</span>
              )}
              {worldState?.apiHealth?.[key]?.status === 'fallback' && (
                <span className="signal-sim-badge signal-fallback-badge">~LIVE</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '1px',
          background: 'var(--concrete)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 'var(--sp-3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${(successCount / totalCount) * 100}%`,
            background: allDone ? 'var(--accent)' : 'var(--eye-core)',
            transition: 'width 0.3s ease, background 0.4s ease',
            boxShadow: `0 0 8px ${allDone ? 'var(--accent)' : 'var(--eye-core)'}`,
          }}
        />
      </div>

      {/* Status line */}
      <div
        style={{
          fontSize: '8px',
          letterSpacing: '0.2em',
          color: allDone ? 'var(--accent)' : 'var(--text-dim)',
          textAlign: 'right',
          transition: 'color 0.4s ease',
        }}
      >
        {allDone
          ? 'SEÑALES COMPLETAS — GENERANDO VISIÓN'
          : `LEYENDO SEÑALES DEL MUNDO... ${successCount}/${totalCount}`}
      </div>
    </div>
  )
}
