'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useWorldStateStore } from '@/store/worldState'
import type { SignalState } from '@/types/worldstate'
import { vertGLSL, fragGLSL } from '@/shaders/monument.glsl'

// Signal key → uniform name mapping
const SIGNAL_UNIFORM_MAP: Record<keyof SignalState, string> = {
  clima:    'uSignalClima',
  cosmos:   'uSignalCosmos',
  tierra:   'uSignalTierra',
  economia: 'uSignalEconomia',
  atencion: 'uSignalAtencion',
  eventos:  'uSignalEventos',
}

const ALL_SIGNAL_KEYS = Object.keys(SIGNAL_UNIFORM_MAP) as Array<keyof SignalState>

function createBlackTexture(): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    THREE.RGBAFormat,
  )
  tex.needsUpdate = true
  return tex
}

export default function MonumentLoader() {
  const signals      = useWorldStateStore((s) => s.signals)
  const monumentData = useWorldStateStore((s) => s.monumentData)
  const setPhase     = useWorldStateStore((s) => s.setPhase)

  const mountRef        = useRef<HTMLDivElement>(null)
  // Mutable refs that do NOT trigger re-renders
  const rafRef          = useRef<number | null>(null)
  const rendererRef     = useRef<THREE.WebGLRenderer | null>(null)
  const materialRef     = useRef<THREE.ShaderMaterial | null>(null)
  const signalTargets   = useRef<Record<string, number>>({
    uSignalClima:    0,
    uSignalCosmos:   0,
    uSignalTierra:   0,
    uSignalEconomia: 0,
    uSignalAtencion: 0,
    uSignalEventos:  0,
  })
  const allDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasTriggeredRef = useRef(false)

  const successCount = ALL_SIGNAL_KEYS.filter(
    (k) => signals[k] === 'success',
  ).length

  // ── Mount: init Three.js renderer ─────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset    = '0'
    renderer.domElement.style.zIndex   = '0'
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Camera + scene
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const scene  = new THREE.Scene()

    // Fullscreen quad
    const geo = new THREE.PlaneGeometry(2, 2)

    const blackTex = createBlackTexture()

    // Shader uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uTime:          { value: 0 },
      uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMonumentTex:   { value: blackTex },
      uPhotoReady:    { value: 0 },
      uLandmarkType:  { value: monumentData?.landmarkType ?? 0 },
      uSeed:          { value: new THREE.Vector2(0.5, 0.5) },
      uSignalClima:    { value: 0 },
      uSignalCosmos:   { value: 0 },
      uSignalTierra:   { value: 0 },
      uSignalEconomia: { value: 0 },
      uSignalAtencion: { value: 0 },
      uSignalEventos:  { value: 0 },
    }

    // If prefers-reduced-motion: activate all signals immediately
    if (prefersReduced) {
      for (const key of Object.values(SIGNAL_UNIFORM_MAP)) {
        uniforms[key].value = 1.0
        signalTargets.current[key] = 1.0
      }
    }

    const material = new THREE.ShaderMaterial({
      vertexShader:   vertGLSL,
      fragmentShader: fragGLSL,
      uniforms,
    })
    materialRef.current = material

    const mesh = new THREE.Mesh(geo, material)
    scene.add(mesh)

    // Load monument photo texture (async — non-blocking)
    const photoUrl = monumentData?.imageProxyUrl ?? null
    let photoTex: THREE.Texture | null = null

    if (photoUrl) {
      const loader = new THREE.TextureLoader()
      loader.load(
        photoUrl,
        (tex) => {
          // Success
          photoTex = tex
          if (materialRef.current) {
            materialRef.current.uniforms['uMonumentTex'].value = tex
            materialRef.current.uniforms['uPhotoReady'].value  = 1.0
          }
        },
        undefined,
        () => {
          // Error — shader works without photo (uPhotoReady stays 0)
        },
      )
    }

    // Resize handler
    const handleResize = () => {
      if (!rendererRef.current || !materialRef.current) return
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      materialRef.current.uniforms['uResolution'].value.set(
        window.innerWidth,
        window.innerHeight,
      )
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    let clock = 0
    const LERP_SPEED = prefersReduced ? 1.0 : 0.02

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      clock += 0.016

      const u = material.uniforms
      u['uTime'].value = clock

      // Lerp each signal uniform toward its target
      for (const [signalName, uName] of Object.entries(SIGNAL_UNIFORM_MAP)) {
        void signalName
        const target  = signalTargets.current[uName] ?? 0
        const current = u[uName].value as number
        if (Math.abs(target - current) > 0.0001) {
          u[uName].value = current + (target - current) * LERP_SPEED
        } else {
          u[uName].value = target
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (allDoneTimerRef.current !== null) clearTimeout(allDoneTimerRef.current)
      renderer.dispose()
      geo.dispose()
      material.dispose()
      blackTex.dispose()
      if (photoTex) photoTex.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      rendererRef.current  = null
      materialRef.current  = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Mount only — signals are watched separately below

  // ── Watch signals: update targets as each one becomes 'success' ───────────
  useEffect(() => {
    for (const key of ALL_SIGNAL_KEYS) {
      if (signals[key] === 'success') {
        const uName = SIGNAL_UNIFORM_MAP[key]
        signalTargets.current[uName] = 1.0
      }
    }

    // When all 6 signals succeed, transition phase after 1200ms
    const allSuccess = ALL_SIGNAL_KEYS.every((k) => signals[k] === 'success')
    if (allSuccess && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      allDoneTimerRef.current = setTimeout(() => {
        setPhase('vision-select')
      }, 1200)
    }
  }, [signals, setPhase])

  return (
    <div
      ref={mountRef}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     5,
        background: '#080808',
      }}
    >
      {/* Accessibility: announce signal progress */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left:     '-9999px',
          width:    '1px',
          height:   '1px',
          overflow: 'hidden',
        }}
      >
        {`Reading signals… ${successCount}/6`}
      </div>
    </div>
  )
}
