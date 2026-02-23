'use client'

import { useEffect, useState, useRef } from 'react'

interface AwakeningSequenceProps {
  onReady: () => void
}

type Line =
  | { kind: 'label';   text: string;  delay: number }
  | { kind: 'sensor';  label: string; sublabel: string; delay: number; sensorIndex: number }
  | { kind: 'divider'; delay: number }
  | { kind: 'status';  text: string;  delay: number }
  | { kind: 'gap';     delay: number }
  | { kind: 'reason';  text: string;  delay: number }

const SEQUENCE: Line[] = [
  { kind: 'label',   text: 'INITIALISIERUNG...',            delay: 0 },
  { kind: 'divider',                                         delay: 250 },
  { kind: 'sensor',  label: 'KLIMASENSOR',    sublabel: 'temperatura · viento · UV · humedad',  delay: 450,  sensorIndex: 0 },
  { kind: 'sensor',  label: 'KOSMOSSENSOR',   sublabel: 'índice Kp · viento solar',             delay: 700,  sensorIndex: 1 },
  { kind: 'sensor',  label: 'SEISMOSENSOR',   sublabel: 'sismos · magnitud · distancia',        delay: 950,  sensorIndex: 2 },
  { kind: 'sensor',  label: 'WIRTSCHAFT',     sublabel: 'volatilidad cripto · tendencia',       delay: 1200, sensorIndex: 3 },
  { kind: 'sensor',  label: 'AUFMERKSAMKEIT', sublabel: 'lo que el mundo lee ahora',            delay: 1450, sensorIndex: 4 },
  { kind: 'sensor',  label: 'EREIGNISSE',     sublabel: 'tono global de los eventos',           delay: 1700, sensorIndex: 5 },
  { kind: 'divider',                                         delay: 1950 },
  { kind: 'status',  text: 'ALLE SENSOREN AKTIV',           delay: 2100 },
  { kind: 'gap',                                             delay: 2400 },
  { kind: 'reason',  text: 'El Ojo leerá el estado del mundo desde tu lugar',  delay: 2550 },
  { kind: 'reason',  text: 'y pintará algo que no ha existido antes.',        delay: 2800 },
]

// Auto-proceed delay (ms after mount): just after last line appears
const AUTO_PROCEED_DELAY = 3300

export default function AwakeningSequence({ onReady }: AwakeningSequenceProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [sensorsDone, setSensorsDone] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    SEQUENCE.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleCount(i + 1)
        if (line.kind === 'status') setSensorsDone(true)
      }, line.delay)
      timers.current.push(t)
    })
    // Auto-proceed — no second click needed
    const autoT = setTimeout(onReady, AUTO_PROCEED_DELAY)
    timers.current.push(autoT)
    return () => timers.current.forEach(clearTimeout)
  }, [onReady])

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '440px',
        padding: '0 var(--sp-6)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* CRT scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        {SEQUENCE.slice(0, visibleCount).map((line, i) => (
          <SequenceLine
            key={i}
            line={line}
            sensorsDone={sensorsDone}
          />
        ))}
      </div>
    </div>
  )
}

function SequenceLine({
  line,
  sensorsDone,
}: {
  line: Line
  sensorsDone: boolean
}) {
  switch (line.kind) {

    case 'label':
      return (
        <p style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'var(--text-dim)', margin: '0 0 var(--sp-2)', animation: 'tape-out 0.3s ease-out' }}>
          {line.text}
        </p>
      )

    case 'divider':
      return <div style={{ height: '1px', background: 'var(--concrete)', margin: 'var(--sp-2) 0', animation: 'tape-out 0.2s ease-out' }} />

    case 'sensor': {
      // Stagger flash: each sensor fires 60ms apart
      const flashDelay = `${line.sensorIndex * 60}ms`
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--sp-2)',
            margin: '0 0 var(--sp-1)',
            animation: 'tape-out 0.35s ease-out',
          }}
        >
          {/* Status dot */}
          <span
            className={sensorsDone ? 'sensor-flash' : ''}
            style={{
              fontSize: '11px',
              flexShrink: 0,
              color: sensorsDone ? 'var(--accent)' : 'var(--eye-core)',
              animationDelay: sensorsDone ? flashDelay : '0ms',
            }}
          >
            {sensorsDone ? '●' : '○'}
          </span>

          {/* Label */}
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: sensorsDone ? 'var(--text)' : 'var(--eye-core)',
              fontWeight: '700',
              transition: 'color 0.3s ease',
              minWidth: '132px',
            }}
          >
            {line.label}
          </span>

          {/* Dotted fill */}
          <span style={{ flex: 1, borderBottom: '1px dotted var(--concrete)', height: '1px', alignSelf: 'center' }} />

          {/* BEREIT */}
          <span
            style={{
              fontSize: '8px',
              letterSpacing: '0.2em',
              color: sensorsDone ? 'var(--accent)' : 'var(--text-dim)',
              transition: `color 0.3s ease ${flashDelay}`,
              flexShrink: 0,
            }}
          >
            BEREIT
          </span>
        </div>
      )
    }

    case 'status':
      return (
        <p style={{ fontSize: '10px', letterSpacing: '0.25em', color: 'var(--accent)', margin: 'var(--sp-2) 0 0', fontWeight: '700', animation: 'tape-out 0.3s ease-out' }}>
          {line.text}
        </p>
      )

    case 'gap':
      return <div style={{ height: 'var(--sp-4)' }} />

    case 'reason':
      return (
        <p style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-dim)', lineHeight: 1.7, margin: '0 0 var(--sp-1)', animation: 'tape-out 0.35s ease-out' }}>
          {line.text}
        </p>
      )

  }
}
