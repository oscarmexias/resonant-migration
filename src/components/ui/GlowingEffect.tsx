'use client'

/**
 * GlowingEffect — border que sigue el cursor
 * Inspirado en el patrón Aceternity / Cursor.so de 21st.dev
 *
 * Uso: envuelve cualquier elemento y su border brilla hacia donde apunta el cursor
 */

import { useCallback, useEffect, useRef } from 'react'

interface GlowingEffectProps {
  children: React.ReactNode
  /** Color primario del glow. Default: var(--eye-core) */
  color?: string
  /** Qué tan ancho es el arco del gradiente (0-1). Default: 0.25 */
  spread?: number
  /** Desactivar en mobile si se quiere */
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function GlowingEffect({
  children,
  color = '#d4811f',
  spread = 0.22,
  disabled = false,
  className,
  style,
}: GlowingEffectProps) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const glowRef  = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const angleRef = useRef<number>(0)
  const targetRef = useRef<number>(0)

  const onMouseMove = useCallback((e: MouseEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    // angle in degrees from center to cursor
    const rad = Math.atan2(e.clientY - cy, e.clientX - cx)
    targetRef.current = (rad * 180) / Math.PI
  }, [])

  useEffect(() => {
    if (disabled) return

    const wrap = wrapRef.current
    const glow = glowRef.current
    if (!wrap || !glow) return

    // smooth lerp toward cursor angle
    const animate = () => {
      // lerp angle (handle wrap-around)
      let diff = targetRef.current - angleRef.current
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360
      angleRef.current += diff * 0.12

      const deg = angleRef.current
      const arc = spread * 360

      glow.style.setProperty(
        '--glow-gradient',
        `conic-gradient(from ${deg - arc / 2}deg at 50% 50%,
          transparent 0%,
          ${color}99 ${arc * 0.3}%,
          ${color} ${arc * 0.5}%,
          ${color}99 ${arc * 0.7}%,
          transparent ${arc}%
        )`
      )

      frameRef.current = requestAnimationFrame(animate)
    }

    wrap.addEventListener('mouseenter', () => {
      glow.style.opacity = '1'
      frameRef.current = requestAnimationFrame(animate)
    })
    wrap.addEventListener('mouseleave', () => {
      glow.style.opacity = '0'
      cancelAnimationFrame(frameRef.current)
    })
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [disabled, color, spread, onMouseMove])

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {/* Glow border layer */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position:  'absolute',
          inset:     '-1px',
          borderRadius: 'inherit',
          padding:   '1px',
          background: 'var(--glow-gradient, transparent)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity:   0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex:    1,
        } as React.CSSProperties}
      />
      {children}
    </div>
  )
}
