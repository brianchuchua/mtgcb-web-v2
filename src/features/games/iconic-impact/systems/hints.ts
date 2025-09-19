import { Icon } from '../types';
import { ICON_SIZE, HINT_TEXT_OFFSET } from '../constants';
import { getHintForLevel } from '../utils/text';
import { drawTextWithStroke } from '../utils/text';

export function renderHint(ctx: CanvasRenderingContext2D, icon: Icon): void {
  if (icon.showHint < 0) return;

  const hintText = getHintForLevel(icon.setName, icon.setCode, icon.showHint);
  const centerX = icon.x + ICON_SIZE / 2;
  const y = icon.y - HINT_TEXT_OFFSET;

  drawTextWithStroke(
    ctx,
    hintText,
    centerX,
    y,
    'bold 16px Arial',
    'rgba(255, 255, 0, 0.9)',
    'rgba(0, 0, 0, 0.5)',
    1,
    'center'
  );
}

export function shouldShowHint(icon: Icon): boolean {
  return icon.showHint >= 0;
}

export function getHintText(icon: Icon): string {
  return getHintForLevel(icon.setName, icon.setCode, icon.showHint);
}