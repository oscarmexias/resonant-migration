# Resonant Migration — Project Status

> **Auto-maintained by AI agents.** Updated every session that touches this project.

---

## Quick Status

| Field | Value |
|-------|-------|
| **Type** | Generative Art / Net Art Installation — "El Ojo" |
| **Phase** | Phase A — Algorithm (art generation + share link) |
| **Stack** | Next.js 14 + Three.js/R3F + p5.js + D3 scales + Zustand |
| **PRD** | v6.0 (`docs/PRD-Resonant-Migration-v6.md`) — MBA-grade, web3-native |
| **Target Launch** | Q2 2026 (MVP: Phase A) |
| **Last Updated** | 2026-02-22 |

---

## What's Working ✅

- [x] PRD v6.0 — MBA-grade, personas, KPIs, NFT architecture, GTM, a11y specs
- [x] Prototype HTML (`resonant-migration/index.html`) — 6 real APIs, canvas art, working
- [x] **Phase 0 COMPLETE** — Next.js 14 scaffold in `resonant-migration/`
  - [x] App Router structure (`src/app/`)
  - [x] `/api/world-state` route — 6 APIs server-side, Promise.allSettled, 5min cache, rate limiting
  - [x] `/api/generate-ai` route — Phase B placeholder
  - [x] TypeScript types for WorldState (all 6 signals)
  - [x] D3 scales: WorldState → ArtParams mappings (`src/lib/worldstate.ts`)
  - [x] Zustand store for WorldState + AppPhase (`src/store/worldState.ts`)
  - [x] Design system CSS vars (void #080808, amber #d4811f, IBM Plex Mono)
  - [x] `ElOjo.tsx` — SVG eye, cursor tracking, CTA
  - [x] `SignalLoader.tsx` — 6-signal loading ritual
  - [x] `Receipt.tsx` — data receipt + share/download/nueva visión
  - [x] `ArtCanvas.tsx` + `ArtCanvasInner.tsx` — canvas 2D particle system (SSR-safe)
  - [x] `page.tsx` — full app flow: idle → request → loading → generating → output → error
  - [x] `.env.local.example`, `.gitignore`, `vercel.json`
  - [x] TypeScript checks clean ✓
  - [x] Dev server runs at localhost:3000 ✓

## What's Next — Phase A

- [ ] Test art generation visually — iterate ArtCanvasInner.tsx parameters
- [ ] Wire signal status updates (LOADING/SUCCESS/ERROR per API in Zustand)
- [ ] Share link round-trip test (generate → share URL → recreate same art)
- [ ] Download with watermark (canvas.toDataURL + text overlay)
- [ ] Mobile layout verification (100dvh, touch targets 44px+)
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Initialize git repo at root level

## What's Not Started — Phase B+

- [ ] Three.js R3F scene (upgrade from canvas 2D)
- [ ] NFT mint flow (chain TBD) — ⚠️ activar `security-guidance` plugin antes de iniciar (wallet connect + endpoints Web3)
- [ ] AI generation (Replicate/FLUX)
- [ ] Edition counter (DB)
- [ ] Analytics (Vercel Analytics / Plausible)

---

## Architecture (current)

```
resonant-migration/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, metadata, skip link
│   │   ├── page.tsx                # Main app: full phase state machine
│   │   ├── globals.css             # Design system CSS vars + animations
│   │   └── api/
│   │       ├── world-state/route.ts  # 6 APIs aggregated server-side
│   │       └── generate-ai/route.ts  # Phase B placeholder
│   ├── components/
│   │   ├── ElOjo.tsx               # SVG eye, cursor tracking, CTA
│   │   ├── SignalLoader.tsx         # 6-signal loading ritual
│   │   ├── Receipt.tsx             # Data receipt + actions
│   │   ├── ArtCanvas.tsx           # SSR-safe wrapper (dynamic import)
│   │   └── ArtCanvasInner.tsx      # Canvas 2D particle system (client-only)
│   ├── lib/
│   │   └── worldstate.ts           # D3 scales + fetch + seed utils
│   ├── store/
│   │   └── worldState.ts           # Zustand store
│   └── types/
│       └── worldstate.ts           # WorldState + ArtParams interfaces
├── next.config.mjs
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.local.example
```

## Key Decisions (locked)

- **No API keys in Phase A** — all 6 world-state APIs are free/keyless
- **GDELT server-side only** — CORS blocked in browser, fixed via API route
- **Chain TBD** — decided AFTER validating art (Solana or Base)
- **Free to generate always** — NFT mint is optional, never a gate
- **Deterministic art** — same seed = same piece (SHA256 of WorldState)
- **Cache 5 min server-side** — prevents hammering free APIs

---

## Installed Skills (this project)

- `prd-generator` ✅
- `frontend-design` ✅
- `go-to-market-plan` ✅
- `strategy-frameworks` ✅
- `product-strategist` ✅
- `vercel-react-best-practices` ✅ (global)
