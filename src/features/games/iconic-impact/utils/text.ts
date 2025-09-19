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
  let revealedCount = 0;

  // Words to always show (they're BS and inconsistent)
  const keyWords = ['classic', 'core set', 'edition'];

  for (let i = 0; i < setName.length; i++) {
    // Always show spaces, colons, apostrophes, and dashes
    if (setName[i] === ' ' || setName[i] === ':' || setName[i] === "'" || setName[i] === '-') {
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

      if (isKeyWord) {
        hint += setName[i];
      } else if (revealedCount < visibleLength) {
        hint += setName[i];
        revealedCount++;
      } else {
        hint += '_';
      }
    }
  }

  return `(${setCode}) ${hint}`;
}

function calculateProgressiveHints(hiddenLength: number): number[] {
  // Calculate progressive hints based on the length of the unrevealed portion
  if (hiddenLength <= 4) {
    // Very short names: reveal 1 letter at a time
    return [1, 2, hiddenLength - 1];
  } else if (hiddenLength <= 8) {
    // Short names like "Lorwyn": reveal progressively
    return [
      2,
      Math.ceil(hiddenLength * 0.5),
      hiddenLength - 1
    ];
  } else if (hiddenLength <= 15) {
    // Medium names: reveal in larger chunks
    return [
      3,
      Math.ceil(hiddenLength * 0.4),
      Math.ceil(hiddenLength * 0.75)
    ];
  } else {
    // Long names: reveal in percentage-based chunks
    return [
      4,
      Math.ceil(hiddenLength * 0.35),
      Math.ceil(hiddenLength * 0.65),
      Math.ceil(hiddenLength * 0.85)
    ];
  }
}

function getHiddenCharacterCount(setName: string): number {
  // Count characters that would be hidden (not including always-shown words, spaces, colons)
  const lowerName = setName.toLowerCase();
  const keyWords = ['classic', 'core set', 'edition'];
  let hiddenCount = 0;

  for (let i = 0; i < setName.length; i++) {
    // Skip spaces, colons, apostrophes, and dashes
    if (setName[i] === ' ' || setName[i] === ':' || setName[i] === "'" || setName[i] === '-') {
      continue;
    }

    // Check if this position is part of a key word
    let isKeyWord = false;
    for (const word of keyWords) {
      const index = lowerName.indexOf(word);
      if (index !== -1 && i >= index && i < index + word.length) {
        isKeyWord = true;
        break;
      }
    }

    if (!isKeyWord) {
      hiddenCount++;
    }
  }

  return hiddenCount;
}

export function getHintForLevel(
  setName: string,
  setCode: string,
  hintLevel: number
): string {
  // Always show set code first
  if (hintLevel === 0) {
    // Check if there are pre-shown keywords
    const lowerName = setName.toLowerCase();
    const hasKeyWord = lowerName.includes('classic') ||
                       lowerName.includes('core set') ||
                       lowerName.includes('edition');

    if (hasKeyWord) {
      // Show set code plus the keywords/colons
      return createHintText(setName, setCode, 0);
    }
    // Just show set code
    return `(${setCode})`;
  }

  // Calculate how many characters are actually hideable
  const hiddenCharCount = getHiddenCharacterCount(setName);

  // Get progressive hints based on the hidden character count
  const visibleChars = calculateProgressiveHints(hiddenCharCount);

  // Ensure we have a valid hint level index
  const levelIndex = Math.min(hintLevel - 1, visibleChars.length - 1);

  if (levelIndex >= 0 && levelIndex < visibleChars.length) {
    return createHintText(setName, setCode, visibleChars[levelIndex]);
  }

  // Never show the full name - use the last hint level
  const lastHintChars = visibleChars[visibleChars.length - 1] || hiddenCharCount - 1;
  return createHintText(setName, setCode, Math.min(lastHintChars, hiddenCharCount - 1));
}

export function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}