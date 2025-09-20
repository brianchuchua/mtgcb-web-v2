import { GameEngine, GameConfig, GameStateData, GameState } from './types';
import {
  createInitialState,
  resetGameState,
  updateGameState,
  initializeWave,
  updateWaveProgress,
  isWaveComplete,
  createCheckpointData,
  restoreFromCheckpoint,
  markSetCompleted,
} from './state';
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
  const waveSize = config.waveSize || 10;
  let hasCheckpoint = false;

  // Restore from checkpoint if provided
  if (config.initialCheckpoint) {
    state = restoreFromCheckpoint(state, config.initialCheckpoint, waveSize);
    hasCheckpoint = true;
  }

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
      case 'wave-complete':
        state = renderWaveCompleteScreen(state, config);
        break;
    }

    // Continue animation loop
    animationFrame = requestAnimationFrame(gameLoop);
    state.animationFrame = animationFrame;
  }

  // Start the game
  function start(): void {
    // Check if we're resuming from a checkpoint
    const isResuming = hasCheckpoint && state.waveState.currentWave > 0;

    if (!isResuming) {
      state = resetGameState(state);
      // Initialize first wave only if not resuming
      state = initializeWave(state, 1, waveSize);
    }

    // Update the game state to playing
    state = updateGameState(state, 'playing');

    config.callbacks.onStateChange('playing');
    config.callbacks.onScoreChange(state.score);
    config.callbacks.onLivesChange(state.lives);

    // Calculate initial progress for resumed games
    const completedInWave = state.waveState.setsInCurrentWave.filter(
      code => state.completedSets.has(code)
    ).length;
    config.callbacks.onProgressUpdate(completedInWave, state.waveState.setsInCurrentWave.length);
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

    // If matched, check for wave completion
    if (result.matched && result.matchedSetCode) {
      state = markSetCompleted(state, result.matchedSetCode);
      state = updateWaveProgress(state, result.matchedSetCode);

      // Check if wave is complete
      if (isWaveComplete(state)) {
        // Block further spawning
        state = { ...state, blockSpawning: true };

        // Schedule wave complete screen
        state.scheduledStateChange = {
          state: 'wave-complete',
          time: Date.now() + 2000
        };

        // Trigger wave complete callback
        const nextWave = state.waveState.currentWave + 1;
        config.callbacks.onWaveComplete(state.waveState.currentWave, nextWave);

        // Request checkpoint save
        const checkpointData = createCheckpointData(
          state,
          config.gameMode || 'standard',
          config.hintsDisabled || false
        );
        config.callbacks.onRequestCheckpointSave(checkpointData);

        setTimeout(() => {
          config.callbacks.onStateChange('wave-complete');
        }, 2000);
      }
    }

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
        // Clear any checkpoint state for fresh start after game over
        hasCheckpoint = false;
        start();
        break;
      case 'won':
        start();
        break;
      case 'wave-complete':
        continueToNextWave();
        break;
    }
  }

  // Continue to next wave
  function continueToNextWave(): void {
    if (state.state !== 'wave-complete') return;

    const nextWave = state.waveState.currentWave + 1;

    // Check if there are more sets available
    const availableSets = state.allAvailableSets.filter(
      set => !state.waveState.totalSetsShown.includes(set.code)
    );

    if (availableSets.length === 0) {
      // No more sets, game won!
      state = updateGameState(state, 'won');
      config.callbacks.onAllWavesComplete();
      config.callbacks.onStateChange('won');
    } else {
      // Initialize next wave
      state = initializeWave(state, nextWave, waveSize);
      state = { ...state, blockSpawning: false };
      state = updateGameState(state, 'playing');

      config.callbacks.onWaveTransition(nextWave - 1, nextWave);
      config.callbacks.onStateChange('playing');
      config.callbacks.onProgressUpdate(0, state.waveState.setsInCurrentWave.length);
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

  // Render wave complete screen
  function renderWaveCompleteScreen(state: GameStateData, config: GameConfig): GameStateData {
    const ctx = config.canvas.getContext('2d');
    if (!ctx) return state;

    // Set canvas size
    config.canvas.width = config.width;
    config.canvas.height = config.height;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, config.width, config.height);

    // Draw wave complete message
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Wave ${state.waveState.currentWave} Complete!`, config.width / 2, config.height / 2 - 80);

    // Draw checkpoint saved message
    ctx.font = '24px Arial';
    ctx.fillStyle = '#4caf50';
    ctx.fillText('Progress Saved to Your Device', config.width / 2, config.height / 2 - 30);

    // Draw you can continue or come back later message
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('You can continue now or come back anytime to resume', config.width / 2, config.height / 2);

    // Draw instructions
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Click to continue to Wave ' + (state.waveState.currentWave + 1), config.width / 2, config.height / 2 + 40);

    // Draw stats
    ctx.font = '18px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Score: ${state.score} | Lives: ${state.lives}`, config.width / 2, config.height / 2 + 80);

    return state;
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