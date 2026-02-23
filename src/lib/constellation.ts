// ── Constellation Engine for El Ojo ────────────────────────────────────────────
// Calculates the dominant visible constellation for a given lat/lng and UTC time.
// Uses standard astronomical formulas: LST → Hour Angle → Alt/Az projection.

const DEG = Math.PI / 180

export interface CStar {
  ra:  number  // Right Ascension in decimal hours (0–24)
  dec: number  // Declination in degrees (−90 to +90)
  mag: number  // Visual magnitude (lower = brighter)
}

export interface Constellation {
  id:     string
  name:   string   // Latin/English name shown as title
  nameEs: string   // Spanish poetic name
  myth:   string   // One-line description
  center: { ra: number; dec: number }
  stars:  CStar[]
  edges:  [number, number][]
}

export interface ConstellationResult {
  constellation: Constellation
  altitude:      number   // degrees above horizon
  stars:         { x: number; y: number; mag: number }[]  // normalized 0–1 for box
}

// ── Catalog: 22 major constellations (both hemispheres, all seasons) ──────────
export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'ori', name: 'ORION', nameEs: 'El Cazador', myth: 'El gran cazador del invierno',
    center: { ra: 5.5, dec: 5 },
    stars: [
      { ra: 5.919, dec:  7.41, mag: 0.4 },  // 0 Betelgeuse
      { ra: 5.243, dec: -8.20, mag: 0.1 },  // 1 Rigel
      { ra: 5.419, dec:  6.35, mag: 1.6 },  // 2 Bellatrix
      { ra: 5.533, dec: -0.30, mag: 2.2 },  // 3 Mintaka  (belt)
      { ra: 5.603, dec: -1.20, mag: 1.7 },  // 4 Alnilam  (belt)
      { ra: 5.679, dec: -1.94, mag: 1.7 },  // 5 Alnitak  (belt)
      { ra: 5.796, dec: -9.67, mag: 2.1 },  // 6 Saiph
      { ra: 5.589, dec:  9.93, mag: 3.4 },  // 7 Meissa
    ],
    edges: [[7,0],[7,2],[0,2],[0,3],[2,4],[3,4],[4,5],[5,1],[5,6]],
  },
  {
    id: 'uma', name: 'URSA MAJOR', nameEs: 'La Osa Mayor', myth: 'La guía eterna de los navegantes',
    center: { ra: 12.5, dec: 57 },
    stars: [
      { ra: 11.05, dec: 61.75, mag: 1.8 },  // 0 Dubhe
      { ra: 11.02, dec: 56.37, mag: 2.4 },  // 1 Merak
      { ra: 11.90, dec: 53.70, mag: 2.4 },  // 2 Phecda
      { ra: 12.26, dec: 57.03, mag: 3.3 },  // 3 Megrez
      { ra: 12.90, dec: 55.96, mag: 1.8 },  // 4 Alioth
      { ra: 13.40, dec: 54.92, mag: 2.1 },  // 5 Mizar
      { ra: 13.79, dec: 49.31, mag: 1.9 },  // 6 Alkaid
    ],
    edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
  },
  {
    id: 'cas', name: 'CASSIOPEIA', nameEs: 'La Reina', myth: 'La vanidosa reina del norte celestial',
    center: { ra: 1.0, dec: 61 },
    stars: [
      { ra: 0.15, dec: 59.15, mag: 2.3 },  // 0 Caph
      { ra: 0.68, dec: 56.54, mag: 2.2 },  // 1 Schedar
      { ra: 0.95, dec: 60.72, mag: 2.2 },  // 2 Gamma Cas
      { ra: 1.43, dec: 60.24, mag: 2.7 },  // 3 Ruchbah
      { ra: 1.90, dec: 63.67, mag: 3.4 },  // 4 Segin
    ],
    edges: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    id: 'sco', name: 'SCORPIUS', nameEs: 'El Escorpión', myth: 'El escorpión que venció a Orión',
    center: { ra: 16.9, dec: -30 },
    stars: [
      { ra: 16.09, dec: -19.80, mag: 2.6 },  // 0 Graffias
      { ra: 16.01, dec: -22.62, mag: 2.3 },  // 1 Delta
      { ra: 16.48, dec: -26.43, mag: 0.9 },  // 2 Antares ★
      { ra: 17.00, dec: -37.10, mag: 2.4 },  // 3 Zeta
      { ra: 17.37, dec: -42.99, mag: 1.9 },  // 4 Sargas
      { ra: 17.52, dec: -37.30, mag: 2.7 },  // 5 Lesath
      { ra: 17.56, dec: -37.10, mag: 1.6 },  // 6 Shaula
    ],
    edges: [[0,1],[1,2],[2,3],[3,4],[3,5],[5,6]],
  },
  {
    id: 'leo', name: 'LEO', nameEs: 'El León', myth: 'El rey de los cielos primaverales',
    center: { ra: 10.6, dec: 15 },
    stars: [
      { ra: 10.13, dec: 11.97, mag: 1.4 },  // 0 Regulus ★
      { ra: 10.33, dec: 19.84, mag: 2.1 },  // 1 Algieba
      { ra: 10.28, dec: 23.42, mag: 3.4 },  // 2 Adhafera
      { ra:  9.76, dec: 23.77, mag: 3.0 },  // 3 Epsilon
      { ra: 11.23, dec: 20.52, mag: 2.6 },  // 4 Zosma
      { ra: 11.82, dec: 14.57, mag: 2.1 },  // 5 Denebola
    ],
    edges: [[3,2],[2,1],[1,0],[1,4],[4,5]],
  },
  {
    id: 'cru', name: 'CRUX', nameEs: 'La Cruz del Sur', myth: 'Emblema del hemisferio austral',
    center: { ra: 12.4, dec: -60 },
    stars: [
      { ra: 12.44, dec: -63.10, mag: 0.8 },  // 0 Acrux (bottom)
      { ra: 12.52, dec: -57.11, mag: 1.6 },  // 1 Gacrux (top)
      { ra: 12.25, dec: -58.75, mag: 2.8 },  // 2 Delta (left)
      { ra: 12.79, dec: -59.69, mag: 1.3 },  // 3 Mimosa (right)
    ],
    edges: [[0,1],[2,3]],
  },
  {
    id: 'cyg', name: 'CYGNUS', nameEs: 'El Cisne', myth: 'El cisne que surca la Vía Láctea',
    center: { ra: 20.4, dec: 42 },
    stars: [
      { ra: 20.69, dec: 45.28, mag: 1.3 },  // 0 Deneb ★
      { ra: 20.37, dec: 40.26, mag: 2.2 },  // 1 Sadr (center)
      { ra: 19.51, dec: 27.96, mag: 3.1 },  // 2 Albireo (head)
      { ra: 20.77, dec: 45.13, mag: 2.9 },  // 3 Gienah (N wing)
      { ra: 20.77, dec: 33.97, mag: 2.5 },  // 4 Epsilon (S wing)
    ],
    edges: [[0,1],[1,2],[1,3],[1,4]],
  },
  {
    id: 'gem', name: 'GEMINI', nameEs: 'Los Gemelos', myth: 'Los héroes Castor y Pólux',
    center: { ra: 7.2, dec: 27 },
    stars: [
      { ra: 7.58, dec: 31.89, mag: 1.6 },  // 0 Castor
      { ra: 7.75, dec: 28.03, mag: 1.2 },  // 1 Pollux ★
      { ra: 6.63, dec: 16.40, mag: 1.9 },  // 2 Alhena
      { ra: 6.38, dec: 22.51, mag: 2.9 },  // 3 Tejat
      { ra: 6.73, dec: 25.13, mag: 3.1 },  // 4 Mebsuda
    ],
    edges: [[0,4],[4,2],[4,3],[0,1],[1,4]],
  },
  {
    id: 'tau', name: 'TAURUS', nameEs: 'El Toro', myth: 'Guardián de las Pléyades',
    center: { ra: 4.7, dec: 20 },
    stars: [
      { ra: 4.60, dec: 16.51, mag: 0.9 },  // 0 Aldebaran ★
      { ra: 5.44, dec: 28.61, mag: 1.7 },  // 1 Elnath
      { ra: 3.79, dec: 24.12, mag: 2.9 },  // 2 Alcyone (Pléyades)
      { ra: 4.48, dec: 19.18, mag: 3.5 },  // 3 Ain
      { ra: 4.33, dec: 15.63, mag: 3.8 },  // 4 Hyadum I
    ],
    edges: [[0,3],[3,4],[3,1],[4,2]],
  },
  {
    id: 'vir', name: 'VIRGO', nameEs: 'La Virgen', myth: 'Diosa de la cosecha y la justicia',
    center: { ra: 13.2, dec: -3 },
    stars: [
      { ra: 13.42, dec: -11.16, mag: 1.0 },  // 0 Spica ★
      { ra: 12.69, dec: -1.45,  mag: 2.7 },  // 1 Porrima
      { ra: 13.04, dec: 10.96,  mag: 2.8 },  // 2 Vindemiatrix
      { ra: 14.77, dec: -5.65,  mag: 3.9 },  // 3 Heze
      { ra: 12.33, dec:  3.40,  mag: 3.4 },  // 4 Zaniah
    ],
    edges: [[0,1],[1,2],[1,4],[1,3]],
  },
  {
    id: 'aql', name: 'AQUILA', nameEs: 'El Águila', myth: 'El águila de Zeus, portadora del rayo',
    center: { ra: 19.8, dec: 6 },
    stars: [
      { ra: 19.85, dec:  8.87, mag: 0.8 },  // 0 Altair ★
      { ra: 19.77, dec: 10.61, mag: 2.7 },  // 1 Tarazed
      { ra: 19.92, dec:  6.41, mag: 3.7 },  // 2 Alshain
      { ra: 19.10, dec: 13.86, mag: 3.4 },  // 3 Zeta
      { ra: 20.19, dec:  0.82, mag: 3.4 },  // 4 Lambda
    ],
    edges: [[1,0],[0,2],[0,3],[0,4]],
  },
  {
    id: 'lyr', name: 'LYRA', nameEs: 'La Lira', myth: 'La lira de Orfeo, la música más bella',
    center: { ra: 18.8, dec: 36 },
    stars: [
      { ra: 18.61, dec: 38.78, mag: 0.0 },  // 0 Vega ★ (más brillante del verano N)
      { ra: 18.83, dec: 33.36, mag: 3.5 },  // 1 Sheliak
      { ra: 18.98, dec: 32.69, mag: 3.2 },  // 2 Sulafat
      { ra: 18.90, dec: 36.90, mag: 4.3 },  // 3 Delta
      { ra: 18.74, dec: 37.60, mag: 4.4 },  // 4 Zeta
    ],
    edges: [[0,4],[0,3],[3,4],[0,1],[0,2],[1,2]],
  },
  {
    id: 'cma', name: 'CANIS MAJOR', nameEs: 'El Can Mayor', myth: 'Guardián de Sirio, la estrella más brillante',
    center: { ra: 6.9, dec: -23 },
    stars: [
      { ra: 6.75, dec: -16.72, mag: -1.5 },  // 0 Sirius ★★
      { ra: 6.38, dec: -17.96, mag:  2.0 },  // 1 Mirzam
      { ra: 6.98, dec: -28.97, mag:  1.5 },  // 2 Adhara
      { ra: 7.14, dec: -26.39, mag:  1.8 },  // 3 Wezen
      { ra: 7.40, dec: -29.30, mag:  2.4 },  // 4 Aludra
    ],
    edges: [[0,1],[0,3],[3,2],[3,4]],
  },
  {
    id: 'per', name: 'PERSEUS', nameEs: 'Perseo', myth: 'El héroe que venció a Medusa',
    center: { ra: 3.4, dec: 45 },
    stars: [
      { ra: 3.40, dec: 49.86, mag: 1.8 },  // 0 Mirfak ★
      { ra: 3.14, dec: 40.96, mag: 2.1 },  // 1 Algol (estrella demonio)
      { ra: 3.90, dec: 31.88, mag: 2.8 },  // 2 Atik
      { ra: 3.97, dec: 35.79, mag: 4.0 },  // 3 Menkib
      { ra: 2.84, dec: 55.90, mag: 2.9 },  // 4 Miram
    ],
    edges: [[4,0],[0,1],[1,3],[3,2],[0,3]],
  },
  {
    id: 'peg', name: 'PEGASUS', nameEs: 'El Caballo Alado', myth: 'El corcel de Perseo surcando el otoño',
    center: { ra: 22.5, dec: 20 },
    stars: [
      { ra: 23.06, dec: 28.08, mag: 2.4 },  // 0 Scheat
      { ra: 23.08, dec: 15.21, mag: 2.5 },  // 1 Markab
      { ra:  0.14, dec: 29.09, mag: 2.1 },  // 2 Alpheratz
      { ra: 21.74, dec:  9.88, mag: 2.4 },  // 3 Enif ★
      { ra: 22.69, dec: 10.83, mag: 2.8 },  // 4 Matar
    ],
    edges: [[0,2],[2,1],[0,1],[1,3],[3,4]],
  },
  {
    id: 'sgr', name: 'SAGITTARIUS', nameEs: 'El Arquero', myth: 'Apuntando al corazón de la galaxia',
    center: { ra: 18.7, dec: -28 },
    stars: [
      { ra: 18.35, dec: -29.83, mag: 2.7 },  // 0 Kaus Media
      { ra: 18.40, dec: -34.38, mag: 1.8 },  // 1 Kaus Australis ★
      { ra: 18.47, dec: -25.42, mag: 2.8 },  // 2 Kaus Borealis
      { ra: 18.92, dec: -26.30, mag: 2.0 },  // 3 Nunki
      { ra: 19.04, dec: -29.88, mag: 2.6 },  // 4 Ascella
      { ra: 18.76, dec: -26.99, mag: 3.2 },  // 5 Phi
    ],
    edges: [[1,0],[0,2],[0,5],[5,3],[3,4],[4,0]],
  },
  {
    id: 'boo', name: 'BOÖTES', nameEs: 'El Boyero', myth: 'El pastor que guía las estrellas del norte',
    center: { ra: 14.7, dec: 30 },
    stars: [
      { ra: 14.26, dec: 19.19, mag: -0.1 },  // 0 Arcturus ★★ (más brillante N)
      { ra: 14.75, dec: 27.07, mag:  3.5 },  // 1 Izar
      { ra: 15.26, dec: 33.31, mag:  3.5 },  // 2 Muphrid
      { ra: 14.53, dec: 30.37, mag:  2.7 },  // 3 Seginus
      { ra: 13.91, dec: 18.40, mag:  3.6 },  // 4 Nekkar
    ],
    edges: [[0,1],[0,2],[1,3],[3,4],[4,0]],
  },
  {
    id: 'and', name: 'ANDROMEDA', nameEs: 'La Princesa', myth: 'La princesa encadenada, galaxia gemela',
    center: { ra: 1.0, dec: 38 },
    stars: [
      { ra: 0.14, dec: 29.09, mag: 2.1 },  // 0 Alpheratz
      { ra: 1.16, dec: 35.62, mag: 2.1 },  // 1 Mirach ★
      { ra: 2.07, dec: 42.33, mag: 2.1 },  // 2 Almach ★
      { ra: 0.83, dec: 30.86, mag: 3.3 },  // 3 Delta
    ],
    edges: [[0,3],[3,1],[1,2]],
  },
  {
    id: 'aur', name: 'AURIGA', nameEs: 'El Auriga', myth: 'El cochero con su cabra y cabrillas',
    center: { ra: 6.0, dec: 44 },
    stars: [
      { ra: 5.28, dec: 45.99, mag: 0.1 },  // 0 Capella ★
      { ra: 5.99, dec: 44.95, mag: 1.9 },  // 1 Menkalinan
      { ra: 5.03, dec: 43.82, mag: 2.7 },  // 2 Mahasim
      { ra: 4.95, dec: 33.17, mag: 3.0 },  // 3 Hassaleh
      { ra: 5.44, dec: 28.61, mag: 1.7 },  // 4 Elnath
    ],
    edges: [[0,1],[0,2],[2,3],[3,4],[4,1]],
  },
  {
    id: 'her', name: 'HERCULES', nameEs: 'Hércules', myth: 'El héroe de los doce trabajos',
    center: { ra: 17.0, dec: 28 },
    stars: [
      { ra: 17.24, dec: 14.39, mag: 2.8 },  // 0 Kornephoros
      { ra: 16.50, dec: 21.49, mag: 2.8 },  // 1 Zeta
      { ra: 16.69, dec: 31.60, mag: 3.1 },  // 2 Pi
      { ra: 17.39, dec: 37.15, mag: 3.8 },  // 3 Eta
      { ra: 17.94, dec: 36.81, mag: 3.5 },  // 4 Sarin
    ],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,0]],
  },
  {
    id: 'cen', name: 'CENTAURUS', nameEs: 'El Centauro', myth: 'Quirón, maestro de héroes, estrella más cercana',
    center: { ra: 13.5, dec: -48 },
    stars: [
      { ra: 14.66, dec: -60.83, mag: -0.1 },  // 0 Alpha Cen ★★ (sistema más cercano)
      { ra: 14.06, dec: -60.37, mag:  0.6 },  // 1 Hadar
      { ra: 11.35, dec: -54.49, mag:  2.1 },  // 2 Muhlifain
      { ra: 12.19, dec: -52.37, mag:  2.2 },  // 3 Menkent
      { ra: 13.66, dec: -53.47, mag:  2.4 },  // 4 Zeta Cen
    ],
    edges: [[0,1],[1,4],[4,2],[2,3]],
  },
  {
    id: 'psa', name: 'PISCIS AUSTRINUS', nameEs: 'El Pez Austral', myth: 'El pez que bebe del Aquario',
    center: { ra: 22.1, dec: -30 },
    stars: [
      { ra: 22.96, dec: -29.62, mag: 1.2 },  // 0 Fomalhaut ★ (ojo del pez)
      { ra: 22.68, dec: -32.53, mag: 4.2 },  // 1 Beta
      { ra: 22.14, dec: -32.99, mag: 4.5 },  // 2 Gamma
      { ra: 22.52, dec: -27.04, mag: 4.2 },  // 3 Delta
    ],
    edges: [[0,3],[0,1],[1,2]],
  },
]

// ── Astronomical calculations ────────────────────────────────────────────────────

function getLocalSiderealTime(date: Date, lngDeg: number): number {
  const JD   = date.getTime() / 86400000 + 2440587.5
  const D    = JD - 2451545.0
  const GMST = (18.697374558 + 24.06570982441908 * D) % 24
  return ((GMST + lngDeg / 15) % 24 + 24) % 24
}

function getAltAz(lat: number, lstH: number, ra: number, dec: number) {
  const HA   = ((lstH - ra) * 15 + 360) % 360
  const latR = lat * DEG
  const decR = dec * DEG
  const HAr  = HA  * DEG

  const sinAlt = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(HAr)
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG

  const cosAlt = Math.cos(altitude * DEG)
  const cosAz  = cosAlt > 0.001
    ? (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * cosAlt)
    : 0
  const sinAz  = cosAlt > 0.001
    ? -Math.cos(decR) * Math.sin(HAr) / cosAlt
    : 0
  const azimuth = (Math.atan2(sinAz, cosAz) / DEG + 360) % 360

  return { altitude, azimuth }
}

// ── Main export ──────────────────────────────────────────────────────────────────

export function getDominantConstellation(
  lat: number,
  lng: number,
  dateISO: string,
): ConstellationResult | null {
  const date = new Date(dateISO)
  const LST  = getLocalSiderealTime(date, lng)

  // Score each constellation: altitude + bonus for bright stars
  let best:      Constellation | null = null
  let bestScore  = -999

  for (const c of CONSTELLATIONS) {
    const { altitude } = getAltAz(lat, LST, c.center.ra, c.center.dec)
    if (altitude < 15) continue   // too close to horizon

    const brightBonus = c.stars.reduce((s, st) => s + Math.max(0, 3 - st.mag), 0)
    const score = altitude + brightBonus * 4

    if (score > bestScore) { bestScore = score; best = c }
  }

  if (!best) {
    // Fallback: pick the highest constellation even if below 15°
    for (const c of CONSTELLATIONS) {
      const { altitude } = getAltAz(lat, LST, c.center.ra, c.center.dec)
      const score = altitude
      if (score > bestScore) { bestScore = score; best = c }
    }
  }

  if (!best) return null

  // Calculate Alt/Az for each star of the winning constellation
  const altAzs = best.stars.map(s => getAltAz(lat, LST, s.ra, s.dec))

  // Weighted centroid (brighter stars weigh more)
  let wAlt = 0, wAz = 0, wSum = 0
  altAzs.forEach((aa, i) => {
    const w = Math.max(0.2, 4 - best!.stars[i].mag)
    wAlt += aa.altitude * w
    wAz  += aa.azimuth  * w
    wSum += w
  })
  const cAlt = wAlt / wSum
  const cAz  = wAz  / wSum

  // Tangent-plane projection relative to centroid
  const proj = altAzs.map(aa => ({
    x:  (aa.azimuth  - cAz)  * Math.cos(cAlt * DEG),
    y: -(aa.altitude - cAlt),   // flip: higher altitude = lower y
  }))

  // Normalize to 0.05–0.95 inside a unit box
  const xs = proj.map(p => p.x), ys = proj.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const span = Math.max(0.5, maxX - minX, maxY - minY)
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  const normalized = proj.map((p, i) => ({
    x:   0.5 + (p.x - midX) / span * 0.82,
    y:   0.5 + (p.y - midY) / span * 0.82,
    mag: best!.stars[i].mag,
  }))

  const { altitude } = getAltAz(lat, LST, best.center.ra, best.center.dec)
  return { constellation: best, altitude, stars: normalized }
}
