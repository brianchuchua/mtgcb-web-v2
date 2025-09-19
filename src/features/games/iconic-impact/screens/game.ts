import { GameStateData, GameConfig } from '../types';
import { renderGameScreen } from '../renderer';
import { updateGamePhysics } from '../physics';

export function renderGameplayScreen(state: GameStateData, config: GameConfig): GameStateData {
  // Update physics
  const newState = updateGamePhysics(state, config);

  // Render the game
  renderGameScreen(newState, config);

  return newState;
}