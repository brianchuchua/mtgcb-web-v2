import { GameStateData, GameConfig } from './types';
import { GAME_HEIGHT, GROUND_HEIGHT } from './constants';
import { updateIconPosition, updateIconAnimation, isIconExpired } from './entities/icon';
import { processIconCollision } from './systems/collision';
import { triggerGameOver } from './systems/input';
import { shouldSpawnIcon, selectRandomSet, generateIconPosition, createNewIcon, preloadImage, getIconUrl } from './systems/spawn';
import { updateIcons, addIcon, decrementLives, updateLastSpawnTime, clearCompletedSets, cacheImage } from './state';

export function updateGamePhysics(state: GameStateData, config: GameConfig): GameStateData {
  let newState = state;

  // Update icon positions and animations
  newState = updateIconPhysics(newState);

  // Check collisions
  newState = checkIconCollisions(newState, config);

  // Remove expired animations
  newState = removeExpiredIcons(newState);

  // Check spawning
  newState = handleIconSpawning(newState, config);

  return newState;
}

function updateIconPhysics(state: GameStateData): GameStateData {
  const updatedIcons = state.icons.map(icon => {
    // Update animation timers first
    let updatedIcon = updateIconAnimation(icon);

    // Then update position if not destroyed/failed
    updatedIcon = updateIconPosition(updatedIcon, GAME_HEIGHT, GROUND_HEIGHT);

    return updatedIcon;
  });

  return updateIcons(state, updatedIcons);
}

function checkIconCollisions(state: GameStateData, config: GameConfig): GameStateData {
  let newState = state;
  let shouldTriggerGameOver = false;

  const updatedIcons = state.icons.map(icon => {
    const beforeFailed = icon.failed;
    const updatedIcon = processIconCollision(icon);

    // If icon just failed (wasn't failed before, now is)
    if (!beforeFailed && updatedIcon.failed) {
      // Fire callback for missed icon
      config.callbacks.onMissedIcon(icon.setName);
      config.callbacks.onMessage(`Missed: ${icon.setName}`, 2000);

      // Decrement lives will be handled after mapping
      shouldTriggerGameOver = state.lives <= 1; // Will be 0 after decrement
    }

    return updatedIcon;
  });

  newState = updateIcons(newState, updatedIcons);

  // Count how many icons just failed
  const newlyFailedCount = updatedIcons.filter(icon => {
    const original = state.icons.find(i => i.id === icon.id);
    return original && !original.failed && icon.failed;
  }).length;

  // Decrement lives for each newly failed icon
  for (let i = 0; i < newlyFailedCount; i++) {
    newState = decrementLives(newState);
    config.callbacks.onLivesChange(newState.lives);
  }

  // Check for game over
  if (newState.lives <= 0 && !state.blockSpawning) {
    newState = triggerGameOver(newState, config);
  }

  return newState;
}

function removeExpiredIcons(state: GameStateData): GameStateData {
  const activeIcons = state.icons.filter(icon => !isIconExpired(icon));
  return updateIcons(state, activeIcons);
}

function handleIconSpawning(state: GameStateData, config: GameConfig): GameStateData {
  if (!shouldSpawnIcon(state)) {
    return state;
  }

  // Check if we need to reset completed sets
  let newState = state;
  if (state.completedSets.size >= config.sets.length) {
    newState = clearCompletedSets(newState);
  }

  const selectedSet = selectRandomSet(config.sets, newState.completedSets);
  if (!selectedSet) {
    // All sets completed - this should trigger win condition elsewhere
    return newState;
  }

  const iconUrl = getIconUrl(selectedSet.code);

  // Preload image if not cached
  if (!newState.imageCache.has(iconUrl)) {
    const img = preloadImage(iconUrl);
    newState = cacheImage(newState, iconUrl, img);
  }

  const x = generateIconPosition(config.width, newState.icons);
  const newIcon = createNewIcon(newState, selectedSet, x);

  // Attach cached image to icon if available
  if (newState.imageCache.has(iconUrl)) {
    newIcon.image = newState.imageCache.get(iconUrl);
  }

  newState = addIcon(newState, newIcon);
  newState = updateLastSpawnTime(newState, Date.now());

  return newState;
}