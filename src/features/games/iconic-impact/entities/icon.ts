import { Icon, SetData } from '../types';
import { ICON_SIZE, FALL_SPEED, HINT_THRESHOLDS, SUCCESS_ANIMATION_DURATION, FAILURE_ANIMATION_DURATION } from '../constants';
import { calculateProgress } from '../utils/math';

export function createIcon(
  id: number,
  x: number,
  setData: SetData,
  iconUrl: string
): Icon {
  return {
    id,
    x,
    y: -ICON_SIZE,
    setCode: setData.code,
    setName: setData.name,
    iconUrl,
    speed: FALL_SPEED,
    showHint: -1,
    destroyed: false,
  };
}

export function updateIconPosition(icon: Icon, gameHeight: number, groundHeight: number): Icon {
  if (icon.destroyed || icon.failed) return icon;

  const newY = icon.y + icon.speed;
  const progress = calculateProgress(newY, gameHeight, groundHeight);
  const hintLevel = calculateHintLevel(progress);

  return { ...icon, y: newY, showHint: hintLevel };
}

export function calculateHintLevel(progress: number): number {
  let hintLevel = -1;
  for (let i = 0; i < HINT_THRESHOLDS.length; i++) {
    if (progress >= HINT_THRESHOLDS[i]) {
      hintLevel = i;
    }
  }
  return hintLevel;
}

export function markIconDestroyed(icon: Icon): Icon {
  return {
    ...icon,
    destroyed: true,
    animationTimer: SUCCESS_ANIMATION_DURATION,
    animationRadius: 0,
  };
}

export function markIconFailed(icon: Icon): Icon {
  return {
    ...icon,
    failed: true,
    animationTimer: FAILURE_ANIMATION_DURATION,
    animationRadius: 0,
  };
}

export function updateIconAnimation(icon: Icon): Icon {
  if (icon.animationTimer === undefined || icon.animationTimer <= 0) {
    return icon;
  }

  const newTimer = icon.animationTimer - 1;
  const radiusIncrement = icon.failed ? 0.25 : 1; // Failure expands slower
  const newRadius = (icon.animationRadius || 0) + radiusIncrement;

  return {
    ...icon,
    animationTimer: newTimer,
    animationRadius: newRadius,
  };
}

export function isIconExpired(icon: Icon): boolean {
  return (icon.destroyed || icon.failed === true) &&
         icon.animationTimer !== undefined &&
         icon.animationTimer <= 0;
}

export function isIconActive(icon: Icon): boolean {
  return !icon.destroyed && !icon.failed;
}

export function getIconImage(icon: Icon, imageCache: Map<string, HTMLImageElement>): HTMLImageElement | undefined {
  return imageCache.get(icon.iconUrl);
}

export function preloadIconImage(iconUrl: string): HTMLImageElement {
  const img = new Image();
  img.src = iconUrl;
  return img;
}

export function iconMatchesInput(icon: Icon, normalizedInput: string): boolean {
  return !icon.destroyed &&
         !icon.failed &&
         icon.setName.toLowerCase() === normalizedInput;
}