import { GameStateData, GameConfig } from '../types';
import { GAME_HEIGHT } from '../constants';
import { clearCanvas } from '../utils/canvas';
import { drawGradientBackground } from '../entities/effects';
import { drawCenteredText } from '../utils/text';

export function renderGameOverScreen(state: GameStateData, config: GameConfig): GameStateData {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return state;

  clearCanvas(ctx, config.width, GAME_HEIGHT);
  drawGameOverBackground(ctx, config.width);
  drawGameOverText(ctx, config.width, state.score);

  return state;
}

function drawGameOverBackground(ctx: CanvasRenderingContext2D, width: number): void {
  drawGradientBackground(ctx, width, GAME_HEIGHT, '#1a0a0a', '#0d0505');
}

function drawGameOverText(ctx: CanvasRenderingContext2D, width: number, score: number): void {
  const centerX = width / 2;
  const centerY = GAME_HEIGHT / 2;

  // Draw game over text
  drawCenteredText(ctx, 'GAME OVER', centerX, centerY - 40, 'bold 48px Arial', '#ff4444');

  // Draw final score
  drawCenteredText(ctx, `Final Score: ${score}`, centerX, centerY, '24px Arial', '#ffffff');

  // Draw instructions
  drawCenteredText(ctx, 'Click to Play Again', centerX, centerY + 40, '20px Arial', '#b0b0b0');
}