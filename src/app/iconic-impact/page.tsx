'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

const MAX_GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const ICON_SIZE = 64;
const FALL_SPEED = 0.1; // 50% slower
const HINT_THRESHOLDS = [0.2, 0.35, 0.55, 0.75];
const MAX_CONCURRENT_ICONS = 1; // Configurable: how many icons can fall at once
const GROUND_HEIGHT = 120; // Height from bottom where icons fail (increased for text)

interface FallingIcon {
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
}

interface SetData {
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

export default function IconicImpactPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const iconImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const fallingIconsRef = useRef<FallingIcon[]>([]);
  const gameStateRef = useRef<'idle' | 'playing' | 'paused' | 'gameover' | 'won'>('idle');
  const lastSpawnTimeRef = useRef<number>(0);
  const completedSetsRef = useRef<Set<string>>(new Set());
  const blockSpawningRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'won'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [normalSets, setNormalSets] = useState<SetData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [iconIdCounter, setIconIdCounter] = useState(0);
  const [gameLog, setGameLog] = useState<Array<{ type: 'correct' | 'missed', setName: string, points?: number }>>([]);
  const [gameWidth, setGameWidth] = useState(MAX_GAME_WIDTH);
  const titleScreenIconsRef = useRef<Array<{ x: number, y: number, iconUrl: string, speed: number }>>([]);
  const titleAnimationRef = useRef<number | undefined>(undefined);

  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = Math.min(MAX_GAME_WIDTH, containerWidth - 32); // 32px for padding
        setGameWidth(newWidth);
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
        const response = await fetch('http://local.mtgcb.com:5000/sets/search', {
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

  const spawnIcon = useCallback(() => {
    if (normalSets.length === 0) return;

    // Filter out completed sets
    const availableSets = normalSets.filter(set => !completedSetsRef.current.has(set.code));

    // If all sets have been completed, reset the completed list
    if (availableSets.length === 0) {
      completedSetsRef.current.clear();
      availableSets.push(...normalSets);
    }

    const randomSet = availableSets[Math.floor(Math.random() * availableSets.length)];
    const iconUrl = `https://svgs.scryfall.io/sets/${randomSet.code.toLowerCase()}.svg`;

    // Preload the image
    if (!iconImagesRef.current.has(iconUrl)) {
      const img = new Image();
      img.src = iconUrl;
      iconImagesRef.current.set(iconUrl, img);
    }

    // Add padding to ensure text has room on both sides (scale with game width)
    const horizontalPadding = Math.min(150, gameWidth * 0.15); // Scale padding with width
    const minX = horizontalPadding;
    const maxX = gameWidth - ICON_SIZE - horizontalPadding;

    const newIcon: FallingIcon = {
      id: iconIdCounter,
      x: minX + Math.random() * (maxX - minX),
      y: -ICON_SIZE,
      setCode: randomSet.code,
      setName: randomSet.name,
      iconUrl,
      speed: FALL_SPEED,
      showHint: -1,
      destroyed: false,
    };

    fallingIconsRef.current = [...fallingIconsRef.current, newIcon];
    setIconIdCounter((prev) => prev + 1);
  }, [normalSets, iconIdCounter, gameWidth]);

  const checkAnswer = useCallback(() => {
    const normalizedInput = inputValue.trim().toLowerCase();

    fallingIconsRef.current = fallingIconsRef.current.map((icon) => {
      const normalizedSetName = icon.setName.toLowerCase();
      if (!icon.destroyed && !icon.failed && normalizedSetName === normalizedInput) {
        // Calculate bonus based on distance from ground (farther from ground = more points)
        const maxDistance = GAME_HEIGHT - GROUND_HEIGHT; // Total distance icon can fall
        const distanceFromTop = icon.y + ICON_SIZE; // How far icon has fallen from top
        const percentageFallen = distanceFromTop / maxDistance;
        const distanceBonus = Math.max(0, Math.floor((1 - percentageFallen) * 200)); // More points when less fallen
        const totalPoints = 100 + distanceBonus;

        setScore((s) => s + totalPoints);
        setCorrectGuesses((c) => c + 1);
        setMessage(`Correct! +${totalPoints} points`);
        setTimeout(() => setMessage(''), 2000);

        // Add to game log
        setGameLog(prev => [...prev, { type: 'correct', setName: icon.setName, points: totalPoints }]);

        // Mark this set as completed
        completedSetsRef.current.add(icon.setCode);

        // Mark icon as destroyed with success animation
        const updatedIcon = { ...icon, destroyed: true, animationTimer: 540, animationRadius: 0 };

        // Check for win condition (TEMP: Only 2 sets for testing)
        // Delay the win state to allow the final animation to play
        if (completedSetsRef.current.size >= 2) {
          // Immediately block all spawning
          blockSpawningRef.current = true;
          gameStateRef.current = 'won';
          setTimeout(() => {
            setGameState('won');
          }, 1500); // Wait for success animation to be visible
        }

        return updatedIcon;
      }
      return icon;
    });

    setInputValue('');
  }, [inputValue]);

  const renderTitleScreen = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Initialize background icons if needed
    if (titleScreenIconsRef.current.length === 0 && normalSets.length > 0) {
      // Start with 5 random icons at different heights
      for (let i = 0; i < 5; i++) {
        const randomSet = normalSets[Math.floor(Math.random() * normalSets.length)];
        const iconUrl = `https://svgs.scryfall.io/sets/${randomSet.code.toLowerCase()}.svg`;

        // Pre-load the image
        const img = new Image();
        img.src = iconUrl;
        iconImagesRef.current.set(iconUrl, img);

        titleScreenIconsRef.current.push({
          x: Math.random() * (gameWidth - ICON_SIZE),
          y: Math.random() * GAME_HEIGHT - GAME_HEIGHT/2, // Start some in view
          iconUrl,
          speed: 0.15 + Math.random() * 0.1, // Even slower speeds
        });
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, GAME_HEIGHT);

    // Draw background gradient (dark theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, GAME_HEIGHT);

    // Update and draw background falling icons
    titleScreenIconsRef.current = titleScreenIconsRef.current.map(icon => {
      const newY = icon.y + icon.speed;

      // If icon falls off screen, respawn at top with new random position
      if (newY > GAME_HEIGHT) {
        const randomSet = normalSets[Math.floor(Math.random() * normalSets.length)];
        const iconUrl = `https://svgs.scryfall.io/sets/${randomSet.code.toLowerCase()}.svg`;

        // Find a spawn position that's not too close to other icons
        let newX: number;
        let attempts = 0;
        do {
          newX = Math.random() * (gameWidth - ICON_SIZE);
          attempts++;
        } while (
          attempts < 10 &&
          titleScreenIconsRef.current.some(otherIcon =>
            otherIcon !== icon &&
            otherIcon.y < 100 &&
            Math.abs(otherIcon.x - newX) < ICON_SIZE * 2
          )
        );

        return {
          x: newX,
          y: -ICON_SIZE,
          iconUrl,
          speed: 0.15 + Math.random() * 0.1, // Even slower speeds
        };
      }

      // Draw the icon if image is loaded
      const img = iconImagesRef.current.get(icon.iconUrl);

      if (img && img.complete && img.naturalWidth !== 0) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = ICON_SIZE;
        let drawHeight = ICON_SIZE;

        if (aspectRatio > 1) {
          drawHeight = ICON_SIZE / aspectRatio;
        } else {
          drawWidth = ICON_SIZE * aspectRatio;
        }

        const drawX = icon.x + (ICON_SIZE - drawWidth) / 2;
        const drawY = newY + (ICON_SIZE - drawHeight) / 2;

        // Save context state
        ctx.save();

        // Set opacity for background icons (brighter)
        ctx.globalAlpha = 0.3;

        // Draw white outline/shadow effect (multiple passes for stronger effect)
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw the icon with proper aspect ratio
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Draw a second pass for stronger outline
        ctx.shadowBlur = 2;
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Restore context state
        ctx.restore();
      } else {
        // Try to load the image
        if (!iconImagesRef.current.has(icon.iconUrl)) {
          const newImg = new Image();
          newImg.src = icon.iconUrl;
          iconImagesRef.current.set(icon.iconUrl, newImg);
        }

        // Draw placeholder while loading
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#666';
        ctx.fillRect(icon.x, newY, ICON_SIZE, ICON_SIZE);
        ctx.globalAlpha = 1.0;
      }

      return { ...icon, y: newY };
    });

    // Draw semi-transparent overlay to ensure text is readable
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, gameWidth, GAME_HEIGHT);

    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Iconic Impact', gameWidth / 2, 150);

    // Draw description
    ctx.font = '20px Arial';
    ctx.fillStyle = '#b0b0b0';
    const lines = [
      'Type the name of the Magic: The Gathering set',
      'before its icon hits the ground!',
      '',
      'As icons fall closer, you\'ll get hints to help identify them.'
    ];
    lines.forEach((line, index) => {
      ctx.fillText(line, gameWidth / 2, 220 + index * 30);
    });

    // Draw instructions
    ctx.font = '18px Arial';
    ctx.fillStyle = '#909090';
    ctx.fillText('Click to Start', gameWidth / 2, 400);

    // Draw device warning
    ctx.font = '14px Arial';
    ctx.fillStyle = '#707070';
    ctx.fillText('Best played on desktop with a keyboard', gameWidth / 2, 440);

    ctx.textAlign = 'start';

    // Continue animation
    if (gameStateRef.current === 'idle') {
      titleAnimationRef.current = requestAnimationFrame(renderTitleScreen);
    }
  }, [gameWidth, normalSets]);

  const renderWinScreen = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, GAME_HEIGHT);

    // Draw background gradient (celebratory theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a2a0a');
    gradient.addColorStop(1, '#051505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, GAME_HEIGHT);

    // Draw some celebratory particles or confetti effect
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * gameWidth;
      const y = Math.random() * GAME_HEIGHT;
      const size = Math.random() * 20 + 10;
      ctx.fillStyle = ['#44ff44', '#22dd22', '#66ff66'][Math.floor(Math.random() * 3)];
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Draw title
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(68, 255, 68, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('YOU WIN!', gameWidth / 2, 180);
    ctx.shadowBlur = 0;

    // Draw message
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Perfect! All 2 sets identified!', gameWidth / 2, 240);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#b0b0b0';
    ctx.fillText(`Final Score: ${score}`, gameWidth / 2, 280);

    // Draw instructions
    ctx.font = '18px Arial';
    ctx.fillStyle = '#909090';
    ctx.fillText('Click to Play Again', gameWidth / 2, 400);

    ctx.textAlign = 'start';

    // Continue animation
    if (gameStateRef.current === 'won') {
      titleAnimationRef.current = requestAnimationFrame(renderWinScreen);
    }
  }, [gameWidth, score]);

  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Always get fresh state from ref
    const currentState = gameStateRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, GAME_HEIGHT);

    if (currentState === 'paused') {
      // Draw the current game state frozen
      drawGameState(ctx);

      // Draw pause overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, gameWidth, GAME_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', gameWidth / 2, GAME_HEIGHT / 2 - 20);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#b0b0b0';
      ctx.fillText('Click to Resume', gameWidth / 2, GAME_HEIGHT / 2 + 20);
      ctx.textAlign = 'start';
      return;
    }

    if (currentState === 'gameover') {
      // Clear canvas completely for game over
      ctx.clearRect(0, 0, gameWidth, GAME_HEIGHT);

      // Draw dark background
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, '#1a0a0a');
      gradient.addColorStop(1, '#0d0505');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, gameWidth, GAME_HEIGHT);

      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', gameWidth / 2, GAME_HEIGHT / 2 - 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, gameWidth / 2, GAME_HEIGHT / 2);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#b0b0b0';
      ctx.fillText('Click to Play Again', gameWidth / 2, GAME_HEIGHT / 2 + 40);
      ctx.textAlign = 'start';

      // Keep animation frame running
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Don't process won state here - it has its own render function
    if (currentState === 'won') {
      return;
    }

    if (currentState !== 'playing') return;

    drawGameState(ctx);

    // Spawn new icons with a delay to prevent instant spawning
    const activeIcons = fallingIconsRef.current.filter(icon => !icon.destroyed && !icon.failed).length;
    const currentTime = Date.now();
    const spawnDelay = 500; // Minimum 500ms between spawns

    // Only spawn if playing and not blocked
    const canSpawn = currentState === 'playing' && lives > 0 && !blockSpawningRef.current;
    if (activeIcons < MAX_CONCURRENT_ICONS && currentTime - lastSpawnTimeRef.current > spawnDelay && canSpawn) {
      spawnIcon();
      lastSpawnTimeRef.current = currentTime;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [spawnIcon, gameWidth, score, normalSets.length, lives]);

  const drawGameState = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw ground line
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(gameWidth, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();

    // Draw danger zone shading
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, gameWidth, GROUND_HEIGHT);

    // Update icons
    fallingIconsRef.current = fallingIconsRef.current.map((icon) => {
      // Update animation timers
      if (icon.animationTimer !== undefined && icon.animationTimer > 0) {
        const newTimer = icon.animationTimer - 1;
        // Different expansion speeds for success vs failure
        const radiusIncrement = icon.failed ? 0.25 : 1; // Failure expands even slower
        const newRadius = icon.animationRadius !== undefined ? icon.animationRadius + radiusIncrement : 0;
        return { ...icon, animationTimer: newTimer, animationRadius: newRadius };
      }

      if (icon.destroyed || icon.failed) return icon;

      const newY = icon.y + icon.speed;

      // Check for hints based on position
      const progress = newY / (GAME_HEIGHT - GROUND_HEIGHT);
      let hintLevel = -1;
      for (let i = 0; i < HINT_THRESHOLDS.length; i++) {
        if (progress >= HINT_THRESHOLDS[i]) {
          hintLevel = i;
        }
      }

      return { ...icon, y: newY, showHint: hintLevel };
    });

    // Check for icons hitting the ground
    fallingIconsRef.current = fallingIconsRef.current.map((icon) => {
      // Icon fails when the text label is fully below the ground line with padding
      // Text is drawn at icon.y - 5, we want the TOP of text to be below the line with padding
      // So icon.y - 5 should be > groundLine + 32 for the text to be fully below with extra padding
      const textTop = icon.y - 5;
      const groundLine = GAME_HEIGHT - GROUND_HEIGHT;
      if (!icon.destroyed && !icon.failed && textTop >= groundLine + 32) {

        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            // Immediately block spawning and set state to prevent any new icons
            blockSpawningRef.current = true;
            gameStateRef.current = 'gameover';
            // Delay visual game over to show the failure explosion
            setTimeout(() => {
              setGameState('gameover');
            }, 1500);
          }
          return newLives;
        });
        setMessage(`Missed: ${icon.setName}`);
        setTimeout(() => setMessage(''), 2000);

        // Add to game log
        setGameLog(prev => [...prev, { type: 'missed', setName: icon.setName }]);

        // Position icon where it failed (text below the line)
        return { ...icon, failed: true, animationTimer: 720, animationRadius: 0, y: icon.y };
      }
      return icon;
    });

    // Remove icons that have finished animating
    fallingIconsRef.current = fallingIconsRef.current.filter((icon) => {
      if ((icon.destroyed || icon.failed) && icon.animationTimer !== undefined && icon.animationTimer <= 0) {
        return false;
      }
      return true;
    });

    // Draw active icons
    fallingIconsRef.current.forEach((icon) => {
      if (icon.destroyed && icon.animationTimer !== undefined && icon.animationTimer > 0) {
        // Draw explosion animation for destroyed icons
        const opacity = Math.min(1, icon.animationTimer / 180); // Fade out only in last 180 frames
        const radius = icon.animationRadius || 0;

        // Draw expanding circle
        ctx.fillStyle = `rgba(0, 255, 0, ${opacity * 0.3})`;
        ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(icon.x + ICON_SIZE / 2, icon.y + ICON_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw success text
        ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(icon.setName, icon.x + ICON_SIZE / 2, icon.y - 10);
        ctx.fillText(icon.setName, icon.x + ICON_SIZE / 2, icon.y - 10);
        ctx.textAlign = 'start';
      } else if (icon.failed && icon.animationTimer !== undefined && icon.animationTimer > 0) {
        // Draw failure explosion animation (slower)
        const opacity = Math.min(1, icon.animationTimer / 240); // Fade out in last 240 frames
        const radius = (icon.animationRadius || 0) * 0.5; // Slower radius expansion

        // Draw expanding red circle
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity * 0.3})`;
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(icon.x + ICON_SIZE / 2, icon.y + ICON_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw failure text
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(icon.setName, icon.x + ICON_SIZE / 2, icon.y - 10);
        ctx.fillText(icon.setName, icon.x + ICON_SIZE / 2, icon.y - 10);
        ctx.textAlign = 'start';
      } else if (!icon.destroyed && !icon.failed) {
        // Draw normal falling icon
        // Always draw something - either the image or a placeholder
        const img = iconImagesRef.current.get(icon.iconUrl);

        if (img && img.complete && img.naturalWidth !== 0) {
          // Calculate dimensions maintaining aspect ratio
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          let drawWidth = ICON_SIZE;
          let drawHeight = ICON_SIZE;

          if (aspectRatio > 1) {
            // Wider than tall - fit to width
            drawHeight = ICON_SIZE / aspectRatio;
          } else {
            // Taller than wide - fit to height
            drawWidth = ICON_SIZE * aspectRatio;
          }

          // Center the icon in its space
          const drawX = icon.x + (ICON_SIZE - drawWidth) / 2;
          const drawY = icon.y + (ICON_SIZE - drawHeight) / 2;

          // Draw white outline/shadow effect (multiple passes for stronger effect)
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw the icon with proper aspect ratio
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          // Draw a second pass for stronger outline
          ctx.shadowBlur = 2;
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        } else {
          // Draw placeholder while loading - ALWAYS visible
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(icon.x, icon.y, ICON_SIZE, ICON_SIZE);
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          ctx.strokeRect(icon.x, icon.y, ICON_SIZE, ICON_SIZE);

          // Draw set code prominently
          ctx.fillStyle = '#333';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon.setCode, icon.x + ICON_SIZE / 2, icon.y + ICON_SIZE / 2);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }

        // Draw hint if applicable
        if (icon.showHint >= 0) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = 'bold 16px Arial';

          // Helper function to create hint with spaces, colons, and key words preserved
          const createHint = (visibleLength: number) => {
            const name = icon.setName;
            const lowerName = name.toLowerCase();
            let hint = '';

            // Words to always show
            const keyWords = ['classic', 'core set', 'edition'];

            for (let i = 0; i < name.length; i++) {
              if (i < visibleLength) {
                hint += name[i];
              } else if (name[i] === ' ' || name[i] === ':') {
                hint += name[i];
              } else {
                // Check if this position is part of a key word
                let isKeyWord = false;
                for (const word of keyWords) {
                  const index = lowerName.indexOf(word);
                  if (index !== -1 && i >= index && i < index + word.length) {
                    isKeyWord = true;
                    break;
                  }
                }
                hint += isKeyWord ? name[i] : '_';
              }
            }
            return hint;
          };

          // Generate hints with underscores for unknown letters, preserving spaces and colons
          const nameLength = icon.setName.length;

          // For the first hint, show key words even before the set code
          const firstHint = (() => {
            const lowerName = icon.setName.toLowerCase();
            const hasKeyWord = lowerName.includes('classic') ||
                              lowerName.includes('core set') ||
                              lowerName.includes('edition');
            return hasKeyWord ? createHint(0) : `(${icon.setCode})`;
          })();

          const hints = [
            firstHint,
            `(${icon.setCode}) ${createHint(4)}`,
            `(${icon.setCode}) ${createHint(Math.floor(nameLength / 2))}`,
            `(${icon.setCode}) ${createHint(Math.max(0, nameLength - 3))}`,  // Always leave at least 3 letters hidden
          ];
          const hintText = hints[icon.showHint];

          // Center the text horizontally over the icon
          ctx.textAlign = 'center';
          const centerX = icon.x + ICON_SIZE / 2;
          ctx.strokeText(hintText, centerX, icon.y - 5);
          ctx.fillText(hintText, centerX, icon.y - 5);
          ctx.textAlign = 'start';
        }
      }
    });

  }, [gameWidth]);

  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') {
      // Cancel title animation if running
      if (titleAnimationRef.current) {
        cancelAnimationFrame(titleAnimationRef.current);
        titleAnimationRef.current = undefined;
      }
      animationRef.current = requestAnimationFrame(gameLoop);
    } else if (gameState === 'won') {
      // Cancel game animation if running
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      renderWinScreen();
    } else if (gameState === 'idle') {
      // Cancel game animation if running
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      renderTitleScreen();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (titleAnimationRef.current) {
        cancelAnimationFrame(titleAnimationRef.current);
      }
    };
  }, [gameState, gameLoop, renderTitleScreen, renderWinScreen]);

  // Start rendering title screen when sets are loaded
  useEffect(() => {
    if (normalSets.length > 0 && gameState === 'idle') {
      renderTitleScreen();
    }
  }, [normalSets.length, gameState, renderTitleScreen]);

  const startGame = () => {
    fallingIconsRef.current = [];
    titleScreenIconsRef.current = []; // Clear title screen icons
    lastSpawnTimeRef.current = 0;
    completedSetsRef.current.clear(); // Clear completed sets for new game
    blockSpawningRef.current = false; // Reset spawn blocking
    gameStateRef.current = 'playing';
    setGameState('playing');
    setScore(0);
    setLives(3);
    setCorrectGuesses(0);
    setInputValue('');
    setMessage('');
    setGameLog([]); // Clear log for new game

    // Auto-focus the input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const pauseGame = () => {
    const newState = gameState === 'paused' ? 'playing' : 'paused';
    gameStateRef.current = newState;
    setGameState(newState);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  const handleCanvasClick = () => {
    if (gameState === 'idle' && normalSets.length > 0) {
      startGame();
    } else if (gameState === 'playing' || gameState === 'paused') {
      pauseGame();
    } else if (gameState === 'gameover' || gameState === 'won') {
      startGame();
    }
  };

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
                <TextField
                  fullWidth
                  label="Type set name here"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={gameState !== 'playing'}
                  placeholder="e.g., Innistrad: Midnight Hunt"
                  inputRef={inputRef}
                />
              </Grid>
            </Grid>
          </GameContainer>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, height: `calc(${GAME_HEIGHT}px + 107px)` }}>
            {/* Game Stats Panel */}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Game Stats
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={`Score: ${score}`} color="primary" size="small" />
                  <Chip label={`Lives: ${lives}`} color={lives > 1 ? 'success' : 'error'} size="small" />
                  <Chip label={`${correctGuesses}/${normalSets.length}`} color="secondary" size="small" />
                </Box>
                <Box>
                  {gameState === 'idle' && (
                    <Button variant="contained" fullWidth onClick={startGame} disabled={normalSets.length === 0}>
                      {normalSets.length === 0 ? 'Loading Sets...' : 'Start Game'}
                    </Button>
                  )}
                  {(gameState === 'playing' || gameState === 'paused') && (
                    <Button variant="contained" fullWidth onClick={pauseGame}>
                      {gameState === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  {(gameState === 'gameover' || gameState === 'won') && (
                    <Button variant="contained" fullWidth onClick={startGame}>
                      Play Again
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Game Log Panel */}
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
                  You Win! All 2 sets identified!
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