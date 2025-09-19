import { GameStateData, SetData, Icon, TitleIcon, GameState } from './types';
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