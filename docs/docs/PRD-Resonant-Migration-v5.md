# Product Requirements Document
## Resonant Migration v5.0 — El Ojo: Live World Data as Generative Art

**Document Owner:** Oscar Mejía
**Last Updated:** 2026-02-21
**Status:** Active — New Direction
**Supersedes:** PRD v4.0 (Audio Art Platform / NFT scope — archived)
**Target MVP:** Q2 2026

---

## Executive Summary

Resonant Migration is a living generative art installation on the web. It reads the real state of the world — weather, seismic activity, cosmic radiation, global events, collective attention, economic volatility — and translates those signals into a unique piece of art, generated in real time, for your location, at this exact moment.

The interface is a **Kapselmaschine** (capsule machine): a decommissioned surveillance machine repurposed to dispense art. You insert your location. The Eye activates. It sees you, processes your world, and returns a vision. Dark. Industrial. Berlin underground. Every piece is unique, stamped with coordinates and a timestamp, shareable with a link.

**The concept in one sentence:** Open data + real-time APIs + generative algorithms + AI = a portrait of where you are and when you are.

**What makes it different:** This doesn't exist. The closest thing is earth.nullschool.net (beautiful, single data source, not art). What Resonant Migration does — multi-source, location-personalized, aesthetically serious, open source, dispensed like a physical art machine — has no direct precedent on the open web.

---

## The Core Metaphor: El Ojo / The Eye

**El Ojo** is not a dashboard. It is a character. A digital Sauron that sees everything — not to judge or control, but to paint. It processes the raw signal of the world and returns it as a gift: a vision it prepared for you, from your place, at your moment.

```
Sauron clásico:  TODO LO VE → juzga, condena, controla
El Ojo:          TODO LO VE → procesa, interpreta, regala
```

The interaction is ritual:
1. You arrive (ideally via sticker QR scan in the physical world)
2. "El Ojo quiere verte" — the eye asks for your location
3. You accept → the 6 world signals are read for your coordinates
4. The eye activates: dilates, glitches, generates
5. A vision is dispensed — your portrait of the world, right now
6. A receipt is stamped: coordinates, timestamp, serial number
7. You can share it, download it with watermark, or let it disappear

---

## The Experience: Full MVP Flow

### Entry
- Black. A single vertical amber eye, center screen.
- The eye tracks your cursor. Slow. Mechanical. Aware.
- Ambient text rotates around it: coordinates, hex values, signal data — all static/random until location is granted.
- Minimal prompt: **"EL OJO QUIERE VERTE"** / below in Plex Mono: `[SHARE LOCATION TO GENERATE]`

### Activation
- User grants geolocation
- The eye's data ring activates — numbers become real: `19.4326° N · 99.1332° W · 09:14 LOCAL`
- Six signals begin loading, each with a label:
  - `CLIMA ···` (Open-Meteo)
  - `EVENTOS ···` (GDELT)
  - `COSMOS ···` (NOAA Space Weather)
  - `ECONOMÍA ···` (CoinGecko)
  - `ATENCIÓN ···` (Wikipedia)
  - `TIERRA ···` (USGS)
- Progress feels mechanical, not digital — like a machine reading tape

### Generation
- All 6 signals loaded → the eye fully dilates
- Glitch event: RGB channel split, horizontal displacement (150ms)
- The eye's iris becomes an aperture — opens fully to white/black
- The art is generated (Three.js/p5.js canvas below the eye, emerging from a "slot")
- **Phase A:** Pure generative algorithm, parameters driven by the 6 signals
- **Phase B:** AI-generated image using the 6 signals as prompt (server-side)
- Both modes available; toggle hidden in UI for testing

### Output
- The art is displayed fullscreen, with the eye as a small overlay in corner
- Receipt stamped at bottom (monospaced):
  ```
  AUSGABE #00042
  19.4326° N · 99.1332° W
  2026-02-21T15:14:07Z
  TEMP: 18°C · WIND: 12km/h NE · KP: 3.2
  TONE: -12.4 (GDELT) · SEISMIC: M1.4 (142km)
  SHA256: a3f9b2...
  ```
- Actions: `[DESCARGAR]` `[COMPARTIR LINK]` `[GENERAR NUEVO]`
- The link generates a unique URL that recreates the art (using the same seed/parameters)
- Download includes watermark: `resonantmigration.xyz · #00042 · 2026-02-21`

---

## Data Sources: The 6 World Signals

All server-side. No API keys exposed to client. Called via Next.js API Routes.

| Signal | API | Data Used | Art Mapping |
|--------|-----|-----------|-------------|
| **CLIMA** | Open-Meteo | Temperature, wind speed/dir, UV index, humidity | Color temperature, particle speed, field direction |
| **EVENTOS** | GDELT Project | Global event tone score (-100 to +100), conflict density | Form angularity vs. flow, density, visual entropy |
| **COSMOS** | NOAA SWPC | Kp geomagnetic index (0–9), solar wind speed | Particle storm intensity, aurora-like effects |
| **ECONOMÍA** | CoinGecko | Top 10 crypto 24h % change → volatility index | Visual chaos vs. order, fractal complexity |
| **ATENCIÓN** | Wikipedia Pageviews | Top 50 articles being read now → topic categories | Color palette theme (science=blue, conflict=red, art=purple) |
| **TIERRA** | USGS Earthquakes | Nearest seismic event in last hour: magnitude + distance | Shockwave visual elements, tremor animations |

### World State Object (server-side, every 5 min cache)
```typescript
interface WorldState {
  location:  { lat: number; lng: number; city: string; timezone: string }
  clima:     { temp: number; wind: number; windDir: number; uv: number; humidity: number }
  eventos:   { toneScore: number; conflictDensity: number; dominantTheme: string }
  cosmos:    { kpIndex: number; solarWind: number }
  economia:  { volatilityIndex: number; trendDir: 'up' | 'down' | 'neutral' }
  atencion:  { topTheme: string; palette: string; topArticles: string[] }
  tierra:    { nearestMagnitude: number; nearestDistanceKm: number; totalLastHour: number }
  generatedAt: string  // ISO timestamp
  seed: string         // SHA256 of all values → deterministic art recreation
}
```

---

## Art Generation: Phase Roadmap

### Phase A — Pure Algorithm (MVP)
- **Stack:** Three.js + React Three Fiber + p5.js (instance mode)
- **Method:** WorldState params → D3 scales → visual parameters → Three.js scene
- **Deterministic:** Same location + timestamp = same piece (via seed)
- **Examples:**
  - Kp index 8 + GDELT tone -70 = dark, violent particle storm
  - UV high + Wikipedia top = science topics = cool blue flowing field
  - Major earthquake nearby = shockwave rings emanating from canvas center
- **Goal:** Validate the concept. Is this beautiful? Does the data-to-art mapping feel meaningful?

### Phase B — AI Generative
- **Stack:** Phase A params → prompt construction → Stable Diffusion / FLUX API (server-side)
- **Method:** WorldState → structured prompt → image generation → returned to client
- **Example prompt constructed server-side:**
  ```
  Dark generative digital art. Cyberpunk industrial aesthetic.
  Atmospheric conditions: cold (18°C), strong northeastern wind.
  World emotional tone: tense, fragmented (-12.4 GDELT score).
  Cosmic activity: moderate aurora (Kp 3.2).
  Economic state: high volatility.
  Color palette: deep blues, amber neon, with fractured geometries.
  Style: Berghain flyer meets data visualization, glitch art, Hito Steyerl.
  ```
- **Security:** API key for image model stored in `.env.local`, called only from API route. Client never touches it.
- **Toggle:** Site has hidden mode toggle (keyboard shortcut or URL param `?mode=algo|ai`) for testing

### Phase C — Hybrid (Final Product)
- Algorithm generates the base structure and motion (Three.js)
- AI refines textures, color treatment, or overlay elements
- Full share mechanics: link (recreatable), download (watermark), GIF export
- Optional: Substack-style "artist notes" per piece — what the data meant

---

## Tech Stack

```
Framework:          Next.js 14+ (App Router)
Language:           TypeScript
3D Rendering:       Three.js + React Three Fiber (@react-three/fiber)
Helpers:            @react-three/drei, @react-three/postprocessing
2D/Sketching:       p5.js (instance mode, SSR disabled)
Data Mapping:       d3-scale + d3-scale-chromatic
State / Data Bus:   Zustand (live data store, decoupled from render loop)
Noise:              simplex-noise (JS) + lygia (GLSL)
Shaders:            GLSL via vite-plugin-glsl or inline strings
Animation:          @react-spring/three for data transitions
AI Generation:      Replicate API or Together AI (Stable Diffusion / FLUX) — server-side only
Hosting:            Vercel (recommended, Next.js native)
```

### Security Architecture (Non-Negotiable)
```
CLIENT (browser)                     SERVER (Next.js API Routes)
     |                                         |
     | GET /api/world-state?lat=X&lng=Y ──────→ Open-Meteo    (no key)
     |                                         → GDELT         (no key)
     |                                         → NOAA SWPC     (no key)
     |                                         → CoinGecko     (no key)
     |                                         → Wikipedia     (no key)
     |                                         → USGS          (no key)
     |                                         ↓
     | POST /api/generate-ai ─────────────────→ Replicate/Together AI  (key in .env.local)
     |                                         → Returns: image URL only
     |                                         ↓
     | ← WorldState object ←──────────────────
     | Three.js renders client-side
```

**Rules:**
- No API key ever in client-side bundle
- All external calls go through `/api/*` routes
- `.env.local` is never committed (add to .gitignore day 1)
- Rate limit API routes (Upstash Redis or simple in-memory for MVP)
- WorldState cached 5 minutes server-side to avoid hammering free APIs

---

## Design System: The Kapselmaschine

### Color Palette
```css
--void:       #080808   /* background, dominant */
--charcoal:   #1c1c1c   /* secondary surfaces */
--concrete:   #363636   /* tertiary, texture */
--text:       #e0e0e0   /* primary text */
--eye-core:   #d4811f   /* El Ojo, amber/orange */
--eye-glow:   #8a4f0f   /* eye outer glow */
--accent:     #39ff14   /* acid green, digital/CRT */
--danger:     #ff2020   /* warnings, system errors */
--cold:       #00aaff   /* cosmic/cold data layer */
```

### Typography
- **Display / Headers:** Druk (ultra-heavy condensed) or Monument Grotesk — ALL CAPS, tight tracking
- **Metadata / System:** IBM Plex Mono — coordinates, timestamps, serial numbers, readouts
- **Body (minimal):** Suisse Int'l or Aktiv Grotesk

### Visual Language Rules
1. Darkness is the default. Do not add light unless it serves the eye.
2. The eye is the only warm thing in the interface.
3. Information is dense and functional — like a database printout, not a landing page.
4. Glitch is intentional: RGB split, scanline artifacts, brief displacements = the machine thinking.
5. German operational labels alongside Spanish/English: `AUSGABE`, `SERIENNUMMER`, `EINHEIT`, `WIRD GENERIERT`.
6. Every output is numbered and stamped. Edition feel, even if generation is infinite.
7. The art emerges from a slot — it is dispensed, ejected, not merely displayed.

### Key References
- **Berghain / Ostgut Ton** — visual identity, flyer design, darkness as design
- **Tresor Records** — industrial typography, vault aesthetic
- **Metahaven** — "Black Transparency", surveillance as visual language
- **Hito Steyerl** — "Factory of the Sun", data as industrial material
- **Rosa Menkman** — glitch aesthetics, compression artifact beauty
- **JODI.org** — net art as broken machine (visit it)
- **earth.nullschool.net** — closest technical precedent (single data source, beautiful)

---

## Physical Layer: The Sticker

### Concept
A sticker in the physical world is the offline entry point. Someone sees it, has doubt, scans out of curiosity — morbo. The QR code IS the iris of the eye. The sticker IS El Ojo.

### Design Brief
- Format: circle or oval sticker, ~5–8cm
- Central element: stylized eye, techno-retro, Sauron-adjacent but not derivative
- The iris = QR code (technically integrated into the design, not pasted on top)
- Typography: "RESONANT MIGRATION" in Druk or similar, tight, small
- Color: black on white, or white on black for maximum contrast and printability
- URL: `resonantmigration.xyz` (or chosen domain) in Plex Mono below
- Should cause doubt: "¿Qué es esto?" → morbo → scan

### Distribution
- Personal placement (early phase): laptops, walls, coffee spots
- Future: art events, Substack QR, colabs with venues

---

## Journaling & Content Strategy

### Technical Journal (Existing)
- `STATUS.md` — operational state of the project
- `PROJECT-JOURNAL.md` — workspace-level log

### Narrative Journal (New)
- `docs/OSCAR-VOICE-JOURNAL.md` — voice corpus, session notes, Substack seeds
- CDRs (Creative Decision Records) — `docs/decisions/creative/CDR-XXXX-*.md`

### Substack Pipeline
The project will eventually be documented on Substack, narrating:
- The process of building a generative art system with AI
- The philosophical exploration of "data as art"
- The journaling method itself as subject matter

Each major creative decision → CDR → eventual Substack post.

### AI Context for the Project
Oscar's journaling style and voice (see `OSCAR-VOICE-JOURNAL.md`) feeds into:
- How Claude should write in Oscar's voice when drafting Substack content
- How AI prompts for art generation should be written
- The "personality" of El Ojo's copy and interface text

---

## MVP Definition

**MVP is complete when:**
1. User visits the site on mobile or desktop
2. Site asks for geolocation (with explanation)
3. On grant: 6 APIs are called server-side, WorldState object is created
4. Three.js/p5.js art piece is generated client-side from WorldState params
5. Art is displayed fullscreen with metadata receipt
6. User can share via unique URL that recreates the same piece
7. User can download with watermark

**MVP explicitly excludes:**
- AI generation (Phase B)
- User accounts or saved gallery
- Social features beyond share link
- Sticker/QR distribution (that's a launch activity, not a build activity)
- Substack integration
- Multiple "moods" or art styles

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **0 — Foundation** | Next.js scaffold, API routes for 6 data sources, basic WorldState | TODO |
| **A — Algorithm** | Three.js art generation from WorldState, share link, download | TODO |
| **B — AI Layer** | Stable Diffusion/FLUX server-side, toggle A/B | TODO |
| **C — Hybrid** | Algo + AI combined, GIF export, refined UX, sticker launch | TODO |
| **D — Content** | Substack presence, narrative docs, project page on site | TODO |

---

## Open Questions (Parking Lot)

- Domain: `resonantmigration.xyz` or other? To be decided.
- GIF export: FFmpeg server-side or client-side canvas capture?
- Hosting AI model: Replicate vs. Together AI vs. self-hosted (cost/latency tradeoff)
- Rate limiting strategy for MVP (prevent API abuse of free endpoints)
- Obsidian setup for journaling: deferred, not blocking

---

*This PRD supersedes v4.0. The audio-reactive platform / NFT scope has been archived.*
*Last updated: 2026-02-21 | Claude Code + Oscar Mejía*
