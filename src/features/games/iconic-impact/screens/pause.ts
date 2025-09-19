import { GameStateData, GameConfig } from '../types';
import { GAME_HEIGHT, PAUSE_OVERLAY_OPACITY } from '../constants';
import { renderGameScreen } from '../renderer';
import { drawRect } from '../utils/canvas';
import { drawCenteredText } from '../utils/text';

export function renderPauseScreen(state: GameStateData, config: GameConfig): GameStateData {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return state;

  // Draw the frozen game state
  renderGameScreen(state, config);

  // Draw pause overlay
  drawPauseOverlay(ctx, config.width);

  return state;
}

function drawPauseOverlay(ctx: CanvasRenderingContext2D, width: number): void {
  // Semi-transparent overlay
  const overlayColor = `rgba(0, 0, 0, ${PAUSE_OVERLAY_OPACITY})`;
  drawRect(ctx, 0, 0, width, GAME_HEIGHT, overlayColor);

  const centerX = width / 2;
  const centerY = GAME_HEIGHT / 2;

  // Draw pause text
  drawCenteredText(ctx, 'PAUSED', centerX, centerY - 20, 'bold 48px Arial', '#ffffff');
  drawCenteredText(ctx, 'Click to Resume', centerX, centerY + 20, '20px Arial', '#b0b0b0');
}