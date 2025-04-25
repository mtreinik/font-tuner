
function approximateArc(cx, cy, r, startAngle, endAngle, clockwise) {
    console.log(`approximateArc ${JSON.stringify({cx, cy, r, startAngle, endAngle, clockwise})}`)

    let delta = endAngle - startAngle;

    // Normalize delta into [0, 2π)
    if (clockwise && delta < 0) {
        delta += Math.PI * 2;
    }
    if (!clockwise && delta > 0) {
        delta -= Math.PI * 2;
    }

    const absDelta = Math.abs(delta);
    const segments = Math.ceil(absDelta / (Math.PI / 2)); // up to quarter-circle per segment
    const angleStep = delta / segments; // step follows delta direction (positive or negative)

    const beziers = [];

    for (let i = 0; i < segments; i++) {
        const theta1 = startAngle + i * angleStep;
        const theta2 = startAngle + (i + 1) * angleStep;

        const t = (4 / 3) * Math.tan((theta2 - theta1) / 4);
        const cos1 = Math.cos(theta1), sin1 = Math.sin(theta1);
        const cos2 = Math.cos(theta2), sin2 = Math.sin(theta2);

        const p0 = { x: cx + r * cos1, y: cy + r * sin1 };
        const p1 = { x: p0.x - r * t * sin1, y: p0.y + r * t * cos1 };
        const p3 = { x: cx + r * cos2, y: cy + r * sin2 };
        const p2 = { x: p3.x + r * t * sin2, y: p3.y - r * t * cos2 };

        beziers.push({
            cp1x: p1.x, cp1y: p1.y,
            cp2x: p2.x, cp2y: p2.y,
            x: p3.x, y: p3.y
        });
    }

    return beziers;
}


export function arcTo(path, x1, y1, x2, y2, radius) {
    // If radius is zero, just use a straight line
    if (radius === 0) {
        path.lineTo(x1, y1);
        return;
    }

    const commands = path.commands;
    if (commands.length === 0) {
        // No current point — fallback to moveTo
        path.moveTo(x1, y1);
        return;
    }

    // Get current point from last command (supports lineTo and bezierCurveTo)
    const lastCmd = commands[commands.length - 1];
    const currentX = lastCmd.x ?? lastCmd.x2 ?? lastCmd.x1;
    const currentY = lastCmd.y ?? lastCmd.y2 ?? lastCmd.y1;

    const p0 = { x: currentX, y: currentY }; // Current point (start of arc)
    const p1 = { x: x1, y: y1 };             // Tangent vertex
    const p2 = { x: x2, y: y2 };             // Target direction after arc

    // Compute vectors: p0→p1 and p2→p1
    const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    // If any length is zero (no angle), fallback to straight line
    if (len1 === 0 || len2 === 0) {
        path.lineTo(p1.x, p1.y);
        return;
    }

    // Normalize vectors
    const v1n = { x: v1.x / len1, y: v1.y / len1 };
    const v2n = { x: v2.x / len2, y: v2.y / len2 };

    // Angle between the two segments
    const angle = Math.acos(v1n.x * v2n.x + v1n.y * v2n.y) / 2;

    // Distance from p1 to arc start/end points along each segment
    const dist = radius / Math.tan(angle);
    const dist1 = Math.min(dist, len1);
    const dist2 = Math.min(dist, len2);

    // Points where the arc starts and ends
    const pA = {
        x: p1.x + v1n.x * dist1,
        y: p1.y + v1n.y * dist1
    };
    const pB = {
        x: p1.x + v2n.x * dist2,
        y: p1.y + v2n.y * dist2
    };

    // Compute the arc center
    const ortho = {
        x: v1n.x + v2n.x,
        y: v1n.y + v2n.y
    };
    const orthoLen = Math.hypot(ortho.x, ortho.y);
    const centerDir = { x: ortho.x / orthoLen, y: ortho.y / orthoLen };
    const centerDistance = radius / Math.sin(angle);

    const center = {
        x: p1.x + centerDir.x * centerDistance,
        y: p1.y + centerDir.y * centerDistance
    };

    // Cross product to determine turn direction
    const cross = (v1n.x * v2n.y) - (v1n.y * v2n.x);
    const clockwise = cross < 0; // Correct detection

    // Compute start and end angles relative to center
    const startAngle = Math.atan2(pA.y - center.y, pA.x - center.x);
    const endAngle = Math.atan2(pB.y - center.y, pB.x - center.x);

    // Create arc approximation
    const arc = approximateArc(center.x, center.y, radius, startAngle, endAngle, clockwise);

    // Now line to arc start point and draw arc curves
    path.lineTo(pA.x, pA.y);
    for (const seg of arc) {
        path.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x, seg.y);
    }

}
