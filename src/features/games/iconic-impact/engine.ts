import { GameEngine, GameConfig, GameStateData, GameState } from './types';
import { createInitialState, resetGameState, updateGameState } from './state';
import { processAnswer } from './systems/input';
import { renderTitleScreen } from './screens/title';
import { renderGameplayScreen } from './screens/game';
import { renderPauseScreen } from './screens/pause';
import { renderGameOverScreen } from './screens/gameover';
import { renderWinScreen } from './screens/win';

export function createGameEngine(config: GameConfig): GameEngine {
  let state = createInitialState(config.sets);
  let animationFrame: number | null = null;
  let isDestroyed = false;

  // Game loop
  function gameLoop(): void {
    if (isDestroyed) return;

    // Check for scheduled state changes
    if (state.scheduledStateChange && Date.now() >= state.scheduledStateChange.time) {
      state = updateGameState(state, state.scheduledStateChange.state);
      state.scheduledStateChange = undefined;
    }

    // Update and render based on current state
    switch (state.state) {
      case 'idle':
        state = renderTitleScreen(state, config);
        break;
      case 'playing':
        state = renderGameplayScreen(state, config);
        break;
      case 'paused':
        state = renderPauseScreen(state, config);
        break;
      case 'gameover':
        state = renderGameOverScreen(state, config);
        break;
      case 'won':
        state = renderWinScreen(state, config);
        break;
    }

    // Continue animation loop
    animationFrame = requestAnimationFrame(gameLoop);
    state.animationFrame = animationFrame;
  }

  // Start the game
  function start(): void {
    state = resetGameState(state);
    config.callbacks.onStateChange('playing');
    config.callbacks.onScoreChange(0);
    config.callbacks.onLivesChange(state.lives);
    config.callbacks.onProgressUpdate(0, config.sets.length);
  }

  // Pause the game
  function pause(): void {
    if (state.state === 'playing') {
      state = updateGameState(state, 'paused');
      config.callbacks.onStateChange('paused');
    }
  }

  // Resume the game
  function resume(): void {
    if (state.state === 'paused') {
      state = updateGameState(state, 'playing');
      config.callbacks.onStateChange('playing');
    }
  }

  // Reset the game
  function reset(): void {
    state = createInitialState(config.sets);
    config.callbacks.onStateChange('idle');
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    gameLoop(); // Restart the game loop
  }

  // Check answer
  function checkAnswer(input: string): boolean {
    if (state.state !== 'playing') return false;

    const result = processAnswer(state, config, input);
    state = result.newState;
    return result.matched;
  }

  // Handle canvas click
  function handleClick(): void {
    switch (state.state) {
      case 'idle':
        if (config.sets.length > 0) {
          start();
        }
        break;
      case 'playing':
        pause();
        break;
      case 'paused':
        resume();
        break;
      case 'gameover':
      case 'won':
        start();
        break;
    }
  }

  // Destroy the engine
  function destroy(): void {
    isDestroyed = true;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  // Update canvas size
  function updateSize(width: number): void {
    config.width = width;
    // Canvas will be resized on next render
  }

  // Start the game loop
  gameLoop();

  return {
    start,
    pause,
    resume,
    reset,
    checkAnswer,
    handleClick,
    destroy,
    updateSize,
  };
}