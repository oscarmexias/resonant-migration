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
  // ── Europe ────────────────────────────────────────────────────────────────
  MAD: {
    city: 'Madrid',
    name: 'Puerta de Alcalá',
    nameEs: 'La Puerta de Alcalá',
    myth: 'Arco de triunfo que vio nacer a Madrid moderno',
    wikiTitle: 'Puerta_de_Alcalá',
    landmarkType: 1,
  },
  BCN: {
    city: 'Barcelona',
    name: 'Sagrada Família',
    nameEs: 'La Sagrada Familia',
    myth: 'Catedral que crece con la ciudad, nunca terminada',
    wikiTitle: 'Sagrada_Família',
    landmarkType: 2,
  },
  SEV: {
    city: 'Seville',
    name: 'Giralda',
    nameEs: 'La Giralda',
    myth: 'Minarete almohade coronado por la fe de dos mundos',
    wikiTitle: 'Giralda',
    landmarkType: 3,
  },
  BIL: {
    city: 'Bilbao',
    name: 'Guggenheim Museum Bilbao',
    nameEs: 'El Guggenheim de Bilbao',
    myth: 'Titanio plateado que revivió una ciudad industrial',
    wikiTitle: 'Guggenheim_Museum_Bilbao',
    landmarkType: 5,
  },
  PAR: {
    city: 'Paris',
    name: 'Eiffel Tower',
    nameEs: 'La Torre Eiffel',
    myth: 'Hierro forjado que conquistó el cielo parisino',
    wikiTitle: 'Eiffel_Tower',
    landmarkType: 3,
  },
  LON: {
    city: 'London',
    name: 'Big Ben',
    nameEs: 'El Big Ben',
    myth: 'Campanario que marca el tiempo del Imperio',
    wikiTitle: 'Big_Ben',
    landmarkType: 3,
  },
  DUB: {
    city: 'Dublin',
    name: 'Trinity College Dublin',
    nameEs: 'El Trinity College de Dublín',
    myth: 'Biblioteca medieval que custodia el Libro de Kells',
    wikiTitle: 'Trinity_College_Dublin',
    landmarkType: 5,
  },
  EDI: {
    city: 'Edinburgh',
    name: 'Edinburgh Castle',
    nameEs: 'El Castillo de Edimburgo',
    myth: 'Fortaleza de basalto volcánico que domina la ciudad escocesa',
    wikiTitle: 'Edinburgh_Castle',
    landmarkType: 2,
  },
  AMS: {
    city: 'Amsterdam',
    name: 'Rijksmuseum',
    nameEs: 'El Rijksmuseum',
    myth: 'Palacio del arte que guarda los maestros flamencos',
    wikiTitle: 'Rijksmuseum',
    landmarkType: 5,
  },
  BRU: {
    city: 'Brussels',
    name: 'Atomium',
    nameEs: 'El Atomium',
    myth: 'Molécula de hierro gigante, reliquia del futuro del siglo XX',
    wikiTitle: 'Atomium',
    landmarkType: 2,
  },
  BER: {
    city: 'Berlin',
    name: 'Brandenburg Gate',
    nameEs: 'La Puerta de Brandeburgo',
    myth: 'Portal neoclásico que unió dos mundos separados',
    wikiTitle: 'Brandenburg_Gate',
    landmarkType: 1,
  },
  HAM: {
    city: 'Hamburg',
    name: 'Elbphilharmonie',
    nameEs: 'La Elbphilharmonie',
    myth: 'Cristal ondulante sobre el Elba, ola que toca el cielo',
    wikiTitle: 'Elbphilharmonie',
    landmarkType: 4,
  },
  MUN: {
    city: 'Munich',
    name: 'Neues Rathaus',
    nameEs: 'El Nuevo Ayuntamiento de Múnich',
    myth: 'Carillón gótico que da la hora con figuras danzantes',
    wikiTitle: 'Neues_Rathaus,_Munich',
    landmarkType: 2,
  },
  COL: {
    city: 'Cologne',
    name: 'Cologne Cathedral',
    nameEs: 'La Catedral de Colonia',
    myth: 'Dos agujas de piedra que tardaron 600 años en terminarse',
    wikiTitle: 'Cologne_Cathedral',
    landmarkType: 2,
  },
  ROM: {
    city: 'Rome',
    name: 'Colosseum',
    nameEs: 'El Coliseo Romano',
    myth: 'Anfiteatro eterno donde rugió la gloria de Roma',
    wikiTitle: 'Colosseum',
    landmarkType: 5,
  },
  FLO: {
    city: 'Florence',
    name: 'Florence Cathedral',
    nameEs: 'El Duomo de Florencia',
    myth: 'Cúpula de Brunelleschi que desafió la física del Renacimiento',
    wikiTitle: 'Florence_Cathedral',
    landmarkType: 5,
  },
  VEN: {
    city: 'Venice',
    name: "St Mark's Basilica",
    nameEs: 'La Basílica de San Marcos',
    myth: 'Cúpulas doradas que brillan sobre la laguna eterna',
    wikiTitle: "St_Mark's_Basilica",
    landmarkType: 5,
  },
  NAP: {
    city: 'Naples',
    name: "Castel dell'Ovo",
    nameEs: "El Castillo del Huevo",
    myth: 'Fortaleza sobre el mar donde Virgilio enterró un huevo mágico',
    wikiTitle: "Castel_dell'Ovo",
    landmarkType: 5,
  },
  VIE: {
    city: 'Vienna',
    name: "St. Stephen's Cathedral",
    nameEs: 'La Catedral de San Esteban',
    myth: 'Aguja gótica que orienta a los vieneses desde el medievo',
    wikiTitle: "St._Stephen's_Cathedral,_Vienna",
    landmarkType: 3,
  },
  ZUR: {
    city: 'Zurich',
    name: 'Grossmünster',
    nameEs: 'El Grossmünster de Zúrich',
    myth: 'Torres románicas gemelas sobre el Limmat, símbolo de la Reforma',
    wikiTitle: 'Grossmünster',
    landmarkType: 2,
  },
  PRG: {
    city: 'Prague',
    name: 'Prague Castle',
    nameEs: 'El Castillo de Praga',
    myth: 'Fortaleza sobre el Vltava, corazón de Bohemia',
    wikiTitle: 'Prague_Castle',
    landmarkType: 2,
  },
  KRA: {
    city: 'Kraków',
    name: 'Wawel Castle',
    nameEs: 'El Castillo de Wawel',
    myth: 'Fortaleza real sobre el Vístula donde duermen los reyes polacos',
    wikiTitle: 'Wawel_Castle',
    landmarkType: 2,
  },
  WAR: {
    city: 'Warsaw',
    name: 'Palace of Culture and Science',
    nameEs: 'El Palacio de la Cultura y la Ciencia',
    myth: 'Rascacielos estalinista regalado que define el skyline de Varsovia',
    wikiTitle: 'Palace_of_Culture_and_Science',
    landmarkType: 4,
  },
  BUD: {
    city: 'Budapest',
    name: 'Hungarian Parliament Building',
    nameEs: 'El Parlamento Húngaro',
    myth: 'Cúpula neogótica que se refleja en el Danubio al anochecer',
    wikiTitle: 'Hungarian_Parliament_Building',
    landmarkType: 5,
  },
  DUB2: {
    city: 'Dubrovnik',
    name: 'Old City of Dubrovnik',
    nameEs: 'La Ciudad Vieja de Dubrovnik',
    myth: 'Murallas medievales sobre el Adriático azul cobalto',
    wikiTitle: 'Old_City_of_Dubrovnik',
    landmarkType: 5,
  },
  CPH: {
    city: 'Copenhagen',
    name: 'The Little Mermaid',
    nameEs: 'La Sirenita',
    myth: 'Estatua de bronce que sueña mirando el estrecho de Øresund',
    wikiTitle: 'The_Little_Mermaid_(statue)',
    landmarkType: 0,
  },
  STO: {
    city: 'Stockholm',
    name: 'Gamla Stan',
    nameEs: 'La Ciudad Vieja de Estocolmo',
    myth: 'Isla medieval de colores ocre entre el lago Mälaren y el Báltico',
    wikiTitle: 'Gamla_stan',
    landmarkType: 5,
  },
  HEL: {
    city: 'Helsinki',
    name: 'Helsinki Cathedral',
    nameEs: 'La Catedral de Helsinki',
    myth: 'Cúpula blanca neoclásica que domina la Plaza del Senado',
    wikiTitle: 'Helsinki_Cathedral',
    landmarkType: 5,
  },
  OSL: {
    city: 'Oslo',
    name: 'Oslo City Hall',
    nameEs: 'El Ayuntamiento de Oslo',
    myth: 'Dos torres de ladrillo donde se entrega el Nobel de la Paz',
    wikiTitle: 'Oslo_City_Hall',
    landmarkType: 2,
  },
  REY: {
    city: 'Reykjavik',
    name: 'Hallgrímskirkja',
    nameEs: 'La Iglesia Hallgrímskirkja',
    myth: 'Columna de basalto volcánico que imita las cascadas de lava solidificada',
    wikiTitle: 'Hallgrímskirkja',
    landmarkType: 3,
  },
  LIS: {
    city: 'Lisbon',
    name: 'Tower of Belém',
    nameEs: 'Torre de Belém',
    myth: 'Centinela manueline desde donde partieron los navegantes',
    wikiTitle: 'Tower_of_Belém',
    landmarkType: 3,
  },
  POR: {
    city: 'Porto',
    name: 'Torre dos Clérigos',
    nameEs: 'La Torre de los Clérigos',
    myth: 'Campanario barroco que orienta a marineros desde el siglo XVIII',
    wikiTitle: 'Torre_dos_Clérigos',
    landmarkType: 3,
  },
  ATH: {
    city: 'Athens',
    name: 'Parthenon',
    nameEs: 'El Partenón',
    myth: 'Templo de mármol blanco donde nació la democracia',
    wikiTitle: 'Parthenon',
    landmarkType: 5,
  },
  IST: {
    city: 'Istanbul',
    name: 'Hagia Sophia',
    nameEs: 'Santa Sofía',
    myth: 'Cúpula que flotó entre el cielo y dos imperios',
    wikiTitle: 'Hagia_Sophia',
    landmarkType: 5,
  },
  TBI: {
    city: 'Tbilisi',
    name: 'Narikala',
    nameEs: 'La Fortaleza de Narikala',
    myth: 'Ruinas de ciudadela que vigilan el Cáucaso desde el siglo IV',
    wikiTitle: 'Narikala',
    landmarkType: 2,
  },
  BAK: {
    city: 'Baku',
    name: 'Flame Towers',
    nameEs: 'Las Torres de Fuego',
    myth: 'Tres llamas de cristal que arden sobre el Mar Caspio',
    wikiTitle: 'Flame_Towers',
    landmarkType: 2,
  },
  ALM: {
    city: 'Almaty',
    name: 'Zenkov Cathedral',
    nameEs: 'La Catedral Zenkov',
    myth: 'Iglesia ortodoxa de madera sin clavos que sobrevivió terremotos',
    wikiTitle: 'Zenkov_Cathedral',
    landmarkType: 5,
  },
  MOS: {
    city: 'Moscow',
    name: "Saint Basil's Cathedral",
    nameEs: 'La Catedral de San Basilio',
    myth: 'Cúpulas de colores que florecen sobre la Plaza Roja',
    wikiTitle: "Saint_Basil's_Cathedral",
    landmarkType: 2,
  },

  // ── Americas ──────────────────────────────────────────────────────────────
  NYC: {
    city: 'New York City',
    name: 'Statue of Liberty',
    nameEs: 'La Estatua de la Libertad',
    myth: 'Faro de cobre verde que guía a los que llegan al nuevo mundo',
    wikiTitle: 'Statue_of_Liberty',
    landmarkType: 4,
  },
  CHI: {
    city: 'Chicago',
    name: 'Cloud Gate',
    nameEs: 'La Puerta de las Nubes',
    myth: 'Espejo de acero que refleja el skyline y el cielo de Chicago',
    wikiTitle: 'Cloud_Gate',
    landmarkType: 5,
  },
  SEA: {
    city: 'Seattle',
    name: 'Space Needle',
    nameEs: 'La Aguja Espacial',
    myth: 'Torre futurista del World Fair 1962 que vigila el Puget Sound',
    wikiTitle: 'Space_Needle',
    landmarkType: 3,
  },
  SFO: {
    city: 'San Francisco',
    name: 'Golden Gate Bridge',
    nameEs: 'El Puente Golden Gate',
    myth: 'Arco naranja sobre la niebla que conecta dos mundos',
    wikiTitle: 'Golden_Gate_Bridge',
    landmarkType: 1,
  },
  LAX: {
    city: 'Los Angeles',
    name: 'Griffith Observatory',
    nameEs: 'El Observatorio Griffith',
    myth: 'Cúpulas blancas sobre Hollywood donde James Dean buscó las estrellas',
    wikiTitle: 'Griffith_Observatory',
    landmarkType: 5,
  },
  WDC: {
    city: 'Washington',
    name: 'Washington Monument',
    nameEs: 'El Monumento a Washington',
    myth: 'Obelisco de mármol más alto del mundo, eje del poder americano',
    wikiTitle: 'Washington_Monument',
    landmarkType: 0,
  },
  TOR: {
    city: 'Toronto',
    name: 'CN Tower',
    nameEs: 'La Torre CN',
    myth: 'Aguja de hormigón que fue la más alta del mundo por 31 años',
    wikiTitle: 'CN_Tower',
    landmarkType: 3,
  },
  HAV: {
    city: 'Havana',
    name: 'El Capitolio',
    nameEs: 'El Capitolio de La Habana',
    myth: 'Cúpula neoclásica que corona la ciudad más bella del Caribe',
    wikiTitle: 'El_Capitolio',
    landmarkType: 5,
  },
  BOG: {
    city: 'Bogota',
    name: 'Monserrate',
    nameEs: 'El Cerro de Monserrate',
    myth: 'Santuario blanco que vigila la sabana a 3000 metros',
    wikiTitle: 'Monserrate_(Bogotá)',
    landmarkType: 5,
  },
  LIM: {
    city: 'Lima',
    name: 'Plaza Mayor de Lima',
    nameEs: 'La Plaza Mayor de Lima',
    myth: 'Corazón virreinal donde Francisco Pizarro trazó la ciudad de los reyes',
    wikiTitle: 'Plaza_Mayor_de_Lima',
    landmarkType: 5,
  },
  SCL: {
    city: 'Santiago',
    name: 'Gran Torre Santiago',
    nameEs: 'La Gran Torre Santiago',
    myth: 'Rascacielos más alto de Latinoamérica entre los Andes y el océano',
    wikiTitle: 'Gran_Torre_Santiago',
    landmarkType: 4,
  },
  BUE: {
    city: 'Buenos Aires',
    name: 'Obelisco de Buenos Aires',
    nameEs: 'El Obelisco',
    myth: 'Aguja de hormigón en el corazón del tango porteño',
    wikiTitle: 'Obelisco_de_Buenos_Aires',
    landmarkType: 0,
  },
  RIO: {
    city: 'Rio de Janeiro',
    name: 'Christ the Redeemer',
    nameEs: 'El Cristo Redentor',
    myth: 'Brazos abiertos sobre la ciudad del carnaval eterno',
    wikiTitle: 'Christ_the_Redeemer_(statue)',
    landmarkType: 0,
  },
  SAO: {
    city: 'São Paulo',
    name: 'Metropolitan Cathedral of São Paulo',
    nameEs: 'La Catedral Metropolitana de São Paulo',
    myth: 'Cúpula neogótica en el corazón de la mayor ciudad de América',
    wikiTitle: 'Metropolitan_Cathedral_of_São_Paulo',
    landmarkType: 5,
  },
  CDMX: {
    city: 'Ciudad de Mexico',
    name: 'Angel of Independence',
    nameEs: 'El Ángel de la Independencia',
    myth: 'Columna de victoria que corona el Paseo de la Reforma',
    wikiTitle: 'Angel_of_Independence',
    landmarkType: 0,
  },
  MEX: {
    city: 'Mexico City',
    name: 'Palacio de Bellas Artes',
    nameEs: 'El Palacio de Bellas Artes',
    myth: 'Cúpula art déco sobre el zócalo de la cultura mexicana',
    wikiTitle: 'Palacio_de_Bellas_Artes',
    landmarkType: 5,
  },

  // ── Africa & Middle East ──────────────────────────────────────────────────
  CAI: {
    city: 'Cairo',
    name: 'Great Pyramid of Giza',
    nameEs: 'La Gran Pirámide de Giza',
    myth: 'Tumba de piedra que desafía cuatro mil años de olvido',
    wikiTitle: 'Great_Pyramid_of_Giza',
    landmarkType: 0,
  },
  MAR: {
    city: 'Marrakech',
    name: 'Koutoubia Mosque',
    nameEs: 'La Mezquita Koutoubia',
    myth: 'Minarete almorávide que guió caravanas a través del Sahara',
    wikiTitle: 'Koutoubia_Mosque',
    landmarkType: 3,
  },
  CAS: {
    city: 'Casablanca',
    name: 'Hassan II Mosque',
    nameEs: 'La Mezquita Hassan II',
    myth: 'Minarete más alto del mundo sobre el Atlántico marroquí',
    wikiTitle: 'Hassan_II_Mosque',
    landmarkType: 3,
  },
  CPT: {
    city: 'Cape Town',
    name: 'Table Mountain',
    nameEs: 'La Montaña de la Mesa',
    myth: 'Meseta de granito donde el mantel de nubes cae al océano',
    wikiTitle: 'Table_Mountain',
    landmarkType: 5,
  },
  NAI: {
    city: 'Nairobi',
    name: 'Nairobi National Park',
    nameEs: 'El Parque Nacional de Nairobi',
    myth: 'Savana única en el mundo con rascacielos al fondo del horizonte',
    wikiTitle: 'Nairobi_National_Park',
    landmarkType: 5,
  },
  DXB: {
    city: 'Dubai',
    name: 'Burj Khalifa',
    nameEs: 'El Burj Khalifa',
    myth: 'Aguja de cristal que rasga las nubes del desierto',
    wikiTitle: 'Burj_Khalifa',
    landmarkType: 4,
  },
  ABD: {
    city: 'Abu Dhabi',
    name: 'Sheikh Zayed Grand Mosque',
    nameEs: 'La Gran Mezquita Sheikh Zayed',
    myth: 'Mármol blanco y cúpulas doradas sobre el golfo Pérsico',
    wikiTitle: 'Sheikh_Zayed_Grand_Mosque',
    landmarkType: 5,
  },
  DOH: {
    city: 'Doha',
    name: 'Museum of Islamic Art',
    nameEs: 'El Museo de Arte Islámico',
    myth: 'Geometría de piedra caliza flotando sobre la bahía de Doha',
    wikiTitle: 'Museum_of_Islamic_Art,_Doha',
    landmarkType: 5,
  },
  RUH: {
    city: 'Riyadh',
    name: 'Kingdom Centre Tower',
    nameEs: 'La Torre del Centro del Reino',
    myth: 'Rascacielos con ojo de aguja que define el skyline de Arabia Saudita',
    wikiTitle: 'Kingdom_Centre',
    landmarkType: 4,
  },
  THR: {
    city: 'Tehran',
    name: 'Azadi Tower',
    nameEs: 'La Torre de la Libertad',
    myth: 'Arco de mármol blanco símbolo de la identidad iraní',
    wikiTitle: 'Azadi_Tower',
    landmarkType: 1,
  },

  // ── Asia ──────────────────────────────────────────────────────────────────
  DEL: {
    city: 'Delhi',
    name: 'India Gate',
    nameEs: 'La Puerta de la India',
    myth: 'Arco de arenisca en memoria de los soldados caídos',
    wikiTitle: 'India_Gate',
    landmarkType: 1,
  },
  MUM: {
    city: 'Mumbai',
    name: 'Gateway of India',
    nameEs: 'La Puerta de la India',
    myth: 'Arco de basalto amarillo donde atracaron los últimos buques imperiales',
    wikiTitle: 'Gateway_of_India',
    landmarkType: 1,
  },
  HYD: {
    city: 'Hyderabad',
    name: 'Charminar',
    nameEs: 'El Charminar',
    myth: 'Cuatro minaretes que custodian el corazón de la ciudad del Nizám',
    wikiTitle: 'Charminar',
    landmarkType: 2,
  },
  CCU: {
    city: 'Kolkata',
    name: 'Victoria Memorial',
    nameEs: 'El Memorial Victoria',
    myth: 'Mármol blanco de Makrana que rinde tributo al Imperio sobre el Hooghly',
    wikiTitle: 'Victoria_Memorial,_Kolkata',
    landmarkType: 5,
  },
  LHE: {
    city: 'Lahore',
    name: 'Badshahi Mosque',
    nameEs: 'La Mezquita Badshahi',
    myth: 'Perla mogol de mármol rojo que fue la mezquita más grande del mundo',
    wikiTitle: 'Badshahi_Mosque',
    landmarkType: 5,
  },
  CMB: {
    city: 'Colombo',
    name: 'Lotus Tower',
    nameEs: 'La Torre Loto de Colombo',
    myth: 'Torre de telecomunicaciones con forma de flor de loto sobre el Índico',
    wikiTitle: 'Lotus_Tower',
    landmarkType: 3,
  },
  KTM: {
    city: 'Kathmandu',
    name: 'Swayambhunath',
    nameEs: 'El Templo de los Monos',
    myth: 'Stupa blanca con ojos que todo lo ven sobre el valle del Himalaya',
    wikiTitle: 'Swayambhunath',
    landmarkType: 5,
  },
  BEI: {
    city: 'Beijing',
    name: 'Forbidden City',
    nameEs: 'La Ciudad Prohibida',
    myth: 'Palacio de mil salas donde vivió el Hijo del Cielo',
    wikiTitle: 'Forbidden_City',
    landmarkType: 5,
  },
  SHA: {
    city: 'Shanghai',
    name: 'Oriental Pearl Tower',
    nameEs: 'La Torre Perla Oriental',
    myth: 'Esferas de rubí ensartadas en aguja sobre el río Huangpu',
    wikiTitle: 'Oriental_Pearl_Tower',
    landmarkType: 3,
  },
  TOK: {
    city: 'Tokyo',
    name: 'Tokyo Tower',
    nameEs: 'La Torre de Tokio',
    myth: 'Acero naranja que brilla sobre la megalópolis',
    wikiTitle: 'Tokyo_Tower',
    landmarkType: 3,
  },
  OSA: {
    city: 'Osaka',
    name: 'Osaka Castle',
    nameEs: 'El Castillo de Osaka',
    myth: 'Donjon de azulejos verdes y oro rodeado de cerezos en flor',
    wikiTitle: 'Osaka_Castle',
    landmarkType: 2,
  },
  KYO: {
    city: 'Kyoto',
    name: 'Kinkaku-ji',
    nameEs: 'El Pabellón Dorado',
    myth: 'Templo recubierto de oro puro que se refleja en el estanque Kyoko',
    wikiTitle: 'Kinkaku-ji',
    landmarkType: 5,
  },
  SEO: {
    city: 'Seoul',
    name: 'Gyeongbokgung Palace',
    nameEs: 'El Palacio Gyeongbokgung',
    myth: 'Palacio joseon entre montañas donde el tigre aún ruge en el mito',
    wikiTitle: 'Gyeongbokgung',
    landmarkType: 5,
  },
  TPE: {
    city: 'Taipei',
    name: 'Taipei 101',
    nameEs: 'La Torre Taipei 101',
    myth: 'Bambú de acero con 101 pisos que desafía los tifones del Pacífico',
    wikiTitle: 'Taipei_101',
    landmarkType: 4,
  },
  HKG: {
    city: 'Hong Kong',
    name: 'Victoria Peak',
    nameEs: 'El Pico Victoria',
    myth: 'Cima de granito desde la que el skyline más denso del mundo se despliega',
    wikiTitle: 'Victoria_Peak',
    landmarkType: 5,
  },
  SGP: {
    city: 'Singapore',
    name: 'Marina Bay Sands',
    nameEs: 'Marina Bay Sands',
    myth: 'Tres torres coronadas por el barco del futuro asiático',
    wikiTitle: 'Marina_Bay_Sands',
    landmarkType: 2,
  },
  KUL: {
    city: 'Kuala Lumpur',
    name: 'Petronas Towers',
    nameEs: 'Las Torres Petronas',
    myth: 'Gemelas de acero y vidrio inspiradas en los patrones del islam',
    wikiTitle: 'Petronas_Towers',
    landmarkType: 2,
  },
  JKT: {
    city: 'Jakarta',
    name: 'National Monument',
    nameEs: 'El Monumento Nacional',
    myth: 'Obelisco de mármol coronado por llama de oro símbolo de la independencia',
    wikiTitle: 'National_Monument_(Indonesia)',
    landmarkType: 0,
  },
  MNL: {
    city: 'Manila',
    name: 'Intramuros',
    nameEs: 'La Ciudad Intramuros',
    myth: 'Ciudad amurallada española que sobrevivió siglos de historia filipina',
    wikiTitle: 'Intramuros',
    landmarkType: 5,
  },
  BKK: {
    city: 'Bangkok',
    name: 'Wat Phra Kaew',
    nameEs: 'El Templo del Buda Esmeralda',
    myth: 'Templo de tejados dorados que custodia la esmeralda sagrada',
    wikiTitle: 'Wat_Phra_Kaew',
    landmarkType: 2,
  },
  RGN: {
    city: 'Yangon',
    name: 'Shwedagon Pagoda',
    nameEs: 'La Pagoda Shwedagon',
    myth: 'Estupa recubierta de oro macizo que guarda reliquias del Buda',
    wikiTitle: 'Shwedagon_Pagoda',
    landmarkType: 3,
  },
  SGN: {
    city: 'Ho Chi Minh City',
    name: 'Notre-Dame Cathedral Basilica of Saigon',
    nameEs: 'La Catedral Notre-Dame de Saigón',
    myth: 'Dos campanarios de ladrillo rojo que resisten el trópico desde 1880',
    wikiTitle: 'Notre-Dame_Cathedral_Basilica_of_Saigon',
    landmarkType: 2,
  },
  HAN: {
    city: 'Hanoi',
    name: 'Temple of Literature',
    nameEs: 'El Templo de la Literatura',
    myth: 'Universidad confuciana del siglo XI rodeada de jardines y tortuga sagrada',
    wikiTitle: 'Temple_of_Literature,_Hanoi',
    landmarkType: 5,
  },

  // ── Oceania ───────────────────────────────────────────────────────────────
  SYD: {
    city: 'Sydney',
    name: 'Sydney Opera House',
    nameEs: 'La Ópera de Sídney',
    myth: 'Conchas de vela blanca sobre las aguas del puerto',
    wikiTitle: 'Sydney_Opera_House',
    landmarkType: 5,
  },
  MEL: {
    city: 'Melbourne',
    name: 'Flinders Street Station',
    nameEs: 'La Estación de Flinders Street',
    myth: 'Cúpula eduardiana con reloj que es el corazón social de Melbourne',
    wikiTitle: 'Flinders_Street_station',
    landmarkType: 5,
  },
  AKL: {
    city: 'Auckland',
    name: 'Sky Tower',
    nameEs: 'La Sky Tower de Auckland',
    myth: 'Aguja de hormigón más alta del hemisferio sur sobre el Waitemata',
    wikiTitle: 'Sky_Tower,_Auckland',
    landmarkType: 3,
  },
}

// ─── Extra city-name aliases (common English names that differ from the entry) ──
const CITY_ALIASES: Record<string, string> = {
  'new york':             'NYC',
  'new york city':        'NYC',
  'ciudad de mexico':     'CDMX',
  'mexico city':          'MEX',
  'new delhi':            'DEL',
  'rio':                  'RIO',
  'bogotá':               'BOG',
  'séville':              'SEV',
  'athènes':              'ATH',
  'lisbonne':             'LIS',
  'praga':                'PRG',
  'washington dc':        'WDC',
  'washington d.c.':      'WDC',
  'dc':                   'WDC',
  'ho chi minh':          'SGN',
  'saigon':               'SGN',
  'sao paulo':            'SAO',
  'krakow':               'KRA',
  'cracow':               'KRA',
  'rangoon':              'RGN',
  'calcutta':             'CCU',
  'bombay':               'MUM',
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
