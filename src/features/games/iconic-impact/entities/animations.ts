import { Icon } from '../types';
import { SUCCESS_FADE_START, FAILURE_FADE_START, ICON_SIZE, ICON_TEXT_OFFSET } from '../constants';
import { calculateOpacity } from '../utils/math';
import { drawCircle } from '../utils/canvas';
import { drawTextWithStroke } from '../utils/text';

export function renderSuccessAnimation(ctx: CanvasRenderingContext2D, icon: Icon): void {
  if (!icon.animationTimer || icon.animationTimer <= 0) return;

  const opacity = calculateOpacity(icon.animationTimer, SUCCESS_FADE_START);
  const radius = icon.animationRadius || 0;

  // Draw expanding green circle
  const fillColor = `rgba(0, 255, 0, ${opacity * 0.3})`;
  const strokeColor = `rgba(0, 255, 0, ${opacity})`;

  drawCircle(
    ctx,
    icon.x + ICON_SIZE / 2,
    icon.y + ICON_SIZE / 2,
    radius,
    fillColor,
    strokeColor,
    3
  );

  // Draw success text
  drawTextWithStroke(
    ctx,
    icon.setName,
    icon.x + ICON_SIZE / 2,
    icon.y - ICON_TEXT_OFFSET,
    'bold 20px Arial',
    `rgba(0, 255, 0, ${opacity})`,
    `rgba(0, 0, 0, ${opacity * 0.5})`,
    1,
    'center'
  );
}

export function renderFailureAnimation(ctx: CanvasRenderingContext2D, icon: Icon): void {
  if (!icon.animationTimer || icon.animationTimer <= 0) return;

  const opacity = calculateOpacity(icon.animationTimer, FAILURE_FADE_START);
  const radius = (icon.animationRadius || 0) * 0.5; // Slower radius expansion

  // Draw expanding red circle
  const fillColor = `rgba(255, 0, 0, ${opacity * 0.3})`;
  const strokeColor = `rgba(255, 0, 0, ${opacity})`;

  drawCircle(
    ctx,
    icon.x + ICON_SIZE / 2,
    icon.y + ICON_SIZE / 2,
    radius,
    fillColor,
    strokeColor,
    3
  );

  // Draw failure text
  drawTextWithStroke(
    ctx,
    icon.setName,
    icon.x + ICON_SIZE / 2,
    icon.y - ICON_TEXT_OFFSET,
    'bold 20px Arial',
    `rgba(255, 0, 0, ${opacity})`,
    `rgba(0, 0, 0, ${opacity * 0.5})`,
    1,
    'center'
  );
}

export function animateExplosion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: { r: number; g: number; b: number },
  opacity: number
): void {
  const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`;
  const strokeColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;

  drawCircle(ctx, x, y, radius, fillColor, strokeColor, 3);
}

export function calculateAnimationProgress(timer: number, duration: number): number {
  return 1 - (timer / duration);
}

export function shouldAnimationEnd(timer: number): boolean {
  return timer <= 0;
}