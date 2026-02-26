'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useWorldStateStore } from '@/store/worldState'
import { getOptimalPixelRatio, type DeviceTier } from '@/lib/deviceTier'
import * as surveillance from '@/shaders/surveillance.glsl'
import * as glitch from '@/shaders/glitch.glsl'
import * as volumetric from '@/shaders/volumetric.glsl'
import * as brutalist from '@/shaders/brutalist.glsl'
import * as organism from '@/shaders/organism.glsl'
import { seedToNumber } from '@/lib/worldstate'
import { getLandmarkType } from '@/lib/monumentData'
import type { VisionType } from '@/types/vision'

const SHADER_MAP = {
  surveillance,
  glitch,
  volumetric,
  brutalist,
  organism,
}

interface Props {
  tier: DeviceTier
}

export default function ArtCanvasWebGL({ tier }: Props) {
  const mountRef     = useRef<HTMLDivElement>(null)
  const worldState   = useWorldStateStore((s) => s.worldState)
  const artParams    = useWorldStateStore((s) => s.artParams)
  const selectedVision = useWorldStateStore((s) => s.selectedVision)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !worldState || !artParams || !selectedVision) return

    // Select shader module based on vision
    const shaderModule = SHADER_MAP[selectedVision as VisionType]
    if (!shaderModule) return

    // ── Renderer ───────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(getOptimalPixelRatio(tier))
    renderer.setSize(window.innerWidth, window.innerHeight)
    mount.appendChild(renderer.domElement)

    // ── Fullscreen quad + orthographic camera ──────────────────────────────────
    const scene    = new THREE.Scene()
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)

    // ── Uniforms — world state packed into vec4 ────────────────────────────────
    const ws = worldState
    const uniforms: Record<string, THREE.IUniform> = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uAtmosphere: { value: new THREE.Vector4(
        ws.clima.temp, ws.clima.wind, ws.clima.humidity, ws.clima.windDir,
      )},
      uCosmos: { value: new THREE.Vector4(
        ws.cosmos.kpIndex,
        ws.cosmos.solarWind,
        ws.solar.isDaylight ? 1 : 0,
        ws.solar.sunElevation / 90,
      )},
      uEarth: { value: new THREE.Vector4(
        ws.tierra.nearestMagnitude,
        ws.tierra.nearestDistanceKm,
        ws.tierra.totalLastHour,
        0,
      )},
      uEconomy: { value: new THREE.Vector4(
        ws.economia.volatilityIndex,
        ws.economia.trendDir === 'up' ? 1 : ws.economia.trendDir === 'down' ? -1 : 0,
        0,
        0,
      )},
      uSocial: { value: new THREE.Vector2(ws.eventos.toneScore, ws.trending.score) },
      uCity:   { value: new THREE.Vector2(ws.location.lat, ws.location.lng) },
      // Dos floats derivados del seed SHA256 — huella única de esta ciudad+momento
      uSeed:   { value: new THREE.Vector2(
        seedToNumber(ws.seed),
        parseInt(ws.seed.slice(8, 16), 16) / 0xffffffff,
      )},
      // Arquetipo de monumento SDF 0-5 — identidad visual de la ciudad
      uLandmarkType: { value: getLandmarkType(ws.location.cityCode, seedToNumber(ws.seed)) },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader:   shaderModule.vertGLSL,
      fragmentShader: shaderModule.fragGLSL,
      uniforms,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    scene.add(mesh)

    // ── Animation loop ─────────────────────────────────────────────────────────
    let animId: number
    const startTime = performance.now()

    const animate = () => {
      if (document.hidden) { animId = requestAnimationFrame(animate); return }
      uniforms.uTime.value = (performance.now() - startTime) / 1000
      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }
    animate()

    // ── Resize ─────────────────────────────────────────────────────────────────
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      ;(uniforms.uResolution.value as THREE.Vector2).set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [worldState, artParams, tier, selectedVision])

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#080808' }}
    />
  )
}
