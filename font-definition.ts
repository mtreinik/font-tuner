import { Glyph, Font, Path } from 'opentype.js'
import { arcTo } from './path'

export interface FontParams {
  strokeWidth: number
  cornerRadius: number
  loopRatio: number
  terminalRatio: number
  cornerRatio: number
  waistLength: number
  verticalStress: number
}

interface GlyphParams extends FontParams {
  fontSize: number
  width: number
  height: number
}

interface GlyphPosition {
  x: number
  y: number
  dir: number
}

function c(x: number, y: number) {
  return `(${x.toFixed(2)},${y.toFixed(2)})`
}

function arcRight(
  path: Path,
  pos: GlyphPosition,
  params: GlyphParams,
  stress1: number = 1.0,
  stress2: number = 1.0
) {
  const radius = params.cornerRadius
  const innerRadius = params.cornerRadius - (params.strokeWidth * (stress1 + stress2)) / 2
  const dx = Math.cos(pos.dir)
  const dy = Math.sin(pos.dir)
  const dir2 = pos.dir - Math.PI / 2
  const dx2 = Math.cos(dir2)
  const dy2 = Math.sin(dir2)
  const [x, y] = [pos.x, pos.y]
  const [x1, y1] = [x + dx * radius, y + dy * radius]
  const [x2, y2] = [x + (dx + dx2) * radius, y + (dy + dy2) * radius]
  const [x3, y3] = [x2 - dx * params.strokeWidth * stress2, y2 - dy * params.strokeWidth * stress2]
  const [x4, y4] = [x3 - dx2 * innerRadius, y3 - dy2 * innerRadius]
  const [x5, y5] = [x + dy * params.strokeWidth * stress1, y - dx * params.strokeWidth * stress1]
  console.log(
    `arcRight: x,y=${c(x, y)}  x1,y1=${c(x1, y1)}  x2,y2=${c(x2, y2)}  dx,dy=${c(dx, dy)}, params: ${JSON.stringify(params)}`
  )
  path.moveTo(x, y)
  arcTo(path, x1, y1, x2, y2, radius)
  path.lineTo(x3, y3)
  arcTo(path, x4, y4, x5, y5, innerRadius * params.cornerRatio)
  path.lineTo(x5, y5)
  path.close()
  return {
    x: x2,
    y: y2,
    dir: dir2
  }
}

function straight(
  path: Path,
  pos: GlyphPosition,
  params: GlyphParams,
  straightLength: number,
  reverse: boolean = false
) {
  if (straightLength < 0) {
    return pos
  }
  const dx = Math.cos(pos.dir)
  const dy = Math.sin(pos.dir)
  const dir2 = pos.dir - Math.PI / 2
  const dx2 = Math.cos(dir2)
  const dy2 = Math.sin(dir2)
  const reverseCoefficient = reverse ? -1 : 1

  const [x, y] = [pos.x, pos.y]
  const [x1, y1] = [x + dx * straightLength, y + dy * straightLength]
  const [x2, y2] = [
    x1 + reverseCoefficient * dx2 * params.strokeWidth,
    y1 + reverseCoefficient * dy2 * params.strokeWidth
  ]
  const [x3, y3] = [
    x + reverseCoefficient * dy * params.strokeWidth,
    y - reverseCoefficient * dx * params.strokeWidth
  ]
  path.moveTo(x, y)
  path.lineTo(x1, y1)
  path.lineTo(x2, y2)
  path.lineTo(x3, y3)
  path.close()
  return {
    x: x1,
    y: y1,
    dir: pos.dir
  }
}
function skip(_path: Path, pos: GlyphPosition, _params: GlyphParams, straightLength: number) {
  const dx = Math.cos(pos.dir)
  const dy = Math.sin(pos.dir)
  const [x, y] = [pos.x, pos.y]
  const [x1, y1] = [x + dx * straightLength, y + dy * straightLength]
  return {
    x: x1,
    y: y1,
    dir: pos.dir
  }
}

function createZero(path: Path, params: GlyphParams) {
  let pos: GlyphPosition = {
    x: 0,
    y: params.cornerRadius,
    dir: Math.PI / 2
  }
  const straightLength = params.fontSize - params.cornerRadius * 2
  pos = straight(path, pos, params, straightLength)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  path.close()
}

function createOne(path: Path, params: GlyphParams) {
  let pos: GlyphPosition = {
    x: 0,
    y: 0,
    dir: Math.PI / 2
  }
  pos = straight(path, pos, params, params.fontSize)
  pos = straight(
    path,
    { x: pos.x, y: pos.y, dir: (-Math.PI * 4) / 5 },
    params,
    params.fontSize * 0.2,
    true
  )
  path.close()
}

function createThree(path: Path, params: GlyphParams) {
  const straightLengthTotal =
    params.fontSize - params.cornerRadius * 4 + params.strokeWidth * params.verticalStress
  const straightLength1 = straightLengthTotal * params.loopRatio
  const straightLength2 = straightLengthTotal * (1 - params.loopRatio)
  let pos: GlyphPosition = {
    x: params.cornerRadius,
    y: params.cornerRadius * 2 + straightLength1,
    dir: 0
  }
  let pos2: GlyphPosition = {
    x: 0,
    y: params.cornerRadius * 3 + straightLengthTotal - params.strokeWidth * params.verticalStress,
    dir: Math.PI / 2
  }
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength1)
  pos = arcRight(path, pos, params, 1, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)

  pos2 = arcRight(path, pos2, params, 1.0, params.verticalStress)
  pos2 = arcRight(path, pos2, params, params.verticalStress, 1.0)
  pos2 = straight(path, pos2, params, straightLength2)
  pos2 = arcRight(path, pos2, params, 1.0, params.verticalStress)
  path.close()
}

function createFive(path: Path, params: GlyphParams) {
  const straightLengthTotal = params.fontSize - params.cornerRadius
  const straightLength2 = (straightLengthTotal * params.loopRatio) / 2
  const straightLength1 = straightLengthTotal * (1 - params.loopRatio / 2)
  let pos: GlyphPosition = {
    x: 0,
    y: params.cornerRadius + straightLength2,
    dir: Math.PI / 2
  }
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength2)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = skip(path, pos, params, straightLength2)
  pos = straight(path, pos, params, straightLength1)
  pos = straight(
    path,
    { x: pos.x, y: pos.y, dir: 0 },
    { strokeWidth: params.strokeWidth * params.verticalStress, ...params },
    params.cornerRadius * 2
  )
  path.close()
}

function createSix(path: Path, params: GlyphParams) {
  const straightLengthTotal =
    params.fontSize -
    params.cornerRadius * 4 +
    params.strokeWidth * params.verticalStress +
    params.cornerRadius * 2 -
    params.strokeWidth * params.verticalStress
  const straightLength2 = (straightLengthTotal * params.loopRatio) / 2
  let pos: GlyphPosition = {
    x: 0,
    y: params.cornerRadius + straightLength2,
    dir: Math.PI / 2
  }
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength2)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLengthTotal)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  path.close()
}

function createEight(path: Path, params: GlyphParams) {
  const straightLengthTotal =
    params.fontSize - params.cornerRadius * 4 + params.strokeWidth * params.verticalStress
  const straightLength1 = straightLengthTotal * params.loopRatio
  const straightLength2 = straightLengthTotal * (1 - params.loopRatio)
  let pos: GlyphPosition = {
    x: 0,
    y: params.cornerRadius,
    dir: Math.PI / 2
  }
  let pos2: GlyphPosition = {
    x: 0,
    y: params.cornerRadius * 3 - params.strokeWidth * params.verticalStress + straightLength1,
    dir: Math.PI / 2
  }
  pos = straight(path, pos, params, straightLength1)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength1)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos2 = straight(path, pos2, params, straightLength2)
  pos2 = arcRight(path, pos2, params, 1.0, params.verticalStress)
  pos2 = arcRight(path, pos2, params, params.verticalStress, 1.0)
  pos2 = straight(path, pos2, params, straightLength2)
  pos2 = arcRight(path, pos2, params, 1.0, params.verticalStress)
  pos2 = arcRight(path, pos2, params, params.verticalStress, 1.0)
  path.close()
}

function createNine(path: Path, params: GlyphParams) {
  const straightLengthTotal =
    params.fontSize -
    params.cornerRadius * 4 +
    params.strokeWidth * params.verticalStress +
    params.cornerRadius * 2 -
    params.strokeWidth * params.verticalStress
  // const straightLength1 = straightLengthTotal * params.loopRatio
  const straightLength2 = straightLengthTotal * (1 - params.loopRatio)
  let pos: GlyphPosition = {
    x: params.cornerRadius * 2,
    y: params.fontSize - params.cornerRadius - straightLength2,
    dir: -Math.PI / 2
  }
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLength2)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  pos = straight(path, pos, params, straightLengthTotal)
  pos = arcRight(path, pos, params, 1.0, params.verticalStress)
  pos = arcRight(path, pos, params, params.verticalStress, 1.0)
  path.close()
}

function createCustomGlyph(
  char: string,
  advanceWidth: number,
  fontSize: number,
  params: FontParams
): Glyph {
  const path = new Path()
  const glyphParams = {
    width: fontSize * 0.6,
    height: fontSize * 1.2,
    fontSize,
    ...params
  }
  switch (char) {
    case '0':
      createZero(path, glyphParams)
      break
    case '1':
      createOne(path, glyphParams)
      break
    case '3':
      createThree(path, glyphParams)
      break
    case '5':
      createFive(path, glyphParams)
      break
    case '6':
      createSix(path, glyphParams)
      break
    case '8':
      createEight(path, glyphParams)
      break
    case '9':
      createNine(path, glyphParams)
      break
  }

  return new Glyph({
    name: char,
    unicode: char.charCodeAt(0),
    advanceWidth,
    path
  })
}

export function buildFont(params: FontParams): Font {
  const glyphs: Glyph[] = []

  // Required .notdef glyph
  glyphs.push(
    new Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 200,
      path: new Path()
    })
  )

  const chars = '0123456789.'
  const fontSize = 96

  for (const char of chars) {
    const glyph = createCustomGlyph(char, fontSize * 0.6, fontSize, params)
    glyphs.push(glyph)
  }

  const font = new Font({
    familyName: 'ParametricDigits',
    styleName: 'Regular',
    unitsPerEm: fontSize,
    ascender: fontSize * 0.8,
    descender: -fontSize * 0.2,
    glyphs,
    kerningPairs: {} // required for opentype.js
  })

  font.encoding = {
    charToGlyphIndex(c: string): number {
      const unicode = c.charCodeAt(0)
      for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i)
        if (glyph.unicode === unicode) {
          return i
        }
      }
      return 0 // fallback to .notdef
    }
  }

  return font
}
