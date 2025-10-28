// Helper to draw a single hexagon
const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const pointX = x + size * Math.cos(angle);
    const pointY = y + size * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

export const drawHoneycomb = (
  canvasCtx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  bufferLength: number,
  width: number,
  height: number
) => {
  const hexSize = 20;
  const hexWidth = Math.sqrt(3) * hexSize;
  const hexHeight = 2 * hexSize;
  
  const cols = Math.ceil(width / hexWidth) + 1;
  const rows = Math.ceil(height / (hexHeight * 3 / 4)) + 1;

  // Calculate average frequency values for bass, mids, treble
  const bassAvg = dataArray.slice(0, bufferLength / 8).reduce((a, b) => a + b, 0) / (bufferLength / 8);
  const midAvg = dataArray.slice(bufferLength / 8, bufferLength / 2).reduce((a, b) => a + b, 0) / (bufferLength * 3 / 8);
  const trebleAvg = dataArray.slice(bufferLength / 2).reduce((a, b) => a + b, 0) / (bufferLength / 2);

  canvasCtx.lineWidth = 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOffset = row % 2 === 0 ? 0 : hexWidth / 2;
      const x = col * hexWidth + xOffset;
      const y = row * hexHeight * 0.75;
      
      const distanceToCenter = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
      const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
      const distNormal = distanceToCenter / maxDist; // 0 at center, 1 at corners

      let sizePulse, alpha;
      
      // Affect hexagons based on their distance from the center
      if (distNormal < 0.33) { // Center (bass)
        sizePulse = bassAvg;
        alpha = bassAvg / 255;
      } else if (distNormal < 0.66) { // Middle (mids)
        sizePulse = midAvg;
        alpha = midAvg / 255;
      } else { // Outer (treble)
        sizePulse = trebleAvg;
        alpha = trebleAvg / 255;
      }
      
      const dynamicSize = hexSize * 0.5 + (sizePulse / 255) * hexSize * 0.8;
      
      // HSL(39, 92%, 58%) -> amber-500
      const r = 245;
      const g = 158;
      const b = 11;
      
      canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
      canvasCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`;

      drawHex(canvasCtx, x, y, dynamicSize);
    }
  }
};
