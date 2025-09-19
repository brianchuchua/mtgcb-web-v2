import { GameStateData, GameConfig } from '../types';
import { GAME_HEIGHT } from '../constants';
import { clearCanvas } from '../utils/canvas';
import { drawGradientBackground, drawParticles } from '../entities/effects';
import { drawCenteredText } from '../utils/text';

export function renderWinScreen(state: GameStateData, config: GameConfig): GameStateData {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return state;

  clearCanvas(ctx, config.width, GAME_HEIGHT);
  drawWinBackground(ctx, config.width);
  drawWinEffects(ctx, config.width);
  drawWinText(ctx, config.width, state.score, config.sets.length);

  return state;
}

function drawWinBackground(ctx: CanvasRenderingContext2D, width: number): void {
  drawGradientBackground(ctx, width, GAME_HEIGHT, '#0a2a0a', '#051505');
}

function drawWinEffects(ctx: CanvasRenderingContext2D, width: number): void {
  // Draw celebratory particles
  const colors = ['#44ff44', '#22dd22', '#66ff66'];
  drawParticles(ctx, width, GAME_HEIGHT, 20, colors);
}

function drawWinText(
  ctx: CanvasRenderingContext2D,
  width: number,
  score: number,
  totalSets: number
): void {
  const centerX = width / 2;

  // Draw win title with shadow effect
  ctx.shadowColor = 'rgba(68, 255, 68, 0.5)';
  ctx.shadowBlur = 20;
  drawCenteredText(ctx, 'YOU WIN!', centerX, 180, 'bold 56px Arial', '#44ff44');
  ctx.shadowBlur = 0;

  // Draw completion message
  drawCenteredText(
    ctx,
    `Perfect! All ${totalSets} sets identified!`,
    centerX,
    240,
    '24px Arial',
    '#ffffff'
  );

  // Draw final score
  drawCenteredText(ctx, `Final Score: ${score}`, centerX, 280, '20px Arial', '#b0b0b0');

  // Draw instructions
  drawCenteredText(ctx, 'Click to Play Again', centerX, 400, '18px Arial', '#909090');
}