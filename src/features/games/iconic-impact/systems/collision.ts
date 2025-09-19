import { Icon } from '../types';
import { GAME_HEIGHT, GROUND_HEIGHT, GROUND_TEXT_PADDING, HINT_TEXT_OFFSET } from '../constants';
import { isIconActive, markIconFailed } from '../entities/icon';

export function checkGroundCollision(icon: Icon): boolean {
  if (!isIconActive(icon)) return false;

  // Icon fails when the text label is fully below the ground line with padding
  // Text is drawn at icon.y - HINT_TEXT_OFFSET
  const textTop = icon.y - HINT_TEXT_OFFSET;
  const groundLine = GAME_HEIGHT - GROUND_HEIGHT;

  return textTop >= groundLine + GROUND_TEXT_PADDING;
}

export function processIconCollision(icon: Icon): Icon {
  if (checkGroundCollision(icon)) {
    return markIconFailed(icon);
  }
  return icon;
}

export function countFailedIcons(icons: Icon[]): number {
  return icons.filter(icon => icon.failed).length;
}

export function getCollidedIcon(icons: Icon[]): Icon | undefined {
  return icons.find(icon => checkGroundCollision(icon));
}

export function isInDangerZone(icon: Icon): boolean {
  const groundLine = GAME_HEIGHT - GROUND_HEIGHT;
  return icon.y >= groundLine - 100 && icon.y < groundLine;
}