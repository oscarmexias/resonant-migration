// Nominatim reverse geocode + city → code lookup table

export const CITY_CODES: Record<string, string> = {
  // Mexico
  'ciudad de méxico': 'CDMX', 'ciudad de mexico': 'CDMX', 'cdmx': 'CDMX', 'mexico city': 'CDMX',
  'guadalajara': 'GDL', 'monterrey': 'MTY', 'puebla': 'PUE',
  'tijuana': 'TIJ', 'cancún': 'CUN', 'cancun': 'CUN', 'mérida': 'MID', 'merida': 'MID',
  'leon': 'LEO', 'léon': 'LEO', 'zapopan': 'ZAP', 'ecatepec': 'ECA',
  // United States
  'new york city': 'NYC', 'new york': 'NYC',
  'los angeles': 'LAX', 'chicago': 'CHI', 'houston': 'HOU',
  'miami': 'MIA', 'san francisco': 'SFO', 'seattle': 'SEA',
  'boston': 'BOS', 'atlanta': 'ATL', 'dallas': 'DAL',
  'denver': 'DEN', 'phoenix': 'PHX', 'washington': 'WDC',
  'las vegas': 'LAS', 'portland': 'PDX', 'minneapolis': 'MSP',
  'detroit': 'DET', 'baltimore': 'BAL', 'nashville': 'BNA',
  // Europe
  'madrid': 'MAD', 'barcelona': 'BCN', 'seville': 'SVQ', 'sevilla': 'SVQ',
  'paris': 'PAR', 'marseille': 'MRS', 'lyon': 'LYS', 'toulouse': 'TLS',
  'london': 'LON', 'manchester': 'MAN', 'birmingham': 'BHX', 'edinburgh': 'EDI',
  'berlin': 'BER', 'munich': 'MUC', 'münchen': 'MUC', 'hamburg': 'HAM', 'frankfurt': 'FRA',
  'cologne': 'CGN', 'köln': 'CGN', 'dusseldorf': 'DUS', 'düsseldorf': 'DUS',
  'rome': 'ROM', 'roma': 'ROM', 'milan': 'MIL', 'milano': 'MIL', 'naples': 'NAP', 'napoli': 'NAP',
  'amsterdam': 'AMS', 'rotterdam': 'RTM', 'the hague': 'HAG',
  'brussels': 'BRU', 'bruxelles': 'BRU', 'antwerp': 'ANT',
  'vienna': 'VIE', 'wien': 'VIE', 'graz': 'GRZ',
  'zurich': 'ZRH', 'zürich': 'ZRH', 'geneva': 'GVA', 'genève': 'GVA',
  'lisbon': 'LIS', 'lisboa': 'LIS', 'porto': 'OPO',
  'athens': 'ATH', 'athina': 'ATH', 'thessaloniki': 'SKG',
  'warsaw': 'WAW', 'krakow': 'KRK', 'kraków': 'KRK',
  'prague': 'PRG', 'praga': 'PRG', 'brno': 'BRQ',
  'budapest': 'BUD', 'stockholm': 'STO', 'gothenburg': 'GOT', 'göteborg': 'GOT',
  'oslo': 'OSL', 'copenhagen': 'CPH', 'kobenhavn': 'CPH', 'københavn': 'CPH',
  'helsinki': 'HEL', 'tampere': 'TMP',
  'bucharest': 'OTP', 'bucurești': 'OTP',
  'kiev': 'KBP', 'kyiv': 'KBP',
  'moscow': 'MOW', 'moskva': 'MOW', 'saint petersburg': 'LED', 'st. petersburg': 'LED',
  // Latin America
  'buenos aires': 'BUE', 'córdoba': 'COR', 'cordoba': 'COR', 'rosario': 'ROS',
  'bogotá': 'BOG', 'bogota': 'BOG', 'medellín': 'MDE', 'medellin': 'MDE', 'cali': 'CLO',
  'santiago': 'SCL', 'lima': 'LIM', 'quito': 'UIO',
  'caracas': 'CCS', 'la paz': 'LPZ', 'montevideo': 'MVD',
  'são paulo': 'SAO', 'sao paulo': 'SAO', 'rio de janeiro': 'RIO', 'brasília': 'BSB', 'brasilia': 'BSB',
  'havana': 'HAV', 'habana': 'HAV',
  'santo domingo': 'SDQ', 'san juan': 'SJU', 'panama city': 'PTY',
  'san josé': 'SJO', 'san jose': 'SJO', 'managua': 'MGA', 'tegucigalpa': 'TGU',
  // Asia
  'tokyo': 'TYO', 'tōkyō': 'TYO', 'osaka': 'OSA', 'kyoto': 'KYO', 'fukuoka': 'FUK',
  'seoul': 'SEL', 'busan': 'PUS', 'incheon': 'ICN',
  'beijing': 'BJS', 'shanghai': 'SHA', 'guangzhou': 'CAN', 'shenzhen': 'SZX',
  'hong kong': 'HKG', 'chongqing': 'CKG', 'chengdu': 'CTU',
  'singapore': 'SIN',
  'bangkok': 'BKK', 'phuket': 'HKT', 'chiang mai': 'CNX',
  'jakarta': 'JKT', 'surabaya': 'SUB', 'bali': 'DPS',
  'mumbai': 'BOM', 'delhi': 'DEL', 'new delhi': 'DEL', 'bangalore': 'BLR', 'bengaluru': 'BLR',
  'hyderabad': 'HYD', 'chennai': 'MAA', 'kolkata': 'CCU', 'ahmedabad': 'AMD',
  'karachi': 'KHI', 'lahore': 'LHE', 'islamabad': 'ISB',
  'dhaka': 'DAC', 'colombo': 'CMB', 'kathmandu': 'KTM',
  'tehran': 'THR', 'baghdad': 'BGW', 'kabul': 'KBL',
  'riyadh': 'RUH', 'dubai': 'DXB', 'abu dhabi': 'AUH',
  'kuwait city': 'KWI', 'doha': 'DOH', 'muscat': 'MCT',
  'tel aviv': 'TLV', 'jerusalem': 'JRS', 'haifa': 'HFA',
  'beirut': 'BEY', 'amman': 'AMM', 'damascus': 'DAM',
  'istanbul': 'IST', 'ankara': 'ANK', 'izmir': 'ADB',
  'tashkent': 'TAS', 'almaty': 'ALA',
  // Africa
  'cairo': 'CAI', 'alexandria': 'ALY',
  'casablanca': 'CAS', 'rabat': 'RBA', 'marrakech': 'RAK', 'marrakesh': 'RAK',
  'tunis': 'TUN', 'algiers': 'ALG', 'tripoli': 'TIP',
  'lagos': 'LOS', 'abuja': 'ABV', 'kano': 'KAN',
  'accra': 'ACC', 'kumasi': 'KMS',
  'nairobi': 'NBO', 'mombasa': 'MBA',
  'johannesburg': 'JNB', 'cape town': 'CPT', 'durban': 'DUR', 'pretoria': 'PRY',
  'addis ababa': 'ADD', 'dar es salaam': 'DAR', 'kampala': 'KLA',
  'kinshasa': 'FIH', 'luanda': 'LAD',
  // Oceania
  'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE',
  'perth': 'PER', 'adelaide': 'ADL', 'canberra': 'CBR',
  'auckland': 'AKL', 'wellington': 'WLG', 'christchurch': 'CHC',
  // Canada
  'toronto': 'YYZ', 'montreal': 'YUL', 'montréal': 'YUL',
  'vancouver': 'YVR', 'calgary': 'YYC', 'ottawa': 'YOW',
  'edmonton': 'YEG', 'winnipeg': 'YWG',
}

export function cityNameToCode(rawName: string): string {
  const key = rawName.toLowerCase().trim()

  // 1. Direct match
  if (CITY_CODES[key]) return CITY_CODES[key]

  // 2. Partial prefix match
  for (const [k, v] of Object.entries(CITY_CODES)) {
    if (key.startsWith(k) || k.startsWith(key)) return v
  }

  // 3. Fallback: consonant-preferred 3-letter code
  const normalized = rawName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()

  const consonants = normalized.replace(/[AEIOU]/g, '')
  const code = consonants.length >= 3 ? consonants.slice(0, 3) : normalized.slice(0, 3)
  return (code || 'UNK').slice(0, 4)
}

export function coordFallback(lat: number, lng: number): string {
  // Known coordinate ranges → codes
  if (lat > 18 && lat < 21 && lng > -100 && lng < -98) return 'CDMX'
  if (lat > 40 && lat < 42 && lng > -4 && lng < -2)    return 'MAD'
  if (lat > 40 && lat < 41 && lng > -75 && lng < -73)  return 'NYC'
  if (lat > 33 && lat < 35 && lng > -119 && lng < -117) return 'LAX'
  if (lat > 48 && lat < 49 && lng > 2 && lng < 3)      return 'PAR'
  if (lat > 51 && lat < 52 && lng > -1 && lng < 1)     return 'LON'
  if (lat > 35 && lat < 36 && lng > 139 && lng < 140)  return 'TYO'
  if (lat > 52 && lat < 53 && lng > 13 && lng < 14)    return 'BER'
  if (lat > 41 && lat < 42 && lng > 12 && lng < 13)    return 'ROM'
  if (lat > 25 && lat < 26 && lng > 55 && lng < 56)    return 'DXB'
  if (lat > -34 && lat < -33 && lng > -71 && lng < -70) return 'SCL'
  if (lat > -24 && lat < -22 && lng > -44 && lng < -42) return 'RIO'
  // Generic: use coordinate-derived code
  const latCode = Math.abs(Math.round(lat)).toString().padStart(2, '0')
  return `L${latCode}`
}

export async function fetchCityName(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ElOjo/1.0 (generative-art; contact@resonantmigration.xyz)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 }, // cache 1 hour server-side
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data?.address ?? {}
    return addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? null
  } catch {
    return null
  }
}
