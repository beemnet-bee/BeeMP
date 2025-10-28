export const drawBars = (
  canvasCtx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  bufferLength: number,
  width: number,
  height: number
) => {
  const barWidth = (width / bufferLength) * 1.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height;
    
    // HSL(39, 92%, 58%) -> amber-500
    const r = 245;
    const g = 158;
    const b = 11;
    const a = 0.3 + (dataArray[i] / 255) * 0.7;

    canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

    x += barWidth + 2; // Add 2 for spacing between bars
  }
};
