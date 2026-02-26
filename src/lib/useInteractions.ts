import { useEffect, useRef, useState } from 'react'

// La Cucaracha melody (first 16 notes) - frequencies in Hz
const LA_CUCARACHA_NOTES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  261.63, // C4
  261.63, // C4
  293.66, // D4
  329.63, // E4
  261.63, // C4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  392.00, // G4
]

export function useInteractions(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [noteIndex, setNoteIndex] = useState(0)
  const [isShaking, setIsShaking] = useState(false)
  const [micLevel, setMicLevel] = useState(0)

  // Initialize AudioContext on first interaction
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }

  // Play beep with frequency from La Cucaracha
  const playBeep = (frequency: number, duration = 200) => {
    if (!enabled) return

    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }

  // Click handler - plays next note in melody
  const handleClick = () => {
    if (!enabled) return

    const frequency = LA_CUCARACHA_NOTES[noteIndex]
    playBeep(frequency, 200)
    setNoteIndex((prev) => (prev + 1) % LA_CUCARACHA_NOTES.length)
  }

  // Shake detection (DeviceMotion API)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let lastX = 0, lastY = 0, lastZ = 0
    let shakeCount = 0
    let shakeTimer: ReturnType<typeof setTimeout>

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return

      const deltaX = Math.abs(acc.x - lastX)
      const deltaY = Math.abs(acc.y - lastY)
      const deltaZ = Math.abs(acc.z - lastZ)

      if (deltaX + deltaY + deltaZ > 30) {
        shakeCount++
        if (shakeCount > 2) {
          setIsShaking(true)
          playBeep(523.25, 100) // C5 - higher pitch for shake

          clearTimeout(shakeTimer)
          shakeTimer = setTimeout(() => {
            setIsShaking(false)
            shakeCount = 0
          }, 500)
        }
      }

      lastX = acc.x
      lastY = acc.y
      lastZ = acc.z
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      clearTimeout(shakeTimer)
    }
  }, [enabled])

  // Microphone level detection
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let animationId: number
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
          const normalized = Math.min(average / 128, 1) // 0-1 range

          setMicLevel(normalized)

          // Play sound when mic picks up loud noise
          if (normalized > 0.5) {
            playBeep(659.25 + normalized * 200, 50) // E5 + variation
          }

          animationId = requestAnimationFrame(checkLevel)
        }

        checkLevel()
      } catch (err) {
        console.info('[El Ojo] Microphone access denied or unavailable')
      }
    }

    startMic()

    return () => {
      cancelAnimationFrame(animationId)
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [enabled])

  return {
    handleClick,
    isShaking,
    micLevel,
  }
}
