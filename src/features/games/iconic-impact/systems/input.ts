import { GameStateData, GameConfig, Icon } from '../types';
import { normalizeInput } from '../utils/text';
import { iconMatchesInput, markIconDestroyed } from '../entities/icon';
import { calculatePoints, getScoreMessage } from './scoring';
import {
  updateScore,
  incrementCorrectGuesses,
  markSetCompleted,
  updateIcons,
  updateGameState,
  setBlockSpawning
} from '../state';

export function processAnswer(
  state: GameStateData,
  config: GameConfig,
  input: string
): { matched: boolean; newState: GameStateData } {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return { matched: false, newState: state };
  }

  const matchedIcon = findMatchingIcon(state.icons, normalized);
  if (!matchedIcon) {
    return { matched: false, newState: state };
  }

  const points = calculatePoints(matchedIcon);
  const message = getScoreMessage(points);

  // Update the matched icon
  const updatedIcons = state.icons.map(icon =>
    icon.id === matchedIcon.id ? markIconDestroyed(icon) : icon
  );

  // Update state
  let newState = updateIcons(state, updatedIcons);
  newState = updateScore(newState, points);
  newState = incrementCorrectGuesses(newState);
  newState = markSetCompleted(newState, matchedIcon.setCode);

  // Fire callbacks
  config.callbacks.onCorrectGuess(matchedIcon.setName, points);
  config.callbacks.onScoreChange(newState.score);
  config.callbacks.onMessage(message, 2000);
  config.callbacks.onProgressUpdate(newState.correctGuesses, config.sets.length);

  // Check win condition
  if (checkWinCondition(newState, config)) {
    newState = triggerWin(newState, config);
  }

  return { matched: true, newState };
}

export function findMatchingIcon(icons: Icon[], normalizedInput: string): Icon | undefined {
  return icons.find(icon => iconMatchesInput(icon, normalizedInput));
}

export function checkWinCondition(state: GameStateData, config: GameConfig): boolean {
  return state.completedSets.size >= config.sets.length;
}

export function triggerWin(state: GameStateData, config: GameConfig): GameStateData {
  let newState = setBlockSpawning(state, true);

  // Schedule the state change for later
  newState.scheduledStateChange = {
    state: 'won',
    time: Date.now() + 1500
  };

  // Also notify React after delay for UI updates
  setTimeout(() => {
    config.callbacks.onStateChange('won');
    config.callbacks.onGameComplete();
  }, 1500);

  return newState;
}

export function triggerGameOver(state: GameStateData, config: GameConfig): GameStateData {
  let newState = setBlockSpawning(state, true);

  // Schedule the state change for later
  newState.scheduledStateChange = {
    state: 'gameover',
    time: Date.now() + 1500
  };

  // Also notify React after delay for UI updates
  setTimeout(() => {
    config.callbacks.onStateChange('gameover');
  }, 1500);

  return newState;
}