import { GameStateData, SetData, Icon, TitleIcon, GameState, WaveState } from './types';
import { INITIAL_LIVES } from './constants';

export function createInitialState(sets: SetData[]): GameStateData {
  return {
    state: 'idle',
    score: 0,
    lives: INITIAL_LIVES,
    correctGuesses: 0,
    icons: [],
    completedSets: new Set<string>(),
    lastSpawnTime: 0,
    blockSpawning: false,
    titleIcons: [],
    iconIdCounter: 0,
    animationFrame: null,
    imageCache: new Map<string, HTMLImageElement>(),
    waveState: {
      currentWave: 0,
      setsInCurrentWave: [],
      completedInWave: 0,
      totalSetsShown: [],
      waveStartLives: INITIAL_LIVES,
      waveStartScore: 0,
    },
    allAvailableSets: sets,
    lastFrameTime: performance.now(),
  };
}

export function resetGameState(state: GameStateData): GameStateData {
  return {
    ...state,
    state: 'playing',
    score: 0,
    lives: INITIAL_LIVES,
    correctGuesses: 0,
    icons: [],
    completedSets: new Set<string>(),
    lastSpawnTime: 0,
    blockSpawning: false,
    titleIcons: [],
    iconIdCounter: 0,
    lastFrameTime: performance.now(),
  };
}

export function updateGameState(state: GameStateData, newState: GameState): GameStateData {
  return {
    ...state,
    state: newState,
  };
}

export function addIcon(state: GameStateData, icon: Icon): GameStateData {
  return {
    ...state,
    icons: [...state.icons, icon],
    iconIdCounter: state.iconIdCounter + 1,
  };
}

export function updateIcons(state: GameStateData, icons: Icon[]): GameStateData {
  return {
    ...state,
    icons,
  };
}

export function removeIcon(state: GameStateData, iconId: number): GameStateData {
  return {
    ...state,
    icons: state.icons.filter(icon => icon.id !== iconId),
  };
}

export function updateScore(state: GameStateData, points: number): GameStateData {
  return {
    ...state,
    score: state.score + points,
  };
}

export function decrementLives(state: GameStateData): GameStateData {
  return {
    ...state,
    lives: state.lives - 1,
  };
}

export function incrementCorrectGuesses(state: GameStateData): GameStateData {
  return {
    ...state,
    correctGuesses: state.correctGuesses + 1,
  };
}

export function markSetCompleted(state: GameStateData, setCode: string): GameStateData {
  const newCompletedSets = new Set(state.completedSets);
  newCompletedSets.add(setCode);
  return {
    ...state,
    completedSets: newCompletedSets,
  };
}

export function updateLastSpawnTime(state: GameStateData, time: number): GameStateData {
  return {
    ...state,
    lastSpawnTime: time,
  };
}

export function setBlockSpawning(state: GameStateData, block: boolean): GameStateData {
  return {
    ...state,
    blockSpawning: block,
  };
}

export function updateTitleIcons(state: GameStateData, titleIcons: TitleIcon[]): GameStateData {
  return {
    ...state,
    titleIcons,
  };
}

export function cacheImage(state: GameStateData, url: string, image: HTMLImageElement): GameStateData {
  const newCache = new Map(state.imageCache);
  newCache.set(url, image);
  return {
    ...state,
    imageCache: newCache,
  };
}

export function clearCompletedSets(state: GameStateData): GameStateData {
  return {
    ...state,
    completedSets: new Set<string>(),
  };
}

// Wave management functions
export function initializeWave(state: GameStateData, waveNumber: number, waveSize: number = 10): GameStateData {
  // Filter out already-shown sets
  const availableSets = state.allAvailableSets.filter(
    set => !state.waveState.totalSetsShown.includes(set.code)
  );

  // Shuffle and select sets for this wave
  const shuffled = [...availableSets].sort(() => Math.random() - 0.5);
  const waveSets = shuffled.slice(0, Math.min(waveSize, availableSets.length));
  const waveSetCodes = waveSets.map(set => set.code);

  return {
    ...state,
    waveState: {
      ...state.waveState,
      currentWave: waveNumber,
      setsInCurrentWave: waveSetCodes,
      completedInWave: 0,
      waveStartLives: state.lives,
      waveStartScore: state.score,
    },
    completedSets: new Set<string>(), // Clear completed sets for the new wave
  };
}

export function updateWaveProgress(state: GameStateData, setCode: string): GameStateData {
  // Check if this set is part of the current wave
  if (!state.waveState.setsInCurrentWave.includes(setCode)) {
    return state;
  }

  // Update completed in wave count
  const completedInWave = state.waveState.setsInCurrentWave.filter(
    code => state.completedSets.has(code) || code === setCode
  ).length;

  // Add to total sets shown if not already there
  const totalSetsShown = state.waveState.totalSetsShown.includes(setCode)
    ? state.waveState.totalSetsShown
    : [...state.waveState.totalSetsShown, setCode];

  return {
    ...state,
    waveState: {
      ...state.waveState,
      completedInWave,
      totalSetsShown,
    },
  };
}

export function isWaveComplete(state: GameStateData): boolean {
  return state.waveState.completedInWave >= state.waveState.setsInCurrentWave.length;
}

export function createCheckpointData(state: GameStateData, gameMode: 'standard' | 'bad-at', hintsDisabled: boolean): any {
  return {
    version: 1,
    timestamp: Date.now(),
    gameMode,
    currentWave: state.waveState.currentWave,
    lives: state.lives,
    score: state.score,
    setsShownHistory: state.waveState.totalSetsShown,
    hintsDisabled,
  };
}

export function restoreFromCheckpoint(state: GameStateData, checkpointData: any, waveSize: number = 10): GameStateData {
  // Restore wave state from checkpoint
  const restoredState = {
    ...state,
    score: checkpointData.score,
    lives: checkpointData.lives,
    waveState: {
      ...state.waveState,
      currentWave: checkpointData.currentWave,
      totalSetsShown: checkpointData.setsShownHistory || [],
    },
  };

  // Initialize the NEXT wave (checkpoint saves at end of completed wave)
  const nextWave = checkpointData.currentWave + 1;
  return initializeWave(restoredState, nextWave, waveSize);
}