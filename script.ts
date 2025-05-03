import { buildFont } from './font-definition'

interface FontParams {
  strokeWidth: number
  cornerRadius: number
  loopRatio: number
  terminalRatio: number
  cornerRatio: number
  waistLength: number
  fontStress: number
}

function getInputValue(id: string): number {
  const input = document.getElementById(id) as HTMLInputElement | null
  if (!input) {
    throw new Error(`Element with id '${id}' not found.`)
  }
  return parseFloat(input.value)
}

function getParams(): FontParams {
  return {
    strokeWidth: getInputValue('strokeWidth'),
    cornerRadius: getInputValue('cornerRadius'),
    loopRatio: getInputValue('loopRatio'),
    terminalRatio: getInputValue('terminalRatio'),
    cornerRatio: getInputValue('cornerRatio'),
    waistLength: getInputValue('waistLength'),
    fontStress: getInputValue('fontStress')
  }
}

function render(): void {
  const canvas = document.getElementById('glyphCanvas') as HTMLCanvasElement | null
  if (!canvas) {
    console.error('Canvas element not found')
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Could not get canvas 2D context')
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const input = document.getElementById('inputNumber') as HTMLInputElement | null
  if (!input) {
    console.error('Input element for number not found')
    return
  }

  const text = input.value
  const params = getParams()
  const font = buildFont(params)

  const fontSize = 96
  const xStart = 100
  let x = xStart
  const y = 140
  const spacing = 9

  for (const char of text) {
    const glyph = font.charToGlyph(char)
    const glyphPath = glyph.getPath(x, y, fontSize)
    glyphPath.draw(ctx)

    const box = glyph.getBoundingBox()
    ctx.strokeStyle = 'rgba(0,0,255,0.3)'
    ctx.strokeRect(x + box.x1, y - box.y2, box.x2 - box.x1, box.y2 - box.y1)

    ctx.strokeStyle = 'rgba(255,0,0,0.3)'
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()

    x += box.x2 - box.x1 + spacing
  }
}

// Initial render
render()

// Register events for UI elements
const controls = [
  'renderButton',
  'strokeWidth',
  'cornerRadius',
  'loopRatio',
  'terminalRatio',
  'cornerRatio',
  'waistLength',
  'fontStress',
  'inputNumber'
]

for (const id of controls) {
  const element = document.getElementById(id)
  if (element) {
    const event = id === 'renderButton' ? 'click' : 'input'
    element.addEventListener(event, render)
  } else {
    console.warn(`Element with id '${id}' not found.`)
  }
}
