// Curated monument database — cityCode → monument info
// wikiTitle is the Wikipedia REST API page title used with:
// https://en.wikipedia.org/api/rest_v1/page/summary/{wikiTitle}
//
// Primary lookup: getMonumentByCity(cityName) — matches English city name
// Legacy lookup:  getMonument(cityCode)       — matches 3-4 letter code (MAD, NYC…)

// Landmark archetype 0-5 — matches uLandmarkType in domainWarp.glsl
//  0 = Columna / Obelisco   (single tall column, statue, pyramid, obelisk)
//  1 = Arco / Puerta        (ceremonial arch or gate)
//  2 = Torres múltiples     (cluster of towers/spires)
//  3 = Torre cónica / Aguja (single tapering tower or needle)
//  4 = Rascacielos          (modernist skyscraper block)
//  5 = Cúpula               (dome, basilica, circular or flat complex)

export interface MonumentEntry {
  city: string           // English city name (primary lookup key)
  name: string           // English monument name
  nameEs: string         // Spanish monument name / poetic description
  myth: string           // Short evocative myth/description
  wikiTitle: string      // Wikipedia page title (underscores for spaces)
  landmarkType: number   // 0-5 SDF archetype for the WebGL shader
}

const MONUMENTS: Record<string, MonumentEntry> = {
  MAD: {
    city: 'Madrid',
    name: 'Puerta de Alcalá',
    nameEs: 'La Puerta de Alcalá',
    myth: 'Arco de triunfo que vio nacer a Madrid moderno',
    wikiTitle: 'Puerta_de_Alcalá',
    landmarkType: 1, // Arco / Puerta
  },
  BCN: {
    city: 'Barcelona',
    name: 'Sagrada Família',
    nameEs: 'La Sagrada Familia',
    myth: 'Catedral que crece con la ciudad, nunca terminada',
    wikiTitle: 'Sagrada_Família',
    landmarkType: 2, // Torres múltiples
  },
  CDMX: {
    city: 'Ciudad de Mexico',
    name: 'Angel of Independence',
    nameEs: 'El Ángel de la Independencia',
    myth: 'Columna de victoria que corona el Paseo de la Reforma',
    wikiTitle: 'Angel_of_Independence',
    landmarkType: 0, // Columna / Obelisco
  },
  NYC: {
    city: 'New York City',
    name: 'Statue of Liberty',
    nameEs: 'La Estatua de la Libertad',
    myth: 'Faro de cobre verde que guía a los que llegan al nuevo mundo',
    wikiTitle: 'Statue_of_Liberty',
    landmarkType: 4, // Rascacielos (NYC iconic skyline)
  },
  PAR: {
    city: 'Paris',
    name: 'Eiffel Tower',
    nameEs: 'La Torre Eiffel',
    myth: 'Hierro forjado que conquistó el cielo parisino',
    wikiTitle: 'Eiffel_Tower',
    landmarkType: 3, // Torre cónica / Aguja
  },
  LON: {
    city: 'London',
    name: 'Big Ben',
    nameEs: 'El Big Ben',
    myth: 'Campanario que marca el tiempo del Imperio',
    wikiTitle: 'Big_Ben',
    landmarkType: 3, // Torre cónica / Aguja (gothic clock tower)
  },
  ROM: {
    city: 'Rome',
    name: 'Colosseum',
    nameEs: 'El Coliseo Romano',
    myth: 'Anfiteatro eterno donde rugió la gloria de Roma',
    wikiTitle: 'Colosseum',
    landmarkType: 5, // Cúpula (circular elliptical structure)
  },
  BER: {
    city: 'Berlin',
    name: 'Brandenburg Gate',
    nameEs: 'La Puerta de Brandeburgo',
    myth: 'Portal neoclásico que unió dos mundos separados',
    wikiTitle: 'Brandenburg_Gate',
    landmarkType: 1, // Arco / Puerta
  },
  TOK: {
    city: 'Tokyo',
    name: 'Tokyo Tower',
    nameEs: 'La Torre de Tokio',
    myth: 'Acero naranja que brilla sobre la megalópolis',
    wikiTitle: 'Tokyo_Tower',
    landmarkType: 3, // Torre cónica / Aguja
  },
  SYD: {
    city: 'Sydney',
    name: 'Sydney Opera House',
    nameEs: 'La Ópera de Sídney',
    myth: 'Conchas de vela blanca sobre las aguas del puerto',
    wikiTitle: 'Sydney_Opera_House',
    landmarkType: 5, // Cúpula (shell/sail forms)
  },
  DXB: {
    city: 'Dubai',
    name: 'Burj Khalifa',
    nameEs: 'El Burj Khalifa',
    myth: 'Aguja de cristal que rasga las nubes del desierto',
    wikiTitle: 'Burj_Khalifa',
    landmarkType: 4, // Rascacielos (world's tallest)
  },
  RIO: {
    city: 'Rio de Janeiro',
    name: 'Christ the Redeemer',
    nameEs: 'El Cristo Redentor',
    myth: 'Brazos abiertos sobre la ciudad del carnaval eterno',
    wikiTitle: 'Christ_the_Redeemer_(statue)',
    landmarkType: 0, // Columna / Obelisco (statue on pedestal)
  },
  AMS: {
    city: 'Amsterdam',
    name: 'Rijksmuseum',
    nameEs: 'El Rijksmuseum',
    myth: 'Palacio del arte que guarda los maestros flamencos',
    wikiTitle: 'Rijksmuseum',
    landmarkType: 5, // Cúpula (large neogothic museum complex)
  },
  IST: {
    city: 'Istanbul',
    name: 'Hagia Sophia',
    nameEs: 'Santa Sofía',
    myth: 'Cúpula que flotó entre el cielo y dos imperios',
    wikiTitle: 'Hagia_Sophia',
    landmarkType: 5, // Cúpula
  },
  ATH: {
    city: 'Athens',
    name: 'Parthenon',
    nameEs: 'El Partenón',
    myth: 'Templo de mármol blanco donde nació la democracia',
    wikiTitle: 'Parthenon',
    landmarkType: 5, // Cúpula (classical colonnaded temple)
  },
  CAI: {
    city: 'Cairo',
    name: 'Great Pyramid of Giza',
    nameEs: 'La Gran Pirámide de Giza',
    myth: 'Tumba de piedra que desafía cuatro mil años de olvido',
    wikiTitle: 'Great_Pyramid_of_Giza',
    landmarkType: 0, // Columna / Obelisco (pyramid = single monolith)
  },
  LIS: {
    city: 'Lisbon',
    name: 'Tower of Belém',
    nameEs: 'Torre de Belém',
    myth: 'Centinela manueline desde donde partieron los navegantes',
    wikiTitle: 'Tower_of_Belém',
    landmarkType: 3, // Torre cónica / Aguja
  },
  VIE: {
    city: 'Vienna',
    name: "St. Stephen's Cathedral",
    nameEs: 'La Catedral de San Esteban',
    myth: 'Aguja gótica que orienta a los vieneses desde el medievo',
    wikiTitle: "St._Stephen's_Cathedral,_Vienna",
    landmarkType: 3, // Torre cónica / Aguja (gothic spire)
  },
  PRG: {
    city: 'Prague',
    name: 'Prague Castle',
    nameEs: 'El Castillo de Praga',
    myth: 'Fortaleza sobre el Vltava, corazón de Bohemia',
    wikiTitle: 'Prague_Castle',
    landmarkType: 2, // Torres múltiples (castle with multiple towers)
  },
  BOG: {
    city: 'Bogota',
    name: 'Monserrate',
    nameEs: 'El Cerro de Monserrate',
    myth: 'Santuario blanco que vigila la sabana a 3000 metros',
    wikiTitle: 'Monserrate_(Bogotá)',
    landmarkType: 5, // Cúpula (church on hilltop)
  },
  BUE: {
    city: 'Buenos Aires',
    name: 'Obelisco de Buenos Aires',
    nameEs: 'El Obelisco',
    myth: 'Aguja de hormigón en el corazón del tango porteño',
    wikiTitle: 'Obelisco_de_Buenos_Aires',
    landmarkType: 0, // Columna / Obelisco
  },
  MEX: {
    city: 'Mexico City',
    name: 'Palacio de Bellas Artes',
    nameEs: 'El Palacio de Bellas Artes',
    myth: 'Cúpula art déco sobre el zócalo de la cultura mexicana',
    wikiTitle: 'Palacio_de_Bellas_Artes',
    landmarkType: 5, // Cúpula
  },
  SEV: {
    city: 'Seville',
    name: 'Giralda',
    nameEs: 'La Giralda',
    myth: 'Minarete almohade coronado por la fe de dos mundos',
    wikiTitle: 'Giralda',
    landmarkType: 3, // Torre cónica / Aguja (minaret/tower)
  },
  SGP: {
    city: 'Singapore',
    name: 'Marina Bay Sands',
    nameEs: 'Marina Bay Sands',
    myth: 'Tres torres coronadas por el barco del futuro asiático',
    wikiTitle: 'Marina_Bay_Sands',
    landmarkType: 2, // Torres múltiples (3 towers)
  },
  BKK: {
    city: 'Bangkok',
    name: 'Wat Phra Kaew',
    nameEs: 'El Templo del Buda Esmeralda',
    myth: 'Templo de tejados dorados que custodia la esmeralda sagrada',
    wikiTitle: 'Wat_Phra_Kaew',
    landmarkType: 2, // Torres múltiples (layered temple spires)
  },
  MOS: {
    city: 'Moscow',
    name: "Saint Basil's Cathedral",
    nameEs: 'La Catedral de San Basilio',
    myth: 'Cúpulas de colores que florecen sobre la Plaza Roja',
    wikiTitle: "Saint_Basil's_Cathedral",
    landmarkType: 2, // Torres múltiples (cluster of colorful onion domes)
  },
  BEI: {
    city: 'Beijing',
    name: 'Forbidden City',
    nameEs: 'La Ciudad Prohibida',
    myth: 'Palacio de mil salas donde vivió el Hijo del Cielo',
    wikiTitle: 'Forbidden_City',
    landmarkType: 5, // Cúpula (vast imperial palace complex)
  },
  DEL: {
    city: 'Delhi',
    name: 'India Gate',
    nameEs: 'La Puerta de la India',
    myth: 'Arco de arenisca en memoria de los soldados caídos',
    wikiTitle: 'India_Gate',
    landmarkType: 1, // Arco / Puerta
  },
}

// ─── Extra city-name aliases (common English names that differ from the entry) ──
const CITY_ALIASES: Record<string, string> = {
  'new york':       'NYC',
  'new york city':  'NYC',
  'ciudad de mexico': 'CDMX',
  'mexico city':    'MEX',
  'new delhi':      'DEL',
  'rio':            'RIO',
  'bogotá':         'BOG',
  'séville':        'SEV',
  'athènes':        'ATH',
  'lisbonne':       'LIS',
  'praga':          'PRG',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .trim()
}

// Build reverse city-name → code map from entries
const CITY_TO_CODE: Record<string, string> = {}
for (const [code, entry] of Object.entries(MONUMENTS)) {
  CITY_TO_CODE[normalize(entry.city)] = code
}
// Merge aliases
for (const [alias, code] of Object.entries(CITY_ALIASES)) {
  CITY_TO_CODE[normalize(alias)] = code
}

/** Look up monument by cityCode (3-4 letter code, e.g. "MAD"). */
export function getMonument(cityCode: string): MonumentEntry | null {
  return MONUMENTS[cityCode.toUpperCase()] ?? null
}

/**
 * Resolve landmark SDF archetype (0-5) for a city code.
 * Falls back to a deterministic value derived from the seed if city is unknown.
 */
export function getLandmarkType(cityCode: string | undefined, seedFallback = 0): number {
  if (cityCode) {
    const entry = MONUMENTS[cityCode.toUpperCase()]
    if (entry) return entry.landmarkType
  }
  // Unknown city — deterministic 0-5 from seed (seedFallback is 0..1)
  return Math.floor((seedFallback % 1) * 6) % 6
}

/** Look up monument by full English city name (case-insensitive, diacritic-tolerant). */
export function getMonumentByCity(cityName: string): MonumentEntry | null {
  const key = normalize(cityName)
  // Direct match
  if (CITY_TO_CODE[key]) return MONUMENTS[CITY_TO_CODE[key]] ?? null
  // Prefix / partial match
  for (const [mapped, code] of Object.entries(CITY_TO_CODE)) {
    if (mapped.startsWith(key) || key.startsWith(mapped)) {
      return MONUMENTS[code] ?? null
    }
  }
  return null
}

export default MONUMENTS
