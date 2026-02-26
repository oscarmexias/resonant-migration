// Vision Types — 5 aesthetic approaches to rendering world-state data
// User selects one vision at startup, which determines shader used for canvas

export type VisionType = 'surveillance' | 'glitch' | 'volumetric' | 'brutalist' | 'organism'

export interface VisionMeta {
  id: VisionType
  name: string
  tagline: string
  description: string
}

export const VISIONS: Record<VisionType, VisionMeta> = {
  surveillance: {
    id: 'surveillance',
    name: 'Vigilancia',
    tagline: 'CCTV del sistema nervioso del mundo',
    description: 'Estética terminal. Datos como vigilancia.'
  },
  glitch: {
    id: 'glitch',
    name: 'Colapso',
    tagline: 'La belleza se corrompe bajo presión',
    description: 'El arte se rompe cuando el mundo grita.'
  },
  volumetric: {
    id: 'volumetric',
    name: 'Volumétrico',
    tagline: 'Escultura de datos en 3D',
    description: 'Nubes de puntos. Profundidad. Estructura.'
  },
  brutalist: {
    id: 'brutalist',
    name: 'Brutalista',
    tagline: 'Un gesto violento',
    description: 'Mínimo. Crudo. Sin concesiones.'
  },
  organism: {
    id: 'organism',
    name: 'Organismo',
    tagline: 'Tejido vivo responde a estímulos',
    description: 'Bio-horror. Visceral. Vivo.'
  }
}
