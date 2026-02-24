'use client'

import { useEffect, useRef } from 'react'
import { useWorldStateStore } from '@/store/worldState'
import { seedToNumber } from '@/lib/worldstate'
import { buildMosaicGrid, type FontGrid, type FontGridCell } from '@/lib/pixelFont'
import { getDominantConstellation, type ConstellationResult } from '@/lib/constellation'
import { useDeviceMotion } from '@/lib/useDeviceMotion'
import { useIsLandscape } from '@/lib/useIsMobile'

// Pixel font grid of generative algorithms — all fed by the same WorldState
// Each active pixel of the city code (CDMX, MAD, NYC…) runs one of 13 algorithms.
// Inactive pixels are void (#080808).

export default function ArtCanvasInner() {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const animFrameRef  = useRef<number>(0)
  const { tiltRef, shakeRef } = useDeviceMotion()
  const isLandscape   = useIsLandscape()  // causes effect re-run on orientation change → rebuilds grid
  const lastShakeFrame = useRef(0)
  const monumentRef   = useRef<{
    img:           HTMLImageElement | null
    name:          string
    nameEs:        string
    myth:          string
    needsResample: boolean
    cellH:         Float32Array | null
    cellS:         Float32Array | null
    cellL:         Float32Array | null
    lumThreshold:  number
  } | null>(null)
  const artParams        = useWorldStateStore((s) => s.artParams)
  const worldState       = useWorldStateStore((s) => s.worldState)
  const mosaicMode       = useWorldStateStore((s) => s.mosaicMode)
  const monumentModeOn   = useWorldStateStore((s) => s.monumentModeOn)
  // Ref-based so toggle is instant (next draw frame) without remounting canvas
  const monumentModeOnRef = useRef(monumentModeOn)
  useEffect(() => { monumentModeOnRef.current = monumentModeOn }, [monumentModeOn])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !artParams || !worldState) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cityCode   = worldState.location.cityCode ?? 'UNK'
    // In 'name' mode render the full English city name; fall back to code if unavailable
    const cityName   = (worldState.location.city ?? cityCode)
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')   // keep letters + spaces for word gaps
      .trim() || cityCode
    const mosaicLabel = mosaicMode === 'name' ? cityName : cityCode

    // Compute dominant constellation once — uses lat/lng + current time
    const constellationResult: ConstellationResult | null = getDominantConstellation(
      worldState.location.lat,
      worldState.location.lng,
      worldState.generatedAt,
    )

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const seedNum = seedToNumber(worldState.seed)
    const {
      particleSpeed, storminess, chaos, warmth, shockwaveIntensity,
      fieldAngle, entropy, brightness, density, paletteHueShift,
      solarWindSpeed, trendDir, quakeProximity, quakeActivity,
    } = artParams

    const isDaylight = (artParams as any).isDaylight ?? true
    const sunElevation = (artParams as any).sunElevation ?? 0
    const trendingKeyword = (artParams as any).trendingKeyword ?? 'RESONANCE'
    const trendingIntensity = (artParams as any).trendingIntensity ?? 0.5
    const trafficDensity = (artParams as any).trafficDensity ?? 0.3
    const crowdDensity = (artParams as any).crowdDensity ?? 0.3

    // ── Shared color ────────────────────────────────────────────────────────
    const baseHue    = warmth * 38 + (1 - warmth) * 215
    const primaryHue = ((baseHue + paletteHueShift) % 360 + 360) % 360
    const saturation = 55 + chaos * 35
    const gravityY   = trendDir === 'up' ? -0.006 : trendDir === 'down' ? 0.006 : 0

    // Each algo gets a hue shifted 28° from the previous
    const H13 = Array.from({ length: 13 }, (_, i) => (primaryHue + i * 28) % 360)

    // Deterministic PRNG from seed
    const rng = (i: number) => {
      const x = Math.sin(seedNum * 9301 + i * 49297 + 233720) * 46340
      return x - Math.floor(x)
    }

    // Shared seismic params
    const ringCount      = Math.ceil(shockwaveIntensity * 5) + Math.ceil(quakeActivity * 2)
    const ringPulseSpeed = 0.006 + quakeProximity * 0.014
    const ringPhase      = seedNum * Math.PI * 2

    // ── Per-cell state maps ──────────────────────────────────────────────────
    type P = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }
    type NodeT = { nx: number; ny: number; flash: number }
    const campoStates   = new Map<string, P[]>()
    const flujoStates   = new Map<string, P[]>()
    const networkStates = new Map<string, NodeT[]>()
    type LightningBolt = { x1: number; y1: number; x2: number; y2: number; age: number; maxAge: number; jags: {x:number;y:number}[] }
    const plasmaStates = new Map<string, { bolts: LightningBolt[]; nextBolt: number }>()
    const vortexStates = new Map<string, { angle: number }>()

    // ── Size canvas to screen BEFORE building grid (avoids 300×150 default on first mount) ──
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    // ── Build mosaic grid — entire canvas filled with ~20px cells ───────────
    const grid = buildMosaicGrid(mosaicLabel, canvas.width, canvas.height, seedNum)
    const cellIsMicro = grid.cellW < 30   // true for all mosaic cells (~20px)
    const scaleFactor = cellIsMicro ? 0.06 : 8 / Math.max(8, grid.activeCells.length)

    // ── Vignette cache — render once per lifecycle, drawImage instead of createRadialGradient ──
    // Eliminates N gradient allocations per frame (was the primary GC pressure source)
    const vigW = grid.cellW - 2, vigH = grid.cellH - 2   // GAP=1 on each side
    const vigCanvas = document.createElement('canvas')
    vigCanvas.width = vigW; vigCanvas.height = vigH
    const vigCtx = vigCanvas.getContext('2d')!
    const _vg = vigCtx.createRadialGradient(vigW / 2, vigH / 2, 0, vigW / 2, vigH / 2, Math.hypot(vigW / 2, vigH / 2))
    _vg.addColorStop(0,    'rgba(8,8,8,0)')
    _vg.addColorStop(0.52, 'rgba(8,8,8,0)')
    _vg.addColorStop(1,    'rgba(8,8,8,0.82)')
    vigCtx.fillStyle = _vg
    vigCtx.fillRect(0, 0, vigW, vigH)

    grid.activeCells.forEach((cell, ci) => {
      const key = `${cell.col}:${cell.row}`
      const seedOff = ci * 7777

      if (cell.algoIndex === 0) { // EL CAMPO
        const N = Math.floor((60 + density * 200) * scaleFactor)
        const ox = cell.col * grid.cellW, oy = cell.row * grid.cellH
        campoStates.set(key, Array.from({ length: N }, (_, i) => ({
          x: ox + rng(i + seedOff) * grid.cellW,
          y: oy + rng(i + seedOff + 1000) * grid.cellH,
          vx: (rng(i + seedOff + 2000) - 0.5) * (particleSpeed * 3 + 0.5),
          vy: (rng(i + seedOff + 3000) - 0.5) * (particleSpeed * 3 + 0.5),
          life: rng(i + seedOff + 4000) * 100,
          maxLife: 50 + rng(i + seedOff + 5000) * 140,
          size: 0.4 + rng(i + seedOff + 6000) * 1.8 * (1 + storminess * 0.8),
        })))
      }
      if (cell.algoIndex === 4) { // EL FLUJO
        const N = Math.floor((55 + density * 170) * scaleFactor)
        const ox = cell.col * grid.cellW, oy = cell.row * grid.cellH
        flujoStates.set(key, Array.from({ length: N }, (_, i) => ({
          x: ox + rng(i + seedOff + 10000) * grid.cellW,
          y: oy + rng(i + seedOff + 11000) * grid.cellH,
          vx: 0, vy: 0,
          life: rng(i + seedOff + 12000) * 120,
          maxLife: 80 + rng(i + seedOff + 13000) * 120,
          size: 0.3 + rng(i + seedOff + 14000) * 1.2,
        })))
      }
      if (cell.algoIndex === 5) { // LA RED
        const NET_N = cellIsMicro
          ? Math.max(4, Math.floor(3 + density * 3))
          : Math.max(8, Math.floor((18 + density * 22) * scaleFactor))
        networkStates.set(key, Array.from({ length: NET_N }, (_, i) => ({
          nx: rng(i + seedOff + 20000),
          ny: rng(i + seedOff + 21000),
          flash: 0,
        })))
      }
      if (cell.algoIndex === 8) { // EL PLASMA
        plasmaStates.set(key, { bolts: [], nextBolt: 0 })
      }
      if (cell.algoIndex === 11) { // EL VÓRTEX
        vortexStates.set(key, { angle: rng(ci + seedOff + 99000) * Math.PI * 2 })
      }
    })

    // ── Utility: clip to cell + vignette ────────────────────────────────────
    const withCell = (
      ox: number, oy: number, cW: number, cH: number,
      fn: (ox: number, oy: number) => void,
    ) => {
      ctx.save()
      ctx.beginPath()
      ctx.rect(ox, oy, cW, cH)
      ctx.clip()
      fn(ox, oy)
      ctx.restore()
    }

    const vignette = (cx: number, cy: number, r: number) => {
      const v = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      v.addColorStop(0,    'rgba(8,8,8,0)')
      v.addColorStop(0.52, 'rgba(8,8,8,0)')
      v.addColorStop(1,    'rgba(8,8,8,0.82)')
      return v
    }

    const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      const l = (max + min) / 2
      if (max === min) return [0, 0, l * 100]
      const d = max - min
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      let h = 0
      if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b - r) / d + 2) / 6
      else                h = ((r - g) / d + 4) / 6
      return [h * 360, s * 100, l * 100]
    }

    let frame = 0

    // ── Perf diagnostics (dev-only · press P to toggle) ─────────────────────
    const DEV = process.env.NODE_ENV === 'development'
    const perf = {
      show:       DEV,
      fps:        0,
      drawMs:     0,
      frameTimes: [] as number[],
      lastT:      performance.now(),
    }
    const onKeyP = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') perf.show = !perf.show
    }
    if (DEV) window.addEventListener('keydown', onKeyP)

    // ── Interaction state ────────────────────────────────────────────────────
    const mousePos = { x: -1, y: -1 }
    type Ripple    = { x: number; y: number; r: number; maxR: number; born: number }
    const ripples: Ripple[]         = []
    const cellFlash                 = new Map<string, number>()

    const spawnRipple = (cx: number, cy: number) => {
      if (ripples.length >= 5) ripples.shift()
      ripples.push({ x: cx, y: cy, r: 0, maxR: Math.max(canvas.width, canvas.height) * 0.55, born: frame })
    }

    const toCanvas = (clientX: number, clientY: number) => {
      const rect  = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left) * (canvas.width  / rect.width),
        y: (clientY - rect.top)  * (canvas.height / rect.height),
      }
    }

    const onMouseMove  = (e: MouseEvent)  => { const p = toCanvas(e.clientX, e.clientY); mousePos.x = p.x; mousePos.y = p.y }
    const onMouseLeave = ()               => { mousePos.x = -1; mousePos.y = -1 }
    const onClick      = (e: MouseEvent)  => { const p = toCanvas(e.clientX, e.clientY); spawnRipple(p.x, p.y) }
    const onTouchStart = (e: TouchEvent)  => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const p = toCanvas(e.changedTouches[i].clientX, e.changedTouches[i].clientY)
        spawnRipple(p.x, p.y)
      }
    }

    const draw = () => {
      if (document.hidden) { animFrameRef.current = requestAnimationFrame(draw); return }

      const _t0 = performance.now()
      let _activeCells = 0

      const W = canvas.width, H = canvas.height

      // Shake → spawn ripple
      if (shakeRef.current > 0.35 && frame - lastShakeFrame.current > 18) {
        spawnRipple(
          W / 2 + (Math.random() - 0.5) * W * 0.4,
          H / 2 + (Math.random() - 0.5) * H * 0.4,
        )
        lastShakeFrame.current = frame
      }

      // Clear canvas to void
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, W, H)

      const { cellW: cW, cellH: cH, cells: allCells } = grid

      // Resample monument image at current grid dimensions when newly loaded (4× supersample)
      if (monumentRef.current?.needsResample && monumentRef.current.img) {
        const SW = grid.gridCols * 4, SH = grid.gridRows * 4
        const oc = document.createElement('canvas')
        oc.width = SW; oc.height = SH
        const oc2 = oc.getContext('2d', { willReadFrequently: true })!
        oc2.drawImage(monumentRef.current.img, 0, 0, SW, SH)
        const raw = oc2.getImageData(0, 0, SW, SH).data
        const N = grid.gridCols * grid.gridRows
        const cellH = new Float32Array(N)
        const cellS = new Float32Array(N)
        const cellL = new Float32Array(N)
        for (let row = 0; row < grid.gridRows; row++) {
          for (let col = 0; col < grid.gridCols; col++) {
            let sh = 0, ss = 0, sl = 0
            for (let dr = 0; dr < 4; dr++) {
              for (let dc = 0; dc < 4; dc++) {
                const pi = ((row * 4 + dr) * SW + (col * 4 + dc)) * 4
                const [h, s, l] = rgbToHsl(raw[pi], raw[pi + 1], raw[pi + 2])
                sh += h; ss += s; sl += l
              }
            }
            const ci = row * grid.gridCols + col
            cellH[ci] = sh / 16
            cellS[ci] = ss / 16
            cellL[ci] = sl / 16
          }
        }
        // Adaptive luminance threshold: 30th-percentile so most lit surfaces are active
        const lumSorted = Array.from(cellL).sort((a, b) => a - b)
        const threshold = Math.max(18, lumSorted[Math.floor(N * 0.30)])
        monumentRef.current.cellH = cellH
        monumentRef.current.cellS = cellS
        monumentRef.current.cellL = cellL
        monumentRef.current.lumThreshold = threshold
        monumentRef.current.needsResample = false
      }
      const monH = (monumentModeOnRef.current && monumentRef.current?.cellH) ? monumentRef.current.cellH : null
      const monS = monH ? monumentRef.current!.cellS : null
      const monL = monH ? monumentRef.current!.cellL : null
      const monThreshold = monumentRef.current?.lumThreshold ?? 25

      // 1px gap between cells gives the mosaic grid-line look
      const GAP = 1

      // Center the grid on the canvas
      const gridPixelW = grid.gridCols * cW
      const gridPixelH = grid.gridRows * cH
      const offsetX = Math.floor((W - gridPixelW) / 2)
      const offsetY = Math.floor((H - gridPixelH) / 2)

      // Gyroscope parallax
      const jiggleX = tiltRef.current.x * 20   // ±20px parallax
      const jiggleY = tiltRef.current.y * 12   // ±12px parallax
      const effectiveOffsetX = offsetX + jiggleX
      const effectiveOffsetY = offsetY + jiggleY

      // Draw ALL cells — inactive: dark ambient; active: generative algorithms tinted by monument palette
      for (const cell of allCells) {
        // Per-column perspective distortion for 3D tilt feel
        const perspY = tiltRef.current.x * (cell.col - grid.gridCols / 2) * 0.2
        const ox = effectiveOffsetX + cell.col * cW
        const oy = effectiveOffsetY + cell.row * cH + perspY

        // Monument mode: derive hue + activity from image pixel
        let cellBaseHue        = H13[cell.algoIndex >= 0 ? cell.algoIndex : 0]
        let cellBaseSat        = saturation
        let cellBaseLum        = 55.0
        let isCellActive       = cell.isActive
        let effectiveAlgoIndex = cell.algoIndex >= 0 ? cell.algoIndex : (cell.col * 7 + cell.row * 13) % 13

        if (monH) {
          const ci    = cell.row * grid.gridCols + cell.col
          cellBaseHue = monH[ci]
          cellBaseSat = monS![ci]
          cellBaseLum = monL![ci]
          // Activate only cells above the pre-computed luminance threshold (30th-percentile)
          // Cells below threshold render as dark voids — preserves monument silhouette, kills ~30-70% of draw cost
          isCellActive = cellBaseLum > monThreshold
        }

        // ── Inactive cell: dark breathing void ──────────────────────────────
        if (!isCellActive) {
          const phase = cell.col * 0.37 + cell.row * 0.61 + frame * 0.005
          const l = 3 + Math.sin(phase) * 1.5
          ctx.fillStyle = `hsl(${primaryHue},7%,${l.toFixed(1)}%)`
          ctx.fillRect(ox + GAP, oy + GAP, cW - 2 * GAP, cH - 2 * GAP)
          continue
        }

        // ── Active cell: generative algorithm ────────────────────────────
        const key = `${cell.col}:${cell.row}`
        _activeCells++

        // ── Monument fast-path (~1μs/cell vs ~44μs for full algorithms) ─────────
        // In monument mode, 20px cells running full particle systems are indistinguishable
        // from a simple animated fill — save ~43μs/cell → enables 60fps vs 4fps
        if (monH) {
          const breathe = (Math.sin(frame * 0.025 + cell.col * 0.18 + cell.row * 0.27) + 1) / 2
          ctx.fillStyle = `hsl(${Math.round(cellBaseHue)},${Math.round(cellBaseSat)}%,${Math.round(cellBaseLum * (0.55 + breathe * 0.45))}%)`
          ctx.fillRect(ox + GAP, oy + GAP, cW - 2, cH - 2)
          ctx.drawImage(vigCanvas, ox + GAP, oy + GAP)
          continue
        }

        withCell(ox + GAP, oy + GAP, cW - 2 * GAP, cH - 2 * GAP, (ox, oy) => {
          // cellBaseHue is already tinted by monument palette (monH[ci]) when monument is loaded
          // Algorithms run at full opacity — generative art is the protagonist
          switch (effectiveAlgoIndex) {
            // ── case 0: EL CAMPO — organic particle cloud ───────────────
            case 0: {
              ctx.fillStyle = `rgba(8,8,8,${0.03 + (1 - entropy) * 0.07})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2

              // Aurora (solar wind)
              if (solarWindSpeed > 0.15) {
                for (let b = 0; b < 3; b++) {
                  const bY     = oy + cH * 0.03 + b * cH * 0.04
                  const shimmer = (Math.sin(frame * 0.018 + b * 1.4 + seedNum * 6) + 1) / 2
                  const g = ctx.createLinearGradient(0, bY - 18, 0, bY + 18)
                  g.addColorStop(0,   'rgba(0,210,120,0)')
                  g.addColorStop(0.5, `rgba(0,210,120,${solarWindSpeed * shimmer * 0.12})`)
                  g.addColorStop(1,   'rgba(0,210,120,0)')
                  ctx.fillStyle = g
                  ctx.fillRect(ox, bY - 18, cW, 36)
                }
              }
              // Seismic rings
              for (let r = 0; r < ringCount; r++) {
                const maxR  = Math.min(cW, cH) * (0.14 + r * 0.11)
                const t     = (frame * ringPulseSpeed + ringPhase + r * 0.65) % (Math.PI * 2)
                const rad   = maxR * ((Math.sin(t) + 1) / 2)
                const alpha = (shockwaveIntensity * 0.35 + quakeActivity * 0.15) * (1 - rad / maxR)
                ctx.beginPath()
                ctx.arc(cx, cy, Math.max(0.5, rad), 0, Math.PI * 2)
                ctx.strokeStyle = `hsla(${cellBaseHue + 10},70%,55%,${alpha})`
                ctx.lineWidth   = 1 + shockwaveIntensity * 1.5
                ctx.stroke()
              }
              // Particles
              // Lazy init for monument-activated cells not in initial activeCells
              if (!campoStates.has(key)) {
                const seedOff = (cell.col * 137 + cell.row * 97) * 777
                const N = Math.floor((60 + density * 200) * scaleFactor)
                campoStates.set(key, Array.from({ length: N }, (_, i) => ({
                  x: (cell.col * grid.cellW) + rng(i + seedOff) * grid.cellW,
                  y: (cell.row * grid.cellH) + rng(i + seedOff + 1000) * grid.cellH,
                  vx: (rng(i + seedOff + 2000) - 0.5) * (particleSpeed * 3 + 0.5),
                  vy: (rng(i + seedOff + 3000) - 0.5) * (particleSpeed * 3 + 0.5),
                  life: rng(i + seedOff + 4000) * 100,
                  maxLife: 50 + rng(i + seedOff + 5000) * 140,
                  size: 0.4 + rng(i + seedOff + 6000) * 1.8 * (1 + storminess * 0.8),
                })))
              }
              const campoP = campoStates.get(key) ?? []
              for (const p of campoP) {
                p.life++
                if (p.life > p.maxLife) {
                  p.x = ox + rng(frame + p.life)       * cW
                  p.y = oy + rng(frame + p.life + 500) * cH
                  p.life = 0
                }
                p.vx += Math.cos(fieldAngle) * (0.015 + storminess * 0.07)
                p.vy += Math.sin(fieldAngle) * (0.015 + storminess * 0.07) + gravityY
                if (chaos > 0.2) {
                  p.vx += (rng((frame + p.life) * 0.1)       - 0.5) * chaos * 0.4
                  p.vy += (rng((frame + p.life) * 0.1 + 100) - 0.5) * chaos * 0.4
                }
                p.vx *= 0.975; p.vy *= 0.975
                p.x  += p.vx;  p.y  += p.vy
                if (p.x < ox)      p.x += cW;  if (p.x > ox + cW) p.x -= cW
                if (p.y < oy)      p.y += cH;  if (p.y > oy + cH) p.y -= cH
                const lr = p.life / p.maxLife
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${cellBaseHue + lr * 15},${saturation}%,${50 + lr * 20}%,${Math.sin(lr * Math.PI) * brightness * 0.65})`
                ctx.fill()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 1: EL TEJIDO — sine-wave interference weave ────────
            case 1: {
              ctx.fillStyle = `rgba(8,8,8,${0.06 + (1 - entropy) * 0.04})`
              ctx.fillRect(ox, oy, cW, cH)

              const rcx = ox + cW / 2, rcy = oy + cH / 2
              const wf1  = 1.5 + storminess * 5.5
              const wf2  = (1 + chaos * 7) * 1.618
              const lc   = cellIsMicro ? Math.max(3, Math.floor(3 + density * 4)) : Math.floor(15 + density * 35)
              const A1   = (cH / lc) * 0.48 * (0.25 + particleSpeed * 0.75)
              const A2   = A1 * 0.38 * chaos
              const t1   = frame * 0.013, t2 = frame * 0.0079

              for (let i = 0; i < lc; i++) {
                const lt   = i / (lc - 1)
                const yB   = oy + cH * 0.04 + lt * cH * 0.92
                const ps   = lt * fieldAngle * 4
                ctx.beginPath()
                for (let xi = 0; xi <= (cellIsMicro ? 8 : 60); xi++) {
                  const tx   = xi / 60
                  const x    = ox + tx * cW
                  const dx   = x - rcx, dy = yB - rcy
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  const sd   = shockwaveIntensity > 0.04
                    ? Math.sin(dist * 0.02 - frame * ringPulseSpeed * 2.5 + ringPhase) * shockwaveIntensity * A1 * 0.7
                    : 0
                  const y = yB
                    + A1 * Math.sin(tx * Math.PI * 2 * wf1 + ps + t1)
                    + A2 * Math.sin(tx * Math.PI * 2 * wf2 + ps * 1.3 + t2)
                    + sd + gravityY * dist * 0.4
                  xi === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
                }
                const breathe = (Math.sin(lt * Math.PI * 4 + t1 * 0.8) + 1) / 2
                ctx.strokeStyle = `hsla(${cellBaseHue + lt * 18},${38 + chaos * 28}%,${42 + breathe * 28}%,${brightness * 0.38 * (0.3 + breathe * 0.7)})`
                ctx.lineWidth   = 0.55 + shockwaveIntensity * 0.9
                ctx.stroke()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 2: EL PULSO — concentric breathing rings ───────────
            case 2: {
              ctx.fillStyle = `rgba(8,8,8,${0.04 + (1 - entropy) * 0.06})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              const maxR = Math.min(cW, cH) * 0.46

              // Kp family: large slow-breathing rings (geomagnetic)
              const kpRings = 1 + Math.round(storminess * 4)
              for (let r = 0; r < kpRings; r++) {
                const phase  = ringPhase + r * (Math.PI * 2 / kpRings)
                const t      = (frame * 0.007 + phase) % (Math.PI * 2)
                const radius = maxR * (0.25 + 0.75 * (Math.sin(t) + 1) / 2)
                const alpha  = (storminess * 0.45 + 0.05) * (1 - radius / maxR)
                ctx.beginPath()
                ctx.arc(cx, cy, radius, 0, Math.PI * 2)
                ctx.strokeStyle = `hsla(${cellBaseHue},60%,55%,${alpha})`
                ctx.lineWidth   = 0.7 + storminess * 2.5
                ctx.stroke()
              }
              // Seismic family: fast tight rings
              const seisRings = Math.ceil(shockwaveIntensity * 6) + Math.ceil(quakeActivity * 3)
              for (let r = 0; r < seisRings; r++) {
                const t      = (frame * ringPulseSpeed * 2.2 + ringPhase + r * 0.5) % (Math.PI * 2)
                const radius = maxR * 0.85 * ((Math.sin(t) + 1) / 2)
                const alpha  = (shockwaveIntensity * 0.55 + quakeActivity * 0.2) * (1 - radius / (maxR * 0.85))
                ctx.beginPath()
                ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2)
                ctx.strokeStyle = `hsla(${cellBaseHue + 20},78%,65%,${alpha})`
                ctx.lineWidth   = 1.5 + shockwaveIntensity * 2.5
                ctx.stroke()
              }
              // Center glow (UV driven)
              const glowR = maxR * 0.18 * (0.5 + (Math.sin(frame * 0.045) + 1) / 2 * storminess)
              if (glowR > 0.5) {
                const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
                glow.addColorStop(0, `hsla(${cellBaseHue},85%,72%,${brightness * 0.5})`)
                glow.addColorStop(1, `hsla(${cellBaseHue},60%,50%,0)`)
                ctx.fillStyle = glow
                ctx.fillRect(ox, oy, cW, cH)
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 3: EL ESPEJO — Lissajous parametric curve ──────────
            case 3: {
              ctx.fillStyle = `rgba(8,8,8,${0.02 + (1 - entropy) * 0.05})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              const A  = cW * 0.38, B = cH * 0.38
              const a  = 1 + Math.round(storminess * 3)
              const b  = 1 + Math.round(chaos * 2)
              const delta = fieldAngle + frame * 0.003

              const STEPS = cellIsMicro ? 100 : 700
              const period = Math.PI * 2 * Math.max(a, b)

              for (let s = 0; s < STEPS; s++) {
                const t   = (s / STEPS) * period
                const x   = cx + A * Math.sin(a * t + delta)
                const y   = cy + B * Math.sin(b * t)
                const lr  = s / STEPS
                const alpha = brightness * 0.55 * Math.sin(lr * Math.PI)
                ctx.beginPath()
                ctx.arc(x, y, 0.7 + chaos * 0.6, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${cellBaseHue + lr * 35},${saturation}%,60%,${alpha})`
                ctx.fill()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 4: EL FLUJO — turbulent flow-field streamlines ─────
            case 4: {
              ctx.fillStyle = `rgba(8,8,8,${0.035 + (1 - entropy) * 0.055})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              // Lazy init for monument-activated cells
              if (!flujoStates.has(key)) {
                const seedOff = (cell.col * 137 + cell.row * 97) * 777
                const N = Math.floor((55 + density * 170) * scaleFactor)
                flujoStates.set(key, Array.from({ length: N }, (_, i) => ({
                  x: (cell.col * grid.cellW) + rng(i + seedOff + 10000) * grid.cellW,
                  y: (cell.row * grid.cellH) + rng(i + seedOff + 11000) * grid.cellH,
                  vx: 0, vy: 0,
                  life: rng(i + seedOff + 12000) * 120,
                  maxLife: 80 + rng(i + seedOff + 13000) * 120,
                  size: 0.3 + rng(i + seedOff + 14000) * 1.2,
                })))
              }
              const flujoP = flujoStates.get(key) ?? []

              for (const p of flujoP) {
                p.life++
                if (p.life > p.maxLife) {
                  p.x = ox + rng(frame + p.life + 30000) * cW
                  p.y = oy + rng(frame + p.life + 30500) * cH
                  p.vx = 0; p.vy = 0; p.life = 0
                }
                const nx     = (p.x - ox) / cW
                const ny     = (p.y - oy) / cH
                const noiseA = fieldAngle
                  + storminess * Math.sin(nx * Math.PI * 3 + frame * 0.01)
                  * Math.cos(ny * Math.PI * 3 - frame * 0.008)
                  + chaos * Math.sin(nx * Math.PI * 7 + ny * Math.PI * 5 + frame * 0.015) * 0.8
                p.vx = p.vx * 0.82 + Math.cos(noiseA) * (0.02 + particleSpeed * 0.07)
                p.vy = p.vy * 0.82 + Math.sin(noiseA) * (0.02 + particleSpeed * 0.07) + gravityY * 0.5
                p.x += p.vx; p.y += p.vy
                if (p.x < ox)      p.x += cW;  if (p.x > ox + cW) p.x -= cW
                if (p.y < oy)      p.y += cH;  if (p.y > oy + cH) p.y -= cH
                const lr = p.life / p.maxLife
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${cellBaseHue + lr * 20},${saturation * 0.75}%,${55 + lr * 15}%,${Math.sin(lr * Math.PI) * brightness * 0.58})`
                ctx.fill()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 5: LA RED — living network graph ───────────────────
            case 5: {
              ctx.fillStyle = `rgba(8,8,8,${0.05 + (1 - entropy) * 0.06})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx      = ox + cW / 2, cy = oy + cH / 2
              const maxDist = cW * (0.28 + storminess * 0.15)
              // Lazy init for monument-activated cells
              if (!networkStates.has(key)) {
                const seedOff = (cell.col * 137 + cell.row * 97) * 777
                const NET_N = cellIsMicro
                  ? Math.max(4, Math.floor(3 + density * 3))
                  : Math.max(8, Math.floor((18 + density * 22) * scaleFactor))
                networkStates.set(key, Array.from({ length: NET_N }, (_, i) => ({
                  nx: rng(i + seedOff + 20000),
                  ny: rng(i + seedOff + 21000),
                  flash: 0,
                })))
              }
              const nodes   = networkStates.get(key) ?? []

              // Seismic: randomly flash a node
              if (shockwaveIntensity > 0.08 && frame % 7 === 0 && nodes.length > 0) {
                nodes[Math.floor(rng(frame * 0.1 + 99999) * nodes.length)].flash = 14
              }
              nodes.forEach(n => { if (n.flash > 0) n.flash-- })

              // Jittered positions
              const pos = nodes.map((n, i) => ({
                x: ox + cW * 0.08 + n.nx * cW * 0.84 + Math.sin(frame * 0.02 + i * 1.3) * chaos * (cellIsMicro ? 2 : 7),
                y: oy + cH * 0.08 + n.ny * cH * 0.84 + Math.cos(frame * 0.017 + i * 0.9) * chaos * (cellIsMicro ? 2 : 7),
              }))

              // Edges
              for (let i = 0; i < pos.length; i++) {
                for (let j = i + 1; j < pos.length; j++) {
                  const dx   = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  if (dist < maxDist) {
                    const edgeA = (1 - dist / maxDist) * (0.25 + chaos * 0.4)
                    ctx.beginPath()
                    ctx.moveTo(pos[i].x, pos[i].y)
                    ctx.lineTo(pos[j].x, pos[j].y)
                    ctx.strokeStyle = `hsla(${cellBaseHue},50%,55%,${edgeA})`
                    ctx.lineWidth   = 0.5 + shockwaveIntensity * 1.2
                    ctx.stroke()
                  }
                }
              }
              // Nodes
              for (let i = 0; i < pos.length; i++) {
                const isFlash = nodes[i].flash > 0
                ctx.beginPath()
                ctx.arc(pos[i].x, pos[i].y, isFlash ? 3.5 + shockwaveIntensity * 3 : 1.5, 0, Math.PI * 2)
                ctx.fillStyle = isFlash
                  ? `hsla(${cellBaseHue + 30},92%,78%,0.95)`
                  : `hsla(${cellBaseHue},62%,62%,${brightness * 0.65})`
                ctx.fill()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 6: EL CRISTAL — deforming geometric lattice ────────
            case 6: {
              ctx.fillStyle = `rgba(8,8,8,${0.07 + (1 - entropy) * 0.04})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx      = ox + cW / 2, cy = oy + cH / 2
              const GCOLS   = cellIsMicro ? 4 : 13
              const GROWS   = cellIsMicro ? 3 : 9
              const gW      = cW / GCOLS, gH = cH / GROWS
              const amp     = gW * 0.45 * (0.15 + particleSpeed * 0.55 + storminess * 0.3)
              const t       = frame * 0.011

              // Build deformed grid
              const pts: { x: number; y: number }[][] = []
              for (let row = 0; row <= GROWS; row++) {
                pts[row] = []
                for (let col = 0; col <= GCOLS; col++) {
                  const bx = ox + col * gW, by = oy + row * gH
                  const gnx = col / GCOLS, gny = row / GROWS
                  const dx = bx - cx, dy = by - cy
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  const seis = shockwaveIntensity > 0.04
                    ? Math.sin(dist * 0.024 - frame * ringPulseSpeed * 2.2 + ringPhase)
                      * shockwaveIntensity * amp * 0.85
                    : 0
                  const px = bx
                    + amp * Math.sin(gnx * Math.PI * 3.5 + t       + seedNum * 2)
                    + amp * 0.3 * chaos * Math.sin(gny * Math.PI * 6 + t * 1.4)
                    + seis * (dx / (dist + 0.1))
                  const py = by
                    + amp * Math.cos(gny * Math.PI * 3.5 + t * 0.8  + seedNum)
                    + amp * 0.3 * chaos * Math.cos(gnx * Math.PI * 6 - t * 1.2)
                    + seis * (dy / (dist + 0.1))
                  pts[row][col] = { x: px, y: py }
                }
              }
              // Draw horizontal lines
              for (let row = 0; row <= GROWS; row++) {
                ctx.beginPath()
                for (let col = 0; col <= GCOLS; col++) {
                  const p = pts[row][col]
                  col === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
                }
                const nt    = row / GROWS
                const alpha = brightness * 0.3 * (0.35 + Math.sin(nt * Math.PI + t) * 0.65)
                ctx.strokeStyle = `hsla(${cellBaseHue + nt * 22},52%,55%,${alpha})`
                ctx.lineWidth   = 0.5 + shockwaveIntensity * 0.8
                ctx.stroke()
              }
              // Draw vertical lines
              for (let col = 0; col <= GCOLS; col++) {
                ctx.beginPath()
                for (let row = 0; row <= GROWS; row++) {
                  const p = pts[row][col]
                  row === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
                }
                const nt    = col / GCOLS
                const alpha = brightness * 0.22 * (0.3 + Math.sin(nt * Math.PI * 2 + t * 1.4) * 0.7)
                ctx.strokeStyle = `hsla(${cellBaseHue + 28 + nt * 16},46%,50%,${alpha})`
                ctx.lineWidth   = 0.4 + shockwaveIntensity * 0.7
                ctx.stroke()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 7: EL CÓDIGO — oscillating vertical waveform bars ──
            case 7: {
              ctx.fillStyle = `rgba(8,8,8,${0.08 + (1 - entropy) * 0.04})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx  = ox + cW / 2, cy = oy + cH / 2
              const N   = cellIsMicro ? Math.max(4, Math.floor(4 + density * 6)) : Math.floor(30 + density * 42)
              const bW  = cW / N
              const spd = 0.022 + storminess * 0.08
              const amp = cH * 0.28 * (0.3 + particleSpeed * 0.6)
              const spikeAmp = shockwaveIntensity * cH * 0.18

              for (let i = 0; i < N; i++) {
                const t      = i / N
                const freq   = spd * (1 + t * (1 + chaos * 3.5))
                const phase  = rng(i + 50000) * Math.PI * 2
                const barH   = amp  * Math.sin(freq * frame + phase)
                             + spikeAmp * Math.sin(frame * ringPulseSpeed * 4 + i * 0.28 + ringPhase)
                             + gravityY * cH * 0.12 * t
                const x      = ox + i * bW + bW * 0.5

                const barAlpha = brightness * (0.35 + Math.abs(barH) / (amp + spikeAmp + 1) * 0.55)
                const barHue   = cellBaseHue + (barH / (amp + 0.01)) * 22

                // Vertical bar from center
                ctx.beginPath()
                ctx.moveTo(x, cy)
                ctx.lineTo(x, cy + barH)
                ctx.strokeStyle = `hsla(${barHue},${55 + chaos * 25}%,${50 + Math.abs(barH / (amp + 0.01)) * 20}%,${barAlpha})`
                ctx.lineWidth   = Math.max(0.5, bW * 0.55)
                ctx.stroke()

                // Dot at tip
                ctx.beginPath()
                ctx.arc(x, cy + barH, Math.max(0.5, bW * 0.38), 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${barHue + 15},72%,72%,${barAlpha * 0.85})`
                ctx.fill()
              }
              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 8: EL PLASMA — electric discharge (solar/UV driven) ────────────
            case 8: {
              // Night mode: deep violet/indigo with rare plasma arcs
              // Day mode: vivid white-blue electric discharge
              ctx.fillStyle = isDaylight
                ? `rgba(8,8,20,${0.04 + (1 - entropy) * 0.06})`
                : `rgba(8,4,20,${0.03 + (1 - entropy) * 0.07})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              // Lazy init for monument-activated cells
              if (!plasmaStates.has(key)) plasmaStates.set(key, { bolts: [], nextBolt: 0 })
              const plasmaS = plasmaStates.get(key)!

              // Background glow — purple at night, blue-white at day
              const bgHue = isDaylight ? 200 + sunElevation * 20 : 270 + storminess * 30
              const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cW, cH) * 0.5)
              const glowAlpha = isDaylight
                ? 0.06 + brightness * 0.12 + storminess * 0.08
                : 0.08 + storminess * 0.1 + (1 - sunElevation) * 0.05
              bgGlow.addColorStop(0, `hsla(${bgHue},80%,${isDaylight ? 75 : 45}%,${glowAlpha})`)
              bgGlow.addColorStop(1, `hsla(${bgHue},60%,20%,0)`)
              ctx.fillStyle = bgGlow
              ctx.fillRect(ox, oy, cW, cH)

              // Generate new lightning bolt
              plasmaS.nextBolt--
              const boltInterval = Math.floor(4 + (1 - storminess) * 12 + (isDaylight ? 0 : 6))
              if (plasmaS.nextBolt <= 0 && plasmaS.bolts.length < 6) {
                plasmaS.nextBolt = boltInterval
                const startX = ox + rng(frame + plasmaS.bolts.length * 333 + 70000) * cW
                const startY = oy
                const endX   = ox + rng(frame + plasmaS.bolts.length * 777 + 71000) * cW
                const endY   = oy + cH
                const numJags = 6 + Math.floor(storminess * 8)
                const jags: {x:number;y:number}[] = [{ x: startX, y: startY }]
                for (let j = 1; j < numJags; j++) {
                  const t = j / numJags
                  const bx = startX + (endX - startX) * t + (rng(frame + j * 111 + 72000) - 0.5) * cW * 0.4
                  const by = startY + (endY - startY) * t
                  jags.push({ x: bx, y: by })
                }
                jags.push({ x: endX, y: endY })
                plasmaS.bolts.push({
                  x1: startX, y1: startY, x2: endX, y2: endY,
                  age: 0, maxAge: 8 + Math.floor(storminess * 12),
                  jags,
                })
              }

              // Draw and age bolts
              plasmaS.bolts = plasmaS.bolts.filter(b => b.age < b.maxAge)
              for (const bolt of plasmaS.bolts) {
                bolt.age++
                const t = bolt.age / bolt.maxAge
                const boltAlpha = (1 - t) * brightness * (isDaylight ? 0.9 : 0.6)
                const boltHue = isDaylight ? 195 + sunElevation * 25 : 265 + storminess * 40
                const boltWidth = (2.5 - t * 1.8) * (0.5 + storminess * 1.5)

                ctx.beginPath()
                ctx.moveTo(bolt.jags[0].x, bolt.jags[0].y)
                for (let j = 1; j < bolt.jags.length; j++) {
                  ctx.lineTo(bolt.jags[j].x, bolt.jags[j].y)
                }
                ctx.strokeStyle = isDaylight
                  ? `hsla(${boltHue},95%,${85 + sunElevation * 10}%,${boltAlpha})`
                  : `hsla(${boltHue},85%,70%,${boltAlpha})`
                ctx.lineWidth = Math.max(0.3, boltWidth)
                ctx.shadowColor = isDaylight ? `hsla(${boltHue},100%,90%,0.8)` : `hsla(${boltHue},90%,65%,0.6)`
                ctx.shadowBlur = isDaylight ? 8 : 12
                ctx.stroke()
                ctx.shadowBlur = 0
              }

              // Ambient sparks (small dots floating)
              const sparkCount = Math.floor((8 + storminess * 16) * (isDaylight ? 1.2 : 0.7))
              for (let i = 0; i < sparkCount; i++) {
                const sx = ox + ((rng(i * 317 + frame * 0.3 + 80000) + frame * 0.003) % 1) * cW
                const sy = oy + ((rng(i * 419 + frame * 0.2 + 81000) + frame * 0.002) % 1) * cH
                const sAlpha = brightness * 0.4 * (isDaylight ? (0.3 + sunElevation * 0.3) : (0.5 + storminess * 0.3))
                ctx.beginPath()
                ctx.arc(sx, sy, 0.6 + rng(i + 82000) * 1.2, 0, Math.PI * 2)
                ctx.fillStyle = isDaylight
                  ? `hsla(${195 + i * 3},90%,85%,${sAlpha})`
                  : `hsla(${265 + i * 5},80%,65%,${sAlpha})`
                ctx.fill()
              }

              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 9: EL FRACTAL — L-system branching tree (trending topic driven) ─
            case 9: {
              ctx.fillStyle = `rgba(8,8,8,${0.05 + (1 - entropy) * 0.04})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              const treeHue = cellBaseHue

              // Branching angle influenced by trendingIntensity (viral → wilder branches)
              const branchAngle = Math.PI / 5 + trendingIntensity * Math.PI / 8
              const maxDepth = cellIsMicro ? Math.min(4, 3 + Math.floor(storminess * 1)) : 6 + Math.floor(storminess * 3)
              const baseLen = Math.min(cW, cH) * 0.28

              // Time-varying twist
              const twist = Math.sin(frame * 0.008) * chaos * 0.4

              const drawBranch = (x: number, y: number, angle: number, len: number, depth: number) => {
                if (depth <= 0 || len < 1.2) return
                const ex = x + Math.cos(angle + twist * depth * 0.3) * len
                const ey = y + Math.sin(angle + twist * depth * 0.3) * len
                const depthT = depth / maxDepth
                const alpha = brightness * 0.6 * depthT * (0.4 + trendingIntensity * 0.5)
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(ex, ey)
                ctx.strokeStyle = `hsla(${treeHue + (1 - depthT) * 40},${40 + trendingIntensity * 40}%,${35 + depthT * 35}%,${alpha})`
                ctx.lineWidth = Math.max(0.4, len * 0.04)
                ctx.stroke()

                // Fibonacci-like split ratio driven by chaos
                const lenRatio = 0.62 + chaos * 0.1
                drawBranch(ex, ey, angle - branchAngle, len * lenRatio, depth - 1)
                drawBranch(ex, ey, angle + branchAngle, len * (lenRatio - 0.08), depth - 1)
                // Occasional triple branch when viral
                if (trendingIntensity > 0.6 && depth > 2 && rng(depth * 13 + 40000) < trendingIntensity * 0.4) {
                  drawBranch(ex, ey, angle, len * lenRatio * 0.6, depth - 2)
                }
              }

              // Draw from bottom center, upward
              drawBranch(cx, oy + cH * 0.92, -Math.PI / 2, baseLen, maxDepth)

              // Trending keyword as tiny text at root (when long enough branches)
              if (baseLen > 20 && frame % 2 === 0) {
                ctx.font = `${Math.max(7, Math.min(11, cW / 12))}px 'IBM Plex Mono', monospace`
                ctx.fillStyle = `hsla(${treeHue},60%,65%,${brightness * 0.4})`
                ctx.textAlign = 'center'
                ctx.fillText(trendingKeyword.slice(0, 8), cx, oy + cH * 0.97)
                ctx.textAlign = 'start'
              }

              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 10: EL VORONOI — Voronoi mosaic (traffic density driven) ────────
            case 10: {
              ctx.fillStyle = `rgba(8,8,8,${0.04 + (1 - entropy) * 0.05})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              const voroHue = cellBaseHue

              // Number of Voronoi cells: traffic density → more cells = more congestion
              const N = cellIsMicro ? Math.max(3, Math.floor(3 + trafficDensity * 3)) : Math.floor(8 + trafficDensity * 24 + storminess * 6)

              // Site positions: slowly drift based on traffic
              const sites: { x: number; y: number }[] = []
              for (let i = 0; i < N; i++) {
                const baseX = rng(i + 90000) * cW
                const baseY = rng(i + 91000) * cH
                // Traffic causes sites to cluster (congestion clumping)
                const clusterX = cx + (baseX - cW / 2) * (1 - trafficDensity * 0.4)
                const clusterY = cy + (baseY - cH / 2) * (1 - trafficDensity * 0.3)
                sites.push({
                  x: ox + clusterX + Math.sin(frame * 0.012 + i * 0.8) * trafficDensity * cW * 0.04,
                  y: oy + clusterY + Math.cos(frame * 0.009 + i * 1.1) * trafficDensity * cH * 0.04,
                })
              }

              // Approximate Voronoi by sampling: color each pixel by nearest site
              // For performance: scan grid of points, not every pixel
              const GRID = cellIsMicro ? 5 : 28
              const gW = cW / GRID, gH = cH / GRID

              for (let row = 0; row < GRID; row++) {
                for (let col = 0; col < GRID; col++) {
                  const px = ox + (col + 0.5) * gW
                  const py = oy + (row + 0.5) * gH

                  let minDist = Infinity, secondDist = Infinity, nearestI = 0
                  for (let i = 0; i < sites.length; i++) {
                    const d = Math.hypot(px - sites[i].x, py - sites[i].y)
                    if (d < minDist) { secondDist = minDist; minDist = d; nearestI = i }
                    else if (d < secondDist) secondDist = d
                  }

                  const edgeness = 1 - (secondDist - minDist) / (secondDist + 0.01) // 1 at edge, 0 at center
                  const cellT = nearestI / N
                  // Traffic: red-ish when dense, green-ish when free
                  const cellHue = trafficDensity > 0.6
                    ? 0 + cellT * 30    // red zone (gridlock)
                    : voroHue + cellT * 40  // normal
                  const cellAlpha = brightness * (0.12 + edgeness * 0.5 + chaos * 0.15)

                  ctx.fillStyle = `hsla(${cellHue},${45 + trafficDensity * 30}%,${35 + edgeness * 30}%,${cellAlpha})`
                  ctx.fillRect(px - gW / 2, py - gH / 2, gW + 1, gH + 1)
                }
              }

              // Bright site dots
              for (let i = 0; i < sites.length; i++) {
                const speed = 1 - trafficDensity // slower sites = more traffic
                const sAlpha = brightness * (0.4 + speed * 0.4)
                ctx.beginPath()
                ctx.arc(sites[i].x, sites[i].y, 1.5 + trafficDensity * 2, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${voroHue + i * 6},70%,65%,${sAlpha})`
                ctx.fill()
              }

              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 11: EL VÓRTEX — spiral vortex (crowd density driven) ──────────
            case 11: {
              ctx.fillStyle = `rgba(8,8,8,${0.03 + (1 - entropy) * 0.06})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              // Lazy init for monument-activated cells
              if (!vortexStates.has(key)) {
                const seedOff = (cell.col * 137 + cell.row * 97) * 777
                vortexStates.set(key, { angle: rng(seedOff + 99000) * Math.PI * 2 })
              }
              const vortexS = vortexStates.get(key)!

              // Rotation speed driven by crowd density (packed = fast spin)
              const rotSpeed = 0.004 + crowdDensity * 0.022 + storminess * 0.008
              vortexS.angle += rotSpeed

              const maxR = Math.min(cW, cH) * 0.46
              const armCount = cellIsMicro ? Math.min(2, 2 + Math.floor(crowdDensity * 2)) : 2 + Math.floor(crowdDensity * 4)
              const STEPS = cellIsMicro ? 60 : 180 + Math.floor(density * 120)

              for (let arm = 0; arm < armCount; arm++) {
                const armOffset = (arm / armCount) * Math.PI * 2
                ctx.beginPath()
                let started = false
                for (let s = 0; s < STEPS; s++) {
                  const t = s / STEPS
                  // Archimedean spiral: r = maxR * t, θ = armOffset + angle + t * revolutions
                  const revolutions = 2.5 + crowdDensity * 2.5
                  const r = maxR * t
                  const theta = armOffset + vortexS.angle + t * Math.PI * 2 * revolutions
                  const x = cx + r * Math.cos(theta)
                  const y = cy + r * Math.sin(theta)

                  if (!started) { ctx.moveTo(x, y); started = true }
                  else ctx.lineTo(x, y)
                }
                const armHue = cellBaseHue + arm * (360 / armCount)
                const armAlpha = brightness * (0.25 + crowdDensity * 0.35) * (0.4 + chaos * 0.5)
                ctx.strokeStyle = `hsla(${armHue},${50 + crowdDensity * 30}%,${50 + crowdDensity * 15}%,${armAlpha})`
                ctx.lineWidth = 0.6 + crowdDensity * 1.5
                ctx.stroke()
              }

              // Central eye: small/dim when empty, large/bright when packed
              const eyeR = maxR * (0.05 + crowdDensity * 0.12)
              const eyeGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, eyeR)
              eyeGlow.addColorStop(0, `hsla(${cellBaseHue},85%,75%,${brightness * (0.3 + crowdDensity * 0.5)})`)
              eyeGlow.addColorStop(1, `hsla(${cellBaseHue},60%,40%,0)`)
              ctx.fillStyle = eyeGlow
              ctx.beginPath()
              ctx.arc(cx, cy, eyeR, 0, Math.PI * 2)
              ctx.fill()

              // Seismic: add radial shockwave over vortex
              if (shockwaveIntensity > 0.05) {
                for (let r = 0; r < ringCount; r++) {
                  const t = (frame * ringPulseSpeed + ringPhase + r * 0.65) % (Math.PI * 2)
                  const rad = maxR * ((Math.sin(t) + 1) / 2)
                  const alpha = shockwaveIntensity * 0.25 * (1 - rad / maxR)
                  ctx.beginPath()
                  ctx.arc(cx, cy, Math.max(0.5, rad), 0, Math.PI * 2)
                  ctx.strokeStyle = `hsla(${cellBaseHue + 15},65%,60%,${alpha})`
                  ctx.lineWidth = 1 + shockwaveIntensity
                  ctx.stroke()
                }
              }

              ctx.drawImage(vigCanvas, ox, oy)
              break
            }

            // ── case 12: EL CUÁNTICO — quantum wave interference ────────────────────
            case 12: {
              ctx.fillStyle = `rgba(8,8,8,${0.05 + (1 - entropy) * 0.05})`
              ctx.fillRect(ox, oy, cW, cH)

              const cx = ox + cW / 2, cy = oy + cH / 2
              const quantHue = cellBaseHue

              // Multiple point sources — each emits circular waves
              // Number of sources: seismic + cosmos
              const nSources = cellIsMicro ? 2 : 2 + Math.floor(storminess * 3) + Math.floor(quakeActivity * 2)
              type Source = { x: number; y: number; freq: number; phase: number }
              const sources: Source[] = []
              for (let i = 0; i < nSources; i++) {
                sources.push({
                  x: ox + (0.15 + rng(i + 60000) * 0.7) * cW,
                  y: oy + (0.15 + rng(i + 61000) * 0.7) * cH,
                  freq: 0.018 + storminess * 0.022 + rng(i + 62000) * 0.015,
                  phase: rng(i + 63000) * Math.PI * 2 + seedNum * 3,
                })
                // Sources drift slowly
                sources[i].x += Math.sin(frame * 0.006 + i * 1.7) * chaos * cW * 0.04
                sources[i].y += Math.cos(frame * 0.005 + i * 2.1) * chaos * cH * 0.04
              }

              // Sample interference pattern on a grid
              const GRID = cellIsMicro ? 5 : 36
              const gW = cW / GRID, gH = cH / GRID

              for (let row = 0; row < GRID; row++) {
                for (let col = 0; col < GRID; col++) {
                  const px = ox + (col + 0.5) * gW
                  const py = oy + (row + 0.5) * gH

                  // Sum of waves from all sources
                  let amplitude = 0
                  for (const src of sources) {
                    const dist = Math.hypot(px - src.x, py - src.y)
                    amplitude += Math.sin(dist * src.freq - frame * 0.04 + src.phase)
                  }
                  amplitude /= nSources  // normalize -1..+1

                  // Map amplitude to color: constructive=bright, destructive=dark
                  const brightness01 = (amplitude + 1) / 2  // 0..1
                  const cellAlpha = brightness * brightness01 * 0.65
                  const cellHue = quantHue + amplitude * 35

                  if (cellAlpha > 0.02) {
                    ctx.fillStyle = `hsla(${cellHue},${55 + quakeActivity * 25}%,${35 + brightness01 * 40}%,${cellAlpha})`
                    ctx.fillRect(px - gW / 2, py - gH / 2, gW + 1, gH + 1)
                  }
                }
              }

              // Draw source indicators as tiny pulsing dots
              for (const src of sources) {
                const pulse = (Math.sin(frame * 0.08 + src.phase) + 1) / 2
                ctx.beginPath()
                ctx.arc(src.x, src.y, 1.5 + pulse * 2 * storminess, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${quantHue},85%,75%,${brightness * (0.5 + pulse * 0.4)})`
                ctx.fill()
              }

              ctx.drawImage(vigCanvas, ox, oy)
              break
            }
          }
        })
      }

      // ── Mouse glow: soft spotlight that follows cursor ─────────────────────
      if (mousePos.x >= 0) {
        const glowR = cW * 4
        const g     = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, glowR)
        g.addColorStop(0,   `hsla(${primaryHue},90%,92%,0.22)`)
        g.addColorStop(0.35,`hsla(${primaryHue},80%,78%,0.09)`)
        g.addColorStop(1,   `hsla(${primaryHue},60%,60%,0)`)
        ctx.fillStyle = g
        ctx.fillRect(mousePos.x - glowR, mousePos.y - glowR, glowR * 2, glowR * 2)
      }

      // ── Ripples: expand, draw organic ring, flash cells ────────────────────
      const ringBandW = cW * 2
      for (let ri = ripples.length - 1; ri >= 0; ri--) {
        const rip   = ripples[ri]
        rip.r      += 5 + rip.r * 0.016
        const age   = rip.r / rip.maxR          // 0→1
        const alpha = Math.pow(1 - age, 1.5) * 0.85

        // Primary ring — slightly organic (noisy outline)
        ctx.beginPath()
        const SEG = 72
        for (let s = 0; s <= SEG; s++) {
          const a  = (s / SEG) * Math.PI * 2
          const n  = 1 + 0.045 * Math.sin(a * 9 + rip.born * 0.04)
          const rx = rip.x + Math.cos(a) * rip.r * n
          const ry = rip.y + Math.sin(a) * rip.r * n
          s === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry)
        }
        ctx.closePath()
        ctx.strokeStyle = `hsla(${primaryHue},88%,82%,${alpha})`
        ctx.lineWidth   = (1 - age) * 3.5 + 0.5
        ctx.stroke()

        // Inner trailing ring
        if (rip.r > cW * 4) {
          ctx.beginPath()
          ctx.arc(rip.x, rip.y, rip.r * 0.74, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${primaryHue + 28},70%,72%,${alpha * 0.38})`
          ctx.lineWidth   = 1
          ctx.stroke()
        }

        // Flash cells in the ring band (bounding box for performance)
        const minC = Math.max(0,               Math.floor((rip.x - rip.r - ringBandW - effectiveOffsetX) / cW))
        const maxC = Math.min(grid.gridCols-1, Math.ceil( (rip.x + rip.r + ringBandW - effectiveOffsetX) / cW))
        const minR = Math.max(0,               Math.floor((rip.y - rip.r - ringBandW - effectiveOffsetY) / cH))
        const maxR = Math.min(grid.gridRows-1, Math.ceil( (rip.y + rip.r + ringBandW - effectiveOffsetY) / cH))
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const ccx  = effectiveOffsetX + c * cW + cW / 2
            const ccy  = effectiveOffsetY + r * cH + cH / 2
            const dist = Math.hypot(ccx - rip.x, ccy - rip.y)
            if (Math.abs(dist - rip.r) < ringBandW) {
              const key = `${c}:${r}`
              const str = (1 - Math.abs(dist - rip.r) / ringBandW) * (1 - age)
              if ((cellFlash.get(key) ?? 0) < str) cellFlash.set(key, str)
            }
          }
        }

        if (rip.r >= rip.maxR) ripples.splice(ri, 1)
      }

      // ── Cell flash: decay + overlay ─────────────────────────────────────────
      for (const [key, val] of cellFlash) {
        const next = val * 0.83
        if (next < 0.015) { cellFlash.delete(key); continue }
        cellFlash.set(key, next)
        const colon = key.indexOf(':')
        const fc    = +key.slice(0, colon)
        const fr    = +key.slice(colon + 1)
        ctx.fillStyle = `hsla(${primaryHue},92%,94%,${next * 0.88})`
        ctx.fillRect(effectiveOffsetX + fc * cW + GAP, effectiveOffsetY + fr * cH + GAP, cW - 2 * GAP, cH - 2 * GAP)
      }

      // ── Constellation overlay: top-right corner (stacks below monument on narrow screens) ──
      if (constellationResult) {
        const BOX_W = 178, BOX_H = 158, PAD = 18
        const MONUMENT_OVW = 220, MONUMENT_OVH = 42
        const bx = W - BOX_W - PAD
        // On narrow screens (< ~452px) both boxes would overlap — push constellation below monument
        const wouldOverlap = W < (MONUMENT_OVW + BOX_W + PAD * 3) && !!monumentRef.current?.name
        const by = wouldOverlap ? PAD + MONUMENT_OVH + 8 : PAD
        const LABEL_H = 34   // space at bottom for name labels
        const STAR_H  = BOX_H - LABEL_H

        // Background panel
        ctx.fillStyle = 'rgba(4,4,14,0.80)'
        ctx.fillRect(bx, by, BOX_W, BOX_H)

        // Thin border
        ctx.strokeStyle = `hsla(${primaryHue},35%,45%,0.45)`
        ctx.lineWidth = 0.5
        ctx.strokeRect(bx + 0.5, by + 0.5, BOX_W - 1, BOX_H - 1)

        const { constellation: con, stars: cStars } = constellationResult

        // Map normalized 0–1 → box pixels (10px inner padding)
        const ip   = 10
        const toSx = (nx: number) => bx + ip + nx * (BOX_W - ip * 2)
        const toSy = (ny: number) => by + ip + ny * (STAR_H - ip * 2)

        // Connecting edges (constellation lines)
        ctx.lineWidth = 0.7
        for (const [i, j] of con.edges) {
          if (i >= cStars.length || j >= cStars.length) continue
          ctx.beginPath()
          ctx.moveTo(toSx(cStars[i].x), toSy(cStars[i].y))
          ctx.lineTo(toSx(cStars[j].x), toSy(cStars[j].y))
          ctx.strokeStyle = `hsla(${primaryHue},50%,58%,0.30)`
          ctx.stroke()
        }

        // Star dots with twinkle
        for (let i = 0; i < cStars.length; i++) {
          const s  = cStars[i]
          const sx = toSx(s.x), sy = toSy(s.y)
          const b01     = Math.max(0, Math.min(1, (3.5 - s.mag) / 5))
          const r       = 1.0 + b01 * 3.2
          const twinkle = (Math.sin(frame * 0.06 + i * 1.7) + 1) / 2
          const alpha   = 0.55 + twinkle * 0.45

          // Soft glow halo for the brightest stars (mag < 1.5)
          if (s.mag < 1.5) {
            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 5)
            g.addColorStop(0, `hsla(${primaryHue + i * 8},90%,90%,${0.35 * b01})`)
            g.addColorStop(1, `hsla(${primaryHue},70%,65%,0)`)
            ctx.fillStyle = g
            ctx.fillRect(sx - r * 5, sy - r * 5, r * 10, r * 10)
          }

          ctx.beginPath()
          ctx.arc(sx, sy, r * (0.85 + twinkle * 0.15), 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${primaryHue + i * 6},80%,92%,${alpha})`
          ctx.fill()
        }

        // Labels (constellation name + Spanish name)
        ctx.textAlign = 'center'
        const mx = bx + BOX_W / 2
        ctx.font = '700 8.5px "IBM Plex Mono", monospace'
        ctx.fillStyle = `hsla(${primaryHue},75%,78%,0.90)`
        ctx.fillText(con.name, mx, by + BOX_H - 18)
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillStyle = `hsla(${primaryHue},45%,58%,0.65)`
        ctx.fillText(con.nameEs, mx, by + BOX_H - 6)
        ctx.textAlign = 'start'
      }

      // ── Monument info overlay: top-left (mirrors constellation at top-right) ──
      if (monumentRef.current?.name) {
        const { name, nameEs } = monumentRef.current
        const OVW = 220, OVH = 42, PAD = 18
        const bx = PAD, by = PAD
        ctx.fillStyle = 'rgba(4,4,14,0.80)'
        ctx.fillRect(bx, by, OVW, OVH)
        ctx.strokeStyle = `hsla(${primaryHue},35%,45%,0.45)`
        ctx.lineWidth = 0.5
        ctx.strokeRect(bx + 0.5, by + 0.5, OVW - 1, OVH - 1)

        ctx.font = '700 9px "IBM Plex Mono", monospace'
        ctx.fillStyle = `hsla(${primaryHue},72%,76%,0.88)`
        ctx.fillText(name.toUpperCase(), bx + 10, by + 16)
        ctx.font = '7.5px "IBM Plex Mono", monospace'
        ctx.fillStyle = `hsla(${primaryHue},42%,56%,0.60)`
        ctx.fillText(nameEs, bx + 10, by + 31)
      }

      // ── Perf overlay ─────────────────────────────────────────────────────────
      if (DEV && perf.show) {
        const now = performance.now()
        perf.drawMs = now - _t0
        perf.frameTimes.push(now - perf.lastT)
        perf.lastT = now
        if (perf.frameTimes.length > 60) perf.frameTimes.shift()
        const avgInterval = perf.frameTimes.reduce((a, b) => a + b, 0) / (perf.frameTimes.length || 1)
        perf.fps = Math.round(1000 / avgInterval)

        const PX = 12, PY = 12, PW = 242, PH = 108
        ctx.fillStyle = 'rgba(0,0,0,0.88)'
        ctx.fillRect(PX, PY, PW, PH)
        ctx.strokeStyle = 'rgba(255,70,70,0.7)'
        ctx.lineWidth = 1
        ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1)
        ctx.textAlign = 'left'

        const gradsPerSec = _activeCells * perf.fps
        const lines: [string, string][] = [
          [`FPS ${perf.fps}`,                           perf.fps < 30 ? '#ff4444' : perf.fps < 50 ? '#ffaa00' : '#44ff88'],
          [`draw  ${perf.drawMs.toFixed(1)} ms`,        perf.drawMs > 16 ? '#ff4444' : perf.drawMs > 10 ? '#ffaa00' : '#44ff88'],
          [`cells  ${grid.cells.length}  active ${_activeCells}`, 'rgba(255,255,255,0.75)'],
          [`grads/frame  ${_activeCells}  clips  ${_activeCells}`, 'rgba(255,200,100,0.85)'],
          [`grads/sec  ~${gradsPerSec.toLocaleString()}`, gradsPerSec > 50000 ? '#ff4444' : '#ffaa00'],
          [`[P] toggle`,                                'rgba(255,255,255,0.25)'],
        ]
        lines.forEach(([text, color], i) => {
          ctx.font = i === 0 ? '700 11px "IBM Plex Mono",monospace' : '9.5px "IBM Plex Mono",monospace'
          ctx.fillStyle = color
          ctx.fillText(text, PX + 10, PY + 17 + i * 16)
        })
      }

      frame++
      animFrameRef.current = requestAnimationFrame(draw)
    }

    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('click',      onClick)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })

    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    draw()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove',  onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click',      onClick)
      canvas.removeEventListener('touchstart', onTouchStart)
      if (DEV) window.removeEventListener('keydown', onKeyP)
    }
  }, [artParams, worldState, mosaicMode, isLandscape])

  // ── Monument loading: fetch image whenever city changes ──────────────────
  useEffect(() => {
    // Immediately clear stale monument so the canvas never shows the wrong city
    monumentRef.current = null

    const cityCode = worldState?.location?.cityCode
    const city     = worldState?.location?.city
    if (!cityCode && !city) return

    const controller = new AbortController()
    let currentImg: HTMLImageElement | null = null

    const load = async () => {
      try {
        const params = new URLSearchParams()
        if (cityCode) params.set('cityCode', cityCode)
        if (city)     params.set('city', city)
        const res = await fetch(`/api/monument?${params}`, { signal: controller.signal })
        if (!res.ok) { monumentRef.current = null; return }
        const data = await res.json()
        if (!data.imageUrl) { monumentRef.current = null; return }

        const img = new Image()
        img.crossOrigin = 'anonymous'
        currentImg = img
        img.onload = () => {
          monumentRef.current = {
            img,
            name:          data.name    ?? '',
            nameEs:        data.nameEs  ?? '',
            myth:          data.myth    ?? '',
            needsResample: true,
            cellH:         null,
            cellS:         null,
            cellL:         null,
            lumThreshold:  25,
          }
        }
        img.onerror = () => { monumentRef.current = null }
        img.src = data.imageUrl
      } catch (err) {
        if ((err as Error).name !== 'AbortError') monumentRef.current = null
      }
    }

    load()

    return () => {
      controller.abort()
      if (currentImg) { currentImg.onload = null; currentImg.onerror = null }
    }
  }, [worldState?.location?.cityCode, worldState?.location?.city])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    />
  )
}
