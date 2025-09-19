export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function applyIconShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function clearIconShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function saveContext(ctx: CanvasRenderingContext2D): void {
  ctx.save();
}

export function restoreContext(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

export function setGlobalAlpha(ctx: CanvasRenderingContext2D, alpha: number): void {
  ctx.globalAlpha = alpha;
}

export function resetGlobalAlpha(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1.0;
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor: string,
  strokeColor: string,
  lineWidth: number
): void {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string
): void {
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, width, height);
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}