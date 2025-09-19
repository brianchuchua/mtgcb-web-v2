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

  // Skip the currently falling icon (counts as failure)
  function skipCurrentIcon(): void {
    if (state.state !== 'playing') return;

    // Find the first active (non-destroyed, non-failed) icon
    const activeIcon = state.icons.find(icon => !icon.destroyed && !icon.failed);
    if (!activeIcon) return;

    // Mark it as failed with animation
    const updatedIcons = state.icons.map(icon => {
      if (icon.id === activeIcon.id) {
        return {
          ...icon,
          failed: true,
          animationTimer: 30,  // Start animation timer
          animationRadius: 0   // Start animation radius
        };
      }
      return icon;
    });

    state = { ...state, icons: updatedIcons };

    // Decrement lives
    state = { ...state, lives: state.lives - 1 };

    // Fire callbacks
    config.callbacks.onMissedIcon(activeIcon.setName);
    config.callbacks.onSetFailure(activeIcon.setCode, activeIcon.setName);
    config.callbacks.onLivesChange(state.lives);
    config.callbacks.onMessage(`Skipped: ${activeIcon.setName}`, 2000);

    // Check for game over
    if (state.lives <= 0) {
      // Trigger game over
      state = { ...state, blockSpawning: true };
      state.scheduledStateChange = {
        state: 'gameover',
        time: Date.now() + 1500
      };

      setTimeout(() => {
        config.callbacks.onStateChange('gameover');
      }, 1500);
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

  // Update statistics
  function updateStatistics(statistics: GameConfig['statistics']): void {
    config.statistics = statistics;
  }

  // Update hints disabled setting
  function updateHintsDisabled(hintsDisabled: boolean): void {
    config.hintsDisabled = hintsDisabled;
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
    updateStatistics,
    updateHintsDisabled,
    skipCurrentIcon,
  };
}