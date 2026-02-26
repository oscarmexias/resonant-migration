import { useEffect, useRef, useState, useCallback } from 'react'
import type { VisionType } from '@/types/vision'

export interface InteractionState {
  // Mic
  micLevel: number
  micSeed: number // Random seed derived from audio

  // Motion/Shake
  shakeIntensity: number
  isShaking: boolean

  // Gyro/Orientation
  gyroAlpha: number // 0-360
  gyroBeta: number  // -180 to 180
  gyroGamma: number // -90 to 90

  // Click/Touch
  clickX: number // 0-1 normalized
  clickY: number // 0-1 normalized
  lastClickTime: number
}

const initialState: InteractionState = {
  micLevel: 0,
  micSeed: 0,
  shakeIntensity: 0,
  isShaking: false,
  gyroAlpha: 0,
  gyroBeta: 0,
  gyroGamma: 0,
  clickX: 0.5,
  clickY: 0.5,
  lastClickTime: 0,
}

export function useVisionInteractions(
  vision: VisionType | null,
  enabled: boolean
): [InteractionState, (e: React.MouseEvent) => void] {
  const [state, setState] = useState<InteractionState>(initialState)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play sound (vision-specific)
  const playSound = useCallback((frequency: number, duration: number) => {
    if (!enabled) return
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  }, [enabled, getAudioContext])

  // MICROPHONE (Surveillance + Organism)
  useEffect(() => {
    if (!enabled || !vision || (vision !== 'surveillance' && vision !== 'organism')) return

    let animId: number
    let audioStream: MediaStream | null = null

    const startMic = async () => {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = getAudioContext()
        const source = ctx.createMediaStreamSource(audioStream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkLevel = () => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          const normalized = Math.min(average / 128, 1)

          // Derive pseudo-random seed from audio spectral content
          const seed = dataArray.slice(0, 8).reduce((acc, val) => acc + val, 0) / 1000

          setState(prev => ({ ...prev, micLevel: normalized, micSeed: seed }))

          // Surveillance: glitch sound on loud input
          if (vision === 'surveillance' && normalized > 0.6) {
            playSound(100 + Math.random() * 300, 80)
          }

          animId = requestAnimationFrame(checkLevel)
        }

        checkLevel()
      } catch (err) {
        console.info('[El Ojo] Microphone access denied or unavailable')
      }
    }

    startMic()

    return () => {
      cancelAnimationFrame(animId)
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [enabled, vision, getAudioContext, playSound])

  // SHAKE/MOTION (Glitch)
  useEffect(() => {
    if (!enabled || vision !== 'glitch') return

    let lastX = 0, lastY = 0, lastZ = 0
    let decayTimer: ReturnType<typeof setTimeout>

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return

      const deltaX = Math.abs(acc.x - lastX)
      const deltaY = Math.abs(acc.y - lastY)
      const deltaZ = Math.abs(acc.z - lastZ)
      const totalDelta = deltaX + deltaY + deltaZ

      if (totalDelta > 15) {
        const intensity = Math.min(totalDelta / 50, 1)
        setState(prev => ({ ...prev, shakeIntensity: intensity, isShaking: true }))
        playSound(200 + intensity * 400, 100)

        clearTimeout(decayTimer)
        decayTimer = setTimeout(() => {
          setState(prev => ({ ...prev, shakeIntensity: 0, isShaking: false }))
        }, 800)
      }

      lastX = acc.x
      lastY = acc.y
      lastZ = acc.z
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      clearTimeout(decayTimer)
    }
  }, [enabled, vision, playSound])

  // GYROSCOPE (Volumetric)
  useEffect(() => {
    if (!enabled || vision !== 'volumetric') return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      setState(prev => ({
        ...prev,
        gyroAlpha: e.alpha ?? 0,
        gyroBeta: e.beta ?? 0,
        gyroGamma: e.gamma ?? 0,
      }))
    }

    // Request permission on iOS
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          }
        })
        .catch(console.error)
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [enabled, vision])

  // CLICK HANDLER (Brutalist + global melody)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setState(prev => ({
      ...prev,
      clickX: x,
      clickY: y,
      lastClickTime: Date.now(),
    }))

    // Sound feedback varies by vision
    if (vision === 'brutalist') {
      // Deep thump for brutalist
      playSound(80 + y * 200, 150)
    } else {
      // Default: La Cucaracha melody (simplified)
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00]
      const noteIndex = Math.floor(x * notes.length)
      playSound(notes[noteIndex], 150)
    }
  }, [enabled, vision, playSound])

  return [state, handleClick]
}
