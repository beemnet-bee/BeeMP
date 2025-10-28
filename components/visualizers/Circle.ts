export const drawCircle = (
  canvasCtx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  bufferLength: number,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * (height / 2.5);
    const angle = (i / bufferLength) * 2 * Math.PI;

    const x1 = centerX + radius * Math.cos(angle);
    const y1 = centerY + radius * Math.sin(angle);
    const x2 = centerX + (radius + barHeight) * Math.cos(angle);
    const y2 = centerY + (radius + barHeight) * Math.sin(angle);

    // HSL(39, 92%, 58%) -> amber-500
    const r = 245;
    const g = 158;
    const b = 11;
    const a = 0.3 + (dataArray[i] / 255) * 0.7;

    canvasCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    canvasCtx.lineTo(x2, y2);
    canvasCtx.stroke();
  }
};
