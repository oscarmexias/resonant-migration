// Curated monument database — cityCode → monument info
// wikiTitle is the Wikipedia REST API page title used with:
// https://en.wikipedia.org/api/rest_v1/page/summary/{wikiTitle}
//
// Primary lookup: getMonumentByCity(cityName) — matches English city name
// Legacy lookup:  getMonument(cityCode)       — matches 3-4 letter code (MAD, NYC…)

export interface MonumentEntry {
  city: string       // English city name (primary lookup key)
  name: string       // English monument name
  nameEs: string     // Spanish monument name / poetic description
  myth: string       // Short evocative myth/description
  wikiTitle: string  // Wikipedia page title (underscores for spaces)
}

const MONUMENTS: Record<string, MonumentEntry> = {
  MAD: {
    city: 'Madrid',
    name: 'Puerta de Alcalá',
    nameEs: 'La Puerta de Alcalá',
    myth: 'Arco de triunfo que vio nacer a Madrid moderno',
    wikiTitle: 'Puerta_de_Alcalá',
  },
  BCN: {
    city: 'Barcelona',
    name: 'Sagrada Família',
    nameEs: 'La Sagrada Familia',
    myth: 'Catedral que crece con la ciudad, nunca terminada',
    wikiTitle: 'Sagrada_Família',
  },
  CDMX: {
    city: 'Ciudad de Mexico',
    name: 'Angel of Independence',
    nameEs: 'El Ángel de la Independencia',
    myth: 'Columna de victoria que corona el Paseo de la Reforma',
    wikiTitle: 'Angel_of_Independence',
  },
  NYC: {
    city: 'New York City',
    name: 'Statue of Liberty',
    nameEs: 'La Estatua de la Libertad',
    myth: 'Faro de cobre verde que guía a los que llegan al nuevo mundo',
    wikiTitle: 'Statue_of_Liberty',
  },
  PAR: {
    city: 'Paris',
    name: 'Eiffel Tower',
    nameEs: 'La Torre Eiffel',
    myth: 'Hierro forjado que conquistó el cielo parisino',
    wikiTitle: 'Eiffel_Tower',
  },
  LON: {
    city: 'London',
    name: 'Big Ben',
    nameEs: 'El Big Ben',
    myth: 'Campanario que marca el tiempo del Imperio',
    wikiTitle: 'Big_Ben',
  },
  ROM: {
    city: 'Rome',
    name: 'Colosseum',
    nameEs: 'El Coliseo Romano',
    myth: 'Anfiteatro eterno donde rugió la gloria de Roma',
    wikiTitle: 'Colosseum',
  },
  BER: {
    city: 'Berlin',
    name: 'Brandenburg Gate',
    nameEs: 'La Puerta de Brandeburgo',
    myth: 'Portal neoclásico que unió dos mundos separados',
    wikiTitle: 'Brandenburg_Gate',
  },
  TOK: {
    city: 'Tokyo',
    name: 'Tokyo Tower',
    nameEs: 'La Torre de Tokio',
    myth: 'Acero naranja que brilla sobre la megalópolis',
    wikiTitle: 'Tokyo_Tower',
  },
  SYD: {
    city: 'Sydney',
    name: 'Sydney Opera House',
    nameEs: 'La Ópera de Sídney',
    myth: 'Conchas de vela blanca sobre las aguas del puerto',
    wikiTitle: 'Sydney_Opera_House',
  },
  DXB: {
    city: 'Dubai',
    name: 'Burj Khalifa',
    nameEs: 'El Burj Khalifa',
    myth: 'Aguja de cristal que rasga las nubes del desierto',
    wikiTitle: 'Burj_Khalifa',
  },
  RIO: {
    city: 'Rio de Janeiro',
    name: 'Christ the Redeemer',
    nameEs: 'El Cristo Redentor',
    myth: 'Brazos abiertos sobre la ciudad del carnaval eterno',
    wikiTitle: 'Christ_the_Redeemer_(statue)',
  },
  AMS: {
    city: 'Amsterdam',
    name: 'Rijksmuseum',
    nameEs: 'El Rijksmuseum',
    myth: 'Palacio del arte que guarda los maestros flamencos',
    wikiTitle: 'Rijksmuseum',
  },
  IST: {
    city: 'Istanbul',
    name: 'Hagia Sophia',
    nameEs: 'Santa Sofía',
    myth: 'Cúpula que flotó entre el cielo y dos imperios',
    wikiTitle: 'Hagia_Sophia',
  },
  ATH: {
    city: 'Athens',
    name: 'Parthenon',
    nameEs: 'El Partenón',
    myth: 'Templo de mármol blanco donde nació la democracia',
    wikiTitle: 'Parthenon',
  },
  CAI: {
    city: 'Cairo',
    name: 'Great Pyramid of Giza',
    nameEs: 'La Gran Pirámide de Giza',
    myth: 'Tumba de piedra que desafía cuatro mil años de olvido',
    wikiTitle: 'Great_Pyramid_of_Giza',
  },
  LIS: {
    city: 'Lisbon',
    name: 'Tower of Belém',
    nameEs: 'Torre de Belém',
    myth: 'Centinela manueline desde donde partieron los navegantes',
    wikiTitle: 'Tower_of_Belém',
  },
  VIE: {
    city: 'Vienna',
    name: "St. Stephen's Cathedral",
    nameEs: 'La Catedral de San Esteban',
    myth: 'Aguja gótica que orienta a los vieneses desde el medievo',
    wikiTitle: "St._Stephen's_Cathedral,_Vienna",
  },
  PRG: {
    city: 'Prague',
    name: 'Prague Castle',
    nameEs: 'El Castillo de Praga',
    myth: 'Fortaleza sobre el Vltava, corazón de Bohemia',
    wikiTitle: 'Prague_Castle',
  },
  BOG: {
    city: 'Bogota',
    name: 'Monserrate',
    nameEs: 'El Cerro de Monserrate',
    myth: 'Santuario blanco que vigila la sabana a 3000 metros',
    wikiTitle: 'Monserrate_(Bogotá)',
  },
  BUE: {
    city: 'Buenos Aires',
    name: 'Obelisco de Buenos Aires',
    nameEs: 'El Obelisco',
    myth: 'Aguja de hormigón en el corazón del tango porteño',
    wikiTitle: 'Obelisco_de_Buenos_Aires',
  },
  MEX: {
    city: 'Mexico City',
    name: 'Palacio de Bellas Artes',
    nameEs: 'El Palacio de Bellas Artes',
    myth: 'Cúpula art déco sobre el zócalo de la cultura mexicana',
    wikiTitle: 'Palacio_de_Bellas_Artes',
  },
  SEV: {
    city: 'Seville',
    name: 'Giralda',
    nameEs: 'La Giralda',
    myth: 'Minarete almohade coronado por la fe de dos mundos',
    wikiTitle: 'Giralda',
  },
  SGP: {
    city: 'Singapore',
    name: 'Marina Bay Sands',
    nameEs: 'Marina Bay Sands',
    myth: 'Tres torres coronadas por el barco del futuro asiático',
    wikiTitle: 'Marina_Bay_Sands',
  },
  BKK: {
    city: 'Bangkok',
    name: 'Wat Phra Kaew',
    nameEs: 'El Templo del Buda Esmeralda',
    myth: 'Templo de tejados dorados que custodia la esmeralda sagrada',
    wikiTitle: 'Wat_Phra_Kaew',
  },
  MOS: {
    city: 'Moscow',
    name: "Saint Basil's Cathedral",
    nameEs: 'La Catedral de San Basilio',
    myth: 'Cúpulas de colores que florecen sobre la Plaza Roja',
    wikiTitle: "Saint_Basil's_Cathedral",
  },
  BEI: {
    city: 'Beijing',
    name: 'Forbidden City',
    nameEs: 'La Ciudad Prohibida',
    myth: 'Palacio de mil salas donde vivió el Hijo del Cielo',
    wikiTitle: 'Forbidden_City',
  },
  DEL: {
    city: 'Delhi',
    name: 'India Gate',
    nameEs: 'La Puerta de la India',
    myth: 'Arco de arenisca en memoria de los soldados caídos',
    wikiTitle: 'India_Gate',
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
