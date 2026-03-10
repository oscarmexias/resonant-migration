# Signal Awakening — Design Document
**Date:** 2026-02-26
**Feature:** Monument as loading screen protagonist
**Status:** Approved — ready for implementation

---

## Overview

Replace the current `SignalLoader` component with `MonumentLoader` — a full-screen
WebGL experience where the city's monument comes alive signal by signal during the
`loading-signals` phase.

The loading screen IS the art. Each of the 6 world-state signals (clima, cosmos,
tierra, economía, atención, eventos) activates a distinct visual layer on the monument.
When all signals are loaded, the `VisionSelector` appears as an overlay on top of the
living monument.

---

## User Flow

```
vision-select → idle → awakening → requesting-location
  → loading-signals [MonumentLoader — monument activates signal by signal]
  → vision-select (overlay on monument) → generating → output
```

Key change: after all 6 signals load, phase goes back to `vision-select` (not
`generating`). The VisionSelector renders as an overlay. Monument stays alive behind it.

---

## Architecture

### New Files
| File | Purpose |
|------|---------|
| `src/components/MonumentLoader.tsx` | Three.js canvas, wires shader + uniforms |
| `src/shaders/monument.glsl.ts` | Fragment shader: photo + SDF + 6 signal layers |
| `src/app/api/monument-image/route.ts` | Server-side CORS proxy for monument photo |
| `src/__tests__/worldState.test.ts` | Store unit tests (TDD — write first) |
| `src/__tests__/monumentFlow.test.ts` | Data flow + phase transition tests (TDD) |

### Modified Files
| File | Change |
|------|--------|
| `src/store/worldState.ts` | + `monumentData` field + `setMonumentData` action |
| `src/app/page.tsx` | Swap `<SignalLoader>` → `<MonumentLoader>`, parallel monument fetch |
| `src/components/VisionSelector.tsx` | + `overMonument?: boolean` prop → transparent backdrop |

---

## Store Changes

```typescript
// New field in WorldStateStore
interface MonumentData {
  name: string
  imageProxyUrl: string | null  // /api/monument-image?url=... (CORS-safe)
  landmarkType: number          // 0-5 SDF archetype
}

monumentData: MonumentData | null
setMonumentData: (data: MonumentData | null) => void
// reset() must clear monumentData → null
```

---

## Data Flow: Parallel Fetch

In `requestLocationAndGenerate` (page.tsx):

```typescript
// Run monument fetch in parallel — non-blocking
const [wsResult, monumentResult] = await Promise.allSettled([
  fetchWorldState(lat, lng),
  fetch(`/api/monument?lat=${lat}&lng=${lng}`)
])

// Monument failure is graceful — shader works without photo
if (monumentResult.status === 'fulfilled') {
  const m = await monumentResult.value.json()
  setMonumentData({
    name: m.name ?? '',
    imageProxyUrl: m.imageUrl
      ? `/api/monument-image?url=${encodeURIComponent(m.imageUrl)}`
      : null,
    landmarkType: m.landmarkType ?? 0,
  })
}
```

Phase transitions to `vision-select` after worldState loads — monument fetch does NOT
block the flow.

---

## MonumentLoader Component

```
Props: none (reads from store)
Reads: signals (SignalState), monumentData, location

Lifecycle:
  1. Mount → init Three.js renderer + load photo texture (async)
  2. Texture loaded → set uPhotoReady = 1.0 (fade in photo)
  3. Watch signals store → update 6 signal uniforms as they arrive
  4. When all 6 signals = 'success' → setPhase('vision-select')
  5. Unmount → dispose renderer
```

Signal → uniform mapping (each 0.0 → 1.0, animated with lerp):
- `clima: 'success'`    → `uSignalClima = 1.0`
- `cosmos: 'success'`   → `uSignalCosmos = 1.0`
- `tierra: 'success'`   → `uSignalTierra = 1.0`
- `economia: 'success'` → `uSignalEconomia = 1.0`
- `atencion: 'success'` → `uSignalAtencion = 1.0`
- `eventos: 'success'`  → `uSignalEventos = 1.0`

---

## Shader Design (monument.glsl.ts)

### Uniforms
```glsl
uniform sampler2D uMonumentTex;   // real photo, or black if unavailable
uniform float     uPhotoReady;    // 0→1 fade-in when texture is loaded
uniform float     uLandmarkType;  // 0-5 SDF archetype
uniform float     uTime;
uniform vec2      uResolution;
uniform vec2      uSeed;

// 6 signal activations (0.0 = not loaded, 1.0 = fully loaded)
uniform float uSignalClima;
uniform float uSignalCosmos;
uniform float uSignalTierra;
uniform float uSignalEconomia;
uniform float uSignalAtencion;
uniform float uSignalEventos;
```

### Layer Stack
```
LAYER 0 — Monument photo (sampler2D)
  Dark + desaturated base: luminance * mix(0.1, 0.7, totalSignals)
  Activates: uPhotoReady controls fade-in
  Aspect ratio preserved with cover-fit

LAYER 1 — SDF archetype (from domainWarp.glsl — reuse landmarkSDF())
  Rendered as glowing skeleton: fill + aura + halo
  uSignalEconomia → gold shimmer intensity
  uSignalCosmos   → outer aurora halo radius + intensity

LAYER 2 — Atmospheric effects
  uSignalClima    → warm/cool color temperature overlay + fog density
  uSignalTierra   → seismic rings (2 rings, expanding from base)
  uSignalAtencion → city scatter noise (fine particles)
  uSignalEventos  → warm (positive tone) / cold (conflict) final tint

POST — Reinhard tone mapping + gamma (same as domainWarp.glsl)
```

### totalSignals helper
```glsl
float totalSignals = (uSignalClima + uSignalCosmos + uSignalTierra
                    + uSignalEconomia + uSignalAtencion + uSignalEventos) / 6.0;
// Used to progressively brighten the monument as data arrives
```

---

## CORS Proxy (/api/monument-image)

```
GET /api/monument-image?url=https://...

- Validates url param (must be http/https)
- Fetches image server-side (no CORS restriction)
- Streams response with Content-Type from upstream
- Sets Cache-Control: public, max-age=86400
- Timeout: 8s → 504 if exceeded
- Invalid/missing url → 400
```

---

## VisionSelector Changes

```tsx
// When overMonument=true: semi-transparent backdrop, not full black
<div style={{
  background: overMonument
    ? 'rgba(4, 4, 14, 0.75)'
    : 'var(--void)',
  backdropFilter: overMonument ? 'blur(2px)' : 'none',
}}>
```

---

## UI Compliance (Vercel Web Interface Guidelines)

- `aria-live="polite"` region: announces "Reading signal N/6 — [signal name]"
- `prefers-reduced-motion`: if active, skip signal animations (instant reveal)
- All transitions use `opacity` only — no `transition: all`
- Safe area: canvas uses existing `100dvh`, VisionSelector overlay respects `env(safe-area-inset-*)`
- `touch-action: manipulation` on all VisionSelector buttons
- Loading text: "Reading signals…" (ends with `…`)

---

## Tests (Write BEFORE implementing)

### worldState.test.ts
```typescript
// monumentData is null in initial state
// setMonumentData stores { name, imageProxyUrl, landmarkType }
// reset() clears monumentData to null
// setSignalStatus does not change phase (phase logic lives in page.tsx)
```

### monumentFlow.test.ts
```typescript
// monument fetch runs in parallel with fetchWorldState (both called, not awaited serially)
// if monument fetch fails → monumentData = null, worldState flow continues
// if monument fetch succeeds → setMonumentData called with correct shape
// all 6 signals 'success' → setPhase('vision-select') is called
// phase transitions from 'loading-signals' to 'vision-select' (not 'output')
```

---

## Implementation Order

**Wave 1 (parallel):**
- A: Store + tests
- B: GLSL shader (monument.glsl.ts)
- C: CORS proxy API route

**Wave 2 (after Wave 1):**
- D: MonumentLoader.tsx + page.tsx + VisionSelector integration

---

## Definition of Done

- [ ] `npm run build` passes clean
- [ ] All tests pass
- [ ] Monument photo loads (or gracefully falls back to SDF-only)
- [ ] 6 signals each activate a visible layer change
- [ ] VisionSelector readable over the monument canvas
- [ ] `aria-live` region announces signal progress
- [ ] `prefers-reduced-motion` respected
- [ ] Deployed and visible on Vercel
