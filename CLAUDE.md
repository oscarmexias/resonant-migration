# El Ojo — Claude Code Project Context

## What This Is

Living generative art web installation. Reads 6 real-world signals for the user's location → generates unique art → minteable as NFT. Character: "El Ojo" (techno-Sauron that sees the world and paints instead of judging). Aesthetic: Berghain / industrial / cyberpunk.

## Current Phase

**Phase A — Algorithm** (art generation + share link + Vercel deploy)

Phase roadmap:
- Phase 0 → Foundation (Next.js scaffold, 6 API routes) — **COMPLETE**
- Phase A → Algorithm (Three.js art, share link, deploy Vercel) — **ACTIVE**
- Phase B → NFT Mint (chain TBD, wallet connect, IPFS)
- Phase C → AI Layer (Stable Diffusion/FLUX server-side)
- Phase D → Growth (Substack, sticker distribution)

## Tech Stack

```
Next.js 14 (App Router) + TypeScript (strict)
Three.js / React Three Fiber (@react-three/fiber, drei, postprocessing)
p5.js (instance mode, SSR-safe)
D3 scales (d3-scale, d3-scale-chromatic)
Zustand (world state store)
GLSL shaders
Vercel (deployment)
```

## 6 Data APIs (all free, no key needed)

| Signal      | API                     | Note                                    |
|-------------|-------------------------|-----------------------------------------|
| Climate     | Open-Meteo              | Browser-safe                            |
| Events      | GDELT                   | Server-side only — CORS blocked         |
| Cosmos      | NOAA SWPC (Kp index)    | Browser-safe                            |
| Economy     | CoinGecko               | Browser-safe                            |
| Attention   | Wikipedia Pageviews     | Browser-safe                            |
| Earth       | USGS Earthquakes        | Browser-safe                            |

API routes in `src/app/api/`:
- `/api/world-state` — aggregates all 6 signals, 5min cache, rate limiting
- `/api/generate-ai` — Phase B placeholder

## Key Files

```
src/
  app/
    page.tsx              # Main app flow: idle → request → loading → generating → output
    api/world-state/      # 6 signals aggregator
    api/generate-ai/      # Phase B placeholder
  components/
    ElOjo.tsx             # SVG eye, cursor tracking, CTA
    ArtCanvas.tsx         # Canvas wrapper (SSR-safe)
    ArtCanvasInner.tsx    # p5.js particle system — main art logic
    SignalLoader.tsx       # 6-signal loading ritual
    Receipt.tsx           # Data receipt + share/download/nueva visión
  lib/
    worldstate.ts         # D3 scales: WorldState → ArtParams
    types.ts              # WorldState types
  store/
    worldState.ts         # Zustand store
docs/
  PRD-Resonant-Migration-v6.md   # MBA-grade PRD, locked decisions
```

## Art Parameter Mapping

```
wind speed       → particle speed
Kp index         → storminess / chaos level
BTC volatility   → chaos multiplier
temperature      → color warmth (cool blues ↔ warm ambers)
seismic activity → shockwave ring radius
```

## Design System

```css
--color-void:    #080808  /* near-black background */
--color-amber:   #d4811f  /* primary accent */
--color-signal:  #4a9eff  /* data signal blue */
font: IBM Plex Mono (monospace throughout)
```

## Coding Conventions

- TypeScript strict mode, no `any`
- Functional components, named exports, PascalCase
- `snake_case` for files, `camelCase` for variables
- Canvas/p5.js always in SSR-safe `useEffect` wrappers
- GDELT always server-side — never expose to browser

## Dev Commands

```bash
npm run dev        # localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

## Deployment

```bash
vercel             # preview deploy
vercel --prod      # production deploy
```

## Security Note

Phase B (NFT mint + wallet connect) requires activating `security-guidance` plugin:
```json
{ "enabledPlugins": { "security-guidance@claude-plugins-official": true } }
```

## Cloud Session Setup

If starting in a fresh cloud session without GSD-T:
1. `npm install` — restores all dependencies
2. GSD-T lives in `~/.claude/` — reinstall via: `/user:gsd-t-version-update` (requires npm + the GSD-T package)
3. Secrets: `PERPLEXITY_API_KEY` and `SEMGREP_APP_TOKEN` — set as platform env vars
4. GitHub: `oscarmexias` account (`oscarmexias@gmail.com`)

## Framework

GSD-T (Level 3 — Full Auto). State: `.gsd-t/progress.md` (not in this repo — initialized on first gsd-t-init).
