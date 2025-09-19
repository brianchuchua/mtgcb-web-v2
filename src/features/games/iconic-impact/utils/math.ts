import { ICON_SIZE } from '../constants';

export function calculateDrawDimensions(
  x: number,
  y: number,
  targetSize: number,
  aspectRatio: number
): { width: number; height: number; x: number; y: number } {
  let drawWidth = targetSize;
  let drawHeight = targetSize;

  if (aspectRatio > 1) {
    // Wider than tall - fit to width
    drawHeight = targetSize / aspectRatio;
  } else {
    // Taller than wide - fit to height
    drawWidth = targetSize * aspectRatio;
  }

  // Center the icon in its space
  const drawX = x + (targetSize - drawWidth) / 2;
  const drawY = y + (targetSize - drawHeight) / 2;

  return { width: drawWidth, height: drawHeight, x: drawX, y: drawY };
}

export function getRandomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(getRandomInRange(min, max));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateProgress(y: number, gameHeight: number, groundHeight: number): number {
  return y / (gameHeight - groundHeight);
}

export function calculateOpacity(timer: number, fadeStartTime: number): number {
  return Math.min(1, timer / fadeStartTime);
}

export function findSpawnPosition(
  gameWidth: number,
  existingPositions: number[],
  minDistance: number,
  maxAttempts: number = 10
): number {
  const padding = Math.min(150, gameWidth * 0.15);
  const minX = padding;
  const maxX = gameWidth - ICON_SIZE - padding;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = getRandomInRange(minX, maxX);

    // Check if position is far enough from existing positions
    const isFarEnough = existingPositions.every(
      existingX => Math.abs(existingX - x) >= minDistance
    );

    if (isFarEnough || existingPositions.length === 0) {
      return x;
    }
  }

  // If no good position found, return a random one
  return getRandomInRange(minX, maxX);
}