export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'start'
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function drawTextWithStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  align: CanvasTextAlign = 'start'
): void {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

export function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  font: string,
  color: string
): void {
  drawText(ctx, text, centerX, y, font, color, 'center');
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'center'
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
}

export function createHintText(
  setName: string,
  setCode: string,
  visibleLength: number
): string {
  const lowerName = setName.toLowerCase();
  let hint = '';

  // Words to always show
  const keyWords = ['classic', 'core set', 'edition'];

  for (let i = 0; i < setName.length; i++) {
    if (i < visibleLength) {
      hint += setName[i];
    } else if (setName[i] === ' ' || setName[i] === ':') {
      hint += setName[i];
    } else {
      // Check if this position is part of a key word
      let isKeyWord = false;
      for (const word of keyWords) {
        const index = lowerName.indexOf(word);
        if (index !== -1 && i >= index && i < index + word.length) {
          isKeyWord = true;
          break;
        }
      }
      hint += isKeyWord ? setName[i] : '_';
    }
  }

  return `(${setCode}) ${hint}`;
}

export function getHintForLevel(
  setName: string,
  setCode: string,
  hintLevel: number
): string {
  const nameLength = setName.length;
  const lowerName = setName.toLowerCase();

  // For the first hint, show key words even before the set code
  if (hintLevel === 0) {
    const hasKeyWord = lowerName.includes('classic') ||
                       lowerName.includes('core set') ||
                       lowerName.includes('edition');

    if (hasKeyWord) {
      return createHintText(setName, setCode, 0);
    }
    return `(${setCode})`;
  }

  const visibleChars = [
    4,
    Math.floor(nameLength / 2),
    Math.max(0, nameLength - 3),  // Always leave at least 3 letters hidden
  ];

  if (hintLevel <= visibleChars.length) {
    return createHintText(setName, setCode, visibleChars[hintLevel - 1]);
  }

  return createHintText(setName, setCode, nameLength);
}

export function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}