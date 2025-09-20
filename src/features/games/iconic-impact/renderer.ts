import { GameStateData, GameConfig, Icon } from './types';
import { ICON_SIZE, GAME_HEIGHT, GROUND_HEIGHT, DANGER_ZONE_OPACITY } from './constants';
import { clearCanvas, drawLine, drawRect, applyIconShadow, clearIconShadow } from './utils/canvas';
import { calculateDrawDimensions } from './utils/math';
import { renderSuccessAnimation, renderFailureAnimation } from './entities/animations';
import { renderHint } from './systems/hints';

export function renderGameScreen(state: GameStateData, config: GameConfig): void {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return;

  clearCanvas(ctx, config.width, GAME_HEIGHT);
  drawGameBackground(ctx, config.width);
  drawGroundLine(ctx, config.width);
  drawDangerZone(ctx, config.width);

  // Render all icons
  state.icons.forEach(icon => {
    if (icon.destroyed) {
      renderSuccessAnimation(ctx, icon);
    } else if (icon.failed) {
      renderFailureAnimation(ctx, icon);
    } else {
      renderFallingIcon(ctx, icon, state, config);
      if (icon.showHint >= 0 && !config.hintsDisabled) {
        renderHint(ctx, icon);
      }
    }
  });

  // Render HUD (Heads-Up Display)
  renderHUD(ctx, state, config);
}

function drawGameBackground(ctx: CanvasRenderingContext2D, width: number): void {
  // Optional: Could add a subtle gradient or pattern
  // For now, keep it clear for performance
}

function drawGroundLine(ctx: CanvasRenderingContext2D, width: number): void {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  drawLine(ctx, 0, y, width, y, '#999', 2);
}

function drawDangerZone(ctx: CanvasRenderingContext2D, width: number): void {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  const color = `rgba(255, 0, 0, ${DANGER_ZONE_OPACITY})`;
  drawRect(ctx, 0, y, width, GROUND_HEIGHT, color);
}

function renderFallingIcon(ctx: CanvasRenderingContext2D, icon: Icon, state: GameStateData, config: GameConfig): void {
  const image = state.imageCache.get(icon.iconUrl);

  if (image && image.complete && image.naturalWidth !== 0) {
    renderIconImage(ctx, icon, image, config);
  } else {
    renderIconPlaceholder(ctx, icon);
  }
}

function renderIconImage(ctx: CanvasRenderingContext2D, icon: Icon, image: HTMLImageElement, config: GameConfig): void {
  const aspectRatio = image.naturalWidth / image.naturalHeight;
  const { width, height, x, y } = calculateDrawDimensions(
    icon.x,
    icon.y,
    ICON_SIZE,
    aspectRatio
  );

  // Calculate accuracy for this set
  let shadowColor = 'rgba(255, 255, 255, 0.8)'; // Default white
  if (config.statistics && config.statistics[icon.setCode]) {
    const stats = config.statistics[icon.setCode];
    const total = stats.successes + stats.failures;
    if (total > 0) {
      const accuracy = stats.successes / total;
      if (accuracy >= 0.7) {
        shadowColor = 'rgba(76, 175, 80, 0.9)'; // Green for >= 70% accuracy
      } else if (accuracy < 0.5) {
        shadowColor = 'rgba(244, 67, 54, 0.9)'; // Red for < 50% accuracy
      }
    }
  }

  // Apply shadow effect with color based on accuracy
  ctx.shadowBlur = 8;
  ctx.shadowColor = shadowColor;

  // Draw the icon
  ctx.drawImage(image, x, y, width, height);

  // Second pass for stronger outline
  ctx.shadowBlur = 2;
  ctx.drawImage(image, x, y, width, height);

  clearIconShadow(ctx);
}

function renderIconPlaceholder(ctx: CanvasRenderingContext2D, icon: Icon): void {
  // Draw placeholder with set code
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

export function clearScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  clearCanvas(ctx, width, height);
}

// Render HUD (Heads-Up Display)
function renderHUD(ctx: CanvasRenderingContext2D, state: GameStateData, config: GameConfig): void {
  // HUD background bar
  const hudHeight = 60;
  const gradient = ctx.createLinearGradient(0, 0, 0, hudHeight);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, hudHeight);

  // Add subtle bottom border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hudHeight);
  ctx.lineTo(config.width, hudHeight);
  ctx.stroke();

  // Calculate even spacing for 5 elements
  const totalWidth = config.width; // Use full width
  const sectionWidth = totalWidth / 5;

  // Score (position 1 - left aligned in first section)
  renderScore(ctx, state.score, 20, 35);

  // Lives (position 2 - centered in second section)
  renderLives(ctx, state.lives, sectionWidth * 1.5, 35);

  // Wave info (position 3 - centered in third section)
  const waveSize = config.waveSize || 10;
  const totalWaves = Math.ceil(state.allAvailableSets.length / waveSize);
  renderWaveInfo(ctx, state.waveState.currentWave, totalWaves, sectionWidth * 2.5, 35);

  // Set progress in wave (position 4 - centered in fourth section)
  const completedInWave = state.waveState.setsInCurrentWave.filter(
    code => state.completedSets.has(code)
  ).length;
  renderSetProgress(ctx, completedInWave, state.waveState.setsInCurrentWave.length, sectionWidth * 3.5, 35);

  // Total sets (position 5 - far right)
  const totalCompleted = state.waveState.totalSetsShown.filter(
    code => state.completedSets.has(code) || state.waveState.setsInCurrentWave.includes(code)
  ).length;
  renderTotalSets(ctx, state.correctGuesses, state.allAvailableSets.length, config.width - 20, 35);
}

function renderScore(ctx: CanvasRenderingContext2D, score: number, x: number, y: number): void {
  // Score label
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', x, y - 15);

  // Score value
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(score.toString(), x, y + 8);
}

function renderLives(ctx: CanvasRenderingContext2D, lives: number, x: number, y: number): void {
  // Center align for lives
  ctx.textAlign = 'center';

  // Lives label
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('LIVES', x, y - 15);

  // Lives value
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = lives > 1 ? '#4caf50' : '#f44336';
  ctx.fillText(lives.toString(), x, y + 8);
}

function renderWaveInfo(ctx: CanvasRenderingContext2D, currentWave: number, totalWaves: number, x: number, y: number): void {
  // Center align for wave info
  ctx.textAlign = 'center';

  // Wave label
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('WAVE', x, y - 15);

  // Wave numbers
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#9c27b0';
  ctx.fillText(`${currentWave}/${totalWaves}`, x, y + 8);
}

function renderSetProgress(ctx: CanvasRenderingContext2D, completed: number, total: number, x: number, y: number): void {
  // Center align for set progress
  ctx.textAlign = 'center';

  // Sets label
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('SETS IN WAVE', x, y - 15);

  // Set numbers
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = completed === total ? '#4caf50' : '#ff9800';
  ctx.fillText(`${completed}/${total}`, x, y + 8);
}

function renderTotalSets(ctx: CanvasRenderingContext2D, completed: number, total: number, x: number, y: number): void {
  // Right align for total
  ctx.textAlign = 'right';

  // Total label
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('TOTAL SETS', x, y - 15);

  // Total numbers
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`${completed}/${total}`, x, y + 8);
}