'use client'

import { useEffect, useRef, useState } from 'react'

// Charset mixing alphanumeric with a few symbol chars for sci-fi feel
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·∑≈∂Ω▓▒░'

interface ScrambleTextProps {
  text: string
  /** ms between scramble frames — lower = faster */
  speed?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders text that scrambles through random characters before resolving
 * left-to-right on mount. Re-runs whenever `text` changes.
 *
 * Inspired by the "Scramble Text" pattern from 21st.dev / SixtySix.
 */
export function ScrambleText({ text, speed = 35, className, style }: ScrambleTextProps) {
  const [display, setDisplay] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    let frame = 0
    // 3 scramble passes per character so it feels deliberate
    const totalFrames = text.length * 3

    const tick = () => {
      frame++
      const resolved = Math.floor(frame / 3)

      const out = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' '
          if (i < resolved) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(out)

      if (frame < totalFrames) {
        timerRef.current = setTimeout(tick, speed)
      } else {
        setDisplay(text)
      }
    }

    // Kick off fully scrambled
    setDisplay(
      text.split('').map(c =>
        c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]
      ).join('')
    )
    timerRef.current = setTimeout(tick, speed)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, speed])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {display || text}
    </span>
  )
}
