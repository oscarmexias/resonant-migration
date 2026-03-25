# Product Requirements Document
## Resonant Migration v6.0 — El Ojo: Living World Data as Generative NFT Art

**Document Owner:** Oscar Mejía
**Last Updated:** 2026-02-22
**Status:** Active — MBA-Grade Definition
**Supersedes:** PRD v5.0
**Target MVP:** Q2 2026 (Phase 0 + A)

---

## 1. Executive Summary

**Resonant Migration** is a living generative art installation on the web. It reads the real state of the world — weather, seismic activity, cosmic radiation, global events, collective attention, economic volatility — and translates those signals into a unique piece of art, generated in real time, for your location, at this exact moment.

The interface is a **Kapselmaschine** (Berlin art vending machine): a decommissioned surveillance machine repurposed to dispense art. You insert your location. The Eye activates. It sees you, processes your world, and returns a vision. Dark. Industrial. Every piece is unique, stamped with coordinates and a timestamp, mintable as an NFT that permanently records the exact world state that generated it.

**Product type:** Web3 generative art platform
**Revenue model:** Free to experience. Optional NFT mint per generation (blockchain TBD — Solana or Base). 100% of primary revenue to artist. Royalties on secondary sales.
**North Star metric:** 500 unique generations in first 90 days post-launch
**Competitive position:** No direct competitors. New category: multi-source real-time data + location-personalized + industrial aesthetic + mintable output.

---

## 2. Problem Statement

### The Gap in the Market

Data visualization exists. Generative art exists. NFT art exists. What does NOT exist:

> A web experience that (1) reads multiple live data sources simultaneously for your specific location, (2) translates those signals into aesthetically serious generative art, (3) makes that art mintable as a permanent record of that exact world moment, (4) does all of this with an industrial/dark aesthetic that treats data as a material, not a dashboard.

Earth.nullschool.net is beautiful and shows wind data globally. Refik Anadol shows data sculptures in museums. Art Blocks generates art from random seeds. None of them do what El Ojo does.

### The User Problem

Creative people (designers, musicians, artists, developers) want digital art that feels meaningful and personal — not random. They want something that reflects *their moment in the world*, not a generic generative output. They want to own a piece that has provenance: this is what the world looked like at my coordinates on this date.

Current options:
- Buy existing NFT art (not personal to their moment)
- Use AI art generators (beautiful but arbitrary, no world-data connection)
- Experience data art in museums (not accessible, not ownable)

---

## 3. Product Vision & Positioning

### Vision Statement
> El Ojo es un testigo digital del mundo. Todo lo ve — no para juzgar ni controlar, sino para pintar. Cada visión que dispensa es un retrato único del mundo en ese momento, en ese lugar. Un regalo del estado del planeta para ti.

### Positioning
```
El Ojo es para creadores urbanos que quieren arte digital con proveniencia real
que, a diferencia de plataformas NFT convencionales,
genera piezas únicas desde el estado real del mundo en tu ubicación,
no desde semillas aleatorias o prompts manuales.
```

### Tagline options (para testear)
- "El mundo genera. Tú lo posees."
- "A portrait of where you are. At this exact moment."
- "Six signals. One vision. Yours to keep."

---

## 4. User Personas

### Persona A — "La Creativa" (Primary)
**Name:** Valentina, 28 años, Ciudad de México / Buenos Aires / Madrid
**Role:** Diseñadora gráfica / Art director freelance
**Tech level:** Media-alta. Usa Figma, Instagram, entiende NFTs superficialmente (ha visto OpenSea).

**Context:**
- Ve el sticker en una pared en Roma Norte. Le da morbo el ojo.
- Escanea. El sitio carga, pide ubicación. Dice sí.
- Ve cómo se generan las señales del mundo. La espera se siente ritual.
- La pieza generada la impacta visualmente. Comparte en Stories.
- Considera mintear si el precio es accesible (<$5 USD).

**Goals:** Arte que se vea en su portafolio y feed. Arte que tenga historia ("esto fue generado en CDMX a las 3am cuando había KP alto y un sismo en Guerrero").
**Frustrations:** Arte NFT genérico. Plataformas complicadas. Wallets que confunden.
**Quote:** "Si lo comparto, tiene que decir algo sobre mí y sobre ahora."

---

### Persona B — "El Dev Curioso" (Secondary)
**Name:** Rodrigo, 26 años, remoto / tech hubs
**Role:** Frontend developer. Conoce Three.js, ha experimentado con p5.js.

**Context:**
- Llega vía Hacker News o Twitter (alguien compartió la generación).
- Su interés es técnico + estético. Quiere saber cómo está construido.
- Lee el receipt con los datos del mundo. Le interesa la arquitectura.
- Si es open source, lo comparte con la comunidad. Si no, lo admira igual.
- Minta para tener el caso de uso en su colección ("poseé código que usa datos sísmicos como parámetros").

**Goals:** Entender la arquitectura. Coleccionar algo técnicamente interesante. Posiblemente contribuir o fork.
**Frustrations:** Proyectos con hype pero sin sustancia técnica. NFT art sin concepto.
**Quote:** "Esto es lo que el open data debería generar. No dashboards — arte."

---

### Persona C — "El Coleccionista de Nicho" (Tertiary)
**Name:** Jin, 34 años, Berlín / Seoul / NYC
**Role:** Coleccionista de net art y generative art. Activo en Farcaster, conoce fx(hash), Artblocks.

**Context:**
- Llega vía Farcaster cast o recomendación de artista.
- Entiende el concepto inmediatamente: datos del mundo como parámetros generativos.
- Le importa la unicidad del token: SHA256 del WorldState en metadata = verificable.
- Minta múltiples piezas en fechas/eventos significativos (eclipse, sismo grande, elecciones).
- Revende o colecciona como arte de archivo.

**Goals:** Piezas con unicidad verificable y proveniencia clara. Arte que tenga concepto detrás.
**Frustrations:** Proyectos que usan "datos" como marketing pero son random seeds con nuevo nombre.
**Quote:** "El hash del WorldState en la metadata es lo que hace esto real. La pieza es verificable."

---

## 5. User Journey Maps

### Journey A — Valentina (sticker → share)
```
[VE STICKER] → [MORBO] → [ESCANEA QR]
     ↓
[LLEGA: Ojo en pantalla negra]
     ↓
[CONCEDE UBICACIÓN]
     ↓
[VE LAS 6 SEÑALES CARGAR] (ritual de espera, ~5-8 segundos)
     ↓
[PIEZA GENERADA] (impacto visual)
     ↓
[LEE EL RECEIPT] (sus coordenadas, datos reales)
     ↓
FORK A: [COMPARTE SCREENSHOT/LINK] → amigos escanean
FORK B: [INTENTA MINTEAR] → wallet connect → mint → posee el token
FORK C: [GENERA NUEVO] → ve otra variación → vuelve al fork A o B
```

### Journey B — Rodrigo (link compartido → deep dive)
```
[VE LINK EN TWITTER/HN] → [ABRE EL SITIO]
     ↓
[EL OJO LO RECIBE] → [CONCEDE UBICACIÓN]
     ↓
[OBSERVA SEÑALES + RECEIPT] → [INTRIGADO POR LA ARQUITECTURA]
     ↓
[BUSCA REPO O DOCS] → [ENCUENTRA OPEN SOURCE EN GITHUB]
     ↓
FORK A: [DA STAR] → [COMPARTE EN COMUNIDAD]
FORK B: [MINTA] → tiene el token para su colección de "cosas interesantes"
FORK C: [CONTRIBUYE O HACE FORK] → expande el proyecto
```

---

## 6. Goals & Objectives

### Business Objectives (18 meses)
| Objetivo | Métrica | Target |
|----------|---------|--------|
| Validar concepto | Generaciones únicas | 500 en 90 días post-launch |
| Validar estética | Share rate orgánico | 15%+ de sesiones comparten |
| Validar web3 | NFT mints | 50 mints en primer mes post-mint-launch |
| Validar cultura | Feature en publicación | 1 en Creative Review, Colossal, o HN front page |
| Construir comunidad | Newsletter/Substack subs | 200 subs en 90 días |

### Product Objectives (MVP)
1. El usuario llega, ve el ojo, y entiende qué hace sin texto explicativo
2. La generación de arte se siente ritual, no técnica
3. El receipt hace que el usuario sienta que la pieza ES suya (sus coordenadas, su momento)
4. El share link funciona perfectamente y recrea el arte idéntico
5. El flujo de mint no interrumpe la experiencia estética

---

## 7. Success Metrics & KPIs

### North Star Metric
**500 generaciones únicas en los primeros 90 días post-launch**
Definición: sessions donde el usuario concedió ubicación y llegó al output.

### AARRR Framework

**ACQUISITION**
- Fuentes: sticker QR scan, link compartido, búsqueda orgánica
- KPI: sesiones únicas / semana
- Target 30d: 200 sesiones
- Target 90d: 1,000 sesiones

**ACTIVATION**
- Definición: usuario llega al output (concede ubicación + genera pieza)
- KPI: activation rate = generaciones / sesiones
- Target: ≥ 60% de sesiones activan
- Anti-metric a evitar: bounce en pantalla de ubicación (>40% = problema de UX)

**RETENTION**
- Definición: usuario vuelve a generar
- KPI: % de usuarios que generan 2+ veces en 30d
- Target: 20% de usuarios retornan
- Vector: share link que otros escanean (quien lo comparte vuelve a ver su pieza)

**REVENUE** (Fase B — post-MVP)
- KPI: mint rate = mints / generaciones
- Target inicial: 5% de generaciones se mintean (1 de cada 20)
- KPI secundario: volumen secundario en marketplace
- Target mint price: TBD por chain (validar arte primero)

**REFERRAL**
- KPI: share rate = shares / generaciones
- Target: 20% de generaciones se comparten
- Mecanismo: link único que recrea la pieza exacta (determinístico por seed)

### Métricas de Arte (únicas para este producto)
- Diversidad de outputs: % de generaciones visualmente distintas (evitar "todas se ven igual")
- Engagement con el receipt: tiempo promedio en pantalla output
- "Nueva Visión" rate: % de usuarios que generan una segunda pieza en la misma sesión

---

## 8. Business Model & Revenue

### Fase 1: Free (MVP — Q2 2026)
- 100% gratis para generar y compartir
- Download con watermark gratis
- Sin wallet connect, sin mint
- Objetivo: validar arte, activar comunidad, llegar a 500 generaciones

### Fase 2: NFT Mint (Q3 2026 — post validación)

**Decisión de chain: Pospuesta intencionalmente**
La arquitectura se diseña chain-agnostic. Decisión criterios:
- Si comunidad orgánica es crypto-nativa (Farcaster/Solana users): Solana
- Si comunidad es más Coinbase/mainstream crypto: Base (L2)
- Si comunidad es art-world/coleccionistas tradicionales: Ethereum L2

**Modelo de mint:**
```
Free to generate (siempre gratis)
         ↓
[MINTEAR ESTA VISIÓN] = acción opcional
         ↓
Precio TBD (objetivo: <$5 USD equivalente para accesibilidad)
         ↓
Token metadata incluye:
  - Imagen generada (IPFS via Pinata/NFT.Storage)
  - SHA256 del WorldState completo (verificable)
  - Coordenadas + timestamp
  - Número de edición global (AUSGABE #XXXXX)
```

**Royalties:** 7.5% en ventas secundarias (estándar mercado)

### Fase 3: Revenue diversificado (Q4 2026+)
- Print físico de alta resolución (Printful/Gelato integración)
- API access para otras herramientas creativas (pricing TBD)
- Instalaciones para venues/festivales (B2B, proyecto a proyecto)
- Substack paid (documentación del proceso, detrás de cámara)

---

## 9. NFT Architecture & Metadata

### Token Structure
```json
{
  "name": "El Ojo — AUSGABE #00042",
  "description": "A vision generated from live world data at 19.4326°N 99.1332°W on 2026-02-22T15:14:07Z",
  "image": "ipfs://Qm.../vision-00042.png",
  "attributes": [
    { "trait_type": "Coordinates", "value": "19.4326°N 99.1332°W" },
    { "trait_type": "Timestamp", "value": "2026-02-22T15:14:07Z" },
    { "trait_type": "Temperature", "value": "18°C" },
    { "trait_type": "Wind", "value": "12 km/h NE" },
    { "trait_type": "Kp Index", "value": "3.2" },
    { "trait_type": "World Tone", "value": "-12.4" },
    { "trait_type": "Volatility Index", "value": "4.1%" },
    { "trait_type": "Seismic", "value": "M1.4 (142km)" },
    { "trait_type": "Top Attention", "value": "Super Bowl LIX" },
    { "trait_type": "WorldState SHA256", "value": "a3f9b2e1..." },
    { "trait_type": "Edition", "value": "42" }
  ]
}
```

### On-chain vs Off-chain strategy
- **Image:** Off-chain en IPFS (Pinata). Permanente, descentralizado.
- **Metadata JSON:** Off-chain en IPFS, pinned permanentemente.
- **WorldState SHA256:** En metadata (verificable, no mutable).
- **NFT contract:** On-chain (Solana Metaplex o Base ERC-721).
- **Reproducibilidad:** Dado el SHA256, cualquiera puede regenerar la pieza exacta (open source algorithm + open data).

---

## 10. Competitive Positioning

### Posición: Categoría propia

| Plataforma | Datos reales | Multi-source | Location | Minteable | Estética dark | Accesible web |
|-----------|-------------|-------------|----------|-----------|--------------|--------------|
| **El Ojo** | ✅ 6 fuentes | ✅ | ✅ personalizado | ✅ | ✅ | ✅ |
| Art Blocks | ❌ seed random | ❌ | ❌ | ✅ | ⚠️ varía | ❌ requiere colección |
| earth.nullschool | ✅ 1 fuente | ❌ | ⚠️ global | ❌ | ⚠️ | ✅ |
| Refik Anadol | ✅ varios | ✅ | ❌ | ❌ | ✅ | ❌ museo |
| fx(hash) | ❌ random | ❌ | ❌ | ✅ | ⚠️ varía | ❌ requiere wallet |

**Frame de posicionamiento:** "Earth.nullschool si fuera arte minteable personalizado a tu ubicación y momento exacto."

### Por qué no hay competidores directos
1. La combinación multi-source es técnicamente no trivial (CORS, APIs heterogéneas, normalización)
2. La estética Berghain/industrial es un nicho de alta intención que pocos desarrolladores tienen
3. El ritual de interacción (Kapselmaschine) requiere tanto visión de producto como diseño
4. Web3 + arte de datos en tiempo real no ha sido articulado como producto todavía

---

## 11. The Experience: Full MVP Flow

### Entry
- Black. A single vertical amber eye, center screen.
- The eye tracks your cursor. Slow. Mechanical. Aware.
- Ambient text rotates: coordinates, hex values, signal data — all static until location granted.
- Prompt: **"EL OJO QUIERE VERTE"** / below: `[COMPARTIR UBICACIÓN]`

### Activation
- User grants geolocation
- Data ring activates with real coordinates
- Six signals load with real API data, each labeled and animated
- Loading feels mechanical, tape-reading — not a spinner

### Generation
- All 6 loaded → eye dilates fully
- Glitch event: RGB split (150ms)
- Art canvas emerges from slot below the eye
- **Phase A (MVP):** Pure generative algorithm driven by the 6 real signals
- **Phase B:** AI image generation server-side (Stable Diffusion / FLUX)

### Output
- Art displayed fullscreen, eye as small overlay
- Receipt stamped at bottom with real data
- Actions: `[DESCARGAR]` `[MINTEAR ESTA VISIÓN]` `[COMPARTIR LINK]` `[NUEVA VISIÓN]`
- Share link recreates the exact same art (deterministic seed)
- Download includes watermark: `resonantmigration.xyz · #00042 · 2026-02-22`

---

## 12. Data Sources: The 6 World Signals

All server-side in production. No API keys in client bundle.

| Signal | API | Data Used | Art Mapping |
|--------|-----|-----------|-------------|
| **CLIMA** | Open-Meteo (free, no key) | Temp, wind speed/dir, UV, humidity | Color temp, particle speed, field direction |
| **EVENTOS** | GDELT Project (free, no key, server-side only) | Global event tone (-100 to +100), conflict density | Angularity vs. flow, visual entropy |
| **COSMOS** | NOAA SWPC (free, no key) | Kp geomagnetic index (0–9), solar wind | Storm intensity, aurora effects |
| **ECONOMÍA** | CoinGecko (free, no key) | Top 10 crypto 24h % change → volatility | Visual chaos vs. order, fractal complexity |
| **ATENCIÓN** | Wikipedia Pageviews (free, no key) | Top 50 articles being read → categories | Color palette theme (science=blue, conflict=red) |
| **TIERRA** | USGS Earthquakes (free, no key) | Nearest seismic event in last hour | Shockwave rings, tremor animations |

### WorldState TypeScript Interface
```typescript
interface WorldState {
  location:  { lat: number; lng: number; city?: string; timezone?: string }
  clima:     { temp: number; wind: number; windDir: number; uv: number; humidity: number }
  eventos:   { toneScore: number; conflictDensity: number; dominantTheme: string }
  cosmos:    { kpIndex: number; solarWind: number }
  economia:  { volatilityIndex: number; trendDir: 'up' | 'down' | 'neutral' }
  atencion:  { topTheme: string; palette: string; topArticles: string[] }
  tierra:    { nearestMagnitude: number; nearestDistanceKm: number; totalLastHour: number }
  generatedAt: string   // ISO timestamp
  seed: string          // SHA256 of all values — deterministic art recreation
  editionNumber: number // Global sequential counter
}
```

---

## 13. Art Generation: Phase Roadmap

### Phase A — Pure Algorithm (MVP)
- Three.js + React Three Fiber + p5.js instance mode
- WorldState → D3 scales → visual parameters → Three.js scene
- Deterministic: same location + timestamp = same piece (via seed)
- Key mappings: wind→speed, kp→storminess, volatility→chaos, temp→warmth, seismic→shockwave rings

### Phase B — AI Generative
- WorldState → structured prompt → Stable Diffusion / FLUX (server-side, Replicate API)
- Prompt constructed server-side, key never in client
- Toggle: `?mode=algo|ai` URL param for testing

### Phase C — Hybrid + NFT
- Algorithm generates base structure + motion
- AI refines texture/color treatment
- Full NFT mint flow integrated
- GIF export (client-side canvas capture)
- Artist notes per piece (Substack-style annotation)

---

## 14. Tech Stack

```
Framework:       Next.js 14+ (App Router)
Language:        TypeScript
3D Rendering:    Three.js + React Three Fiber (@react-three/fiber)
Helpers:         @react-three/drei, @react-three/postprocessing
2D/Sketching:    p5.js (instance mode, SSR disabled via dynamic import)
Data Mapping:    d3-scale + d3-scale-chromatic
State:           Zustand (WorldState store, decoupled from render loop)
Noise:           simplex-noise (JS)
Animation:       @react-spring/three for data transitions
AI Generation:   Replicate API (server-side only) — Phase B
NFT (Solana):    @metaplex-foundation/js — Phase C
NFT (Base/EVM):  viem + wagmi — Phase C alternative
Storage:         Pinata SDK for IPFS — Phase C
Hosting:         Vercel (Next.js native)
Cache:           Next.js unstable_cache with revalidate: 300 (no Redis for MVP)
```

---

## 15. Security Architecture

```
CLIENT (browser)                     SERVER (Next.js API Routes)
     |                                         |
     | GET /api/world-state?lat=X&lng=Y ──────→ Open-Meteo    (no key)
     |                                         → GDELT         (no key, CORS bypass)
     |                                         → NOAA SWPC     (no key)
     |                                         → CoinGecko     (no key)
     |                                         → Wikipedia     (no key)
     |                                         → USGS          (no key)
     |                                         ↓ cache 5 min
     | POST /api/generate-ai ─────────────────→ Replicate API  (key in .env.local)
     | POST /api/mint ────────────────────────→ NFT minting    (key in .env.local)
     |                                         → IPFS upload   (key in .env.local)
     | ← WorldState object ←──────────────────
     | Three.js renders client-side
```

**Non-negotiable rules:**
- No API key ever in client-side bundle
- `.env.local` never committed (gitignore day 1)
- Rate limit: 10 req/min per IP on `/api/world-state` (in-memory for MVP)
- WorldState cached 5 min server-side to avoid hammering free APIs
- Mint endpoint validates WorldState hash server-side before minting

---

## 16. Error States & Resilience

| Scenario | User-facing behavior | Technical handling |
|----------|---------------------|-------------------|
| 1-2 APIs fail | Art generates with partial data, receipt shows "NO SIGNAL" for failed sources | `Promise.allSettled` — never blocks generation |
| All APIs fail | Art generates with fallback defaults + clear notice: "SEÑALES FUERA DE LÍNEA" | Fallback WorldState with static defaults |
| Geolocation denied | Art generates for CDMX default (19.4326°N, 99.1332°W) + notice | Graceful fallback, no error |
| Geolocation timeout | Same as denied | 6-second timeout then fallback |
| Canvas not supported | Static image fallback | Feature detection |
| IPFS upload fails on mint | Retry 3x then fail with user message | Async retry, not blocking |
| Chain congestion / tx fail | Clear error + retry option | Wallet error handling |

---

## 17. Accessibility

### WCAG 2.1 AA Compliance (where applicable to art context)

**Navigation:**
- Keyboard accessible: all interactive elements reachable via Tab
- Focus visible: amber outline on focused elements (matches design system)
- Skip link: `[Saltar a generación]` for screen reader users

**Color & Contrast:**
- Amber (#d4811f) on void (#080808): ratio 4.8:1 ✅ AA compliant
- Text (#e0e0e0) on void (#080808): ratio 15.8:1 ✅ AAA compliant
- Accent (#39ff14) on void: used for state only, never as sole info carrier

**Motion:**
- `prefers-reduced-motion`: glitch effects and scanlines disabled, fade-only transitions
- No autoplay audio (project has none)
- Canvas animation pauses when tab not visible (performance + a11y)

**Cognitive load:**
- Single action per screen state
- Progress clearly indicated (6 signal bars = 6 steps)
- Loading time framed as ritual (designed wait, not technical wait)

**Screen readers:**
- Eye SVG has `aria-hidden="true"` (decorative)
- Status announcements via `aria-live="polite"` region
- Receipt data has semantic structure for reading

---

## 18. Mobile UX Specifications

**Primary breakpoint strategy:** Mobile-first, then desktop enhancement.

**Touch targets:**
- Minimum 44x44px for all interactive elements (Apple HIG)
- `[COMPARTIR UBICACIÓN]` button: full-width on mobile, minimum 56px height

**Viewport handling:**
- `height: 100dvh` (dynamic viewport height for mobile browsers)
- Art canvas fills available space below browser chrome
- Receipt bar: scrollable on small screens, sticky on desktop

**Performance targets (mobile 4G, mid-range Android):**
- First contentful paint: < 2s
- Eye SVG interactive: < 1s
- Canvas first frame: < 3s
- API round trip: < 8s (all 5 APIs in parallel, server-cached)

**Geolocation UX:**
- Explain why before asking: "El Ojo necesita tu ubicación para leer los datos del mundo desde donde estás."
- If denied: clear message + CDMX default, no nagging re-prompt
- `{ maximumAge: 300000, timeout: 6000, enableHighAccuracy: false }` — accuracy not critical

**Camera/Share on mobile:**
- `navigator.share()` for native share sheet on mobile
- Fallback to copy link if Web Share API not available
- Canvas `toBlob()` for download on mobile

**Orientation:**
- Portrait: default, optimized layout
- Landscape: art canvas expands, receipt bar collapses to bottom strip

---

## 19. Analytics & Instrumentation

**Philosophy:** Minimal, privacy-respecting. No user tracking. Aggregate stats only.

### Events to capture (via Vercel Analytics or Plausible)
```
page_view
location_granted          { city, country_code }  // NOT precise coords
location_denied           { }
generation_complete       { edition_number, had_seismic: bool, kp_level: string }
share_clicked             { method: 'link'|'download'|'native' }
nueva_vision_clicked      { }
mint_initiated            { edition_number }
mint_completed            { edition_number, chain }
mint_failed               { reason }
```

### Key dashboards
1. **Funnel:** Sessions → Location granted → Generation complete → Share/Mint
2. **Geography:** Country/city heatmap of generations
3. **World correlation:** Do high-KP days generate more mints? (data art about the data art)
4. **Retention:** D1, D7, D30 return rate

### Privacy
- No IP storage
- No fingerprinting
- Precise coordinates never logged (only city-level)
- GDPR/CCPA compliant by default (no PII collected)

---

## 20. Design System: The Kapselmaschine

### Color Palette
```css
--void:       #080808   /* background, dominant */
--charcoal:   #1c1c1c   /* secondary surfaces */
--concrete:   #363636   /* tertiary, texture */
--text:       #e0e0e0   /* primary text */
--text-dim:   #606060   /* metadata, labels */
--eye-core:   #d4811f   /* El Ojo, amber/orange — the only warmth */
--eye-glow:   #8a4f0f   /* eye outer glow */
--accent:     #39ff14   /* acid green, digital/CRT — use sparingly */
--danger:     #ff2020   /* warnings, system errors */
--cold:       #00aaff   /* cosmic/cold data layer */
--glow:       rgba(212,129,31,0.18)
```

### Typography
- **Display / Headers:** Bebas Neue (free) → upgrade to Druk (licensed) for production
- **Metadata / System:** IBM Plex Mono — all receipt text, coordinates, signals
- **Body (minimal):** System sans-serif fallback (no body copy in MVP)

### Visual Language Rules
1. Darkness is default. Do not add light unless it serves the eye.
2. The eye is the only warm thing in the interface.
3. Information is dense and functional — database printout, not landing page.
4. Glitch is intentional: RGB split, scanlines, brief displacements = machine thinking.
5. German operational labels alongside Spanish: `AUSGABE`, `SERIENNUMMER`, `WIRD GENERIERT`.
6. Every output is numbered. Edition feel, even if generation is infinite.
7. Art emerges from a slot — dispensed, not displayed.

---

## 21. Physical Layer: The Sticker

### Concept
The sticker is the offline entry point. The QR code IS the iris of the eye. The sticker IS El Ojo. Someone sees it, feels morbo, scans.

### Design brief
- Format: circle or oval, 5–8cm
- Central element: stylized eye — the iris IS the QR code, technically integrated
- Typography: "RESONANT MIGRATION" in Bebas Neue/Druk, tight, small
- Color: black on white or white on black (maximum contrast, printable anywhere)
- URL: `resonantmigration.xyz` in IBM Plex Mono
- Should provoke: "¿Qué es esto?"

### Distribution strategy (GTM Phase 1)
- Phase 1: Personal placement — laptops, walls in creative districts globally
- Phase 2: Art events, festivals, Substack QR codes, gallery openings
- Phase 3: Colabs with venues (Berghain-adjacent spots, art fairs, design weeks)

---

## 22. GTM Strategy

### Go-to-Market: Global from Day 1

**Channels by persona:**

| Canal | Persona | Contenido | Momento |
|-------|---------|-----------|---------|
| Farcaster (Warpcast) | Dev Curioso, Coleccionista | Technical cast + mint link | Launch |
| Instagram Stories | La Creativa | Screenshot de generación + behind-scenes | Pre-launch |
| Twitter/X | Dev Curioso | "Built this: world data → generative art → minteable" | Launch day |
| Hacker News Show HN | Dev Curioso | Technical writeup, open source | Launch |
| Are.na | La Creativa, Coleccionista | Visual channel documentando el proyecto | Ongoing |
| Sticker físico | Todos | QR en pared → morbo → scan | Ongoing |
| Substack | Todos | Narrative del proceso de construcción | Pre + post launch |

### Launch Sequence
```
T-30 días: Soft launch — prototipo funcional, link a early adopters
T-15 días: Instagram/Farcaster teaser — el ojo, sin explicación
T-7 días:  "El Ojo abre en 7 días" — countdown en social
T-0:       Launch post con generación real de ese día + coordinates
T+7:       HN "Show HN" post con technical writeup
T+30:      Primer NFT mint habilitado (si la validación de arte es positiva)
```

---

## 23. Phase Roadmap

| Fase | Alcance | KPI de éxito | Target |
|------|---------|-------------|--------|
| **0 — Foundation** | Next.js scaffold, 6 API routes server-side, WorldState | APIs funcionando server-side | Sem 1-2 |
| **A — Algorithm** | Three.js art generation, share link, download, deploy en Vercel | 500 generaciones en 90d | MVP Q2 2026 |
| **B — NFT Mint** | Chain seleccionada, wallet connect, mint flow, IPFS | 50 mints en mes 1 | Q3 2026 |
| **C — AI Layer** | Stable Diffusion/FLUX, toggle A/B, GIF export | Share rate 20%+ | Q3-Q4 2026 |
| **D — Growth** | Substack, sticker distribution, venue collabs | Feature en publicación | Q4 2026 |
| **E — API + B2B** | API access para devs, instalaciones para venues | Primer contrato B2B | Q1 2027 |

---

## 24. Risks & Mitigation

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Free APIs cambian o ponen key | Media | Alto | Monitor, fallbacks listos, documentar alternativas |
| Arte generativo "no impresiona" en Phase A | Media | Crítico | Iterar rápido — Phase A es validación, no el producto final |
| Fricción de wallet aleja a Persona A | Alta | Alto | Free mint (sin gas) o login con email vía magic link antes del wallet |
| NFT mercado en baja | Media | Medio | Free forever es el core — NFT es opcional, nunca el gate |
| GDELT CORS en browser (ya detectado) | Alta | Bajo | Resuelto con server-side en Next.js |
| Rate limiting en producción | Media | Medio | Cache 5 min server-side + Upstash Redis si escala |
| Copiadores / forks | Alta | Bajo | Open source by design — la comunidad es el moat |
| Generaciones "todas iguales" | Media | Alto | Testear diversidad visual con variedad de coordenadas antes de launch |

---

## 25. MVP Definition (Updated)

**MVP is complete when:**
1. User visits on mobile or desktop
2. Site asks for geolocation with explanation
3. On grant: 6 APIs called server-side → WorldState created
4. Three.js/p5.js art generated client-side from real WorldState
5. Art displayed fullscreen with real-data receipt
6. User can share via unique URL that recreates the exact piece
7. User can download with watermark
8. Analytics tracking funnel (activation, share rate)

**MVP explicitly excludes:**
- NFT mint (Phase B)
- AI generation (Phase C)
- User accounts
- Social features beyond share link
- Wallet connect
- High-res prints

---

## 26. Open Questions

| Pregunta | Owner | Deadline |
|----------|-------|---------|
| Domain: `resonantmigration.xyz` o otro? | Oscar | Pre-launch |
| Chain final: Solana vs Base | Oscar | Post-500-generaciones |
| Free mint vs. small fee | Oscar | Post-validación arte |
| Precio de print físico | Oscar | Q3 2026 |
| GIF export: FFmpeg server-side o canvas capture? | Dev | Phase C |
| Cómo manejar WorldState para piezas muy antiguas (datos ya no disponibles)? | Dev | Phase B |
| Idioma dominante del copy: español, inglés, o bilingüe? | Oscar | Pre-launch |
| Tipografía final: Bebas Neue (free) es suficiente o vale invertir en Druk? | Oscar | Pre-launch |

---

*PRD v6.0 — Resonant Migration / El Ojo*
*Última actualización: 2026-02-22 | Oscar Mejía + Claude Code*
*Skills aplicadas: prd-generator, strategy-frameworks, go-to-market-plan, product-strategist*
