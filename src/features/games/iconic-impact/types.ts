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

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover' | 'won';

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