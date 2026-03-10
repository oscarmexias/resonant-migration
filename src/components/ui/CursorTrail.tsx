'use client'

/**
 * CursorTrail — vapor trail que sigue el cursor
 * Inspirado en el patrón Cursor Trail / Splash Cursor de 21st.dev
 *
 * Se monta en layout.tsx como overlay global.
 * Se oculta en dispositivos touch automáticamente.
 */

import { useEffect, useRef } from 'react'

const TRAIL_LEN  = 20
const TRAIL_SIZE = 10   // max dot diameter (px)
const COLOR      = '212, 129, 31'   // --eye-core en RGB

interface Point { x: number; y: number }

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const history   = useRef<Point[]>([])
  const mouse     = useRef<Point>({ x: -100, y: -100 })
  const rafRef    = useRef<number>(0)
  const isTouch   = useRef(false)

  useEffect(() => {
    // Don't render on touch devices
    if (typeof window === 'undefined') return
    if (window.matchMedia('(hover: none)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      if (isTouch.current) return
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    const onTouchStart = () => { isTouch.current = true }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onTouchStart, { passive: true })

    function draw() {
      if (!canvas || !ctx) return

      // Push current mouse position into history
      history.current.push({ ...mouse.current })
      if (history.current.length > TRAIL_LEN) history.current.shift()

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      history.current.forEach((pt, i) => {
        const ratio  = (i + 1) / TRAIL_LEN          // 0→1 (oldest→newest)
        const size   = TRAIL_SIZE * ratio * ratio    // quad ease — tip is tiny
        const alpha  = ratio * ratio * 0.5           // fade out toward tail

        ctx.beginPath()
        ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${COLOR}, ${alpha})`
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        99999,
        // hide on touch via media query
      }}
    />
  )
}
