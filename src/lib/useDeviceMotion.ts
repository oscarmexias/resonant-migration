'use client'
import { useEffect, useRef } from 'react'

export function useDeviceMotion() {
  const tiltRef  = useRef({ x: 0, y: 0 })
  const shakeRef = useRef(0)

  useEffect(() => {
    const target = { x: 0, y: 0 }
    let raf: number

    const onOrientation = (e: DeviceOrientationEvent) => {
      // gamma: left-right (-90..90); beta: front-back (-180..180)
      // Subtract 45° from beta for natural phone-hold angle
      target.x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30))
      target.y = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 45) / 45))
    }

    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2)
      if (mag > 18) shakeRef.current = Math.min(1, (mag - 18) / 20)
    }

    // Spring-damped smooth update loop
    const update = () => {
      tiltRef.current.x += (target.x - tiltRef.current.x) * 0.08
      tiltRef.current.y += (target.y - tiltRef.current.y) * 0.08
      shakeRef.current  *= 0.88
      raf = requestAnimationFrame(update)
    }

    // iOS 13+ requires explicit user-gesture permission — auto-registers on Android/desktop
    const needsPermission = typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'

    if (!needsPermission) {
      window.addEventListener('deviceorientation', onOrientation, true)
      window.addEventListener('devicemotion', onMotion)
    }
    raf = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('deviceorientation', onOrientation, true)
      window.removeEventListener('devicemotion', onMotion)
    }
  }, [])

  return { tiltRef, shakeRef }
}
