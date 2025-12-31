interface Point {
  x: number
  y: number
}

interface BezierSegment {
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  x: number
  y: number
}

interface PathCommand {
  type: string
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

interface Path {
  commands: PathCommand[]
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
}

export function f(obj: Object) {
  return `(${Object.keys(obj)
    .map((key) => `${key}=` + (typeof obj[key] === 'number' ? obj[key].toFixed(2) : obj[key]))
    .join(', ')})`
}

function approximateArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  clockwise: boolean
): BezierSegment[] {
  console.log(`approximateArc ${f({ cx, cy, r, startAngle, endAngle, clockwise })}`)

  let delta = endAngle - startAngle

  // Normalize delta into [0, 2π)
  if (clockwise && delta < 0) {
    delta += Math.PI * 2
  }
  if (!clockwise && delta > 0) {
    delta -= Math.PI * 2
  }

  const absDelta = Math.abs(delta)
  const segments = Math.ceil(absDelta / (Math.PI / 2))
  const angleStep = delta / segments

  const beziers: BezierSegment[] = []

  for (let i = 0; i < segments; i++) {
    const theta1 = startAngle + i * angleStep
    const theta2 = startAngle + (i + 1) * angleStep

    const t = (4 / 3) * Math.tan((theta2 - theta1) / 4)
    const cos1 = Math.cos(theta1),
      sin1 = Math.sin(theta1)
    const cos2 = Math.cos(theta2),
      sin2 = Math.sin(theta2)

    const p0: Point = { x: cx + r * cos1, y: cy + r * sin1 }
    const p1: Point = { x: p0.x - r * t * sin1, y: p0.y + r * t * cos1 }
    const p3: Point = { x: cx + r * cos2, y: cy + r * sin2 }
    const p2: Point = { x: p3.x + r * t * sin2, y: p3.y - r * t * cos2 }

    beziers.push({
      cp1x: p1.x,
      cp1y: p1.y,
      cp2x: p2.x,
      cp2y: p2.y,
      x: p3.x,
      y: p3.y
    })
  }

  return beziers
}

export function arcTo(
  path: Path,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number
): void {
  if (radius === 0) {
    path.lineTo(x1, y1)
    return
  }

  const commands = path.commands
  if (commands.length === 0) {
    path.moveTo(x1, y1)
    return
  }

  const lastCmd = commands[commands.length - 1]
  const currentX = lastCmd.x ?? lastCmd.x2 ?? lastCmd.x1
  const currentY = lastCmd.y ?? lastCmd.y2 ?? lastCmd.y1

  const p0: Point = { x: currentX!, y: currentY! }
  const p1: Point = { x: x1, y: y1 }
  const p2: Point = { x: x2, y: y2 }

  const v1: Point = { x: p0.x - p1.x, y: p0.y - p1.y }
  const v2: Point = { x: p2.x - p1.x, y: p2.y - p1.y }

  const len1 = Math.hypot(v1.x, v1.y)
  const len2 = Math.hypot(v2.x, v2.y)

  if (len1 === 0 || len2 === 0) {
    path.lineTo(p1.x, p1.y)
    return
  }

  const v1n: Point = { x: v1.x / len1, y: v1.y / len1 }
  const v2n: Point = { x: v2.x / len2, y: v2.y / len2 }

  const angle = Math.acos(v1n.x * v2n.x + v1n.y * v2n.y) / 2
  const dist = radius / Math.tan(angle)
  const dist1 = Math.min(dist, len1)
  const dist2 = Math.min(dist, len2)

  const pA: Point = {
    x: p1.x + v1n.x * dist1,
    y: p1.y + v1n.y * dist1
  }
  const pB: Point = {
    x: p1.x + v2n.x * dist2,
    y: p1.y + v2n.y * dist2
  }

  const ortho = {
    x: v1n.x + v2n.x,
    y: v1n.y + v2n.y
  }
  const orthoLen = Math.hypot(ortho.x, ortho.y)
  const centerDir = { x: ortho.x / orthoLen, y: ortho.y / orthoLen }
  const centerDistance = radius / Math.sin(angle)

  const center: Point = {
    x: p1.x + centerDir.x * centerDistance,
    y: p1.y + centerDir.y * centerDistance
  }

  const cross = v1n.x * v2n.y - v1n.y * v2n.x
  const clockwise = cross < 0

  const startAngle = Math.atan2(pA.y - center.y, pA.x - center.x)
  const endAngle = Math.atan2(pB.y - center.y, pB.x - center.x)

  const arc = approximateArc(center.x, center.y, radius, startAngle, endAngle, clockwise)

  path.lineTo(pA.x, pA.y)
  for (const seg of arc) {
    path.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x, seg.y)
  }
}
