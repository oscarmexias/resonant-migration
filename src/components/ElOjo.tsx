'use client'

import { useEffect, useRef } from 'react'
import type { AppPhase } from '@/store/worldState'

interface ElOjoProps {
  phase: AppPhase
  onActivate?: () => void
}

const STATUS_TEXT: Record<string, string> = {
  'idle':               '',
  'requesting-location':'SOLICITANDO UBICACIÓN...',
  'loading-signals':    'LEYENDO SEÑALES DEL MUNDO',
  'generating':         'WIRD GENERIERT...',
}

export default function ElOjo({ phase, onActivate }: ElOjoProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Eye tracks cursor in idle state
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || phase !== 'idle') return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx)
      const pupil = svg.querySelector('#ojo-pupil') as SVGCircleElement
      if (pupil) {
        pupil.setAttribute('cx', String(50 + Math.cos(angle) * 6))
        pupil.setAttribute('cy', String(30 + Math.sin(angle) * 6))
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [phase])

  const isDilated = phase === 'generating'
  const isActive = phase !== 'idle'
  const statusText = STATUS_TEXT[phase]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--sp-8)',
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* The Eye */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 60"
        width="180"
        height="108"
        aria-hidden="true"
        className={`eye-breathe${isDilated ? ' glitch' : ''}`}
        style={{ cursor: phase === 'idle' ? 'pointer' : 'default' }}
        onClick={onActivate}
      >
        <defs>
          <filter id="eye-glow-f">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer eye shape */}
        <path
          d="M5,30 Q50,-5 95,30 Q50,65 5,30 Z"
          fill="none"
          stroke="var(--eye-core)"
          strokeWidth="1.2"
          filter="url(#eye-glow-f)"
        />
        {/* Iris ring */}
        <circle
          cx="50" cy="30"
          r={isDilated ? 20 : 15}
          fill="none"
          stroke="var(--eye-core)"
          strokeWidth="1"
          style={{ transition: 'r 0.5s ease' }}
        />
        {/* Iris ticks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const r = isDilated ? 20 : 15
          const rad = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={50 + Math.cos(rad) * r}
              y1={30 + Math.sin(rad) * r}
              x2={50 + Math.cos(rad) * (r + 4)}
              y2={30 + Math.sin(rad) * (r + 4)}
              stroke="var(--eye-glow)"
              strokeWidth="0.6"
            />
          )
        })}
        {/* Pupil */}
        <circle
          id="ojo-pupil"
          cx="50" cy="30"
          r={isDilated ? 12 : 8}
          fill="var(--eye-core)"
          style={{ transition: 'r 0.5s ease' }}
        />
        {/* Inner pupil glint */}
        <circle cx="54" cy="27" r="1.5" fill="rgba(255,255,255,0.3)" />
      </svg>

      {/* Title — only in idle */}
      {!isActive && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 6vw, 48px)',
            letterSpacing: '0.15em',
            color: 'var(--text)',
            textAlign: 'center',
          }}
        >
          EL OJO
        </div>
      )}

      {/* Status text */}
      {statusText && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: 'var(--text-dim)',
            textAlign: 'center',
          }}
        >
          {statusText}
        </div>
      )}

      {/* CTA — only in idle */}
      {phase === 'idle' && onActivate && (
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'var(--text-dim)',
              marginBottom: 'var(--sp-6)',
              maxWidth: '300px',
              lineHeight: 1.7,
            }}
          >
            Arte generativo único, pintado con los datos<br />
            del mundo en este momento desde donde estás.
          </p>

          <button
            onClick={onActivate}
            style={{
              display: 'block',
              width: '100%',
              minWidth: '240px',
              minHeight: '56px',
              background: 'none',
              border: '1px solid var(--eye-core)',
              color: 'var(--eye-core)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.3em',
              cursor: 'pointer',
              padding: 'var(--sp-4) var(--sp-8)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--eye-core)'
              e.currentTarget.style.color = 'var(--void)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--eye-core)'
            }}
          >
            COMPARTIR UBICACIÓN
          </button>
        </div>
      )}
    </div>
  )
}
