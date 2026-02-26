'use client'

import { useEffect } from 'react'
import { VISIONS, type VisionType } from '@/types/vision'

interface VisionSelectorProps {
  onSelect: (vision: VisionType) => void
}

export function VisionSelector({ onSelect }: VisionSelectorProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '1' && key <= '5') {
        const visionIndex = parseInt(key) - 1
        const vision = Object.values(VISIONS)[visionIndex]
        if (vision) {
          onSelect(vision.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onSelect])

  return (
    <div className="vision-selector">
      <div className="vision-content">
        <h1 className="vision-title">ELIGE TU VISIÓN</h1>
        <p className="vision-subtitle">
          Cada visión interpreta los mismos datos del mundo de forma diferente
        </p>

        <div className="vision-grid">
          {Object.values(VISIONS).map((v, index) => (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className="vision-card"
              data-vision={v.id}
              aria-label={`Seleccionar visión ${v.name}`}
            >
              <span className="vision-number">{index + 1}</span>
              <h2 className="vision-name">{v.name}</h2>
              <p className="vision-tagline">{v.tagline}</p>
              <p className="vision-description">{v.description}</p>
            </button>
          ))}
        </div>

        <p className="vision-hint">
          Presiona 1-5 en tu teclado para seleccionar rápidamente
        </p>
      </div>
    </div>
  )
}
