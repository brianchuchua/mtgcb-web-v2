'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  createGameEngine,
  type GameEngine,
  type GameState,
  type GameCallbacks,
  type SetData,
  type GameLogEntry,
} from '@/features/games/iconic-impact';

const MAX_GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

const GameCanvas = styled('canvas')(({ theme }) => ({
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
}));

const GameContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  height: 'fit-content',
}));

// Isolated input component that manages its own state
interface GameInputProps {
  onAnswer: (input: string) => boolean;
  disabled: boolean;
  placeholder: string;
}

const GameInput = memo(function GameInput({ onAnswer, disabled, placeholder }: GameInputProps) {
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear input when game restarts (disabled changes from true to false)
  useEffect(() => {
    if (!disabled) {
      setLocalValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    // Check answer on every change
    if (!disabled && onAnswer(value)) {
      setLocalValue('');
    }
  }, [disabled, onAnswer]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      if (onAnswer(localValue)) {
        setLocalValue('');
      }
    }
  }, [disabled, localValue, onAnswer]);

  return (
    <TextField
      fullWidth
      label="Type set name here"
      value={localValue}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      disabled={disabled}
      placeholder={placeholder}
      inputRef={inputRef}
    />
  );
});

// Memoized game stats component
interface GameStatsProps {
  score: number;
  lives: number;
  correctGuesses: number;
  totalSets: number;
  gameState: GameState;
  onButtonClick: () => void;
  setsLoaded: boolean;
}

const GameStats = memo(function GameStats({
  score,
  lives,
  correctGuesses,
  totalSets,
  gameState,
  onButtonClick,
  setsLoaded,
}: GameStatsProps) {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Game Stats
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label={`Score: ${score}`} color="primary" size="small" />
          <Chip label={`Lives: ${lives}`} color={lives > 1 ? 'success' : 'error'} size="small" />
          <Chip label={`${correctGuesses}/${totalSets}`} color="secondary" size="small" />
        </Box>
        <Box>
          {gameState === 'idle' && (
            <Button variant="contained" fullWidth onClick={onButtonClick} disabled={!setsLoaded}>
              {!setsLoaded ? 'Loading Sets...' : 'Start Game'}
            </Button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <Button variant="contained" fullWidth onClick={onButtonClick}>
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
          {(gameState === 'gameover' || gameState === 'won') && (
            <Button variant="contained" fullWidth onClick={onButtonClick}>
              Play Again
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
});

// Memoized game log component
interface GameLogProps {
  gameLog: GameLogEntry[];
  gameState: GameState;
  score: number;
  totalSets: number;
}

const GameLogComponent = memo(function GameLogComponent({
  gameLog,
  gameState,
  score,
  totalSets,
}: GameLogProps) {
  return (
    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Game Log
      </Typography>
      {gameState === 'gameover' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Game Over! Final Score: {score}
        </Alert>
      )}
      {gameState === 'won' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          You Win! All {totalSets} sets identified!
        </Alert>
      )}
      <List dense>
        {gameLog.length === 0 ? (
          <ListItem>
            <ListItemText secondary="No attempts yet..." />
          </ListItem>
        ) : (
          [...gameLog].reverse().map((entry, index) => (
            <ListItem key={gameLog.length - index - 1}>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    color={entry.type === 'correct' ? 'success.main' : 'error.main'}
                  >
                    {entry.type === 'correct' ? '✓' : '✗'} {entry.setName}
                  </Typography>
                }
                secondary={
                  entry.type === 'correct' ? (
                    <Typography variant="caption">+{entry.points} points</Typography>
                  ) : (
                    <Typography variant="caption">Missed</Typography>
                  )
                }
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
});

export default function IconicImpactPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [normalSets, setNormalSets] = useState<SetData[]>([]);
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [gameWidth, setGameWidth] = useState(MAX_GAME_WIDTH);

  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = Math.min(MAX_GAME_WIDTH, containerWidth - 32); // 32px for padding
        setGameWidth(newWidth);
        engineRef.current?.updateSize(newWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Also observe container for changes (like sidenav opening/closing)
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Fetch normal sets on mount
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';
        const response = await fetch(`${apiBaseUrl}/sets/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sortBy: 'releasedAt',
            sortDirection: 'desc',
            category: { OR: ['normal'] },
            limit: 500,
            offset: 0,
            select: ['name', 'slug', 'code', 'setType', 'category', 'releasedAt', 'cardCount', 'isDraftable', 'sealedProductUrl'],
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Handle the nested data structure
          const actualData = result.data || result;
          const setsArray = actualData.sets || actualData.results || actualData;

          if (Array.isArray(setsArray)) {
            // No need to filter since we're requesting normal sets from the API
            setNormalSets(setsArray);
          } else {
            console.error('Unexpected data structure:', actualData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sets:', error);
      }
    };

    fetchSets();
  }, []);

  // Initialize game engine when canvas and sets are ready
  useEffect(() => {
    if (!canvasRef.current || normalSets.length === 0) return;

    const callbacks: GameCallbacks = {
      onScoreChange: setScore,
      onLivesChange: setLives,
      onStateChange: setGameState,
      onCorrectGuess: (setName, points) => {
        setGameLog(prev => [...prev, { type: 'correct', setName, points }]);
      },
      onMissedIcon: (setName) => {
        setGameLog(prev => [...prev, { type: 'missed', setName }]);
      },
      onMessage: () => {
        // Messages are no longer displayed in UI
      },
      onProgressUpdate: (completed) => {
        setCorrectGuesses(completed);
      },
      onGameComplete: () => {
        // Game complete is handled by state change to 'won'
      },
    };

    engineRef.current = createGameEngine({
      canvas: canvasRef.current,
      width: gameWidth,
      height: GAME_HEIGHT,
      sets: normalSets,
      callbacks,
    });

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [normalSets, gameWidth]);

  const startGame = useCallback(() => {
    setGameLog([]);
    engineRef.current?.start();
  }, []);

  // Stable callback for GameInput component
  const handleAnswer = useCallback((input: string): boolean => {
    if (engineRef.current && gameState === 'playing') {
      return engineRef.current.checkAnswer(input);
    }
    return false;
  }, [gameState]);

  const handleCanvasClick = useCallback(() => {
    engineRef.current?.handleClick();
  }, []);

  const handleButtonClick = useCallback(() => {
    if (gameState === 'idle') {
      startGame();
    } else if (gameState === 'playing' || gameState === 'paused') {
      engineRef.current?.handleClick();
    } else if (gameState === 'gameover' || gameState === 'won') {
      startGame();
    }
  }, [gameState, startGame]);

  // Show desktop-only message on mobile
  if (isMobile) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Iconic Impact
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Desktop Only Game
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This typing game requires a physical keyboard to play.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please visit on a desktop or laptop computer to enjoy the game!
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <GameContainer elevation={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" ref={containerRef}>
                  <GameCanvas
                    ref={canvasRef}
                    width={gameWidth}
                    height={GAME_HEIGHT}
                    onClick={handleCanvasClick}
                    style={{ cursor: 'pointer' }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <GameInput
                  onAnswer={handleAnswer}
                  disabled={gameState !== 'playing'}
                  placeholder="e.g., Innistrad: Midnight Hunt"
                />
              </Grid>
            </Grid>
          </GameContainer>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, height: `calc(${GAME_HEIGHT}px + 107px)` }}>
            <GameStats
              score={score}
              lives={lives}
              correctGuesses={correctGuesses}
              totalSets={normalSets.length}
              gameState={gameState}
              onButtonClick={handleButtonClick}
              setsLoaded={normalSets.length > 0}
            />

            <GameLogComponent
              gameLog={gameLog}
              gameState={gameState}
              score={score}
              totalSets={normalSets.length}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Disclaimer */}
      <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Iconic Impact is a fan-made educational game for learning Magic: The Gathering set icons.
          Magic: The Gathering is a trademark of Wizards of the Coast.
        </Typography>
      </Box>
    </Container>
  );
}