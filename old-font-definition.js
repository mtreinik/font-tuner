import opentype from 'opentype.js'
import { arcTo } from './path'

function roundedRect(path, x, y, width, height, radius, reverse = false) {
  console.trace()
  const right = x + width
  const bottom = y + height

  if (!reverse) {
    // Clockwise
    path.moveTo(x + radius, y)

    path.lineTo(right - radius, y)
    arcTo(path, right, y, right, y + radius, radius)

    path.lineTo(right, bottom - radius)
    arcTo(path, right, bottom, right - radius, bottom, radius)

    path.lineTo(x + radius, bottom)
    arcTo(path, x, bottom, x, bottom - radius, radius)

    path.lineTo(x, y + radius)
    arcTo(path, x, y, x + radius, y, radius)

    path.close()
  } else {
    path.moveTo(x + radius, bottom)

    path.lineTo(right - radius, bottom)
    arcTo(path, right, bottom, right, bottom - radius, radius)

    path.lineTo(right, y + radius)
    arcTo(path, right, y, right - radius, y, radius)

    path.lineTo(x + radius, y)
    arcTo(path, x, y, x, y + radius, radius)

    path.lineTo(x, bottom - radius)
    arcTo(path, x, bottom, x + radius, bottom, radius)

    path.close()
  }
}

function drawRoundedBoxGlyph({
  path,
  x = 0,
  y = 0,
  width,
  height,
  strokeWidth,
  radius,
  cornerRatio
}) {
  const outerWidth = width
  const outerHeight = height

  // Top-left corner of the box
  const top = y

  // Outer box
  roundedRect(path, x, top, outerWidth, outerHeight, radius, false)

  // Inner hole
  const innerWidth = outerWidth - 2 * strokeWidth
  const innerHeight = outerHeight - 2 * strokeWidth
  const innerX = x + strokeWidth
  const innerY = top + strokeWidth

  if (innerWidth > 0 && innerHeight > 0) {
    roundedRect(
      path,
      innerX,
      innerY,
      innerWidth,
      innerHeight,
      Math.max(0, radius - strokeWidth * cornerRatio),
      true
    )
  }
}

function drawDoubleBoxGlyph({
  path,
  x,
  y,
  width,
  height,
  strokeWidth,
  radius,
  loopRatio,
  cornerRatio
}) {
  const overlap = strokeWidth

  const topBoxHeight = height * loopRatio + overlap / 2
  const bottomBoxHeight = height * (1 - loopRatio) + overlap / 2

  // Top box
  drawRoundedBoxGlyph({
    path,
    x: x,
    y: y,
    width,
    height: topBoxHeight,
    strokeWidth,
    radius,
    cornerRatio
  })

  // Bottom box
  drawRoundedBoxGlyph({
    path,
    x: x,
    y: y + height * loopRatio - overlap / 2,
    width,
    height: bottomBoxHeight,
    strokeWidth,
    radius,
    cornerRatio
  })
}

function cutNotch(path, x, y, width, height) {
  // Counter-clockwise notch rectangle
  path.moveTo(x, y)
  path.lineTo(x, y + height)
  path.lineTo(x + width, y + height)
  path.lineTo(x + width, y)
  path.close()
}

function drawThreeGlyph({
  path,
  x = 0,
  y = 0,
  width,
  height,
  strokeWidth,
  radius,
  loopRatio = 0.5,
  terminalRatio = 0.5,
  waistLength = 0.5,
  cornerRatio
}) {
  const topTerminalY = strokeWidth + height * terminalRatio * (1 - loopRatio)
  const bottomTerminalY = height - strokeWidth - height * terminalRatio * loopRatio

  const overlap = strokeWidth
  const topHeight = height * loopRatio + overlap / 2
  const bottomHeight = height * (1 - loopRatio) + overlap / 2

  const topY = y
  const bottomY = y + height * loopRatio - overlap / 2

  /*
    // Top loop
    drawRoundedBoxGlyph({
        path,
        x: x,
        y: topY,
        width,
        height: topHeight,
        strokeWidth,
        radius
    });

    // Bottom loop
    drawRoundedBoxGlyph({
        path,
        x: x,
        y: bottomY,
        width,
        height: bottomHeight,
        strokeWidth,
        radius
    });

    // Cut away full vertical notch (left cut)
    const notchWidth = strokeWidth * 1.2;

    const waistY = y + height * loopRatio;

    // Remove the middle-left wall by two vertical notches (as before)
    cutNotch(path, x, topY + strokeWidth, notchWidth, (waistY - strokeWidth) - (topY + strokeWidth));
    cutNotch(path, x, waistY + strokeWidth, notchWidth, (bottomY + bottomHeight - strokeWidth) - (waistY + strokeWidth));

    // Draw the waist arm as a horizontal short rectangle
    const armWidth = width * waistLength; // waistLength controls how long the arm is
    const armHeight = strokeWidth;

    path.moveTo(x, waistY - armHeight / 2);
    path.lineTo(x + armWidth, waistY - armHeight / 2);
    path.lineTo(x + armWidth, waistY + armHeight / 2);
    path.lineTo(x, waistY + armHeight / 2);
    path.close();
     */
}

function createCustomGlyph(char, advanceWidth, fontSize, params) {
  const path = new opentype.Path()
  const cornerRadius = params.cornerRadius / 100
  if (char === '0') {
    drawRoundedBoxGlyph({
      path,
      x: 0, // origin (left side)
      y: 0, // baseline
      width: fontSize * 0.6, // glyph width
      height: fontSize * 1.2, // glyph height
      strokeWidth: params.strokeWidth,
      radius: fontSize * cornerRadius,
      cornerRatio: params.cornerRatio
    })
  }

  if (char === '1') {
    path.moveTo(-10, -10)
    path.lineTo(110, -10)
    path.lineTo(110, 110)
    path.lineTo(-10, 110)
    path.lineTo(-10, -10)

    path.moveTo(0, 40)
    path.lineTo(0, 60)
    arcTo(path, 0, 100, 40, 100, 30)
    path.lineTo(60, 100)
    arcTo(path, 100, 100, 100, 60, 30)
    path.lineTo(100, 40)
    arcTo(path, 100, 0, 60, 0, 30)
    path.lineTo(40, 0)
    arcTo(path, 0, 0, 0, 40, 30)
    path.close()
  }

  if (char === '8') {
    drawDoubleBoxGlyph({
      path,
      x: 0,
      y: 0,
      width: fontSize * 0.6,
      height: fontSize * 1.2,
      strokeWidth: params.strokeWidth,
      radius: fontSize * cornerRadius,
      loopRatio: params.loopRatio,
      cornerRatio: params.cornerRatio
    })
  }

  if (char === '3') {
    drawThreeGlyph({
      path,
      x: 0,
      y: 0,
      width: fontSize * 0.6,
      height: fontSize * 1.2,
      strokeWidth: params.strokeWidth,
      radius: fontSize * cornerRadius,
      loopRatio: params.loopRatio,
      terminalRatio: params.terminalRatio,
      waistLength: params.waistLength,
      cornerRatio: params.cornerRatio
    })
  }

  return new opentype.Glyph({
    name: char,
    unicode: char.charCodeAt(0),
    advanceWidth,
    path
  })
}

export function buildFont(params) {
  const glyphs = []

  // Required .notdef glyph
  glyphs.push(
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 200,
      path: new opentype.Path()
    })
  )

  const chars = '0123456789.'
  const fontSize = 96

  for (const char of chars) {
    const glyph = createCustomGlyph(char, fontSize * 0.6, fontSize, params)
    glyphs.push(glyph)
  }

  const font = new opentype.Font({
    familyName: 'ParametricDigits',
    styleName: 'Regular',
    unitsPerEm: fontSize,
    ascender: fontSize * 0.8,
    descender: -fontSize * 0.2,
    glyphs,
    kerningPairs: {} // important even if empty
  })

  font.encoding = {
    charToGlyphIndex(c) {
      const unicode = c.charCodeAt(0)
      for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i)
        if (glyph.unicode === unicode) {
          return i // return index
        }
      }
      return 0 // fallback to .notdef
    }
  }

  return font
}
