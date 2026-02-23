// Pixel bitmap fonts for El Ojo city code art
// 5×7 for desktop (≥768px), 3×5 for mobile (<768px)
// Encoding: each character = array of numbers (row bitmasks)
//   5×7: 7 numbers, each 5 bits (bit 4 = leftmost pixel)
//   3×5: 5 numbers, each 3 bits (bit 2 = leftmost pixel)

export const FONT_5x7: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b10001, 0b10001, 0b10001, 0b11111, 0b00001, 0b00001, 0b00001],
  '5': [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b00001, 0b11110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
}

export const FONT_3x5: Record<string, number[]> = {
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  F: [0b111, 0b100, 0b110, 0b100, 0b100],
  G: [0b011, 0b100, 0b101, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111],
  J: [0b011, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b110, 0b100, 0b110, 0b101],
  L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b101, 0b101, 0b101],
  N: [0b101, 0b111, 0b111, 0b101, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100, 0b100],
  Q: [0b010, 0b101, 0b101, 0b011, 0b001],
  R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110],
  T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b010],
  V: [0b101, 0b101, 0b101, 0b010, 0b010],
  W: [0b101, 0b101, 0b111, 0b111, 0b101],
  X: [0b101, 0b010, 0b010, 0b010, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010],
  Z: [0b111, 0b001, 0b010, 0b100, 0b111],
  '0': [0b010, 0b101, 0b101, 0b101, 0b010],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b110, 0b001, 0b010, 0b100, 0b111],
  '3': [0b111, 0b001, 0b011, 0b001, 0b110],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b110, 0b001, 0b110],
  '6': [0b010, 0b100, 0b110, 0b101, 0b010],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b010, 0b101, 0b010, 0b101, 0b010],
  '9': [0b010, 0b101, 0b011, 0b001, 0b010],
}

export interface FontGridCell {
  col: number        // columna en el grid pixel (0-indexed)
  row: number        // fila en el grid pixel (0-indexed)
  isActive: boolean  // true = píxel encendido (ejecuta algoritmo generativo)
  algoIndex: number  // 0-7 cual algoritmo; -1 si inactivo
}

export interface FontGrid {
  cells: FontGridCell[]
  activeCells: FontGridCell[]
  gridCols: number
  gridRows: number
  cellW: number
  cellH: number
}

function shuffleAlgos(seedNum: number): number[] {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  for (let i = arr.length - 1; i > 0; i--) {
    const x = Math.sin(seedNum * 9301 + i * 49297 + 233720) * 46340
    const r = x - Math.floor(x)
    const j = Math.floor(r * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function buildFontGrid(
  cityCode: string,
  canvasW: number,
  canvasH: number,
  isMobile: boolean,
  seedNum: number,
): FontGrid {
  const font  = isMobile ? FONT_3x5 : FONT_5x7
  const charW = isMobile ? 3 : 5
  const charH = isMobile ? 5 : 7
  const gap   = 1 // columnas de separación entre letras

  // Filtrar solo chars con glyph disponible; usar fallback UNK si vacío
  let chars = cityCode.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').filter(c => c in font)
  if (chars.length === 0) chars = ['U', 'N', 'K']

  const gridCols = chars.length * charW + (chars.length - 1) * gap
  const gridRows = charH

  // cellW / cellH: fill canvas, cells pueden ser rectangulares
  const cellW = Math.max(1, Math.floor(canvasW / gridCols))
  const cellH = Math.max(1, Math.floor(canvasH / gridRows))

  // Construir bitmap
  const bitmap: boolean[][] = Array.from({ length: gridRows }, () =>
    new Array(gridCols).fill(false)
  )

  chars.forEach((ch, ci) => {
    const glyph = font[ch] ?? Array(charH).fill(0)
    const colOffset = ci * (charW + gap)
    glyph.forEach((rowBits, row) => {
      for (let bit = 0; bit < charW; bit++) {
        // MSB = leftmost: bit index from left = charW-1-bit
        if ((rowBits >> (charW - 1 - bit)) & 1) {
          bitmap[row][colOffset + bit] = true
        }
      }
    })
  })

  // Construir cells, asignar algoritmos a activos
  const algoOrder = shuffleAlgos(seedNum)
  let activeCount = 0

  const cells: FontGridCell[] = []
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const isActive = bitmap[row][col]
      cells.push({
        col, row, isActive,
        algoIndex: isActive ? algoOrder[activeCount++ % 13] : -1,
      })
    }
  }

  const activeCells = cells.filter(c => c.isActive)
  return { cells, activeCells, gridCols, gridRows, cellW, cellH }
}

// ── Mosaic grid: entire canvas filled with ~20px square cells ──────────────────
// Every font pixel is scaled to scale×scale grid cells so the city code fills
// ~65% of canvas width. Returns ALL cells (active + inactive) for full mosaic rendering.
export function buildMosaicGrid(
  cityCode: string,
  canvasW: number,
  canvasH: number,
  seedNum: number,
): FontGrid {
  // Square cells — aim for ~20px, clamp between 14 and 26px
  const cellSize = Math.max(14, Math.min(26, Math.floor(Math.min(canvasW, canvasH) / 55)))
  const gridCols = Math.floor(canvasW / cellSize)
  const gridRows = Math.floor(canvasH / cellSize)

  const charW = 5, charH = 7, gap = 1 // always use 5×7 font for crisp pixels
  // Treat space as a 2-column blank glyph so full city names have readable word gaps
  const SPACE_W = 2
  const rawChars = cityCode.toUpperCase().split('').filter(c => c === ' ' || c in FONT_5x7)
  let chars = rawChars.length > 0 ? rawChars : ['U', 'N', 'K']
  if (chars.every(c => c === ' ')) chars = ['U', 'N', 'K']

  // Compute total font width accounting for space characters (SPACE_W cols each)
  let fontCols = 0
  const charOffsets: number[] = []
  for (let i = 0; i < chars.length; i++) {
    charOffsets.push(fontCols)
    fontCols += chars[i] === ' ' ? SPACE_W : charW
    if (i < chars.length - 1) fontCols += gap
  }

  // Scale each font pixel → scale×scale grid cells; fill ~65% width / 68% height
  const scaleX = Math.max(2, Math.floor(gridCols * 0.65 / fontCols))
  const scaleY = Math.max(2, Math.floor(gridRows * 0.68 / charH))
  const scale  = Math.min(scaleX, scaleY)

  const startCol = Math.floor((gridCols - fontCols * scale) / 2)
  const startRow = Math.floor((gridRows - charH   * scale) / 2)

  const bitmap: boolean[][] = Array.from({ length: gridRows }, () =>
    new Array(gridCols).fill(false)
  )

  chars.forEach((ch, ci) => {
    if (ch === ' ') return // space is just a blank gap
    const glyph = FONT_5x7[ch] ?? Array(charH).fill(0)
    const charColOffset = charOffsets[ci]
    glyph.forEach((rowBits, fontRow) => {
      for (let bit = 0; bit < charW; bit++) {
        if ((rowBits >> (charW - 1 - bit)) & 1) {
          for (let dr = 0; dr < scale; dr++) {
            for (let dc = 0; dc < scale; dc++) {
              const r = startRow + fontRow * scale + dr
              const c = startCol + (charColOffset + bit) * scale + dc
              if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) bitmap[r][c] = true
            }
          }
        }
      }
    })
  })

  const algoOrder = shuffleAlgos(seedNum)
  let activeCount = 0

  const cells: FontGridCell[] = []
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const isActive = bitmap[row][col]
      cells.push({ col, row, isActive, algoIndex: isActive ? algoOrder[activeCount++ % 13] : -1 })
    }
  }

  const activeCells = cells.filter(c => c.isActive)
  return { cells, activeCells, gridCols, gridRows, cellW: cellSize, cellH: cellSize }
}
