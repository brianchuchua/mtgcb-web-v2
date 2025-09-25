export interface SetData {
  name: string;
  slug: string;
  code: string;
  setType: string;
  category: string;
  releasedAt: string;
  cardCount: number;
  isDraftable: boolean;
  sealedProductUrl: string;
}

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover' | 'won' | 'wave-complete';

export interface WaveState {
  currentWave: number;        // 1-indexed wave number
  setsInCurrentWave: string[]; // Array of set codes for current wave
  completedInWave: number;     // Number of sets completed in current wave (0-10)
  totalSetsShown: string[];    // All set codes shown across all waves
  waveStartLives: number;      // Lives at wave start (for potential retry)
  waveStartScore: number;      // Score at wave start (for potential retry)
}

export interface CheckpointData {
  version: number;             // For migration if needed
  timestamp: number;           // When saved
  gameMode: 'standard' | 'bad-at';
  currentWave: number;
  lives: number;
  score: number;
  setsShownHistory: string[];  // All sets shown so far
  hintsDisabled: boolean;
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onStateChange: (state: GameState) => void;
  onCorrectGuess: (setName: string, points: number) => void;
  onMissedIcon: (setName: string) => void;
  onMessage: (message: string, duration?: number) => void;
  onProgressUpdate: (completed: number, total: number) => void;
  onGameComplete: () => void;
  onSetSuccess: (setCode: string, setName: string) => void;
  onSetFailure: (setCode: string, setName: string) => void;
  onWaveComplete: (waveNumber: number, nextWaveNumber: number) => void;
  onRequestCheckpointSave: (checkpointData: CheckpointData) => void;
  onWaveTransition: (fromWave: number, toWave: number) => void;
  onAllWavesComplete: () => void;
}

export interface SetStatistics {
  [setCode: string]: {
    setName: string;
    successes: number;
    failures: number;
  };
}

export interface GameConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  sets: SetData[];
  callbacks: GameCallbacks;
  statistics?: SetStatistics;
  hintsDisabled?: boolean;
  gameMode?: 'standard' | 'bad-at';
  initialCheckpoint?: CheckpointData;
  waveSize?: number; // Default 10
}

export interface Icon {
  id: number;
  x: number;
  y: number;
  setCode: string;
  setName: string;
  iconUrl: string;
  speed: number;
  showHint: number;
  destroyed: boolean;
  animationTimer?: number;
  animationRadius?: number;
  failed?: boolean;
  width?: number;
  height?: number;
  image?: HTMLImageElement;
}

export interface TitleIcon {
  x: number;
  y: number;
  iconUrl: string;
  speed: number;
}

export interface GameLogEntry {
  type: 'correct' | 'missed';
  setName: string;
  points?: number;
}

export interface GameStateData {
  state: GameState;
  score: number;
  lives: number;
  correctGuesses: number;
  icons: Icon[];
  completedSets: Set<string>;
  lastSpawnTime: number;
  blockSpawning: boolean;
  titleIcons: TitleIcon[];
  iconIdCounter: number;
  animationFrame: number | null;
  imageCache: Map<string, HTMLImageElement>;
  scheduledStateChange?: { state: GameState; time: number };
  waveState: WaveState;
  allAvailableSets: SetData[]; // Store all sets for wave generation
  lastFrameTime: number; // For delta time calculation
}

export interface GameEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  checkAnswer: (input: string) => boolean;
  handleClick: () => void;
  destroy: () => void;
  updateSize: (width: number) => void;
  updateStatistics: (statistics: SetStatistics | undefined) => void;
  updateHintsDisabled: (hintsDisabled: boolean) => void;
  skipCurrentIcon: () => void;
}