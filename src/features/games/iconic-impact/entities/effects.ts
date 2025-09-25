import { TitleIcon } from '../types';
import { ICON_SIZE, TITLE_ICON_OPACITY, TITLE_ICON_MIN_SPEED, TITLE_ICON_SPEED_VARIANCE, GAME_HEIGHT } from '../constants';
import { getRandomInRange, findSpawnPosition, calculateDrawDimensions } from '../utils/math';
import { saveContext, restoreContext, setGlobalAlpha, applyIconShadow, clearIconShadow } from '../utils/canvas';

export function createTitleIcon(
  x: number,
  y: number,
  iconUrl: string
): TitleIcon {
  return {
    x,
    y,
    iconUrl,
    speed: TITLE_ICON_MIN_SPEED + Math.random() * TITLE_ICON_SPEED_VARIANCE,
  };
}

export function updateTitleIcon(
  icon: TitleIcon,
  gameWidth: number,
  availableSets: Array<{ code: string }>,
  existingIcons: TitleIcon[],
  deltaTime: number
): TitleIcon {
  const newY = icon.y + (icon.speed * deltaTime);

  // If icon falls off screen, respawn at top
  if (newY > GAME_HEIGHT) {
    const randomSet = availableSets[Math.floor(Math.random() * availableSets.length)];
    const iconUrl = `https://svgs.scryfall.io/sets/${randomSet.code.toLowerCase()}.svg`;

    const existingPositions = existingIcons
      .filter(i => i !== icon && i.y < 100)
      .map(i => i.x);

    const newX = findSpawnPosition(gameWidth - ICON_SIZE, existingPositions, ICON_SIZE * 2);

    return {
      x: newX,
      y: -ICON_SIZE,
      iconUrl,
      speed: TITLE_ICON_MIN_SPEED + Math.random() * TITLE_ICON_SPEED_VARIANCE,
    };
  }

  return { ...icon, y: newY };
}

export function renderTitleIcon(
  ctx: CanvasRenderingContext2D,
  icon: TitleIcon,
  image?: HTMLImageElement
): void {
  if (!image || !image.complete || image.naturalWidth === 0) {
    // Draw placeholder
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#666';
    ctx.fillRect(icon.x, icon.y, ICON_SIZE, ICON_SIZE);
    ctx.globalAlpha = 1.0;
    return;
  }

  const aspectRatio = image.naturalWidth / image.naturalHeight;
  const { width, height, x, y } = calculateDrawDimensions(icon.x, icon.y, ICON_SIZE, aspectRatio);

  saveContext(ctx);
  setGlobalAlpha(ctx, TITLE_ICON_OPACITY);
  applyIconShadow(ctx);

  // Draw with multiple passes for stronger effect
  ctx.drawImage(image, x, y, width, height);
  ctx.shadowBlur = 2;
  ctx.drawImage(image, x, y, width, height);

  clearIconShadow(ctx);
  restoreContext(ctx);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  gameWidth: number,
  gameHeight: number,
  particleCount: number,
  colors: string[]
): void {
  ctx.globalAlpha = 0.1;

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * gameWidth;
    const y = Math.random() * gameHeight;
    const size = Math.random() * 20 + 10;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 1;
}

export function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topColor: string,
  bottomColor: string
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}