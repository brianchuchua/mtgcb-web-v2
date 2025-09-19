import { GameStateData, GameConfig, Icon } from './types';
import { ICON_SIZE, GAME_HEIGHT, GROUND_HEIGHT, DANGER_ZONE_OPACITY } from './constants';
import { clearCanvas, drawLine, drawRect, applyIconShadow, clearIconShadow } from './utils/canvas';
import { calculateDrawDimensions } from './utils/math';
import { renderSuccessAnimation, renderFailureAnimation } from './entities/animations';
import { renderHint } from './systems/hints';

export function renderGameScreen(state: GameStateData, config: GameConfig): void {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return;

  clearCanvas(ctx, config.width, GAME_HEIGHT);
  drawGameBackground(ctx, config.width);
  drawGroundLine(ctx, config.width);
  drawDangerZone(ctx, config.width);

  // Render all icons
  state.icons.forEach(icon => {
    if (icon.destroyed) {
      renderSuccessAnimation(ctx, icon);
    } else if (icon.failed) {
      renderFailureAnimation(ctx, icon);
    } else {
      renderFallingIcon(ctx, icon, state, config);
      if (icon.showHint >= 0 && !config.hintsDisabled) {
        renderHint(ctx, icon);
      }
    }
  });
}

function drawGameBackground(ctx: CanvasRenderingContext2D, width: number): void {
  // Optional: Could add a subtle gradient or pattern
  // For now, keep it clear for performance
}

function drawGroundLine(ctx: CanvasRenderingContext2D, width: number): void {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  drawLine(ctx, 0, y, width, y, '#999', 2);
}

function drawDangerZone(ctx: CanvasRenderingContext2D, width: number): void {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  const color = `rgba(255, 0, 0, ${DANGER_ZONE_OPACITY})`;
  drawRect(ctx, 0, y, width, GROUND_HEIGHT, color);
}

function renderFallingIcon(ctx: CanvasRenderingContext2D, icon: Icon, state: GameStateData, config: GameConfig): void {
  const image = state.imageCache.get(icon.iconUrl);

  if (image && image.complete && image.naturalWidth !== 0) {
    renderIconImage(ctx, icon, image, config);
  } else {
    renderIconPlaceholder(ctx, icon);
  }
}

function renderIconImage(ctx: CanvasRenderingContext2D, icon: Icon, image: HTMLImageElement, config: GameConfig): void {
  const aspectRatio = image.naturalWidth / image.naturalHeight;
  const { width, height, x, y } = calculateDrawDimensions(
    icon.x,
    icon.y,
    ICON_SIZE,
    aspectRatio
  );

  // Calculate accuracy for this set
  let shadowColor = 'rgba(255, 255, 255, 0.8)'; // Default white
  if (config.statistics && config.statistics[icon.setCode]) {
    const stats = config.statistics[icon.setCode];
    const total = stats.successes + stats.failures;
    if (total > 0) {
      const accuracy = stats.successes / total;
      if (accuracy >= 0.7) {
        shadowColor = 'rgba(76, 175, 80, 0.9)'; // Green for >= 70% accuracy
      } else if (accuracy < 0.5) {
        shadowColor = 'rgba(244, 67, 54, 0.9)'; // Red for < 50% accuracy
      }
    }
  }

  // Apply shadow effect with color based on accuracy
  ctx.shadowBlur = 8;
  ctx.shadowColor = shadowColor;

  // Draw the icon
  ctx.drawImage(image, x, y, width, height);

  // Second pass for stronger outline
  ctx.shadowBlur = 2;
  ctx.drawImage(image, x, y, width, height);

  clearIconShadow(ctx);
}

function renderIconPlaceholder(ctx: CanvasRenderingContext2D, icon: Icon): void {
  // Draw placeholder with set code
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(icon.x, icon.y, ICON_SIZE, ICON_SIZE);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.strokeRect(icon.x, icon.y, ICON_SIZE, ICON_SIZE);

  // Draw set code prominently
  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon.setCode, icon.x + ICON_SIZE / 2, icon.y + ICON_SIZE / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

export function clearScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  clearCanvas(ctx, width, height);
}