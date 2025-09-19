import { GameStateData, SetData, Icon } from '../types';
import { MAX_CONCURRENT_ICONS, SPAWN_DELAY, ICON_SIZE } from '../constants';
import { createIcon, isIconActive } from '../entities/icon';
import { findSpawnPosition } from '../utils/math';

export function shouldSpawnIcon(state: GameStateData): boolean {
  if (state.state !== 'playing' || state.lives <= 0 || state.blockSpawning) {
    return false;
  }

  const activeIcons = state.icons.filter(isIconActive).length;
  const currentTime = Date.now();
  const timeSinceLastSpawn = currentTime - state.lastSpawnTime;

  return activeIcons < MAX_CONCURRENT_ICONS && timeSinceLastSpawn > SPAWN_DELAY;
}

export function selectRandomSet(
  availableSets: SetData[],
  completedSets: Set<string>
): SetData | null {
  const uncompleted = availableSets.filter(set => !completedSets.has(set.code));

  if (uncompleted.length === 0) {
    return null; // All sets completed
  }

  return uncompleted[Math.floor(Math.random() * uncompleted.length)];
}

export function generateIconPosition(
  gameWidth: number,
  existingIcons: Icon[]
): number {
  const activeIcons = existingIcons.filter(isIconActive);
  const existingPositions = activeIcons
    .filter(icon => icon.y < 100) // Only consider icons near the top
    .map(icon => icon.x);

  return findSpawnPosition(gameWidth, existingPositions, ICON_SIZE * 2);
}

export function createNewIcon(
  state: GameStateData,
  setData: SetData,
  x: number
): Icon {
  const iconUrl = `https://svgs.scryfall.io/sets/${setData.code.toLowerCase()}.svg`;
  return createIcon(state.iconIdCounter, x, setData, iconUrl);
}

export function preloadImage(url: string): HTMLImageElement {
  const img = new Image();
  img.src = url;
  return img;
}

export function getIconUrl(setCode: string): string {
  return `https://svgs.scryfall.io/sets/${setCode.toLowerCase()}.svg`;
}