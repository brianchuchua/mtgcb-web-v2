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
  Tabs,
  Tab,
  Menu,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/material/styles';
import {
  createGameEngine,
  type GameEngine,
  type GameState,
  type GameCallbacks,
  type SetData,
  type GameLogEntry,
} from '@/features/games/iconic-impact';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Import the type from the game engine
import type { SetStatistics } from '@/features/games/iconic-impact';

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
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  gameMode: 'standard' | 'bad-at';
  onSkipSet: () => void;
}

const GameStats = memo(function GameStats({
  score,
  lives,
  correctGuesses,
  totalSets,
  gameState,
  onButtonClick,
  setsLoaded,
  onMenuOpen,
  gameMode,
  onSkipSet,
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
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={onButtonClick}
                disabled={!setsLoaded}
              >
                {!setsLoaded ? 'Loading Sets...' :
                  gameMode === 'bad-at' ? 'Start (Bad At)' : 'Start Game'}
              </Button>
              <IconButton onClick={onMenuOpen} disabled={!setsLoaded}>
                <SettingsIcon />
              </IconButton>
            </Box>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <Box display="flex" gap={1}>
              <Button variant="contained" sx={{ flex: 1 }} onClick={onButtonClick}>
                {gameState === 'paused' ? 'Resume' : 'Pause'}
              </Button>
              {gameState === 'playing' && (
                <Button variant="contained" color="error" sx={{ whiteSpace: 'nowrap' }} onClick={onSkipSet}>
                  Skip Set
                </Button>
              )}
            </Box>
          )}
          {(gameState === 'gameover' || gameState === 'won') && (
            <Box display="flex" gap={1}>
              <Button variant="contained" fullWidth onClick={onButtonClick}>
                Play Again
              </Button>
              <IconButton onClick={onMenuOpen}>
                <SettingsIcon />
              </IconButton>
            </Box>
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
  statistics: SetStatistics;
  onClearStatistics: () => void;
}

const GameLogComponent = memo(function GameLogComponent({
  gameLog,
  gameState,
  score,
  totalSets,
  statistics,
  onClearStatistics,
}: GameLogProps) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate statistics data
  const statsData = Object.entries(statistics)
    .map(([code, data]) => ({
      code,
      setName: data.setName || code.toUpperCase(), // Fallback to code if name not available
      successes: data.successes,
      failures: data.failures,
      total: data.successes + data.failures,
      rate: data.successes + data.failures > 0
        ? Math.round((data.successes / (data.successes + data.failures)) * 100)
        : 0,
    }))
    .sort((a, b) => {
      // Sort by lowest success rate first (highest failure rate)
      if (a.rate !== b.rate) {
        return a.rate - b.rate;
      }
      // Then alphabetically by set name as tie breaker
      return a.setName.localeCompare(b.setName);
    });

  return (
    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2, minHeight: '36px' }}>
        <Tab label="Game Log" sx={{ minHeight: '36px', py: 1 }} />
        <Tab label="Statistics" sx={{ minHeight: '36px', py: 1 }} />
      </Tabs>

      {tabValue === 0 && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List dense>
              {statsData.length === 0 ? (
                <ListItem>
                  <ListItemText secondary="No statistics yet. Play a game to see your performance!" />
                </ListItem>
              ) : (
                statsData.map(({ code, setName, successes, failures, rate }) => {
                  let percentColor: 'success.main' | 'error.main' | 'text.secondary' = 'text.secondary';
                  if (rate >= 70) {
                    percentColor = 'success.main';
                  } else if (rate < 50) {
                    percentColor = 'error.main';
                  }

                  return (
                    <ListItem key={code}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {setName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" component="span">
                            {successes}/{successes + failures} correct (
                            <Typography variant="caption" component="span" color={percentColor}>
                              {rate}%
                            </Typography>
                            )
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })
              )}
            </List>
          </Box>
          {statsData.length > 0 && (
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={onClearStatistics}
              >
                Clear Statistics
              </Button>
            </Box>
          )}
        </Box>
      )}
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
  const [statistics, setStatistics] = useLocalStorage<SetStatistics>('mtgcb_iconic_impact_stats', {});
  const setStatisticsRef = useRef(setStatistics);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [gameMode, setGameMode] = useState<'standard' | 'bad-at'>('standard');
  const [hintsDisabled, setHintsDisabled] = useLocalStorage<boolean>('mtgcb_iconic_impact_hints_disabled', false);

  // Keep ref updated with latest setStatistics function
  useEffect(() => {
    setStatisticsRef.current = setStatistics;
  }, [setStatistics]);

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

  // Filter sets based on game mode - memoize the initial set list
  const [initialBadAtSets, setInitialBadAtSets] = useState<SetData[]>([]);

  // Initialize game engine when canvas and sets are ready
  useEffect(() => {
    if (!canvasRef.current || normalSets.length === 0) return;

    // Determine which sets to use based on mode
    let filteredSets = normalSets;
    if (gameMode === 'bad-at') {
      // Use locked sets during gameplay, calculate fresh when idle
      if (gameState !== 'idle' && initialBadAtSets.length > 0) {
        filteredSets = initialBadAtSets;
      } else {
        filteredSets = normalSets.filter(set => {
          const stats = statistics[set.code];
          if (!stats || stats.successes + stats.failures === 0) return false;
          const accuracy = stats.successes / (stats.successes + stats.failures);
          return accuracy < 0.5;
        });
      }

      if (filteredSets.length === 0) {
        // No sets match criteria for "bad-at" mode
        return;
      }
    }

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
      onSetSuccess: (setCode, setName) => {
        setStatisticsRef.current(prev => {
          const updated = { ...prev };
          if (!updated[setCode]) {
            updated[setCode] = { setName, successes: 0, failures: 0 };
          }
          updated[setCode].successes++;
          updated[setCode].setName = setName; // Update name in case it wasn't set
          return updated;
        });
      },
      onSetFailure: (setCode, setName) => {
        setStatisticsRef.current(prev => {
          const updated = { ...prev };
          if (!updated[setCode]) {
            updated[setCode] = { setName, successes: 0, failures: 0 };
          }
          updated[setCode].failures++;
          updated[setCode].setName = setName; // Update name in case it wasn't set
          return updated;
        });
      },
    };

    engineRef.current = createGameEngine({
      canvas: canvasRef.current,
      width: gameWidth,
      height: GAME_HEIGHT,
      sets: filteredSets,
      callbacks,
      statistics,
      hintsDisabled,
    });

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [normalSets, gameWidth, gameMode]);

  // Update statistics in game engine when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateStatistics(statistics);
    }
  }, [statistics]);

  // Update hints disabled setting when it changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateHintsDisabled(hintsDisabled);
    }
  }, [hintsDisabled]);

  const startGame = useCallback(() => {
    setGameLog([]);
    // Lock in the bad-at sets at game start
    if (gameMode === 'bad-at') {
      const badSets = normalSets.filter(set => {
        const stats = statistics[set.code];
        if (!stats || stats.successes + stats.failures === 0) return false;
        const accuracy = stats.successes / (stats.successes + stats.failures);
        return accuracy < 0.5;
      });

      // If no bad sets available, switch to standard mode
      if (badSets.length === 0) {
        setGameMode('standard');
        setInitialBadAtSets([]);
        // Don't start the game, let user click again in standard mode
        return;
      }

      setInitialBadAtSets(badSets);
    }
    engineRef.current?.start();
  }, [gameMode, normalSets, statistics]);

  // Stable callback for GameInput component
  const handleAnswer = useCallback((input: string): boolean => {
    if (engineRef.current && gameState === 'playing') {
      return engineRef.current.checkAnswer(input);
    }
    return false;
  }, [gameState]);

  const handleCanvasClick = useCallback(() => {
    // If starting a new game, clear the log
    if (gameState === 'gameover' || gameState === 'won') {
      setGameLog([]);
    }
    engineRef.current?.handleClick();
  }, [gameState]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleModeChange = useCallback((mode: 'standard' | 'bad-at') => {
    // Check if bad-at mode is viable
    if (mode === 'bad-at') {
      const badSets = normalSets.filter(set => {
        const stats = statistics[set.code];
        if (!stats || stats.successes + stats.failures === 0) return false;
        const accuracy = stats.successes / (stats.successes + stats.failures);
        return accuracy < 0.5;
      });

      // If no bad sets, stay in standard mode
      if (badSets.length === 0) {
        setGameMode('standard');
        setMenuAnchor(null);
        return;
      }
    }

    setGameMode(mode);
    setMenuAnchor(null);
    // Clear the locked sets when changing modes
    if (mode === 'standard') {
      setInitialBadAtSets([]);
    }
  }, [normalSets, statistics]);

  const handleButtonClick = useCallback(() => {
    if (gameState === 'idle') {
      startGame();
    } else if (gameState === 'playing' || gameState === 'paused') {
      engineRef.current?.handleClick();
    } else if (gameState === 'gameover' || gameState === 'won') {
      startGame();
    }
  }, [gameState, startGame]);

  const handleSkipSet = useCallback(() => {
    engineRef.current?.skipCurrentIcon();
  }, []);

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
              totalSets={gameMode === 'bad-at' && gameState !== 'idle' && initialBadAtSets.length > 0 ? initialBadAtSets.length :
                        gameMode === 'bad-at' ? normalSets.filter(set => {
                          const stats = statistics[set.code];
                          if (!stats || stats.successes + stats.failures === 0) return false;
                          const accuracy = stats.successes / (stats.successes + stats.failures);
                          return accuracy < 0.5;
                        }).length : normalSets.length}
              gameState={gameState}
              onButtonClick={handleButtonClick}
              setsLoaded={normalSets.length > 0}
              onMenuOpen={handleMenuOpen}
              gameMode={gameMode}
              onSkipSet={handleSkipSet}
            />

            <GameLogComponent
              gameLog={gameLog}
              gameState={gameState}
              score={score}
              totalSets={gameMode === 'bad-at' && gameState !== 'idle' && initialBadAtSets.length > 0 ? initialBadAtSets.length :
                        gameMode === 'bad-at' ? normalSets.filter(set => {
                          const stats = statistics[set.code];
                          if (!stats || stats.successes + stats.failures === 0) return false;
                          const accuracy = stats.successes / (stats.successes + stats.failures);
                          return accuracy < 0.5;
                        }).length : normalSets.length}
              statistics={statistics}
              onClearStatistics={() => setStatisticsRef.current({})}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Game Mode Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => handleModeChange('standard')}
          selected={gameMode === 'standard'}
        >
          Standard Mode
        </MenuItem>
        <MenuItem
          onClick={() => handleModeChange('bad-at')}
          selected={gameMode === 'bad-at'}
          disabled={
            Object.values(statistics).filter(stats => {
              const total = stats.successes + stats.failures;
              return total > 0 && (stats.successes / total) < 0.5;
            }).length === 0
          }
        >
          Sets I'm Bad At
        </MenuItem>
        <Divider />
        <MenuItem onClick={(e) => e.stopPropagation()}>
          <FormControlLabel
            control={
              <Switch
                checked={hintsDisabled}
                onChange={(e) => setHintsDisabled(e.target.checked)}
                size="small"
              />
            }
            label="Disable Hints"
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>
      </Menu>

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