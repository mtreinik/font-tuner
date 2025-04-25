import {buildFont} from "./font-definition";

function getParams() {
    return {
        strokeWidth: parseFloat(document.getElementById('strokeWidth').value),
        cornerRadius: parseFloat(document.getElementById('cornerRadius').value),
        loopRatio: parseFloat(document.getElementById('loopRatio').value),
        terminalRatio: parseFloat(document.getElementById('terminalRatio').value),
        cornerRatio: parseFloat(document.getElementById('cornerRatio').value),
        waistLength: parseFloat(document.getElementById('waistLength').value),
        fontStress: parseFloat(document.getElementById('fontStress').value)
    };
}

function render() {
    const canvas = document.getElementById('glyphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const text = document.getElementById('inputNumber').value;
    const params = getParams();
    const font = buildFont(params);

    const fontSize = 96;
    const xStart = 100;
    let x = xStart;
    const y = 140;
    const spacing = 9


    for (const char of text) {
        const glyph = font.charToGlyph(char);
        const glyphPath = glyph.getPath(x, y, fontSize);
        glyphPath.draw(ctx);

        const box = glyph.getBoundingBox();
        ctx.strokeStyle = 'rgba(0,0,255,0.3)';
        ctx.strokeRect(x + box.x1, y - box.y2, box.x2 - box.x1, box.y2 - box.y1);

        ctx.strokeStyle = 'rgba(255,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, y); // same y as used in getPath
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        const bbox = glyph.getBoundingBox();
        x += (bbox.x2 - bbox.x1) + spacing;


    }
}

render()
document.getElementById('renderButton').addEventListener('click', render);
document.getElementById('strokeWidth').addEventListener('input', render);
document.getElementById('cornerRadius').addEventListener('input', render);
document.getElementById('loopRatio').addEventListener('input', render);
document.getElementById('terminalRatio').addEventListener('input', render);
document.getElementById('cornerRatio').addEventListener('input', render);
document.getElementById('waistLength').addEventListener('input', render);
document.getElementById('fontStress').addEventListener('input', render);
document.getElementById('inputNumber').addEventListener('input', render);
